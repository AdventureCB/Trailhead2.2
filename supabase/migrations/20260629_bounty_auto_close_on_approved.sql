-- ============================================================================
-- BOUNTIES — auto-close when approved count hits total_slots
-- ============================================================================
-- Once the admin has approved as many submissions as the bounty has
-- winner slots, the bounty is genuinely done — no point keeping it
-- discoverable in OPEN. Flip bounty.status to 'closed' automatically so
-- the card moves into the DONE pill and disappears from the OPEN list.
--
-- Why APPROVED (not submitted)? Submission is the user's signal of
-- completion; APPROVAL is the admin signing off and paying out. Until
-- approval, the admin could reject and the slot frees back up — so the
-- bounty isn't actually filled.
--
-- This only auto-CLOSES. We don't auto-reopen when a previously-approved
-- submission flips out (e.g. admin reverts) because we can't tell whether
-- the close was triggered by us or by a manual admin action. If a rare
-- reopen is needed, admin can change bounty.status by hand.
--
-- Idempotent.
-- ============================================================================

create or replace function public.auto_close_bounty_on_approval_full()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  v_approved_count int;
  v_total_slots int;
  v_status text;
  bid uuid;
begin
  -- Only act when this row's status transitions INTO approved. Excludes
  -- INSERTs that already land in non-approved states + UPDATEs that don't
  -- touch approval. Cheap early-exit otherwise.
  if TG_OP = 'UPDATE' then
    if OLD.status = NEW.status then return NEW; end if;
    if NEW.status <> 'approved' then return NEW; end if;
  elsif TG_OP = 'INSERT' then
    if NEW.status <> 'approved' then return NEW; end if;
  else
    return NEW;
  end if;

  bid := NEW.bounty_id;
  if bid is null then return NEW; end if;

  -- Read the parent bounty's current state under a row lock so a flurry
  -- of approvals from a multi-row admin action can't double-close or
  -- race past each other.
  select status, total_slots into v_status, v_total_slots
    from public.bounties
    where id = bid
    for update;
  if not found then return NEW; end if;
  if v_status <> 'open' then return NEW; end if; -- already closed / draft / archived; nothing to do

  select count(*) into v_approved_count
    from public.bounty_submissions
    where bounty_id = bid
      and status = 'approved';

  if v_approved_count >= v_total_slots then
    update public.bounties
      set status = 'closed',
          updated_at = now()
      where id = bid;
  end if;

  return NEW;
end;
$$;

drop trigger if exists bounty_submissions_auto_close on public.bounty_submissions;
create trigger bounty_submissions_auto_close
  after insert or update of status on public.bounty_submissions
  for each row execute function public.auto_close_bounty_on_approval_full();

-- ── Backfill — any bounty that already has approved_count >= total_slots
--    should be closed now. Safe to re-run.
update public.bounties b
  set status = 'closed', updated_at = now()
  where b.status = 'open'
    and b.total_slots <= (
      select count(*)
      from public.bounty_submissions s
      where s.bounty_id = b.id and s.status = 'approved'
    );

notify pgrst, 'reload schema';
