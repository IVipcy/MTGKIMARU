-- Supabase SQL Editor で実行してください
create table if not exists public.meetings (
  id text primary key,
  payload jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.meetings enable row level security;

drop policy if exists "meetings_select" on public.meetings;
drop policy if exists "meetings_insert" on public.meetings;
drop policy if exists "meetings_update" on public.meetings;
drop policy if exists "meetings_delete" on public.meetings;

-- 招待リンク共有のため、URLを知っている人は読み書き可能（IDはランダム）
create policy "meetings_select" on public.meetings for select using (true);
create policy "meetings_insert" on public.meetings for insert with check (true);
create policy "meetings_update" on public.meetings for update using (true);
create policy "meetings_delete" on public.meetings for delete using (true);

-- リアルタイム更新（出欠が他端末に即反映）
do $$
begin
  alter publication supabase_realtime add table public.meetings;
exception
  when duplicate_object then null;
end $$;
