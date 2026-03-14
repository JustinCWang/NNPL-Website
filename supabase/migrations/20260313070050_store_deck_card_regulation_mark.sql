begin;

alter table public."DecklistCards"
  add column if not exists regulation_mark text;

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
      market_price,
      regulation_mark
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
      market_price,
      regulation_mark
    from jsonb_to_recordset(p_cards) as payload(
      card_key text,
      quantity integer,
      set_id text,
      local_id text,
      name text,
      image_url text,
      set_name text,
      card_number text,
      market_price numeric,
      regulation_mark text
    );
  end if;

  return v_deck_id;
end;
$function$;

commit;
