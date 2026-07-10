-- 2026-07-10: Two fixes for the admin manual-add-order flow.
--
-- 1. Free-form manual add — admin types a subtotal + customer + reason but
--    no Shopify order number (the order was placed off-Shopify or the
--    admin doesn't have the id). Client passes NULL to
--    `admin_add_manual_order.p_shopify_order_id`; the RPC forwards NULL to
--    the column. Column was NOT NULL, insert failed 23502. Fix: drop the
--    NOT NULL. Postgres UNIQUE treats NULLs as distinct so multiple
--    no-id rows never collide.
--
-- 2. Re-add after soft-delete — `admin_remove_order` sets `removed_at`
--    but keeps the row. That row still owns the shopify_order_id, so the
--    UNIQUE constraint blocks a fresh `admin_add_manual_order` with the
--    same id. We keep the strict UNIQUE (the shopify-webhook depends on
--    `on_conflict=shopify_order_id` for idempotent retry inserts) and
--    add a purge RPC the client calls automatically after a 23505 so the
--    admin can re-add without a manual DB touch. Only hard-deletes rows
--    that are ALREADY soft-deleted; active rows are protected (admin
--    must remove via `admin_remove_order` first).

alter table public.ambassador_orders alter column shopify_order_id drop not null;

drop function if exists public.admin_purge_soft_deleted_order(text);
create or replace function public.admin_purge_soft_deleted_order(p_shopify_order_id text)
returns integer
language plpgsql
security definer
set search_path = public
as $$
#variable_conflict use_column
declare
  v_deleted integer;
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'Not authorized';
  end if;
  if p_shopify_order_id is null or length(trim(p_shopify_order_id)) = 0 then
    raise exception 'shopify_order_id required';
  end if;
  delete from public.ambassador_orders
    where shopify_order_id = p_shopify_order_id
      and removed_at is not null;
  get diagnostics v_deleted = row_count;
  return v_deleted;
end
$$;

grant execute on function public.admin_purge_soft_deleted_order(text) to authenticated;
