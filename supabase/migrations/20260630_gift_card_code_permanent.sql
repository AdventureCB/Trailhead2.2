-- ============================================================================
-- Phase 7 follow-up — permanent owner-only gift card code storage
-- ============================================================================
-- Shopify only returns the unmasked gift card code in the response to
-- /gift_cards.json POST (create). After that, every subsequent fetch
-- returns maskedCode + lastCharacters only. The user needs the code
-- whenever they want to redeem at checkout (without a Shopify
-- customer-account auto-apply), so we have to store it ourselves.
--
-- Design constraint: `public.profiles` has a PUBLIC SELECT policy
-- (everyone can read everyone's handle / avatar / etc.), so we can't
-- put a sensitive field like the gift card code there — it would leak.
-- Instead, the code lives in its own table with owner-only SELECT.
-- No admin SELECT either: gift card codes are sensitive enough that
-- admin-snooping is the wrong default. If admin needs to recover one
-- for a user, the path is Shopify Admin → Gift cards → "Send to
-- customer" (Shopify emails the code to the linked customer).
--
-- Service-role writes only — the shopify-bounty-payout edge function
-- upserts after a successful create. No client-side INSERT/UPDATE/
-- DELETE policy.
--
-- Idempotent. Handles rollback of any state from the abandoned
-- 20260630_gift_card_code_capture.sql attempt (which would have stored
-- the code on profiles, leaking via the public read policy).
-- ============================================================================

-- ── 1. New table ──
create table if not exists public.user_gift_card_codes (
  user_id uuid primary key references auth.users(id) on delete cascade,
  code text not null,
  gift_card_id text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.user_gift_card_codes enable row level security;

drop policy if exists user_gift_card_codes_owner_select on public.user_gift_card_codes;
create policy user_gift_card_codes_owner_select on public.user_gift_card_codes
  for select using (auth.uid() = user_id);

-- No INSERT/UPDATE/DELETE policies — only the shopify-bounty-payout
-- edge function (via service role) writes here.

-- NOT in realtime publication — codes are pulled on-demand, not
-- broadcast. Cuts leak surface.

-- ── 2. Migrate any existing state from the abandoned 20260630_gift_card_code_capture
--      attempt (where the column briefly lived on profiles). Safe to run
--      regardless of whether that migration was applied or not. ──
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'profiles' and column_name = 'lpo_gift_card_code'
  ) then
    -- Migrate any populated codes into the new table.
    insert into public.user_gift_card_codes (user_id, code, gift_card_id)
    select p.id, p.lpo_gift_card_code, coalesce(p.lpo_gift_card_id, '')
    from public.profiles p
    where p.lpo_gift_card_code is not null and p.lpo_gift_card_code <> ''
    on conflict (user_id) do update set code = excluded.code, gift_card_id = excluded.gift_card_id, updated_at = now();
    -- Drop the leaky column + the now-stale RPC.
    alter table public.profiles drop column lpo_gift_card_code;
    drop function if exists public.clear_my_gift_card_code();
  end if;
end$$;

notify pgrst, 'reload schema';
