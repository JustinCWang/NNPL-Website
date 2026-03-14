do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'EventMatchFinishSignals'
  ) then
    alter publication supabase_realtime add table public."EventMatchFinishSignals";
  end if;
end
$$;

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
