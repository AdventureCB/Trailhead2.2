-- ============================================================================
-- CONTENT PARTNERS — Chunk 5: breach can upload
-- ============================================================================
-- The chunk 4 auto-flip flips status='active' → 'breached' on deficit,
-- which means the original chunk_1 INSERT policy (which gates on
-- `cp.status = 'active'`) silently blocks the very mechanism that's
-- supposed to RESTORE the partner to good standing — they can't catch
-- up because they can't upload while breached. Widen the policy to
-- allow INSERT when status is 'active' OR 'breached'.
--
-- Manual breach (breach_source='manual', off-app damages) also allows
-- upload — admin enforcement is external, and approved content during
-- a manual breach simply won't auto-restore (chunk 4 restore guard
-- requires breach_source='auto').
--
-- Idempotent — re-running is safe.
-- ============================================================================

drop policy if exists content_partner_deliverables_partner_insert on public.content_partner_deliverables;
create policy content_partner_deliverables_partner_insert on public.content_partner_deliverables
  for insert to authenticated
  with check (
    exists (
      select 1 from public.content_partners cp
      where cp.id = content_partner_deliverables.partner_id
        and cp.profile_id = auth.uid()
        and cp.status in ('active', 'breached')
    )
    and status = 'pending'
    and quantity_accepted is null
    and reviewed_by is null
    and reviewed_at is null
  );

notify pgrst, 'reload schema';
