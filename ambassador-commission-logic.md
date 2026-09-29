# Ambassador Commission Logic

How a Shopify order becomes an ambassador's paid commission. This is the native
program that replaced the Collabs app.

Source of truth in code:
- [supabase/functions/shopify-webhook/index.ts](supabase/functions/shopify-webhook/index.ts) — live ingestion (`orders/paid`, `orders/refunded`)
- [supabase/functions/shopify-backfill-orders/index.ts](supabase/functions/shopify-backfill-orders/index.ts) — historical ingestion, same engine
- [supabase/functions/stripe-transfer-payout/index.ts](supabase/functions/stripe-transfer-payout/index.ts) — money out

---

## 1. The vocabulary

| Concept | Table | What it is |
|---|---|---|
| **Ambassador** | `ambassadors` | One row per approved partner. Carries `tier` (`ambassador` / `installer`) and `commission_rate_pct`. |
| **Discount code** | `ambassador_discount_codes` | Attribution key. One logical discount = a *public* code (customer-facing, $0 effective) + an *internal* code (staff-applied, real value). |
| **Order** | `ambassador_orders` | A raw Shopify order that used one of those codes. Not a commission unit. |
| **Journey** | `ambassador_journeys` | **THE commission unit.** One customer's path from deposit → confirmation (or a single walk-in). Commission is computed and paid per journey, never per order. |
| **Payout** | `ambassador_payouts` | One row per approved/settled payment covering a set of journeys. |
| **Config** | `commission_config` | Single-row global knobs (see §7). |

The key mental model: **orders accumulate into a journey; the journey earns the
commission.**

---

## 2. Commission rules (as locked in by Kyle)

| Type | Trigger | Commission |
|---|---|---|
| **Deposit** | Order subtotal ≈ $500 (within 1¢) using an ambassador code, no open journey | $0 — held pending a confirmation |
| **Confirmation** | Same customer's later orders push cumulative confirmation subtotal ≥ $5,000 within 180 days | `rate% × commission_eligible_total` (deposit + all confirmation parts) |
| **Walk-in** | Order subtotal ≥ $5,000 with no prior deposit journey | `rate% × commission_eligible_subtotal`, earned immediately |
| **Orphan deposit** | $500 order, no confirmation within 180 days | Never paid — journey expires |
| **Anything else** | Order doesn't hit a threshold and no open journey exists | `classification='unclassified'`, no journey, no commission |

Rate comes from `ambassadors.commission_rate_pct` (default 5% for `ambassador`
tier, 15% for `installer`), falling back to 5.0 if the row is missing.

---

## 3. The commission base — what money actually counts

This is the part that has bitten us twice, so it's spelled out precisely.

```
commission_eligible_subtotal
  = order.subtotal_price
  − (post-discount value of every line item whose product_type is in
     commission_config.excluded_product_types, default ['Merch'])
```

Why `subtotal_price` and not the line items:

- `subtotal_price` is already **after all discounts**, including *order-level*
  discount allocations such as the staff-applied internal code.
- Summing `line_items[].discountedTotalSet` is only post-*line-level* discounts.
  Doing it that way inflated the base by the entire order-level discount.

Merch subtraction walks each excluded line and removes its true post-discount
value: `price × qty − total_discount − Σ discount_allocations`.
See `computeEligibleSubtotal()` in the webhook.

Tax and shipping are never commissionable.

**Historical bugs (both fixed 2026-05-27):**
1. *Double-counted deposit* — commission was `depositEligible + newEligible`, but
   `commission_eligible_total` already includes the deposit's eligible amount.
   Correct formula is `newEligible × rate`.
2. *Missing order-level discounts* — described above.

Reference case after both fixes: $500 deposit + $13,758 confirmation →
$14,258 × 5% = **$712.90**.

---

## 4. Ingestion pipeline (`orders/paid`)

1. **Verify HMAC.** SHA-256 of the *raw* body keyed by `SHOPIFY_CLIENT_SECRET`,
   constant-time compared to `X-Shopify-Hmac-Sha256`. Bad signature → 401.
2. **Match a code.** For every `order.discount_codes[].code`, look up
   `ambassador_discount_codes WHERE code = X OR internal_code = X` — *at any
   status*, so soft-deleted codes still attribute historical orders. This is a
   direct row lookup, **not** a prefix match on `base_code` (admins can rename
   codes, which would break prefix matching). No match → 200 OK, ignored.
3. **Attribute.** First matched ambassador wins. If the matched codes span more
   than one ambassador, the resulting journey is flagged `is_conflict = true` for
   the admin CONFLICTS queue. `ambassador_orders.discount_code_id` records which
   specific code earned it.
4. **Insert idempotently.** `ambassador_orders` has UNIQUE `shopify_order_id`;
   the insert uses `Prefer: resolution=ignore-duplicates`. An empty return means
   duplicate delivery → skip all downstream processing. Shopify retries a lot.
5. **Find an open journey** for `(ambassador, customer)`:
   `state IN ('deposit_only','walk_in')` AND
   `deposit_started_at >= now() − 180 days` AND customer matches on **any** of
   `customer_email`, `customer_shopify_id`, or normalized name
   (lowercased, whitespace-collapsed `first last`).
6. **Classify + mutate** (§5).

`shopify-backfill-orders` runs the identical state machine over historical
GraphQL orders, processed **oldest-first** so deposits land before their
confirmations and journeys form correctly.

---

## 5. Journey state machine

```
                order with ambassador code
                          │
              ┌───────────┴───────────┐
       open journey?                 no open journey
              │                        │
              │                ┌───────┴────────┐
              │            subtotal ≈ $500   subtotal ≥ $5,000
              │                │                │
              ▼                ▼                ▼
   add_to_deposit_journey  new_deposit     new_walk_in
   (accumulate subtotal    state=          state=walk_in
    + eligible)            deposit_only    commission computed
              │            commission=0    immediately
              ▼            expires_at =
   cumulative confirmation   +180d
   ≥ $5,000 ?
        │           │
       yes          no
        │           │
        ▼           ▼
   state=confirmed  stays deposit_only
   confirmed_at=now
   commission =
     eligible_total × rate
```

Order `classification` values written alongside: `deposit`, `confirmation_part`,
`walk_in_part`, `excluded`, `unclassified`.

Journey states: `deposit_only` → `confirmed` | `walk_in` → `paid` →
(`clawed_back`), plus `expired` for orphan deposits.

Note: an order landing on an open `walk_in` journey is classified
`walk_in_part` and accumulates, but does **not** re-trigger the confirmation
flip (that branch only fires when the journey was `deposit_only`).

---

## 6. Refunds & clawback (`orders/refunded`)

Shopify ships the **full** order with **every** refund each delivery, so the
handler recomputes from scratch — idempotent by construction, never incremental.

1. Look up `ambassador_orders` by `shopify_order_id`. No match → ack, ignore.
2. `refunded_amount` = Σ `refunds[].transactions[].amount` where `kind='refund'`.
3. `commissionableRefund` = Σ `refund_line_items[].subtotal_set.shop_money.amount`
   for lines whose **parent** line item's `product_type` is *not* excluded.
4. `commission_eligible_subtotal = max(0, recomputedEligible − commissionableRefund)`.
5. Re-sum every order on the journey → new `commission_eligible_total`, then
   `commission_amount = total × rate`.
6. State transitions:
   - `paid` → **`clawed_back`** (always). Reconciled next cycle via
     `ambassador_payouts.clawback_amount`.
   - `confirmed` / `walk_in` with new commission $0 → **`clawed_back`**.
   - Otherwise just reduce the amount; state unchanged.
   - `deposit_only` keeps its state; a fully-refunded deposit dies quietly when
     `expires_at` passes.

UI surfaces a REFUNDED chip + struck subtotal on the ambassador's order feed.

---

## 7. Global config (`commission_config`, single row)

| Column | Default | Effect |
|---|---|---|
| `excluded_product_types` | `['Merch']` | Line items of these types are stripped from the commission base |
| `default_ambassador_pct` | `5` | Rate seeded on new ambassador rows |
| `default_installer_pct` | `15` | Rate seeded on new installer rows |
| `default_discount_pct` | `10` | Customer-facing discount default |
| `deposit_amount` | `500` | Deposit detection amount (±1¢) |
| `confirmation_min` | `5000` | Confirmation / walk-in threshold |
| `pairing_window_days` | `180` | Deposit→confirmation window and journey expiry |

The edge functions read `confirmation_min`, `pairing_window_days`, and
`excluded_product_types` from this table per delivery, falling back to the
hardcoded constants (`500` / `5000` / `180`) if the row is absent. Note that
`deposit_amount` is currently only a hardcoded constant in the webhook — editing
that column alone won't move deposit detection.

---

## 8. Payouts

**Cycle rule:** commissions confirmed in month *M* pay out on the **last business
day of month M+1** (weekends back up to Friday).

Admin flow, all via SECURITY DEFINER RPCs gated on `is_admin(auth.uid())`:

| RPC | Does |
|---|---|
| `admin_all_pending_payouts()` | Un-linked `confirmed`/`walk_in` commission grouped by (ambassador, month) |
| `admin_approve_payout(ambassador, period_start, period_end, scheduled_for, notes)` | Inserts the payout row (`status='approved'`), links the journeys via `payout_id`, notifies the ambassador |
| `admin_mark_payout_paid(payout_id, notes)` | Manual settle — payout + journeys → `paid` |
| `admin_cancel_payout(payout_id)` | Unlinks journeys so they reappear in PENDING; payout → `cancelled` |

Money actually moves through **`stripe-transfer-payout`** (SEND VIA STRIPE, which
replaced MARK PAID in normal use): verifies admin + `status='approved'` +
`ambassador.stripe_onboarded`, POSTs `/v1/transfers` to the Express account with
idempotency key `trailhead_payout_${id}_retry_${prior_failure_ms}` (the retry
suffix matters — Stripe caches idempotent responses 24h, so a retry after fixing
insufficient funds needs a fresh key). On success: persists `stripe_transfer_id`,
flips payout + journeys to `paid`, inserts a `payout_paid` notification.

Payout statuses: `approved` → `paid` | `cancelled` | `failed`.
LPO is the 1099 filer of record (`controller.fees.payer=application_express`).

---

## 9. Admin overrides

Attribution isn't always right the first time. Every override is a SECURITY
DEFINER RPC that writes an `admin_order_corrections` audit row with a **required
reason**:

- `admin_remove_order` — soft-delete (`removed_at`); dashboard queries filter `removed_at IS NULL`
- `admin_reassign_order` — move an order to another ambassador
- `admin_edit_eligible` — override `commission_eligible_subtotal`
- `admin_add_manual_order` — insert an off-Shopify order (`is_manual=true`, MANUAL chip in UI)
- `admin_link_order_to_journey(order, journey, new_eligible, reason)` — attach a stray order to an existing journey
- `admin_backdate_journey_confirmation(journey, confirmed_at)` — fix `confirmed_at` so a backdated manual add buckets into the real sale month, not the month it was entered. Unpaid + `confirmed`/`walk_in` only
- `resolve_conflict_attribution(journey, new_ambassador)` / `dismiss_conflict_flag(journey)` — the CONFLICTS queue

---

## 10. Gotchas worth remembering

- **Attribution requires the code to survive checkout.** The primary public code
  is scoped to the DEPOSIT product at 0% off, so a customer who clicks a share
  link and buys only regular gear is **not** attributed. Deliberate for v1.
- **Soft-deleted codes still attribute.** The lookup ignores `status`; only the
  ambassador's own dashboard filters to `visible` + `active`.
- **Duplicate deliveries are normal.** Everything downstream of the
  `ambassador_orders` insert is skipped when the insert returns empty.
- **Backfill must run oldest-first.** Otherwise a confirmation arrives with no
  open journey and gets misclassified as a walk-in.
- **Shopify's GraphQL `discount_code:` filter is case-sensitive** and only matches
  native Shopify codes — a backfill returning 0 orders usually means that, not a
  logic bug. Fall back to `shopify-lookup-order` + MANUAL ADD ORDER.
