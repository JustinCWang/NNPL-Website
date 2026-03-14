begin;

create table if not exists public."Decklists" (
  deck_id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public."Users"(user_id) on delete cascade,
  name text not null,
  format text,
  description text,
  is_public boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public."DecklistCards" (
  deck_id uuid not null references public."Decklists"(deck_id) on delete cascade,
  card_key text not null,
  quantity integer not null check (quantity > 0),
  set_id text not null,
  local_id text not null,
  name text not null,
  image_url text,
  set_name text,
  card_number text,
  market_price numeric,
  primary key (deck_id, card_key)
);

create index if not exists idx_decklists_user_id on public."Decklists" (user_id);
create index if not exists idx_decklists_is_public on public."Decklists" (is_public);
create index if not exists idx_decklistcards_deck_id on public."DecklistCards" (deck_id);

alter table public."Decklists" enable row level security;
alter table public."DecklistCards" enable row level security;

create or replace function public.is_deck_owner(target_deck_id uuid)
returns boolean
language sql
stable
security definer
set search_path = 'public'
as $function$
  select exists (
    select 1
    from public."Decklists"
    where deck_id = target_deck_id
      and user_id = auth.uid()
  );
$function$;

create or replace function public.touch_decklist_updated_at()
returns trigger
language plpgsql
set search_path = 'public'
as $function$
begin
  new.updated_at = now();
  return new;
end;
$function$;

create or replace function public.upsert_decklist(
  p_deck_id uuid default null,
  p_name text default null,
  p_format text default null,
  p_description text default null,
  p_is_public boolean default false,
  p_cards jsonb default '[]'::jsonb
)
returns uuid
language plpgsql
set search_path = 'public'
as $function$
declare
  v_deck_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  if coalesce(trim(p_name), '') = '' then
    raise exception 'Deck name is required';
  end if;

  if p_cards is null or jsonb_typeof(p_cards) <> 'array' then
    raise exception 'Deck cards payload must be a JSON array';
  end if;

  if p_deck_id is null then
    insert into public."Decklists" (user_id, name, format, description, is_public)
    values (auth.uid(), trim(p_name), nullif(trim(p_format), ''), nullif(trim(p_description), ''), coalesce(p_is_public, false))
    returning deck_id into v_deck_id;
  else
    update public."Decklists"
    set name = trim(p_name),
        format = nullif(trim(p_format), ''),
        description = nullif(trim(p_description), ''),
        is_public = coalesce(p_is_public, false),
        updated_at = now()
    where deck_id = p_deck_id
      and user_id = auth.uid()
    returning deck_id into v_deck_id;

    if v_deck_id is null then
      raise exception 'Deck not found or not owned by user';
    end if;

    delete from public."DecklistCards"
    where deck_id = v_deck_id;
  end if;

  if jsonb_array_length(p_cards) > 0 then
    insert into public."DecklistCards" (
      deck_id,
      card_key,
      quantity,
      set_id,
      local_id,
      name,
      image_url,
      set_name,
      card_number,
      market_price
    )
    select
      v_deck_id,
      trim(card_key),
      quantity,
      trim(set_id),
      trim(local_id),
      trim(name),
      image_url,
      set_name,
      card_number,
      market_price
    from jsonb_to_recordset(p_cards) as payload(
      card_key text,
      quantity integer,
      set_id text,
      local_id text,
      name text,
      image_url text,
      set_name text,
      card_number text,
      market_price numeric
    );
  end if;

  return v_deck_id;
end;
$function$;

drop policy if exists "Users can view own and public decklists" on public."Decklists";
drop policy if exists "Users can insert own decklists" on public."Decklists";
drop policy if exists "Users can update own decklists" on public."Decklists";
drop policy if exists "Users can delete own decklists" on public."Decklists";
drop policy if exists "Users can view owned or public deck cards" on public."DecklistCards";
drop policy if exists "Users can insert own deck cards" on public."DecklistCards";
drop policy if exists "Users can update own deck cards" on public."DecklistCards";
drop policy if exists "Users can delete own deck cards" on public."DecklistCards";

create policy "Users can view own and public decklists"
  on public."Decklists"
  for select
  to public
  using (is_public or (user_id = auth.uid()));

create policy "Users can insert own decklists"
  on public."Decklists"
  for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "Users can update own decklists"
  on public."Decklists"
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "Users can delete own decklists"
  on public."Decklists"
  for delete
  to authenticated
  using (user_id = auth.uid());

create policy "Users can view owned or public deck cards"
  on public."DecklistCards"
  for select
  to public
  using (
    is_deck_owner(deck_id)
    or exists (
      select 1
      from public."Decklists"
      where "Decklists".deck_id = "DecklistCards".deck_id
        and "Decklists".is_public = true
    )
  );

create policy "Users can insert own deck cards"
  on public."DecklistCards"
  for insert
  to authenticated
  with check (is_deck_owner(deck_id));

create policy "Users can update own deck cards"
  on public."DecklistCards"
  for update
  to authenticated
  using (is_deck_owner(deck_id))
  with check (is_deck_owner(deck_id));

create policy "Users can delete own deck cards"
  on public."DecklistCards"
  for delete
  to authenticated
  using (is_deck_owner(deck_id));

grant execute on function public.is_deck_owner(uuid) to authenticated;
grant execute on function public.upsert_decklist(uuid, text, text, text, boolean, jsonb) to authenticated;

drop trigger if exists decklists_set_updated_at on public."Decklists";
create trigger decklists_set_updated_at
before update on public."Decklists"
for each row
execute function public.touch_decklist_updated_at();

commit;
