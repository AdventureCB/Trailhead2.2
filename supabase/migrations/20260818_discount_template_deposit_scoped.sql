-- 2026-08-18: Deposit-scoped bulk discount templates.
--
-- Adds ambassador_discount_templates.deposit_scoped. When true, applying the
-- template mirrors an ambassador's PRIMARY code: the PUBLIC code is scoped to
-- the DEPOSIT product at 0% off (attribution-only) instead of the default
-- broad free-shipping promo. The INTERNAL (staff-applied) code still carries
-- the template's customizable discount (%/$/free-shipping) + expiry.
--
-- Enforced entirely in the shopify-create-discount-code edge function, which
-- reads this flag off the template when role='bulk_promo'.

alter table public.ambassador_discount_templates
  add column if not exists deposit_scoped boolean not null default false;

notify pgrst, 'reload schema';
