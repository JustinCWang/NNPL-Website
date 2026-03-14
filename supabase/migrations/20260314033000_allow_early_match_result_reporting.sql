create or replace function public.report_match_result(
  p_match_id uuid,
  p_round_result text,
  p_games_won integer,
  p_games_lost integer,
  p_games_tied integer default 0,
  p_went_first boolean default null,
  p_round_duration_minutes integer default null,
  p_opponent_archetype text default null,
  p_notes text default null
)
returns text
language plpgsql
security definer
set search_path = 'public'
as $function$
declare
  v_match public."EventRoundMatches"%rowtype;
  v_round public."EventSessionRounds"%rowtype;
  v_session public."EventSessions"%rowtype;
  v_is_player boolean := false;
  v_result_status text;
  v_can_report_early boolean := false;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  if p_round_result not in ('win', 'loss', 'tie') then
    raise exception 'Round result must be win, loss, or tie';
  end if;

  if coalesce(p_games_won, 0) < 0 or coalesce(p_games_lost, 0) < 0 or coalesce(p_games_tied, 0) < 0 then
    raise exception 'Game scores cannot be negative';
  end if;

  select m.*
  into v_match
  from public."EventRoundMatches" m
  where m.match_id = p_match_id;

  if v_match.match_id is null then
    raise exception 'Match not found';
  end if;

  select *
  into v_round
  from public."EventSessionRounds"
  where round_id = v_match.round_id;

  select *
  into v_session
  from public."EventSessions"
  where session_id = v_round.session_id;

  if v_session.status = 'completed' then
    raise exception 'This event session is locked';
  end if;

  perform public.sync_event_round_timer(v_round.round_id);

  v_can_report_early := v_match.pair_finished_at is not null;

  if v_round.timer_started_at is null then
    raise exception 'Round results can only be entered after the timer has started';
  end if;

  if not v_can_report_early and (v_round.timer_expires_at is null or v_round.timer_expires_at > now()) then
    raise exception 'Round results can only be entered after the timer has finished';
  end if;

  if auth.uid() <> v_match.player_user_id and auth.uid() <> v_match.opponent_user_id then
    raise exception 'You do not have access to this match';
  end if;

  v_is_player := auth.uid() = v_match.player_user_id;

  insert into public."EventPlayerRoundStats" (
    match_id,
    user_id,
    games_won,
    games_lost,
    games_tied,
    round_result,
    went_first,
    round_duration_minutes,
    opponent_archetype,
    notes,
    reported_at
  ) values (
    p_match_id,
    auth.uid(),
    coalesce(p_games_won, 0),
    coalesce(p_games_lost, 0),
    coalesce(p_games_tied, 0),
    p_round_result,
    p_went_first,
    p_round_duration_minutes,
    nullif(btrim(coalesce(p_opponent_archetype, '')), ''),
    nullif(btrim(coalesce(p_notes, '')), ''),
    now()
  )
  on conflict (match_id, user_id)
  do update set
    games_won = excluded.games_won,
    games_lost = excluded.games_lost,
    games_tied = excluded.games_tied,
    round_result = excluded.round_result,
    went_first = excluded.went_first,
    round_duration_minutes = excluded.round_duration_minutes,
    opponent_archetype = excluded.opponent_archetype,
    notes = excluded.notes,
    reported_at = excluded.reported_at;

  if v_match.source_type = 'other_player' then
    update public."EventRoundMatches"
    set player_reported_result = p_round_result,
        opponent_reported_result = null,
        result_status = 'unverified',
        confirmed_at = now(),
        updated_at = now()
    where match_id = p_match_id;

    perform public.refresh_event_session_attendee_record(v_round.session_id, auth.uid());
    perform public.refresh_event_player_summary(v_round.session_id, auth.uid());
    return 'unverified';
  end if;

  if v_is_player then
    update public."EventRoundMatches"
    set player_reported_result = p_round_result,
        result_status = case when opponent_reported_result is null then 'reported' else result_status end,
        updated_at = now()
    where match_id = p_match_id;
  else
    update public."EventRoundMatches"
    set opponent_reported_result = p_round_result,
        result_status = case when player_reported_result is null then 'reported' else result_status end,
        updated_at = now()
    where match_id = p_match_id;
  end if;

  select *
  into v_match
  from public."EventRoundMatches"
  where match_id = p_match_id;

  if v_match.player_reported_result is not null and v_match.opponent_reported_result is not null then
    if v_match.player_reported_result = public.event_result_inverse(v_match.opponent_reported_result) then
      v_result_status := 'confirmed';

      update public."EventRoundMatches"
      set result_status = 'confirmed',
          confirmed_at = now(),
          updated_at = now()
      where match_id = p_match_id;
    else
      v_result_status := 'disputed';

      update public."EventRoundMatches"
      set result_status = 'disputed',
          confirmed_at = null,
          updated_at = now()
      where match_id = p_match_id;
    end if;

    perform public.refresh_event_session_attendee_record(v_round.session_id, v_match.player_user_id);
    perform public.refresh_event_player_summary(v_round.session_id, v_match.player_user_id);

    if v_match.opponent_user_id is not null then
      perform public.refresh_event_session_attendee_record(v_round.session_id, v_match.opponent_user_id);
      perform public.refresh_event_player_summary(v_round.session_id, v_match.opponent_user_id);
    end if;
  else
    v_result_status := 'reported';
  end if;

  return v_result_status;
end;
$function$;
