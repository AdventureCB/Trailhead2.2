-- ============================================================================
-- CONTENT PARTNERS — Chunk 6: split AT RISK (auto) from BREACHED (manual)
-- ============================================================================
-- Kyle's call: the existing 'breached' label was doing double duty. Going
-- forward:
--   • 'at_risk'  — NEW status; ONLY set by the auto-recompute RPC when
--                  cumulative content delivery falls behind the term's
--                  base targets. Partner can self-rectify by uploading
--                  more content; the same RPC auto-restores to 'active'
--                  once cumulative_approved catches up.
--   • 'breached' — Now MANUAL ONLY. Admin uses this to flag an account
--                  that requires off-app invoicing (off-the-build
--                  damages, contract dispute, etc.). The auto RPC never
--                  touches it.
--
-- Migration steps:
--   1. Widen the status CHECK to include 'at_risk'
--   2. Backfill: any existing 'breached' row with breach_source='auto'
--      moves to 'at_risk' (preserves history of the auto-flip without
--      misrepresenting it as a damages issue)
--   3. Re-define recompute_content_partner_standing to flip
--      active ↔ at_risk (instead of active ↔ breached)
--   4. Re-define the sweeper RPC to include at_risk in its work queue
--   5. Re-define the partner self-INSERT RLS to allow upload when
--      status IN ('active','at_risk','breached') — all three keep the
--      door open for content; manual breach uploads simply won't
--      auto-restore (breach_source guard remains).
--
-- Idempotent — re-running is safe.
-- ============================================================================

-- 1. Widen the CHECK constraint to include at_risk
alter table public.content_partners
  drop constraint if exists content_partners_status_check;
alter table public.content_partners
  add constraint content_partners_status_check
  check (status in ('pending_delivery','active','at_risk','breached','completed','ended'));

-- 2. Migrate any historical auto-breached rows to at_risk
update public.content_partners
   set status = 'at_risk'
 where status = 'breached'
   and breach_source = 'auto';

-- 3. Re-define the recompute RPC — auto-flip now targets at_risk
create or replace function public.recompute_content_partner_standing(p_partner_id uuid)
returns table(
  ok boolean,
  prior_status text,
  next_status text,
  deficit integer,
  ended_periods integer
)
language plpgsql
security definer
set search_path = public
as $$
#variable_conflict use_column
declare
  v_contract content_partners%rowtype;
  v_quota record;
  v_now timestamptz := now();
  v_total_expected integer := 0;
  v_total_approved integer := 0;
  v_deficit integer := 0;
  v_period_count integer;
  v_period_keys text[];
  v_period_seconds double precision;
  v_started_at timestamptz;
  v_ends_at timestamptz;
  v_periods integer := 0;
  v_per_period integer;
  v_schedule jsonb;
  v_base_target integer;
  v_period_start timestamptz;
  v_period_end timestamptz;
  v_period_approved integer;
  v_prior_status text;
  v_next_status text;
  v_idx integer;
begin
  select * into v_contract from content_partners where id = p_partner_id;
  if not found then
    return query select false, null::text, null::text, 0, 0;
    return;
  end if;

  v_prior_status := v_contract.status;
  v_started_at := v_contract.camper_delivered_at;
  v_ends_at := v_contract.term_ends_at;

  if v_started_at is null or v_ends_at is null or v_now < v_started_at then
    return query select true, v_contract.status, v_contract.status, 0, 0;
    return;
  end if;

  for v_quota in select * from content_partner_quotas where partner_id = p_partner_id loop
    if v_quota.cadence in ('month','quarter') then
      v_period_count := case when v_quota.cadence = 'quarter' then 4 else 12 end;
      v_period_keys := case when v_quota.cadence = 'quarter'
                              then array['q1','q2','q3','q4']
                              else array['m1','m2','m3','m4','m5','m6','m7','m8','m9','m10','m11','m12']
                       end;
      v_period_seconds := extract(epoch from (v_ends_at - v_started_at)) / v_period_count;
      v_schedule := v_quota.schedule;
      if v_schedule is null then
        v_per_period := ceil(coalesce(v_quota.total_target, 0)::numeric / v_period_count)::integer;
      else
        v_per_period := 0;
      end if;

      for v_idx in 1..v_period_count loop
        v_period_start := v_started_at + (v_period_seconds * (v_idx - 1)) * interval '1 second';
        v_period_end := v_started_at + (v_period_seconds * v_idx) * interval '1 second';
        if v_now < v_period_end then
          exit;
        end if;
        if v_schedule is null then
          v_base_target := v_per_period;
        else
          v_base_target := coalesce((v_schedule ->> v_period_keys[v_idx])::integer, 0);
        end if;

        select coalesce(sum(quantity_accepted), 0)::integer into v_period_approved
        from content_partner_deliverables
        where partner_id = p_partner_id
          and kind = v_quota.kind
          and status = 'approved'
          and submitted_at >= v_period_start
          and submitted_at < v_period_end;

        v_total_expected := v_total_expected + v_base_target;
        v_total_approved := v_total_approved + v_period_approved;
        v_periods := v_periods + 1;
      end loop;

    elsif v_quota.cadence = 'milestone' then
      if v_quota.due_at is not null and v_now > v_quota.due_at then
        select coalesce(sum(quantity_accepted), 0)::integer into v_period_approved
        from content_partner_deliverables
        where partner_id = p_partner_id
          and kind = v_quota.kind
          and status = 'approved';
        v_total_expected := v_total_expected + coalesce(v_quota.total_target, 0);
        v_total_approved := v_total_approved + v_period_approved;
        v_periods := v_periods + 1;
      end if;

    elsif v_quota.cadence = 'term' then
      if v_now >= v_ends_at then
        select coalesce(sum(quantity_accepted), 0)::integer into v_period_approved
        from content_partner_deliverables
        where partner_id = p_partner_id
          and kind = v_quota.kind
          and status = 'approved';
        v_total_expected := v_total_expected + coalesce(v_quota.total_target, 0);
        v_total_approved := v_total_approved + v_period_approved;
        v_periods := v_periods + 1;
      end if;
    end if;
  end loop;

  v_deficit := greatest(0, v_total_expected - v_total_approved);

  -- AUTO branch now flips active ↔ at_risk. Breached (manual) is never
  -- touched here.
  if v_deficit > 0 and v_contract.status = 'active' then
    v_next_status := 'at_risk';
    update content_partners
       set status = 'at_risk',
           breach_source = 'auto',
           notes = coalesce(notes || E'\n\n', '') ||
                   '[' || to_char(v_now, 'YYYY-MM-DD') ||
                   '] AT RISK OF DEFAULT — Content delivery deficit (' || v_deficit ||
                   ' items behind cumulative target).',
           updated_at = v_now
     where id = p_partner_id;
    begin
      insert into notifications (user_id, type, actor_id, actor_name, text)
      values (
        v_contract.profile_id,
        'content_partner_review',
        null,
        'LPO System',
        'Your content partnership is at risk of default — you are ' || v_deficit || ' items behind your cumulative quota. Submit additional content to restore good standing.'
      );
    exception when others then null; end;
  elsif v_deficit = 0 and v_contract.status = 'at_risk' then
    v_next_status := 'active';
    update content_partners
       set status = 'active',
           breach_source = null,
           notes = coalesce(notes || E'\n\n', '') ||
                   '[' || to_char(v_now, 'YYYY-MM-DD') ||
                   '] RESTORED — Cumulative quota met, partnership back to active.',
           updated_at = v_now
     where id = p_partner_id;
    begin
      insert into notifications (user_id, type, actor_id, actor_name, text)
      values (
        v_contract.profile_id,
        'content_partner_review',
        null,
        'LPO System',
        'Welcome back — your content partnership has been automatically restored to active status.'
      );
    exception when others then null; end;
  else
    v_next_status := v_contract.status;
  end if;

  return query select true, v_prior_status, v_next_status, v_deficit, v_periods;
end;
$$;

grant execute on function public.recompute_content_partner_standing(uuid) to authenticated;

-- 4. Sweeper now also walks at_risk rows (breached stays in the loop
--    because we still want to surface the partner in admin queries — the
--    RPC itself no-ops on breached since the auto-branch only matches
--    active/at_risk).
create or replace function public.recompute_all_content_partner_standings()
returns table(
  partner_id uuid,
  prior_status text,
  next_status text,
  deficit integer
)
language plpgsql
security definer
set search_path = public
as $$
#variable_conflict use_column
declare
  v_row content_partners%rowtype;
  v_result record;
begin
  if not public.is_admin(auth.uid()) then
    return;
  end if;

  for v_row in
    select * from content_partners
    where status in ('active','at_risk','breached')
  loop
    select * into v_result
    from public.recompute_content_partner_standing(v_row.id);
    if v_result.ok then
      partner_id := v_row.id;
      prior_status := v_result.prior_status;
      next_status := v_result.next_status;
      deficit := v_result.deficit;
      return next;
    end if;
  end loop;
  return;
end;
$$;

grant execute on function public.recompute_all_content_partner_standings() to authenticated;

-- 5. Widen the INSERT RLS to include at_risk
drop policy if exists content_partner_deliverables_partner_insert on public.content_partner_deliverables;
create policy content_partner_deliverables_partner_insert on public.content_partner_deliverables
  for insert to authenticated
  with check (
    exists (
      select 1 from public.content_partners cp
      where cp.id = content_partner_deliverables.partner_id
        and cp.profile_id = auth.uid()
        and cp.status in ('active', 'at_risk', 'breached')
    )
    and status = 'pending'
    and quantity_accepted is null
    and reviewed_by is null
    and reviewed_at is null
  );

notify pgrst, 'reload schema';
