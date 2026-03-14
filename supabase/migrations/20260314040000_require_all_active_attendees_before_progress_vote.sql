create or replace function public.vote_round_progress(p_session_id uuid, p_action text)
returns jsonb
language plpgsql
security definer
set search_path = 'public'
as $function$
declare
  v_session public."EventSessions"%rowtype;
  v_round public."EventSessionRounds"%rowtype;
  v_connected_count integer := 0;
  v_majority integer := 1;
  v_vote_count integer := 0;
  v_own_match public."EventRoundMatches"%rowtype;
  v_unresolved_count integer := 0;
  v_remaining_active_attendees integer := 0;
  v_transitioned boolean := false;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  if p_action not in ('advance', 'finish') then
    raise exception 'Round progress action must be advance or finish';
  end if;

  if not public.is_event_session_attendee(p_session_id) then
    raise exception 'You must be in the event session to vote';
  end if;

  select *
  into v_session
  from public."EventSessions"
  where session_id = p_session_id;

  if v_session.session_id is null then
    raise exception 'Event session not found';
  end if;

  if v_session.status = 'completed' then
    raise exception 'This event session is locked';
  end if;

  select *
  into v_round
  from public."EventSessionRounds"
  where session_id = p_session_id
    and round_number = v_session.current_round;

  if v_round.round_id is null then
    raise exception 'Current round not found';
  end if;

  perform public.sync_event_round_timer(v_round.round_id);

  if v_round.timer_expires_at is null or v_round.timer_expires_at > now() then
    raise exception 'You can only vote to advance once the round timer has ended';
  end if;

  if p_action = 'finish' and v_session.current_round < v_session.total_rounds then
    raise exception 'Finish voting is only available in the final round';
  end if;

  select *
  into v_own_match
  from public."EventRoundMatches"
  where round_id = v_round.round_id
    and (player_user_id = auth.uid() or opponent_user_id = auth.uid())
  limit 1;

  if v_own_match.match_id is not null and v_own_match.result_status not in ('confirmed', 'unverified', 'reported') then
    raise exception 'Submit your round result before voting to continue';
  end if;

  select count(*)::integer
  into v_unresolved_count
  from public."EventRoundMatches"
  where round_id = v_round.round_id
    and result_status not in ('confirmed', 'unverified');

  if v_unresolved_count > 0 then
    raise exception 'Waiting for all round results to be confirmed before progression voting opens';
  end if;

  select count(*)::integer
  into v_remaining_active_attendees
  from public."EventSessionAttendees" attendee
  where attendee.session_id = p_session_id
    and attendee.dropped_at is null
    and not exists (
      select 1
      from public."EventRoundMatches" match
      where match.round_id = v_round.round_id
        and match.result_status in ('confirmed', 'unverified')
        and (
          match.player_user_id = attendee.user_id
          or match.opponent_user_id = attendee.user_id
        )
    );

  if v_remaining_active_attendees > 0 then
    raise exception 'Waiting for every active player to finish the round before progression voting opens';
  end if;

  insert into public."EventRoundProgressVotes" (round_id, user_id, action, voted_at)
  values (v_round.round_id, auth.uid(), p_action, now())
  on conflict (round_id, user_id)
  do update set
    action = excluded.action,
    voted_at = excluded.voted_at;

  select public.get_event_connected_count(p_session_id)
  into v_connected_count;

  v_majority := floor(v_connected_count / 2.0)::integer + 1;

  select count(*)::integer
  into v_vote_count
  from public."EventRoundProgressVotes"
  where round_id = v_round.round_id
    and action = p_action;

  if v_vote_count >= v_majority then
    if p_action = 'finish' then
      perform public.complete_event_session(p_session_id);
    else
      perform public.advance_round(p_session_id);
    end if;
    v_transitioned := true;
  end if;

  return jsonb_build_object(
    'round_id', v_round.round_id,
    'action', p_action,
    'connected_count', v_connected_count,
    'majority_required', v_majority,
    'votes_for_action', v_vote_count,
    'transitioned', v_transitioned
  );
end;
$function$;
