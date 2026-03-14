begin;

create extension if not exists pg_cron;

create or replace function public.generate_weekly_events()
returns integer
language plpgsql
security definer
set search_path = 'public'
as $function$
declare
  inserted_count integer;
begin
  with due_events as (
    select
      e.event_id,
      e.name,
      e.store_id,
      e.created_by,
      e.start_at,
      e.timezone,
      e.is_weekly,
      e.is_cup,
      e.is_challenge,
      e.is_prerelease,
      e.cost,
      e.min_prizing,
      e.max_prizing,
      (((e.start_at at time zone e.timezone) + interval '7 days') at time zone e.timezone) as next_start_at
    from public."Events" e
    where e.is_weekly = true
      and e.start_at < now()
  ),
  inserted as (
    insert into public."Events" (
      name,
      start_at,
      timezone,
      is_weekly,
      is_cup,
      is_challenge,
      is_prerelease,
      store_id,
      created_by,
      cost,
      min_prizing,
      max_prizing
    )
    select
      d.name,
      d.next_start_at,
      d.timezone,
      d.is_weekly,
      d.is_cup,
      d.is_challenge,
      d.is_prerelease,
      d.store_id,
      d.created_by,
      d.cost,
      d.min_prizing,
      d.max_prizing
    from due_events d
    where not exists (
      select 1
      from public."Events" existing
      where existing.name = d.name
        and existing.store_id is not distinct from d.store_id
        and existing.start_at = d.next_start_at
    )
    returning 1
  )
  select count(*) into inserted_count from inserted;

  return inserted_count;
end;
$function$;

do $$
declare
  v_job_id bigint;
begin
  select jobid
  into v_job_id
  from cron.job
  where jobname = 'auto-renew-weekly-events';

  if v_job_id is not null then
    perform cron.unschedule(v_job_id);
  end if;
end
$$;

select cron.schedule(
  'auto-renew-weekly-events',
  '5 * * * *',
  'select public.generate_weekly_events();'
);

commit;
