create or replace function public.report_match_result_checked(
  p_match_id uuid,
  p_round_result text,
  p_games_won integer,
  p_games_lost integer,
  p_games_tied integer,
  p_went_first boolean,
  p_round_duration_minutes integer,
  p_opponent_archetype text,
  p_notes text
)
returns text
language plpgsql
security definer
set search_path = 'public'
as $function$
declare
  v_user_id uuid := auth.uid();
  v_best_of smallint := 3;
  v_total_games integer;
  v_expected_result text;
  v_expected_opponent_result text;
  v_opponent_round_result text;
  v_opponent_games_won integer;
  v_opponent_games_lost integer;
  v_opponent_games_tied integer;
  v_opponent_went_first boolean;
  v_submit_result text;
begin
  select coalesce(session.best_of, 3)
  into v_best_of
  from public."EventRoundMatches" as match
  inner join public."EventSessionRounds" as round
    on round.round_id = match.round_id
  inner join public."EventSessions" as session
    on session.session_id = round.session_id
  where match.match_id = p_match_id;

  if v_best_of not in (1, 3) then
    raise exception 'Match format must be best of 1 or best of 3.';
  end if;

  if p_games_won < 0 or p_games_lost < 0 or p_games_tied < 0 then
    raise exception 'Game counts must be whole numbers of zero or greater.';
  end if;

  v_total_games := p_games_won + p_games_lost + p_games_tied;

  if v_total_games > v_best_of then
    raise exception 'Best of % matches cannot have more than % game(s).', v_best_of, v_best_of;
  end if;

  v_expected_result := case
    when p_games_won > p_games_lost then 'win'
    when p_games_lost > p_games_won then 'loss'
    else 'tie'
  end;

  if v_expected_result <> p_round_result then
    raise exception 'Round result must match the completed game score.';
  end if;

  v_expected_opponent_result := case
    when p_games_lost > p_games_won then 'win'
    when p_games_won > p_games_lost then 'loss'
    else 'tie'
  end;

  v_submit_result := public.report_match_result(
    p_match_id,
    p_round_result,
    p_games_won,
    p_games_lost,
    p_games_tied,
    p_went_first,
    p_round_duration_minutes,
    p_opponent_archetype,
    p_notes
  );

  if v_user_id is null then
    return v_submit_result;
  end if;

  select
    stat.round_result,
    stat.games_won,
    stat.games_lost,
    stat.games_tied,
    stat.went_first
  into
    v_opponent_round_result,
    v_opponent_games_won,
    v_opponent_games_lost,
    v_opponent_games_tied,
    v_opponent_went_first
  from public."EventPlayerRoundStats" as stat
  where stat.match_id = p_match_id
    and stat.user_id <> v_user_id
  order by stat.reported_at desc
  limit 1;

  if found and (
    v_opponent_round_result is distinct from v_expected_opponent_result
    or v_opponent_games_won is distinct from p_games_lost
    or v_opponent_games_lost is distinct from p_games_won
    or v_opponent_games_tied is distinct from p_games_tied
    or (
      p_went_first is not null
      and v_opponent_went_first is not null
      and v_opponent_went_first = p_went_first
    )
  ) then
    update public."EventRoundMatches"
    set
      result_status = 'disputed',
      confirmed_at = null,
      updated_at = timezone('utc', now())
    where match_id = p_match_id;

    return 'disputed';
  end if;

  return v_submit_result;
end;
$function$;
