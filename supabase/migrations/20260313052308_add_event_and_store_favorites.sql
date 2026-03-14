-- Recovered from legacy sql/add_event_and_store_favorites.sql.

create table if not exists public."FavoriteStores" (
  user_id uuid not null references public."Users"(user_id) on delete cascade,
  store_id uuid not null references public."Stores"(store_id) on delete cascade,
  created_at timestamp with time zone not null default now(),
  primary key (user_id, store_id)
);

create table if not exists public."FavoriteEvents" (
  user_id uuid not null references public."Users"(user_id) on delete cascade,
  event_id uuid not null references public."Events"(event_id) on delete cascade,
  created_at timestamp with time zone not null default now(),
  primary key (user_id, event_id)
);

create index if not exists favorite_stores_store_id_idx
  on public."FavoriteStores" (store_id);

create index if not exists favorite_events_event_id_idx
  on public."FavoriteEvents" (event_id);

alter table public."FavoriteStores" enable row level security;
alter table public."FavoriteEvents" enable row level security;

drop policy if exists "Users can view their favorite stores" on public."FavoriteStores";
drop policy if exists "Users can insert their favorite stores" on public."FavoriteStores";
drop policy if exists "Users can delete their favorite stores" on public."FavoriteStores";
drop policy if exists "Users can view their favorite events" on public."FavoriteEvents";
drop policy if exists "Users can insert their favorite events" on public."FavoriteEvents";
drop policy if exists "Users can delete their favorite events" on public."FavoriteEvents";

create policy "Users can view their favorite stores"
  on public."FavoriteStores"
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can insert their favorite stores"
  on public."FavoriteStores"
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can delete their favorite stores"
  on public."FavoriteStores"
  for delete
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can view their favorite events"
  on public."FavoriteEvents"
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can insert their favorite events"
  on public."FavoriteEvents"
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can delete their favorite events"
  on public."FavoriteEvents"
  for delete
  to authenticated
  using (auth.uid() = user_id);
