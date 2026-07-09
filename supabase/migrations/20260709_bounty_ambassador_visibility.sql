-- 2026-07-09: Ambassador-only bounty visibility.
--
-- Adds bounties.visibility ('public' | 'ambassador'). Default 'public'
-- preserves existing rows' behavior. Admin sees everything (drafts + all
-- visibilities), ambassadors + admin see non-draft ambassador-visible
-- bounties, everyone else only sees non-draft public bounties.
--
-- RLS SELECT rewritten to layer the visibility check on top of the existing
-- draft gate. is_ambassador_or_admin() already includes admin so we don't
-- need a separate admin branch — but we keep the top-level is_admin() OR
-- so admins can still see draft rows regardless of visibility.

alter table public.bounties
  add column if not exists visibility text
    not null default 'public'
    check (visibility in ('public', 'ambassador'));

-- Partial index only for the ambassador-visible slice — the common query is
-- "give me every non-draft ambassador-visible row" and the public slice
-- doesn't need it.
create index if not exists bounties_visibility_status_idx
  on public.bounties (visibility, status)
  where visibility = 'ambassador';

drop policy if exists bounties_public_select on public.bounties;
create policy bounties_public_select on public.bounties
  for select using (
    public.is_admin(auth.uid())
    or (
      status <> 'draft'
      and (
        visibility = 'public'
        or public.is_ambassador_or_admin(auth.uid())
      )
    )
  );
