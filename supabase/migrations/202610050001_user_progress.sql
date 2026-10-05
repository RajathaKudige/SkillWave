-- Normalized, user-owned progress records for roadmap, soft-skill, and networking features.

create table public.roadmap_skill_progress (
  user_id uuid not null references auth.users (id) on delete cascade,
  target_role text not null,
  skill_id text not null,
  status text not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, target_role, skill_id)
);

create table public.roadmap_mission_progress (
  user_id uuid not null references auth.users (id) on delete cascade,
  target_role text not null,
  mission_id text not null,
  completed boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key (user_id, target_role, mission_id)
);

create table public.soft_skill_progress (
  user_id uuid not null references auth.users (id) on delete cascade,
  skill_id text not null,
  started boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key (user_id, skill_id)
);

create table public.soft_skill_practice (
  user_id uuid not null references auth.users (id) on delete cascade,
  skill_id text not null,
  reflections jsonb not null default '{}'::jsonb,
  simulation jsonb not null default '{}'::jsonb,
  activity_completed boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key (user_id, skill_id)
);

create table public.networking_journey_progress (
  user_id uuid not null references auth.users (id) on delete cascade,
  step_id text not null,
  completed boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key (user_id, step_id)
);

create table public.networking_scenario_progress (
  user_id uuid not null references auth.users (id) on delete cascade,
  scenario_id text not null,
  selected_choice text,
  completed boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key (user_id, scenario_id)
);

create table public.networking_contacts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  person text not null,
  role text,
  organization text,
  met text,
  topic text,
  last_interaction date,
  next_action text,
  notes text,
  follow_up_completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- The primary keys above already support user-scoped reads for their tables.
create index networking_contacts_user_updated_at_idx
  on public.networking_contacts (user_id, updated_at desc);

alter table public.roadmap_skill_progress enable row level security;
alter table public.roadmap_mission_progress enable row level security;
alter table public.soft_skill_progress enable row level security;
alter table public.soft_skill_practice enable row level security;
alter table public.networking_journey_progress enable row level security;
alter table public.networking_scenario_progress enable row level security;
alter table public.networking_contacts enable row level security;

revoke all on table
  public.roadmap_skill_progress,
  public.roadmap_mission_progress,
  public.soft_skill_progress,
  public.soft_skill_practice,
  public.networking_journey_progress,
  public.networking_scenario_progress,
  public.networking_contacts
from public, anon;

grant select, insert, update, delete on table
  public.roadmap_skill_progress,
  public.roadmap_mission_progress,
  public.soft_skill_progress,
  public.soft_skill_practice,
  public.networking_journey_progress,
  public.networking_scenario_progress,
  public.networking_contacts
to authenticated;

create policy roadmap_skill_progress_select_own
  on public.roadmap_skill_progress for select to authenticated
  using ((select auth.uid()) = user_id);
create policy roadmap_skill_progress_insert_own
  on public.roadmap_skill_progress for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy roadmap_skill_progress_update_own
  on public.roadmap_skill_progress for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy roadmap_skill_progress_delete_own
  on public.roadmap_skill_progress for delete to authenticated
  using ((select auth.uid()) = user_id);

create policy roadmap_mission_progress_select_own
  on public.roadmap_mission_progress for select to authenticated
  using ((select auth.uid()) = user_id);
create policy roadmap_mission_progress_insert_own
  on public.roadmap_mission_progress for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy roadmap_mission_progress_update_own
  on public.roadmap_mission_progress for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy roadmap_mission_progress_delete_own
  on public.roadmap_mission_progress for delete to authenticated
  using ((select auth.uid()) = user_id);

create policy soft_skill_progress_select_own
  on public.soft_skill_progress for select to authenticated
  using ((select auth.uid()) = user_id);
create policy soft_skill_progress_insert_own
  on public.soft_skill_progress for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy soft_skill_progress_update_own
  on public.soft_skill_progress for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy soft_skill_progress_delete_own
  on public.soft_skill_progress for delete to authenticated
  using ((select auth.uid()) = user_id);

create policy soft_skill_practice_select_own
  on public.soft_skill_practice for select to authenticated
  using ((select auth.uid()) = user_id);
create policy soft_skill_practice_insert_own
  on public.soft_skill_practice for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy soft_skill_practice_update_own
  on public.soft_skill_practice for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy soft_skill_practice_delete_own
  on public.soft_skill_practice for delete to authenticated
  using ((select auth.uid()) = user_id);

create policy networking_journey_progress_select_own
  on public.networking_journey_progress for select to authenticated
  using ((select auth.uid()) = user_id);
create policy networking_journey_progress_insert_own
  on public.networking_journey_progress for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy networking_journey_progress_update_own
  on public.networking_journey_progress for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy networking_journey_progress_delete_own
  on public.networking_journey_progress for delete to authenticated
  using ((select auth.uid()) = user_id);

create policy networking_scenario_progress_select_own
  on public.networking_scenario_progress for select to authenticated
  using ((select auth.uid()) = user_id);
create policy networking_scenario_progress_insert_own
  on public.networking_scenario_progress for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy networking_scenario_progress_update_own
  on public.networking_scenario_progress for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy networking_scenario_progress_delete_own
  on public.networking_scenario_progress for delete to authenticated
  using ((select auth.uid()) = user_id);

create policy networking_contacts_select_own
  on public.networking_contacts for select to authenticated
  using ((select auth.uid()) = user_id);
create policy networking_contacts_insert_own
  on public.networking_contacts for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy networking_contacts_update_own
  on public.networking_contacts for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy networking_contacts_delete_own
  on public.networking_contacts for delete to authenticated
  using ((select auth.uid()) = user_id);

create or replace function public.set_progress_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger roadmap_skill_progress_set_updated_at
  before update on public.roadmap_skill_progress
  for each row execute function public.set_progress_updated_at();
create trigger roadmap_mission_progress_set_updated_at
  before update on public.roadmap_mission_progress
  for each row execute function public.set_progress_updated_at();
create trigger soft_skill_progress_set_updated_at
  before update on public.soft_skill_progress
  for each row execute function public.set_progress_updated_at();
create trigger soft_skill_practice_set_updated_at
  before update on public.soft_skill_practice
  for each row execute function public.set_progress_updated_at();
create trigger networking_journey_progress_set_updated_at
  before update on public.networking_journey_progress
  for each row execute function public.set_progress_updated_at();
create trigger networking_scenario_progress_set_updated_at
  before update on public.networking_scenario_progress
  for each row execute function public.set_progress_updated_at();
create trigger networking_contacts_set_updated_at
  before update on public.networking_contacts
  for each row execute function public.set_progress_updated_at();
