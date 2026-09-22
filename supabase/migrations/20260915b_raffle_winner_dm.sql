-- 2026-09-15: Event drawings — deliver the winner's prize code by DM.
--
-- Sends the code to the winner via a real DM from a FIXED admin account
-- (so it's consistent regardless of which host ran the draw). Called by the
-- raffle-pick-winner edge function (service role). Finds an existing direct
-- conversation between sender + recipient or creates one, then posts the
-- message. SECURITY DEFINER so it can write dm_* on behalf of the sender.

create or replace function public.raffle_send_winner_dm(
  p_sender uuid,
  p_recipient uuid,
  p_body text
) returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_conv uuid;
begin
  if p_sender is null or p_recipient is null or p_sender = p_recipient or coalesce(trim(p_body), '') = '' then
    return null;
  end if;
  -- Reuse an existing direct conversation between the two, else create one.
  select c.id into v_conv
  from public.dm_conversations c
  where c.type = 'direct'
    and exists (select 1 from public.dm_participants p where p.conversation_id = c.id and p.user_id = p_sender)
    and exists (select 1 from public.dm_participants p where p.conversation_id = c.id and p.user_id = p_recipient)
  limit 1;
  if v_conv is null then
    insert into public.dm_conversations (type, created_by) values ('direct', p_sender) returning id into v_conv;
    insert into public.dm_participants (conversation_id, user_id) values (v_conv, p_sender), (v_conv, p_recipient)
      on conflict do nothing;
  end if;
  insert into public.dm_messages (conversation_id, sender_id, body) values (v_conv, p_sender, p_body);
  return v_conv;
end;
$$;

revoke all on function public.raffle_send_winner_dm(uuid, uuid, text) from public;
grant execute on function public.raffle_send_winner_dm(uuid, uuid, text) to service_role;

notify pgrst, 'reload schema';
