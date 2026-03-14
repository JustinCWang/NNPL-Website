begin;

create table if not exists public."EventRegistrations" (
  user_id uuid not null references public."Users"(user_id) on delete cascade,
  event_id uuid not null references public."Events"(event_id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, event_id)
);

create index if not exists "EventRegistrations_event_id_idx"
  on public."EventRegistrations" (event_id);

alter table public."EventRegistrations" enable row level security;

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

drop policy if exists "Users can view their event registrations" on public."EventRegistrations";
drop policy if exists "Users can insert their event registrations" on public."EventRegistrations";
drop policy if exists "Users can delete their event registrations" on public."EventRegistrations";

create policy "Users can view their event registrations"
  on public."EventRegistrations"
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can insert their event registrations"
  on public."EventRegistrations"
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can delete their event registrations"
  on public."EventRegistrations"
  for delete
  to authenticated
  using (auth.uid() = user_id);

grant execute on function public.is_event_registered_user(uuid) to authenticated;

commit;
