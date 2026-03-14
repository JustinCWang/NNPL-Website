begin;

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

create or replace function public.enforce_users_update_guard()
returns trigger
language plpgsql
set search_path = 'public'
as $function$
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  if public.is_admin() then
    return new;
  end if;

  if old.user_id <> auth.uid() then
    raise exception 'You can only update your own profile';
  end if;

  if new.user_id is distinct from old.user_id
     or new.role is distinct from old.role
     or new.email is distinct from old.email
     or new.date_joined is distinct from old.date_joined then
    raise exception 'Only admins can modify protected user fields';
  end if;

  return new;
end;
$function$;

create or replace function public.sync_user_email_from_auth()
returns trigger
language plpgsql
security definer
set search_path = 'public'
as $function$
begin
  update public."Users"
  set email = new.email
  where user_id = new.id;

  return new;
end;
$function$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = 'public'
as $function$
begin
  insert into public."Users" (user_id, username, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.email
  )
  on conflict (user_id) do update
  set email = excluded.email,
      username = coalesce(public."Users".username, excluded.username);

  return new;
end;
$function$;

create or replace function public.admin_delete_user(target_user_id uuid)
returns void
language plpgsql
security definer
set search_path = 'public'
as $function$
begin
  if not public.is_admin() then
    raise exception 'Only admins can delete users';
  end if;

  if target_user_id = auth.uid() then
    raise exception 'Admins cannot delete their own account from this action';
  end if;

  delete from public."Users"
  where user_id = target_user_id;

  delete from auth.users
  where id = target_user_id;
end;
$function$;

alter table public."Users" enable row level security;
alter table public."Events" enable row level security;

drop policy if exists "Users can view their own profile and admins can view all" on public."Users";
drop policy if exists "Users can update their own safe profile fields and admins can u" on public."Users";
drop policy if exists "Public can view events" on public."Events";
drop policy if exists "Admins and vendors can insert events" on public."Events";
drop policy if exists "Admins and owning vendors can update events" on public."Events";
drop policy if exists "Admins and owning vendors can delete events" on public."Events";

create policy "Users can view their own profile and admins can view all"
  on public."Users"
  for select
  to authenticated
  using ((auth.uid() = user_id) or is_admin());

create policy "Users can update their own safe profile fields and admins can u"
  on public."Users"
  for update
  to authenticated
  using ((auth.uid() = user_id) or is_admin())
  with check ((auth.uid() = user_id) or is_admin());

create policy "Public can view events"
  on public."Events"
  for select
  to public
  using (true);

create policy "Admins and vendors can insert events"
  on public."Events"
  for insert
  to authenticated
  with check (is_admin() or ((current_user_role() = 'vendor') and (created_by = auth.uid())));

create policy "Admins and owning vendors can update events"
  on public."Events"
  for update
  to authenticated
  using (can_manage_event(created_by))
  with check (can_manage_event(created_by));

create policy "Admins and owning vendors can delete events"
  on public."Events"
  for delete
  to authenticated
  using (can_manage_event(created_by));

grant execute on function public.current_user_role() to authenticated;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.can_manage_event(uuid) to authenticated;
grant execute on function public.admin_delete_user(uuid) to authenticated;

drop trigger if exists users_update_guard on public."Users";
create trigger users_update_guard
before update on public."Users"
for each row
execute function public.enforce_users_update_guard();

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user();

drop trigger if exists on_auth_user_email_updated on auth.users;
create trigger on_auth_user_email_updated
after update of email on auth.users
for each row
when (old.email is distinct from new.email)
execute function public.sync_user_email_from_auth();

commit;
