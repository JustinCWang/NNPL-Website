begin;

alter table public."Events"
  add column if not exists timezone text not null default 'America/Los_Angeles';

commit;
