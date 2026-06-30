-- ============================================================================
-- Phase 7 follow-up — capture gift card code for one-time display
-- ============================================================================
-- Shopify's API only returns the unmasked gift card code in the
-- response to /gift_cards.json POST (create). After that, every
-- subsequent fetch returns maskedCode + lastCharacters only.
-- Customers need the full code to redeem at checkout when they're
-- not signed into a Shopify customer account that has the card
-- linked. So we have to capture the code at create time + hand it
-- to the user.
--
-- Approach: stash in profiles.lpo_gift_card_code temporarily. The
-- VIEW GIFT CARD modal shows a "REVEAL CODE" section while it's
-- populated. When the user taps "Got it — hide forever", a
-- clear_my_gift_card_code() RPC nulls the column so the code is no
-- longer retrievable from our DB. Bring-your-own-receipt model:
-- user is responsible for saving the code (note in Apple Wallet,
-- screenshot, copy into a notes app, etc.) before clearing.
--
-- For TOP-UPS, no new code is generated (same card same code), so
-- the column stays NULL after a topup unless we restore it on the
-- next create. We don't backfill — the user already had the code
-- displayed once when the card was first issued.
--
-- Idempotent.
-- ============================================================================

alter table public.profiles
  add column if not exists lpo_gift_card_code text;

create or replace function public.clear_my_gift_card_code()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.profiles
    set lpo_gift_card_code = null
    where id = auth.uid();
end;
$$;

revoke all on function public.clear_my_gift_card_code() from public;
grant execute on function public.clear_my_gift_card_code() to authenticated;

notify pgrst, 'reload schema';
