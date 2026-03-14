create extension if not exists pgcrypto;

create table if not exists public."EventSessions" (
  session_id uuid primary key default gen_random_uuid(),
  event_id uuid not null unique references public."Events"(event_id) on delete cascade,
  status text not null default 'active' check (status = any (array['pending', 'active', 'completed'])),
  total_rounds integer not null default 4 check (total_rounds > 0 and total_rounds <= 20),
  current_round integer not null default 1 check (current_round > 0),
  timer_minutes integer check (timer_minutes >= 1 and timer_minutes <= 90),
  timer_status text not null default 'not_started' check (timer_status = any (array['not_started', 'voting', 'running', 'expired', 'completed'])),
  timer_started_at timestamptz,
  timer_expires_at timestamptz,
  started_at timestamptz default now(),
  ended_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references public."Users"(user_id) on delete set null,
  started_by uuid references public."Users"(user_id) on delete set null,
  best_of smallint not null default 3 check (best_of = any (array[1, 3]))
);

create index if not exists "EventSessions_status_idx" on public."EventSessions" (status);
create index if not exists "EventSessions_started_at_idx" on public."EventSessions" (started_at desc);

create table if not exists public."EventSessionAttendees" (
  session_id uuid not null references public."EventSessions"(session_id) on delete cascade,
  user_id uuid not null references public."Users"(user_id) on delete cascade,
  selected_deck_id uuid references public."Decklists"(deck_id) on delete set null,
  joined_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  is_connected boolean not null default true,
  current_record_wins integer not null default 0 check (current_record_wins >= 0),
  current_record_losses integer not null default 0 check (current_record_losses >= 0),
  current_record_ties integer not null default 0 check (current_record_ties >= 0),
  display_name text not null default 'Player',
  dropped_at timestamptz,
  primary key (session_id, user_id)
);

create index if not exists "EventSessionAttendees_user_id_idx" on public."EventSessionAttendees" (user_id);
create index if not exists "EventSessionAttendees_last_seen_idx" on public."EventSessionAttendees" (session_id, last_seen_at desc);

create table if not exists public."EventSessionRounds" (
  round_id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public."EventSessions"(session_id) on delete cascade,
  round_number integer not null check (round_number > 0),
  status text not null default 'pending' check (status = any (array['pending', 'active', 'completed'])),
  timer_minutes integer check (timer_minutes >= 1 and timer_minutes <= 90),
  timer_started_at timestamptz,
  timer_expires_at timestamptz,
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  unique (session_id, round_number)
);

create index if not exists "EventSessionRounds_session_round_idx" on public."EventSessionRounds" (session_id, round_number);

create table if not exists public."EventRoundTimerVotes" (
  round_id uuid not null references public."EventSessionRounds"(round_id) on delete cascade,
  user_id uuid not null references public."Users"(user_id) on delete cascade,
  requested_minutes integer not null check (requested_minutes >= 1 and requested_minutes <= 90),
  voted_at timestamptz not null default now(),
  primary key (round_id, user_id)
);

create index if not exists "EventRoundTimerVotes_round_choice_idx" on public."EventRoundTimerVotes" (round_id, requested_minutes);

create table if not exists public."EventRoundMatches" (
  match_id uuid primary key default gen_random_uuid(),
  round_id uuid not null references public."EventSessionRounds"(round_id) on delete cascade,
  player_user_id uuid not null references public."Users"(user_id) on delete cascade,
  opponent_user_id uuid references public."Users"(user_id) on delete cascade,
  opponent_label text,
  source_type text not null check (source_type = any (array['app_user', 'other_player'])),
  result_status text not null default 'pending' check (result_status = any (array['pending', 'reported', 'confirmed', 'disputed', 'unverified'])),
  player_reported_result text check (player_reported_result = any (array['win', 'loss', 'tie'])),
  opponent_reported_result text check (opponent_reported_result = any (array['win', 'loss', 'tie'])),
  confirmed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  pair_finished_at timestamptz,
  pair_finished_duration_minutes integer,
  unique (round_id, player_user_id),
  constraint "EventRoundMatches_check" check (
    (
      source_type = 'app_user'
      and opponent_user_id is not null
      and nullif(btrim(coalesce(opponent_label, '')), '') is null
    ) or (
      source_type = 'other_player'
      and opponent_user_id is null
      and nullif(btrim(coalesce(opponent_label, '')), '') is not null
    )
  )
);

create index if not exists "EventRoundMatches_round_id_idx" on public."EventRoundMatches" (round_id);
create index if not exists "EventRoundMatches_opponent_user_id_idx" on public."EventRoundMatches" (opponent_user_id);
create index if not exists "EventRoundMatches_player_pair_idx" on public."EventRoundMatches" (round_id, player_user_id, opponent_user_id);

create table if not exists public."EventPlayerRoundStats" (
  match_id uuid not null references public."EventRoundMatches"(match_id) on delete cascade,
  user_id uuid not null references public."Users"(user_id) on delete cascade,
  games_won integer not null default 0 check (games_won >= 0),
  games_lost integer not null default 0 check (games_lost >= 0),
  games_tied integer not null default 0 check (games_tied >= 0),
  round_result text not null check (round_result = any (array['win', 'loss', 'tie'])),
  went_first boolean,
  round_duration_minutes integer check (round_duration_minutes >= 1 and round_duration_minutes <= 180),
  opponent_archetype text,
  notes text,
  reported_at timestamptz not null default now(),
  primary key (match_id, user_id)
);

create index if not exists "EventPlayerRoundStats_user_id_idx" on public."EventPlayerRoundStats" (user_id, reported_at desc);

create table if not exists public."EventPlayerSummaries" (
  session_id uuid not null references public."EventSessions"(session_id) on delete cascade,
  user_id uuid not null references public."Users"(user_id) on delete cascade,
  deck_id uuid references public."Decklists"(deck_id) on delete set null,
  final_wins integer not null default 0 check (final_wins >= 0),
  final_losses integer not null default 0 check (final_losses >= 0),
  final_ties integer not null default 0 check (final_ties >= 0),
  rounds_played integer not null default 0 check (rounds_played >= 0),
  total_games_won integer not null default 0 check (total_games_won >= 0),
  total_games_lost integer not null default 0 check (total_games_lost >= 0),
  total_games_tied integer not null default 0 check (total_games_tied >= 0),
  went_first_count integer not null default 0 check (went_first_count >= 0),
  average_round_duration_minutes numeric,
  app_user_rounds integer not null default 0 check (app_user_rounds >= 0),
  other_player_rounds integer not null default 0 check (other_player_rounds >= 0),
  completed_at timestamptz not null default now(),
  primary key (session_id, user_id)
);

create index if not exists "EventPlayerSummaries_user_id_idx" on public."EventPlayerSummaries" (user_id, completed_at desc);

create table if not exists public."EventRoundProgressVotes" (
  round_id uuid not null references public."EventSessionRounds"(round_id) on delete cascade,
  user_id uuid not null references public."Users"(user_id) on delete cascade,
  action text not null check (action = any (array['advance', 'finish'])),
  voted_at timestamptz not null default now(),
  primary key (round_id, user_id)
);

create index if not exists "EventRoundProgressVotes_round_action_idx" on public."EventRoundProgressVotes" (round_id, action);

create table if not exists public."EventMatchFinishSignals" (
  match_id uuid not null references public."EventRoundMatches"(match_id) on delete cascade,
  user_id uuid not null references public."Users"(user_id) on delete cascade,
  signaled_at timestamptz not null default timezone('utc', now()),
  primary key (match_id, user_id)
);

alter table public."EventSessions" enable row level security;
alter table public."EventSessionAttendees" enable row level security;
alter table public."EventSessionRounds" enable row level security;
alter table public."EventRoundTimerVotes" enable row level security;
alter table public."EventRoundMatches" enable row level security;
alter table public."EventPlayerRoundStats" enable row level security;
alter table public."EventPlayerSummaries" enable row level security;
alter table public."EventRoundProgressVotes" enable row level security;
alter table public."EventMatchFinishSignals" enable row level security;

create or replace function public.current_user_role()
returns text
language sql
stable
security definer
set search_path = 'public'
as $function$
  select role
  from public."Users"
  where user_id = auth.uid()
  limit 1;
$function$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = 'public'
as $function$
  select coalesce(public.current_user_role() = 'admin', false);
$function$;

create or replace function public.can_manage_event(event_owner uuid)
returns boolean
language sql
stable
security definer
set search_path = 'public'
as $function$
  select public.is_admin()
      or (public.current_user_role() = 'vendor' and event_owner = auth.uid());
$function$;

create or replace function public.can_manage_event_session(p_session_id uuid)
returns boolean
language sql
stable
security definer
set search_path = 'public'
as $function$
  select coalesce(public.can_manage_event(e.created_by), false)
  from public."EventSessions" s
  join public."Events" e on e.event_id = s.event_id
  where s.session_id = p_session_id
  limit 1;
$function$;

create or replace function public.is_event_registered_user(p_event_id uuid)
returns boolean
language sql
stable
security definer
set search_path = 'public'
as $function$
  select exists (
    select 1
    from public."EventRegistrations"
    where event_id = p_event_id
      and user_id = auth.uid()
  );
$function$;

create or replace function public.is_event_session_attendee(p_session_id uuid)
returns boolean
language sql
stable
security definer
set search_path = 'public'
as $function$
  select exists (
    select 1
    from public."EventSessionAttendees"
    where session_id = p_session_id
      and user_id = auth.uid()
  );
$function$;

create or replace function public.can_access_event_round(p_round_id uuid)
returns boolean
language sql
stable
security definer
set search_path = 'public'
as $function$
  select exists (
    select 1
    from public."EventSessionRounds" r
    join public."EventSessionAttendees" a on a.session_id = r.session_id
    where r.round_id = p_round_id
      and a.user_id = auth.uid()
  );
$function$;

create or replace function public.event_result_inverse(p_result text)
returns text
language sql
immutable
set search_path = 'public'
as $function$
  select case p_result
    when 'win' then 'loss'
    when 'loss' then 'win'
    when 'tie' then 'tie'
    else null
  end;
$function$;

create or replace function public.get_event_connected_count(p_session_id uuid)
returns integer
language sql
stable
security definer
set search_path = 'public'
as $function$
  select coalesce(count(*), 0)::integer
  from public."EventSessionAttendees"
  where session_id = p_session_id
    and is_connected = true
    and last_seen_at >= now() - interval '90 seconds';
$function$;

create or replace function public.refresh_event_session_attendee_record(p_session_id uuid, p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = 'public'
as $function$
declare
  v_wins integer := 0;
  v_losses integer := 0;
  v_ties integer := 0;
begin
  select
    coalesce(count(*) filter (where stats.round_result = 'win'), 0)::integer,
    coalesce(count(*) filter (where stats.round_result = 'loss'), 0)::integer,
    coalesce(count(*) filter (where stats.round_result = 'tie'), 0)::integer
  into v_wins, v_losses, v_ties
  from public."EventPlayerRoundStats" stats
  join public."EventRoundMatches" matches on matches.match_id = stats.match_id
  join public."EventSessionRounds" rounds on rounds.round_id = matches.round_id
  where rounds.session_id = p_session_id
    and stats.user_id = p_user_id
    and matches.result_status in ('confirmed', 'unverified');

  update public."EventSessionAttendees"
  set current_record_wins = v_wins,
      current_record_losses = v_losses,
      current_record_ties = v_ties,
      last_seen_at = greatest(last_seen_at, now())
  where session_id = p_session_id
    and user_id = p_user_id;
end;
$function$;

create or replace function public.refresh_event_player_summary(p_session_id uuid, p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = 'public'
as $function$
declare
  v_deck_id uuid;
  v_final_wins integer := 0;
  v_final_losses integer := 0;
  v_final_ties integer := 0;
  v_rounds_played integer := 0;
  v_total_games_won integer := 0;
  v_total_games_lost integer := 0;
  v_total_games_tied integer := 0;
  v_went_first_count integer := 0;
  v_average_round_duration numeric(5, 2);
  v_app_user_rounds integer := 0;
  v_other_player_rounds integer := 0;
begin
  select selected_deck_id
  into v_deck_id
  from public."EventSessionAttendees"
  where session_id = p_session_id
    and user_id = p_user_id;

  select
    coalesce(count(*) filter (where stats.round_result = 'win'), 0)::integer,
    coalesce(count(*) filter (where stats.round_result = 'loss'), 0)::integer,
    coalesce(count(*) filter (where stats.round_result = 'tie'), 0)::integer,
    coalesce(count(*), 0)::integer,
    coalesce(sum(stats.games_won), 0)::integer,
    coalesce(sum(stats.games_lost), 0)::integer,
    coalesce(sum(stats.games_tied), 0)::integer,
    coalesce(sum(case when stats.went_first = true then 1 else 0 end), 0)::integer,
    round(avg(stats.round_duration_minutes)::numeric, 2),
    coalesce(sum(case when matches.source_type = 'app_user' then 1 else 0 end), 0)::integer,
    coalesce(sum(case when matches.source_type = 'other_player' then 1 else 0 end), 0)::integer
  into v_final_wins, v_final_losses, v_final_ties, v_rounds_played, v_total_games_won, v_total_games_lost, v_total_games_tied, v_went_first_count, v_average_round_duration, v_app_user_rounds, v_other_player_rounds
  from public."EventPlayerRoundStats" stats
  join public."EventRoundMatches" matches on matches.match_id = stats.match_id
  join public."EventSessionRounds" rounds on rounds.round_id = matches.round_id
  where rounds.session_id = p_session_id
    and stats.user_id = p_user_id
    and matches.result_status in ('confirmed', 'unverified');

  insert into public."EventPlayerSummaries" (
    session_id,
    user_id,
    deck_id,
    final_wins,
    final_losses,
    final_ties,
    rounds_played,
    total_games_won,
    total_games_lost,
    total_games_tied,
    went_first_count,
    average_round_duration_minutes,
    app_user_rounds,
    other_player_rounds,
    completed_at
  )
  values (
    p_session_id,
    p_user_id,
    v_deck_id,
    v_final_wins,
    v_final_losses,
    v_final_ties,
    v_rounds_played,
    v_total_games_won,
    v_total_games_lost,
    v_total_games_tied,
    v_went_first_count,
    v_average_round_duration,
    v_app_user_rounds,
    v_other_player_rounds,
    now()
  )
  on conflict (session_id, user_id)
  do update set
    deck_id = excluded.deck_id,
    final_wins = excluded.final_wins,
    final_losses = excluded.final_losses,
    final_ties = excluded.final_ties,
    rounds_played = excluded.rounds_played,
    total_games_won = excluded.total_games_won,
    total_games_lost = excluded.total_games_lost,
    total_games_tied = excluded.total_games_tied,
    went_first_count = excluded.went_first_count,
    average_round_duration_minutes = excluded.average_round_duration_minutes,
    app_user_rounds = excluded.app_user_rounds,
    other_player_rounds = excluded.other_player_rounds,
    completed_at = excluded.completed_at;
end;
$function$;

create or replace function public.rebuild_event_session_rollups(p_session_id uuid)
returns void
language plpgsql
security definer
set search_path = 'public'
as $function$
begin
  update public."EventSessionAttendees"
  set
    current_record_wins = 0,
    current_record_losses = 0,
    current_record_ties = 0
  where session_id = p_session_id;

  update public."EventSessionAttendees" as attendee
  set
    current_record_wins = coalesce(aggregate_results.wins, 0),
    current_record_losses = coalesce(aggregate_results.losses, 0),
    current_record_ties = coalesce(aggregate_results.ties, 0)
  from (
    select
      result_rows.user_id,
      count(*) filter (where result_rows.round_result = 'win')::integer as wins,
      count(*) filter (where result_rows.round_result = 'loss')::integer as losses,
      count(*) filter (where result_rows.round_result = 'tie')::integer as ties
    from (
      select
        match.player_user_id as user_id,
        match.player_reported_result as round_result
      from public."EventRoundMatches" as match
      inner join public."EventSessionRounds" as round
        on round.round_id = match.round_id
      where round.session_id = p_session_id
        and match.player_user_id is not null
        and match.player_reported_result is not null
        and match.result_status in ('confirmed', 'unverified')

      union all

      select
        match.opponent_user_id as user_id,
        match.opponent_reported_result as round_result
      from public."EventRoundMatches" as match
      inner join public."EventSessionRounds" as round
        on round.round_id = match.round_id
      where round.session_id = p_session_id
        and match.opponent_user_id is not null
        and match.opponent_reported_result is not null
        and match.result_status in ('confirmed', 'unverified')
    ) as result_rows
    group by result_rows.user_id
  ) as aggregate_results
  where attendee.session_id = p_session_id
    and attendee.user_id = aggregate_results.user_id;

  update public."EventPlayerSummaries" as summary
  set
    deck_id = attendee.selected_deck_id,
    final_wins = coalesce(aggregate_stats.wins, 0),
    final_losses = coalesce(aggregate_stats.losses, 0),
    final_ties = coalesce(aggregate_stats.ties, 0),
    rounds_played = coalesce(aggregate_stats.rounds_played, 0),
    total_games_won = coalesce(aggregate_stats.total_games_won, 0),
    total_games_lost = coalesce(aggregate_stats.total_games_lost, 0),
    total_games_tied = coalesce(aggregate_stats.total_games_tied, 0),
    went_first_count = coalesce(aggregate_stats.went_first_count, 0),
    average_round_duration_minutes = aggregate_stats.average_round_duration_minutes,
    app_user_rounds = coalesce(aggregate_stats.app_user_rounds, 0),
    other_player_rounds = coalesce(aggregate_stats.other_player_rounds, 0)
  from public."EventSessionAttendees" as attendee
  left join (
    select
      stat.user_id,
      count(*)::integer as rounds_played,
      count(*) filter (where stat.round_result = 'win')::integer as wins,
      count(*) filter (where stat.round_result = 'loss')::integer as losses,
      count(*) filter (where stat.round_result = 'tie')::integer as ties,
      coalesce(sum(stat.games_won), 0)::integer as total_games_won,
      coalesce(sum(stat.games_lost), 0)::integer as total_games_lost,
      coalesce(sum(stat.games_tied), 0)::integer as total_games_tied,
      count(*) filter (where stat.went_first is true)::integer as went_first_count,
      case
        when avg(stat.round_duration_minutes) is null then null
        else round(avg(stat.round_duration_minutes))::integer
      end as average_round_duration_minutes,
      count(*) filter (where match.source_type = 'app_user')::integer as app_user_rounds,
      count(*) filter (where match.source_type = 'other_player')::integer as other_player_rounds
    from public."EventPlayerRoundStats" as stat
    inner join public."EventRoundMatches" as match
      on match.match_id = stat.match_id
    inner join public."EventSessionRounds" as round
      on round.round_id = match.round_id
    where round.session_id = p_session_id
    group by stat.user_id
  ) as aggregate_stats
    on aggregate_stats.user_id = attendee.user_id
  where summary.session_id = p_session_id
    and attendee.session_id = p_session_id
    and attendee.user_id = summary.user_id;
end;
$function$;

create or replace function public.sync_event_round_timer(p_round_id uuid)
returns boolean
language plpgsql
security definer
set search_path = 'public'
as $function$
declare
  v_round public."EventSessionRounds"%rowtype;
  v_session_id uuid;
  v_expired boolean := false;
begin
  select *
  into v_round
  from public."EventSessionRounds"
  where round_id = p_round_id;

  if v_round.round_id is null then
    raise exception 'Round not found';
  end if;

  v_session_id := v_round.session_id;

  if v_round.timer_expires_at is not null and v_round.timer_expires_at <= now() then
    update public."EventSessions"
    set timer_status = case when status = 'completed' then timer_status else 'expired' end,
        updated_at = now()
    where session_id = v_session_id
      and timer_status <> 'completed';

    v_expired := true;
  end if;

  return v_expired;
end;
$function$;

create or replace function public.start_event_session(p_event_id uuid, p_total_rounds integer default 4)
returns uuid
language plpgsql
security definer
set search_path = 'public'
as $function$
declare
  v_event public."Events"%rowtype;
  v_session_id uuid;
  v_existing_status text;
  v_total_rounds integer := greatest(1, least(coalesce(p_total_rounds, 4), 20));
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  select *
  into v_event
  from public."Events"
  where event_id = p_event_id;

  if not found then
    raise exception 'Event not found';
  end if;

  if not public.can_manage_event(v_event.created_by) and coalesce(v_event.start_at, now()) > now() then
    raise exception 'Only event managers can start an event before its scheduled time';
  end if;

  select session_id, status
  into v_session_id, v_existing_status
  from public."EventSessions"
  where event_id = p_event_id;

  if v_existing_status = 'completed' then
    raise exception 'This live event session has already been completed';
  end if;

  if v_session_id is not null then
    update public."EventSessions"
    set status = 'active',
        total_rounds = v_total_rounds,
        started_at = coalesce(started_at, now()),
        started_by = coalesce(started_by, auth.uid()),
        updated_at = now()
    where session_id = v_session_id;
  else
    insert into public."EventSessions" (
      event_id,
      status,
      total_rounds,
      current_round,
      timer_status,
      started_at,
      created_by,
      started_by
    ) values (
      p_event_id,
      'active',
      v_total_rounds,
      1,
      'not_started',
      now(),
      auth.uid(),
      auth.uid()
    )
    returning session_id into v_session_id;
  end if;

  insert into public."EventSessionRounds" (session_id, round_number, status)
  values (v_session_id, 1, 'pending')
  on conflict (session_id, round_number) do nothing;

  return v_session_id;
end;
$function$;

create or replace function public.start_event_session_configured(p_event_id uuid, p_total_rounds integer, p_best_of smallint)
returns uuid
language plpgsql
security definer
set search_path = 'public'
as $function$
declare
  v_session_id uuid;
begin
  if p_best_of not in (1, 3) then
    raise exception 'Match format must be best of 1 or best of 3.';
  end if;

  v_session_id := public.start_event_session(p_event_id, p_total_rounds);

  update public."EventSessions"
  set
    best_of = p_best_of,
    updated_at = timezone('utc', now())
  where session_id = v_session_id;

  return v_session_id;
end;
$function$;

create or replace function public.join_event_session(p_event_id uuid)
returns uuid
language plpgsql
security definer
set search_path = 'public'
as $function$
declare
  v_event public."Events"%rowtype;
  v_session_id uuid;
  v_display_name text;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  select *
  into v_event
  from public."Events"
  where event_id = p_event_id;

  if not found then
    raise exception 'Event not found';
  end if;

  if not public.is_event_registered_user(p_event_id) and not public.can_manage_event(v_event.created_by) then
    raise exception 'You must register for the event before joining the live session';
  end if;

  select session_id
  into v_session_id
  from public."EventSessions"
  where event_id = p_event_id;

  if v_session_id is null then
    if coalesce(v_event.start_at, now()) > now() and not public.can_manage_event(v_event.created_by) then
      raise exception 'This event is not live yet';
    end if;

    v_session_id := public.start_event_session(p_event_id, 4);
  end if;

  if exists (
    select 1
    from public."EventSessions"
    where session_id = v_session_id
      and status = 'completed'
  ) then
    raise exception 'This live event has already ended';
  end if;

  select coalesce(nullif(btrim(username), ''), nullif(btrim(email), ''), 'Player')
  into v_display_name
  from public."Users"
  where user_id = auth.uid();

  insert into public."EventSessionAttendees" (
    session_id,
    user_id,
    display_name,
    joined_at,
    last_seen_at,
    is_connected
  ) values (
    v_session_id,
    auth.uid(),
    coalesce(v_display_name, 'Player'),
    now(),
    now(),
    true
  )
  on conflict (session_id, user_id)
  do update set
    display_name = excluded.display_name,
    last_seen_at = now(),
    is_connected = true;

  insert into public."EventSessionRounds" (session_id, round_number, status)
  select session_id, current_round, 'pending'
  from public."EventSessions"
  where session_id = v_session_id
  on conflict (session_id, round_number) do nothing;

  return v_session_id;
end;
$function$;

create or replace function public.join_event_session_checked(p_event_id uuid)
returns uuid
language plpgsql
security definer
set search_path = 'public'
as $function$
declare
  v_user_id uuid := auth.uid();
  v_session_id uuid;
  v_start_at timestamptz;
  v_timer_status text;
  v_join_grace_ends_at timestamptz;
  v_is_existing_attendee boolean := false;
begin
  if v_user_id is null then
    raise exception 'You must be signed in to join this live event.';
  end if;

  select
    session.session_id,
    event.start_at,
    session.timer_status
  into
    v_session_id,
    v_start_at,
    v_timer_status
  from public."Events" as event
  left join public."EventSessions" as session
    on session.event_id = event.event_id
  where event.event_id = p_event_id;

  if v_start_at is null then
    raise exception 'Event not found.';
  end if;

  if timezone('utc', now()) < v_start_at then
    raise exception 'This live room is not available until the event starts.';
  end if;

  if v_session_id is not null then
    v_join_grace_ends_at := v_start_at + interval '10 minutes';

    select exists (
      select 1
      from public."EventSessionAttendees" as attendee
      where attendee.session_id = v_session_id
        and attendee.user_id = v_user_id
        and attendee.dropped_at is null
    )
    into v_is_existing_attendee;

    if (coalesce(v_timer_status, 'not_started') not in ('not_started', 'voting')
      or timezone('utc', now()) > v_join_grace_ends_at)
      and not v_is_existing_attendee then
      raise exception 'Only existing live-room attendees can reconnect after late join access closes.';
    end if;
  end if;

  return public.join_event_session(p_event_id);
end;
$function$;

create or replace function public.heartbeat_event_session(p_session_id uuid)
returns void
language plpgsql
security definer
set search_path = 'public'
as $function$
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  update public."EventSessionAttendees"
  set last_seen_at = now(),
      is_connected = true
  where session_id = p_session_id
    and user_id = auth.uid();

  if not found then
    raise exception 'You are not connected to this event session';
  end if;
end;
$function$;

create or replace function public.leave_event_session(p_session_id uuid)
returns void
language plpgsql
security definer
set search_path = 'public'
as $function$
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  update public."EventSessionAttendees"
  set is_connected = false,
      last_seen_at = now()
  where session_id = p_session_id
    and user_id = auth.uid();
end;
$function$;

create or replace function public.configure_event_session(p_session_id uuid, p_total_rounds integer)
returns void
language plpgsql
security definer
set search_path = 'public'
as $function$
declare
  v_total_rounds integer := greatest(1, least(coalesce(p_total_rounds, 4), 20));
  v_current_round integer;
  v_status text;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  if not public.is_event_session_attendee(p_session_id) and not public.can_manage_event_session(p_session_id) then
    raise exception 'You do not have access to configure this event session';
  end if;

  select current_round, status
  into v_current_round, v_status
  from public."EventSessions"
  where session_id = p_session_id;

  if v_current_round is null then
    raise exception 'Event session not found';
  end if;

  if v_status = 'completed' then
    raise exception 'This event session is locked';
  end if;

  if v_total_rounds < v_current_round then
    raise exception 'Total rounds cannot be less than the current round';
  end if;

  update public."EventSessions"
  set total_rounds = v_total_rounds,
      updated_at = now()
  where session_id = p_session_id;
end;
$function$;

create or replace function public.configure_event_session_settings(p_session_id uuid, p_total_rounds integer, p_best_of smallint)
returns void
language plpgsql
security definer
set search_path = 'public'
as $function$
begin
  if p_best_of not in (1, 3) then
    raise exception 'Match format must be best of 1 or best of 3.';
  end if;

  perform public.configure_event_session(p_session_id, p_total_rounds);

  update public."EventSessions"
  set
    best_of = p_best_of,
    updated_at = timezone('utc', now())
  where session_id = p_session_id;
end;
$function$;

create or replace function public.select_event_deck(p_session_id uuid, p_deck_id uuid)
returns void
language plpgsql
security definer
set search_path = 'public'
as $function$
declare
  v_status text;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  select status
  into v_status
  from public."EventSessions"
  where session_id = p_session_id;

  if v_status is null then
    raise exception 'Event session not found';
  end if;

  if v_status = 'completed' then
    raise exception 'This event session is locked';
  end if;

  if not exists (
    select 1
    from public."Decklists"
    where deck_id = p_deck_id
      and user_id = auth.uid()
  ) then
    raise exception 'Deck not found or not owned by user';
  end if;

  update public."EventSessionAttendees"
  set selected_deck_id = p_deck_id,
      last_seen_at = now(),
      is_connected = true
  where session_id = p_session_id
    and user_id = auth.uid();

  if not found then
    raise exception 'You are not connected to this event session';
  end if;

  perform public.refresh_event_player_summary(p_session_id, auth.uid());
end;
$function$;

create or replace function public.create_or_update_match(
  p_round_id uuid,
  p_opponent_user_id uuid default null,
  p_opponent_label text default null
)
returns uuid
language plpgsql
security definer
set search_path = 'public'
as $function$
declare
  v_round public."EventSessionRounds"%rowtype;
  v_session public."EventSessions"%rowtype;
  v_match_id uuid;
  v_existing public."EventRoundMatches"%rowtype;
  v_opponent_label text := nullif(btrim(coalesce(p_opponent_label, '')), '');
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  select r.*
  into v_round
  from public."EventSessionRounds" r
  join public."EventSessionAttendees" a on a.session_id = r.session_id and a.user_id = auth.uid()
  where r.round_id = p_round_id;

  if v_round.round_id is null then
    raise exception 'You do not have access to this round';
  end if;

  select *
  into v_session
  from public."EventSessions"
  where session_id = v_round.session_id;

  if v_session.status = 'completed' then
    raise exception 'This event session is locked';
  end if;

  if v_round.round_number <> v_session.current_round then
    raise exception 'You can only pick opponents for the current round';
  end if;

  if v_round.timer_started_at is not null then
    raise exception 'Opponents are locked once the round timer starts';
  end if;

  select *
  into v_existing
  from public."EventRoundMatches"
  where round_id = p_round_id
    and (player_user_id = auth.uid() or opponent_user_id = auth.uid())
  limit 1;

  if found then
    if v_existing.player_user_id = auth.uid() then
      if v_existing.result_status <> 'pending' or v_existing.player_reported_result is not null or v_existing.opponent_reported_result is not null then
        raise exception 'You cannot change opponents after reporting has started';
      end if;

      if p_opponent_user_id is not null then
        if p_opponent_user_id = auth.uid() then
          raise exception 'You cannot pair against yourself';
        end if;

        if not exists (
          select 1
          from public."EventSessionAttendees"
          where session_id = v_round.session_id
            and user_id = p_opponent_user_id
            and is_connected = true
            and last_seen_at >= now() - interval '90 seconds'
        ) then
          raise exception 'Selected opponent is not currently connected';
        end if;

        if exists (
          select 1
          from public."EventRoundMatches"
          where round_id = p_round_id
            and match_id <> v_existing.match_id
            and (player_user_id = p_opponent_user_id or opponent_user_id = p_opponent_user_id)
        ) then
          raise exception 'Selected opponent already has a match for this round';
        end if;

        update public."EventRoundMatches"
        set opponent_user_id = p_opponent_user_id,
            opponent_label = null,
            source_type = 'app_user',
            result_status = 'pending',
            updated_at = now(),
            player_reported_result = null,
            opponent_reported_result = null,
            confirmed_at = null
        where match_id = v_existing.match_id;
      else
        if v_opponent_label is null then
          raise exception 'An opponent name is required for Other Player';
        end if;

        update public."EventRoundMatches"
        set opponent_user_id = null,
            opponent_label = v_opponent_label,
            source_type = 'other_player',
            result_status = 'pending',
            updated_at = now(),
            player_reported_result = null,
            opponent_reported_result = null,
            confirmed_at = null
        where match_id = v_existing.match_id;
      end if;

      return v_existing.match_id;
    end if;

    return v_existing.match_id;
  end if;

  if p_opponent_user_id is not null then
    if p_opponent_user_id = auth.uid() then
      raise exception 'You cannot pair against yourself';
    end if;

    if not exists (
      select 1
      from public."EventSessionAttendees"
      where session_id = v_round.session_id
        and user_id = p_opponent_user_id
        and is_connected = true
        and last_seen_at >= now() - interval '90 seconds'
    ) then
      raise exception 'Selected opponent is not currently connected';
    end if;

    select match_id
    into v_match_id
    from public."EventRoundMatches"
    where round_id = p_round_id
      and player_user_id = p_opponent_user_id
      and opponent_user_id = auth.uid()
    limit 1;

    if v_match_id is not null then
      return v_match_id;
    end if;

    if exists (
      select 1
      from public."EventRoundMatches"
      where round_id = p_round_id
        and (player_user_id = p_opponent_user_id or opponent_user_id = p_opponent_user_id)
    ) then
      raise exception 'Selected opponent already has a match for this round';
    end if;

    insert into public."EventRoundMatches" (
      round_id,
      player_user_id,
      opponent_user_id,
      opponent_label,
      source_type,
      result_status
    ) values (
      p_round_id,
      auth.uid(),
      p_opponent_user_id,
      null,
      'app_user',
      'pending'
    )
    returning match_id into v_match_id;
  else
    if v_opponent_label is null then
      raise exception 'An opponent name is required for Other Player';
    end if;

    insert into public."EventRoundMatches" (
      round_id,
      player_user_id,
      opponent_user_id,
      opponent_label,
      source_type,
      result_status
    ) values (
      p_round_id,
      auth.uid(),
      null,
      v_opponent_label,
      'other_player',
      'pending'
    )
    returning match_id into v_match_id;
  end if;

  return v_match_id;
end;
$function$;

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

  if v_round.timer_started_at is null or v_round.timer_expires_at is null or v_round.timer_expires_at > now() then
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
    stat.games_tied
  into
    v_opponent_round_result,
    v_opponent_games_won,
    v_opponent_games_lost,
    v_opponent_games_tied
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

create or replace function public.mark_event_match_finished(p_match_id uuid)
returns boolean
language plpgsql
security definer
set search_path = 'public'
as $function$
declare
  v_user_id uuid := auth.uid();
  v_player_user_id uuid;
  v_opponent_user_id uuid;
  v_source_type text;
  v_timer_started_at timestamptz;
  v_pair_finished_at timestamptz;
begin
  if v_user_id is null then
    raise exception 'You must be signed in to mark a match finished.';
  end if;

  select
    match.player_user_id,
    match.opponent_user_id,
    match.source_type,
    round.timer_started_at
  into
    v_player_user_id,
    v_opponent_user_id,
    v_source_type,
    v_timer_started_at
  from public."EventRoundMatches" as match
  inner join public."EventSessionRounds" as round
    on round.round_id = match.round_id
  where match.match_id = p_match_id;

  if v_player_user_id is null then
    raise exception 'Match not found.';
  end if;

  if v_source_type <> 'app_user' or v_opponent_user_id is null then
    raise exception 'Finish confirmation is only available for app-vs-app matches.';
  end if;

  if v_user_id <> v_player_user_id and v_user_id <> v_opponent_user_id then
    raise exception 'You do not have permission to update this match.';
  end if;

  if v_timer_started_at is null then
    raise exception 'This round timer has not started yet.';
  end if;

  insert into public."EventMatchFinishSignals" (match_id, user_id, signaled_at)
  values (p_match_id, v_user_id, timezone('utc', now()))
  on conflict (match_id, user_id)
  do update set signaled_at = excluded.signaled_at;

  if exists (
    select 1
    from public."EventMatchFinishSignals" as signal
    where signal.match_id = p_match_id
      and signal.user_id = v_player_user_id
  ) and exists (
    select 1
    from public."EventMatchFinishSignals" as signal
    where signal.match_id = p_match_id
      and signal.user_id = v_opponent_user_id
  ) then
    select max(signal.signaled_at)
    into v_pair_finished_at
    from public."EventMatchFinishSignals" as signal
    where signal.match_id = p_match_id;

    update public."EventRoundMatches"
    set
      pair_finished_at = v_pair_finished_at,
      pair_finished_duration_minutes = greatest(
        0,
        round(extract(epoch from (v_pair_finished_at - v_timer_started_at)) / 60.0)
      )::integer,
      updated_at = timezone('utc', now())
    where match_id = p_match_id;

    return true;
  end if;

  return false;
end;
$function$;

create or replace function public.vote_round_timer(p_round_id uuid, p_minutes integer)
returns jsonb
language plpgsql
security definer
set search_path = 'public'
as $function$
declare
  v_round public."EventSessionRounds"%rowtype;
  v_session public."EventSessions"%rowtype;
  v_connected_count integer := 0;
  v_majority integer := 1;
  v_vote_count integer := 0;
  v_timer_started boolean := false;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  if p_minutes is null or p_minutes < 1 or p_minutes > 90 then
    raise exception 'Timer must be between 1 and 90 minutes';
  end if;

  select r.*
  into v_round
  from public."EventSessionRounds" r
  join public."EventSessionAttendees" a on a.session_id = r.session_id and a.user_id = auth.uid()
  where r.round_id = p_round_id;

  if v_round.round_id is null then
    raise exception 'You do not have access to this round';
  end if;

  select *
  into v_session
  from public."EventSessions"
  where session_id = v_round.session_id;

  if v_session.status = 'completed' then
    raise exception 'This event session is locked';
  end if;

  if v_round.round_number <> v_session.current_round then
    raise exception 'Timer voting is only allowed on the current round';
  end if;

  perform public.sync_event_round_timer(p_round_id);

  if v_round.timer_started_at is not null then
    raise exception 'This round timer has already started';
  end if;

  insert into public."EventRoundTimerVotes" (round_id, user_id, requested_minutes, voted_at)
  values (p_round_id, auth.uid(), p_minutes, now())
  on conflict (round_id, user_id)
  do update set
    requested_minutes = excluded.requested_minutes,
    voted_at = excluded.voted_at;

  update public."EventSessions"
  set timer_status = 'voting',
      updated_at = now()
  where session_id = v_round.session_id;

  select public.get_event_connected_count(v_round.session_id)
  into v_connected_count;

  v_majority := floor(v_connected_count / 2.0)::integer + 1;

  select count(*)::integer
  into v_vote_count
  from public."EventRoundTimerVotes"
  where round_id = p_round_id
    and requested_minutes = p_minutes;

  if v_vote_count >= v_majority then
    update public."EventSessionRounds"
    set status = 'active',
        timer_minutes = p_minutes,
        timer_started_at = now(),
        timer_expires_at = now() + make_interval(mins => p_minutes)
    where round_id = p_round_id;

    update public."EventSessions"
    set timer_minutes = p_minutes,
        timer_status = 'running',
        timer_started_at = now(),
        timer_expires_at = now() + make_interval(mins => p_minutes),
        updated_at = now()
    where session_id = v_round.session_id;

    delete from public."EventRoundProgressVotes"
    where round_id = p_round_id;

    v_timer_started := true;
  end if;

  return jsonb_build_object(
    'round_id', p_round_id,
    'connected_count', v_connected_count,
    'majority_required', v_majority,
    'votes_for_choice', v_vote_count,
    'timer_started', v_timer_started
  );
end;
$function$;

create or replace function public.stop_event_round_timer(p_round_id uuid)
returns void
language plpgsql
security definer
set search_path = 'public'
as $function$
declare
  v_user_id uuid := auth.uid();
  v_user_role text;
  v_session_id uuid;
  v_event_owner uuid;
begin
  if v_user_id is null then
    raise exception 'You must be signed in to manage live events.';
  end if;

  select
    round.session_id,
    event.created_by
  into
    v_session_id,
    v_event_owner
  from public."EventSessionRounds" as round
  inner join public."EventSessions" as session
    on session.session_id = round.session_id
  inner join public."Events" as event
    on event.event_id = session.event_id
  where round.round_id = p_round_id;

  if v_session_id is null then
    raise exception 'Live event round not found.';
  end if;

  select "Users".role
  into v_user_role
  from public."Users"
  where "Users".user_id = v_user_id;

  if coalesce(v_user_role, '') <> 'admin' and v_event_owner <> v_user_id then
    raise exception 'You do not have permission to manage this live event.';
  end if;

  if not exists (
    select 1
    from public."EventSessions" as session
    inner join public."EventSessionRounds" as round
      on round.session_id = session.session_id
     and round.round_number = session.current_round
    where round.round_id = p_round_id
      and session.status <> 'completed'
  ) then
    raise exception 'Only the current round can be modified.';
  end if;

  delete from public."EventRoundProgressVotes"
  where round_id = p_round_id;

  delete from public."EventRoundTimerVotes"
  where round_id = p_round_id;

  update public."EventSessionRounds"
  set
    status = 'pending',
    timer_minutes = null,
    timer_started_at = null,
    timer_expires_at = null,
    completed_at = null
  where round_id = p_round_id;

  update public."EventSessions"
  set
    timer_minutes = null,
    timer_status = 'voting',
    timer_started_at = null,
    timer_expires_at = null,
    updated_at = timezone('utc', now())
  where session_id = v_session_id;
end;
$function$;

create or replace function public.reset_event_round(p_round_id uuid)
returns void
language plpgsql
security definer
set search_path = 'public'
as $function$
declare
  v_user_id uuid := auth.uid();
  v_user_role text;
  v_session_id uuid;
  v_event_owner uuid;
begin
  if v_user_id is null then
    raise exception 'You must be signed in to manage live events.';
  end if;

  select
    round.session_id,
    event.created_by
  into
    v_session_id,
    v_event_owner
  from public."EventSessionRounds" as round
  inner join public."EventSessions" as session
    on session.session_id = round.session_id
  inner join public."Events" as event
    on event.event_id = session.event_id
  where round.round_id = p_round_id;

  if v_session_id is null then
    raise exception 'Live event round not found.';
  end if;

  select "Users".role
  into v_user_role
  from public."Users"
  where "Users".user_id = v_user_id;

  if coalesce(v_user_role, '') <> 'admin' and v_event_owner <> v_user_id then
    raise exception 'You do not have permission to manage this live event.';
  end if;

  if not exists (
    select 1
    from public."EventSessions" as session
    inner join public."EventSessionRounds" as round
      on round.session_id = session.session_id
     and round.round_number = session.current_round
    where round.round_id = p_round_id
      and session.status <> 'completed'
  ) then
    raise exception 'Only the current round can be reset.';
  end if;

  delete from public."EventPlayerRoundStats"
  where match_id in (
    select match_id
    from public."EventRoundMatches"
    where round_id = p_round_id
  );

  delete from public."EventRoundMatches"
  where round_id = p_round_id;

  delete from public."EventRoundProgressVotes"
  where round_id = p_round_id;

  delete from public."EventRoundTimerVotes"
  where round_id = p_round_id;

  update public."EventSessionRounds"
  set
    status = 'pending',
    timer_minutes = null,
    timer_started_at = null,
    timer_expires_at = null,
    completed_at = null
  where round_id = p_round_id;

  update public."EventSessions"
  set
    timer_minutes = null,
    timer_status = 'not_started',
    timer_started_at = null,
    timer_expires_at = null,
    updated_at = timezone('utc', now())
  where session_id = v_session_id;

  perform public.rebuild_event_session_rollups(v_session_id);
end;
$function$;

create or replace function public.advance_round(p_session_id uuid)
returns uuid
language plpgsql
security definer
set search_path = 'public'
as $function$
declare
  v_current_round integer;
  v_total_rounds integer;
  v_current_round_id uuid;
  v_next_round integer;
  v_next_round_id uuid;
  v_pending_count integer := 0;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  if not public.is_event_session_attendee(p_session_id) and not public.can_manage_event_session(p_session_id) then
    raise exception 'You do not have access to this event session';
  end if;

  select current_round, total_rounds
  into v_current_round, v_total_rounds
  from public."EventSessions"
  where session_id = p_session_id;

  if v_current_round is null then
    raise exception 'Event session not found';
  end if;

  if v_current_round >= v_total_rounds then
    raise exception 'This is already the final round';
  end if;

  select round_id
  into v_current_round_id
  from public."EventSessionRounds"
  where session_id = p_session_id
    and round_number = v_current_round;

  perform public.sync_event_round_timer(v_current_round_id);

  select count(*)::integer
  into v_pending_count
  from public."EventRoundMatches"
  where round_id = v_current_round_id
    and result_status not in ('confirmed', 'unverified');

  if v_pending_count > 0 and not public.can_manage_event_session(p_session_id) then
    raise exception 'The current round still has pending or disputed results';
  end if;

  update public."EventSessionRounds"
  set status = 'completed',
      completed_at = coalesce(completed_at, now())
  where round_id = v_current_round_id;

  delete from public."EventRoundTimerVotes"
  where round_id = v_current_round_id;

  delete from public."EventRoundProgressVotes"
  where round_id = v_current_round_id;

  v_next_round := v_current_round + 1;

  insert into public."EventSessionRounds" (session_id, round_number, status)
  values (p_session_id, v_next_round, 'pending')
  on conflict (session_id, round_number)
  do update set
    status = 'pending',
    timer_minutes = null,
    timer_started_at = null,
    timer_expires_at = null,
    completed_at = null
  returning round_id into v_next_round_id;

  update public."EventSessions"
  set current_round = v_next_round,
      timer_minutes = null,
      timer_status = 'not_started',
      timer_started_at = null,
      timer_expires_at = null,
      updated_at = now()
  where session_id = p_session_id;

  return v_next_round_id;
end;
$function$;

create or replace function public.complete_event_session(p_session_id uuid)
returns uuid
language plpgsql
security definer
set search_path = 'public'
as $function$
declare
  v_current_round integer;
  v_current_round_id uuid;
  v_pending_count integer := 0;
  v_attendee record;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  if not public.is_event_session_attendee(p_session_id) and not public.can_manage_event_session(p_session_id) then
    raise exception 'You do not have access to this event session';
  end if;

  select current_round
  into v_current_round
  from public."EventSessions"
  where session_id = p_session_id;

  if v_current_round is null then
    raise exception 'Event session not found';
  end if;

  select round_id
  into v_current_round_id
  from public."EventSessionRounds"
  where session_id = p_session_id
    and round_number = v_current_round;

  if v_current_round_id is not null then
    perform public.sync_event_round_timer(v_current_round_id);

    select count(*)::integer
    into v_pending_count
    from public."EventRoundMatches"
    where round_id = v_current_round_id
      and result_status not in ('confirmed', 'unverified');
  end if;

  if v_pending_count > 0 and not public.can_manage_event_session(p_session_id) then
    raise exception 'The current round still has pending or disputed results';
  end if;

  update public."EventSessionRounds"
  set status = 'completed',
      completed_at = coalesce(completed_at, now())
  where round_id = v_current_round_id;

  delete from public."EventRoundTimerVotes"
  where round_id = v_current_round_id;

  delete from public."EventRoundProgressVotes"
  where round_id = v_current_round_id;

  update public."EventSessions"
  set status = 'completed',
      ended_at = now(),
      timer_status = 'completed',
      timer_minutes = null,
      timer_started_at = null,
      timer_expires_at = null,
      updated_at = now()
  where session_id = p_session_id;

  update public."EventSessionAttendees"
  set is_connected = false,
      last_seen_at = now()
  where session_id = p_session_id;

  for v_attendee in
    select user_id
    from public."EventSessionAttendees"
    where session_id = p_session_id
  loop
    perform public.refresh_event_session_attendee_record(p_session_id, v_attendee.user_id);
    perform public.refresh_event_player_summary(p_session_id, v_attendee.user_id);
  end loop;

  return p_session_id;
end;
$function$;

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

drop policy if exists "Registered users can view event sessions" on public."EventSessions";
create policy "Registered users can view event sessions"
on public."EventSessions"
for select
to authenticated
using (
  is_event_registered_user(event_id) or is_event_session_attendee(session_id) or can_manage_event_session(session_id)
);

drop policy if exists "Attendees can view event session attendees" on public."EventSessionAttendees";
create policy "Attendees can view event session attendees"
on public."EventSessionAttendees"
for select
to authenticated
using (is_event_session_attendee(session_id) or can_manage_event_session(session_id));

drop policy if exists "Attendees can view event session rounds" on public."EventSessionRounds";
create policy "Attendees can view event session rounds"
on public."EventSessionRounds"
for select
to authenticated
using (is_event_session_attendee(session_id) or can_manage_event_session(session_id));

drop policy if exists "Attendees can view timer votes" on public."EventRoundTimerVotes";
create policy "Attendees can view timer votes"
on public."EventRoundTimerVotes"
for select
to authenticated
using (can_access_event_round(round_id));

drop policy if exists "Attendees can view round matches" on public."EventRoundMatches";
create policy "Attendees can view round matches"
on public."EventRoundMatches"
for select
to authenticated
using (
  (
    exists (
      select 1
      from public."EventSessionRounds" r
      join public."EventSessionAttendees" a on a.session_id = r.session_id
      where r.round_id = "EventRoundMatches".round_id
        and a.user_id = auth.uid()
    )
  ) or (
    exists (
      select 1
      from public."EventSessionRounds" r
      where r.round_id = "EventRoundMatches".round_id
        and can_manage_event_session(r.session_id)
    )
  )
);

drop policy if exists "Users can view their round stats" on public."EventPlayerRoundStats";
create policy "Users can view their round stats"
on public."EventPlayerRoundStats"
for select
to authenticated
using (
  (user_id = auth.uid()) or (
    exists (
      select 1
      from public."EventRoundMatches" m
      join public."EventSessionRounds" r on r.round_id = m.round_id
      where m.match_id = "EventPlayerRoundStats".match_id
        and can_manage_event_session(r.session_id)
    )
  )
);

drop policy if exists "Users can view their event summaries" on public."EventPlayerSummaries";
create policy "Users can view their event summaries"
on public."EventPlayerSummaries"
for select
to authenticated
using ((user_id = auth.uid()) or can_manage_event_session(session_id));

drop policy if exists "Attendees can view round progress votes" on public."EventRoundProgressVotes";
create policy "Attendees can view round progress votes"
on public."EventRoundProgressVotes"
for select
to authenticated
using (can_access_event_round(round_id));

drop policy if exists "Participants can view finish signals for their matches" on public."EventMatchFinishSignals";
create policy "Participants can view finish signals for their matches"
on public."EventMatchFinishSignals"
for select
to authenticated
using (
  exists (
    select 1
    from public."EventRoundMatches" match
    where match.match_id = "EventMatchFinishSignals".match_id
      and (auth.uid() = match.player_user_id or auth.uid() = match.opponent_user_id)
  )
);

alter publication supabase_realtime add table public."EventSessions";
alter publication supabase_realtime add table public."EventSessionAttendees";
alter publication supabase_realtime add table public."EventSessionRounds";
alter publication supabase_realtime add table public."EventRoundTimerVotes";
alter publication supabase_realtime add table public."EventRoundMatches";
alter publication supabase_realtime add table public."EventPlayerRoundStats";
alter publication supabase_realtime add table public."EventPlayerSummaries";
alter publication supabase_realtime add table public."EventRoundProgressVotes";
alter publication supabase_realtime add table public."EventMatchFinishSignals";
