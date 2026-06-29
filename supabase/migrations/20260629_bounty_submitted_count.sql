-- ============================================================================
-- BOUNTIES — add submitted_count column + auto-maintain trigger
-- ============================================================================
-- The old "X / Y slots claimed" UI was confusing because a 1-slot bounty
-- with a single claim would read "1/1 claimed" — that LOOKS like the
-- bounty is closed and discourages new claims. Under the 2026-06-29
-- submitted-cap rules (see 20260629_bounty_slot_cap_on_submitted.sql),
-- bounties stay open for additional claimers until total_slots
-- SUBMISSIONS land, so we need a column to surface the completed count
-- separately from the started count.
--
-- Net result: cards can now render "X started · Y completed" + flip to
-- "All slots filled" when submitted_count >= total_slots.
--
-- Counter is denormalized + maintained by a trigger on bounty_submissions
-- so reads stay cheap (no aggregations on every bounty list fetch). The
-- trigger fires on INSERT, UPDATE OF status, and DELETE — those are the
-- only events that can flip a row's "submitted-or-approved" membership.
--
-- Idempotent.
-- ============================================================================

-- ── 1. Column ───────────────────────────────────────────────────────────────
alter table public.bounties
  add column if not exists submitted_count int not null default 0 check (submitted_count >= 0);

-- ── 2. Trigger function — bumps / decrements the parent bounty's counter
--      whenever a submission row crosses the (submitted | approved) line.
create or replace function public.bump_bounty_submitted_count()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  was_complete boolean := (TG_OP <> 'INSERT') and (OLD.status in ('submitted','approved'));
  is_complete  boolean := (TG_OP <> 'DELETE') and (NEW.status in ('submitted','approved'));
  bid uuid;
begin
  if was_complete = is_complete then return coalesce(NEW, OLD); end if;
  bid := coalesce(NEW.bounty_id, OLD.bounty_id);
  if bid is null then return coalesce(NEW, OLD); end if;
  if is_complete then
    update public.bounties
      set submitted_count = coalesce(submitted_count, 0) + 1
      where id = bid;
  else
    update public.bounties
      set submitted_count = greatest(coalesce(submitted_count, 0) - 1, 0)
      where id = bid;
  end if;
  return coalesce(NEW, OLD);
end;
$$;

drop trigger if exists bounty_submissions_maintain_count on public.bounty_submissions;
create trigger bounty_submissions_maintain_count
  after insert or update of status or delete on public.bounty_submissions
  for each row execute function public.bump_bounty_submitted_count();

-- ── 3. Backfill — populate the counter from existing data. Safe to re-run.
update public.bounties b
  set submitted_count = coalesce(sub.cnt, 0)
  from (
    select bounty_id, count(*) as cnt
    from public.bounty_submissions
    where status in ('submitted','approved')
    group by bounty_id
  ) sub
  where b.id = sub.bounty_id;

-- Zero out any bounty that has no completed submissions (covers the
-- backfill edge case where a bounty exists but has no submissions at all).
update public.bounties
  set submitted_count = 0
  where submitted_count is null
     or id not in (
       select distinct bounty_id from public.bounty_submissions
       where status in ('submitted','approved')
     );

notify pgrst, 'reload schema';
