-- Career path ownership and roadmap progress association.
--
-- Compatibility: path_id remains nullable and the existing role-based primary
-- keys stay in place in this phase. Existing clients can continue to read and
-- write the progress tables until the Phase 2B client rollout is verified.
-- The role allowlist below is derived from Object.keys(window.roadmapData) in
-- js/roadmap-data.js at migration authoring time.

create table public.career_paths (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  role_key text not null,
  status text not null check (status in ('primary', 'exploration', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint career_paths_role_key_check check (role_key in (
    'Full-Stack Developer', 'Cloud Architect', 'Cloud Developer', 'DevSecOps Engineer',
    'Platform Engineer', 'Infrastructure Engineer', 'Network Administrator', 'Network Architect',
    'Systems Administrator', 'Systems Engineer', 'IT Support Engineer', 'Blockchain Developer',
    'Blockchain Engineer', 'Smart Contract Developer', 'Web3 Developer', 'Solidity Developer',
    'Quantum Computing Researcher', 'Game Developer', 'Unity Developer', 'Unreal Engine Developer',
    'Gameplay Programmer', 'Game Designer', 'AR/VR Developer', 'Technical Artist',
    'Test Automation Engineer', 'Performance Test Engineer', 'QA Lead', 'Embedded Systems Engineer',
    'Embedded Software Engineer', 'Firmware Engineer', 'IoT Engineer', 'Robotics Engineer',
    'Robotics Software Engineer', 'Autonomous Systems Engineer', 'UX Designer', 'UI Designer',
    'Product Designer', 'UX Researcher', 'Interaction Designer', 'Visual Designer', 'Product Manager',
    'Product Owner', 'Design Systems Designer', 'Frontend Developer', 'AI Engineer', 'Data Scientist',
    'Backend Developer', 'Mobile App Developer', 'Data Analyst', 'Cloud / DevOps Engineer',
    'Cybersecurity Engineer', 'Data Engineer', 'Cybersecurity Analyst', 'Cloud Engineer', 'DevOps Engineer',
    'Android Developer', 'iOS Developer', 'Flutter Developer', 'Ethical Hacker', 'SOC Analyst',
    'QA Engineer', 'SDET', 'Network Engineer', 'Site Reliability Engineer', 'Machine Learning Engineer',
    'AI/ML Engineer', 'Deep Learning Engineer', 'Generative AI Engineer', 'NLP Engineer',
    'Computer Vision Engineer', 'AI Research Engineer', 'Digital Marketing Specialist', 'SEO Specialist',
    'Content Strategist', 'Growth Marketer', 'Social Media Manager', 'Brand Manager', 'Business Analyst',
    'Business Consultant', 'Operations Analyst', 'Sales Executive', 'Business Development Executive',
    'Accountant', 'Management Accountant', 'Financial Analyst', 'FP&A Analyst', 'Risk Analyst',
    'Investment Analyst', 'Product Marketing Manager', 'Software Engineer', 'Web Developer',
    'Application Developer', 'API Developer', 'React Native Developer', 'Analytics Engineer',
    'Data Architect', 'BI Analyst', 'BI Developer', 'Security Analyst', 'Security Engineer',
    'Penetration Tester', 'Application Security Engineer', 'Cloud Security Engineer', 'Security Architect',
    'Digital Forensics Analyst'
  )),
  constraint career_paths_user_role_key unique (user_id, role_key),
  constraint career_paths_id_user_id_unique unique (id, user_id)
);

create unique index career_paths_one_primary_per_user_idx
  on public.career_paths (user_id)
  where status = 'primary';

create index career_paths_user_status_updated_at_idx
  on public.career_paths (user_id, status, updated_at desc);

alter table public.career_paths enable row level security;
revoke all on table public.career_paths from public, anon;
-- Paths may be created only as explorations. Status changes go through the
-- promotion RPC so clients cannot leave a user without a primary by direct
-- update or delete. Auth-user deletion still cascades independently.
grant select, insert on table public.career_paths to authenticated;

create policy career_paths_select_own
  on public.career_paths for select to authenticated
  using ((select auth.uid()) = user_id);
create policy career_paths_insert_own
  on public.career_paths for insert to authenticated
  with check ((select auth.uid()) = user_id and status = 'exploration');

create trigger career_paths_set_updated_at
  before update on public.career_paths
  for each row execute function public.set_progress_updated_at();

-- Avoid guessing role aliases: fail before changing data if saved roadmap rows
-- contain a role that is not an exact key in the checked-in catalog.
do $$
begin
  if exists (
    select 1
    from (
      select target_role as role_key from public.roadmap_skill_progress
      union
      select target_role as role_key from public.roadmap_mission_progress
    ) saved
    where saved.role_key not in (
      'Full-Stack Developer', 'Cloud Architect', 'Cloud Developer', 'DevSecOps Engineer',
      'Platform Engineer', 'Infrastructure Engineer', 'Network Administrator', 'Network Architect',
      'Systems Administrator', 'Systems Engineer', 'IT Support Engineer', 'Blockchain Developer',
      'Blockchain Engineer', 'Smart Contract Developer', 'Web3 Developer', 'Solidity Developer',
      'Quantum Computing Researcher', 'Game Developer', 'Unity Developer', 'Unreal Engine Developer',
      'Gameplay Programmer', 'Game Designer', 'AR/VR Developer', 'Technical Artist',
      'Test Automation Engineer', 'Performance Test Engineer', 'QA Lead', 'Embedded Systems Engineer',
      'Embedded Software Engineer', 'Firmware Engineer', 'IoT Engineer', 'Robotics Engineer',
      'Robotics Software Engineer', 'Autonomous Systems Engineer', 'UX Designer', 'UI Designer',
      'Product Designer', 'UX Researcher', 'Interaction Designer', 'Visual Designer', 'Product Manager',
      'Product Owner', 'Design Systems Designer', 'Frontend Developer', 'AI Engineer', 'Data Scientist',
      'Backend Developer', 'Mobile App Developer', 'Data Analyst', 'Cloud / DevOps Engineer',
      'Cybersecurity Engineer', 'Data Engineer', 'Cybersecurity Analyst', 'Cloud Engineer', 'DevOps Engineer',
      'Android Developer', 'iOS Developer', 'Flutter Developer', 'Ethical Hacker', 'SOC Analyst',
      'QA Engineer', 'SDET', 'Network Engineer', 'Site Reliability Engineer', 'Machine Learning Engineer',
      'AI/ML Engineer', 'Deep Learning Engineer', 'Generative AI Engineer', 'NLP Engineer',
      'Computer Vision Engineer', 'AI Research Engineer', 'Digital Marketing Specialist', 'SEO Specialist',
      'Content Strategist', 'Growth Marketer', 'Social Media Manager', 'Brand Manager', 'Business Analyst',
      'Business Consultant', 'Operations Analyst', 'Sales Executive', 'Business Development Executive',
      'Accountant', 'Management Accountant', 'Financial Analyst', 'FP&A Analyst', 'Risk Analyst',
      'Investment Analyst', 'Product Marketing Manager', 'Software Engineer', 'Web Developer',
      'Application Developer', 'API Developer', 'React Native Developer', 'Analytics Engineer',
      'Data Architect', 'BI Analyst', 'BI Developer', 'Security Analyst', 'Security Engineer',
      'Penetration Tester', 'Application Security Engineer', 'Cloud Security Engineer', 'Security Architect',
      'Digital Forensics Analyst'
    )
  ) then
    raise exception 'Career path migration stopped: roadmap progress contains a role key absent from js/roadmap-data.js. Inspect and resolve mappings before retrying.';
  end if;
end;
$$;

-- Existing profiles remain authoritative for the primary role. Profiles with
-- invalid/unrecognized roles are left untouched and do not get a guessed path.
insert into public.career_paths (user_id, role_key, status)
select p.user_id, p.target_role, 'primary'
from public.profiles p
where p.target_role in (
  'Full-Stack Developer', 'Cloud Architect', 'Cloud Developer', 'DevSecOps Engineer',
  'Platform Engineer', 'Infrastructure Engineer', 'Network Administrator', 'Network Architect',
  'Systems Administrator', 'Systems Engineer', 'IT Support Engineer', 'Blockchain Developer',
  'Blockchain Engineer', 'Smart Contract Developer', 'Web3 Developer', 'Solidity Developer',
  'Quantum Computing Researcher', 'Game Developer', 'Unity Developer', 'Unreal Engine Developer',
  'Gameplay Programmer', 'Game Designer', 'AR/VR Developer', 'Technical Artist',
  'Test Automation Engineer', 'Performance Test Engineer', 'QA Lead', 'Embedded Systems Engineer',
  'Embedded Software Engineer', 'Firmware Engineer', 'IoT Engineer', 'Robotics Engineer',
  'Robotics Software Engineer', 'Autonomous Systems Engineer', 'UX Designer', 'UI Designer',
  'Product Designer', 'UX Researcher', 'Interaction Designer', 'Visual Designer', 'Product Manager',
  'Product Owner', 'Design Systems Designer', 'Frontend Developer', 'AI Engineer', 'Data Scientist',
  'Backend Developer', 'Mobile App Developer', 'Data Analyst', 'Cloud / DevOps Engineer',
  'Cybersecurity Engineer', 'Data Engineer', 'Cybersecurity Analyst', 'Cloud Engineer', 'DevOps Engineer',
  'Android Developer', 'iOS Developer', 'Flutter Developer', 'Ethical Hacker', 'SOC Analyst',
  'QA Engineer', 'SDET', 'Network Engineer', 'Site Reliability Engineer', 'Machine Learning Engineer',
  'AI/ML Engineer', 'Deep Learning Engineer', 'Generative AI Engineer', 'NLP Engineer',
  'Computer Vision Engineer', 'AI Research Engineer', 'Digital Marketing Specialist', 'SEO Specialist',
  'Content Strategist', 'Growth Marketer', 'Social Media Manager', 'Brand Manager', 'Business Analyst',
  'Business Consultant', 'Operations Analyst', 'Sales Executive', 'Business Development Executive',
  'Accountant', 'Management Accountant', 'Financial Analyst', 'FP&A Analyst', 'Risk Analyst',
  'Investment Analyst', 'Product Marketing Manager', 'Software Engineer', 'Web Developer',
  'Application Developer', 'API Developer', 'React Native Developer', 'Analytics Engineer',
  'Data Architect', 'BI Analyst', 'BI Developer', 'Security Analyst', 'Security Engineer',
  'Penetration Tester', 'Application Security Engineer', 'Cloud Security Engineer', 'Security Architect',
  'Digital Forensics Analyst'
)
on conflict (user_id, role_key) do nothing;

-- Preserve additional roles represented by existing progress as explorations.
-- Never replace an existing primary row for that same role.
insert into public.career_paths (user_id, role_key, status)
select distinct saved.user_id, saved.target_role, 'exploration'
from (
  select user_id, target_role from public.roadmap_skill_progress
  union
  select user_id, target_role from public.roadmap_mission_progress
) saved
on conflict (user_id, role_key) do nothing;

alter table public.roadmap_skill_progress add column path_id uuid;
alter table public.roadmap_mission_progress add column path_id uuid;

update public.roadmap_skill_progress progress
set path_id = paths.id
from public.career_paths paths
where progress.path_id is null
  and paths.user_id = progress.user_id
  and paths.role_key = progress.target_role;

update public.roadmap_mission_progress progress
set path_id = paths.id
from public.career_paths paths
where progress.path_id is null
  and paths.user_id = progress.user_id
  and paths.role_key = progress.target_role;

alter table public.roadmap_skill_progress
  add constraint roadmap_skill_progress_path_user_fkey
  foreign key (path_id, user_id) references public.career_paths (id, user_id) on delete cascade;
alter table public.roadmap_mission_progress
  add constraint roadmap_mission_progress_path_user_fkey
  foreign key (path_id, user_id) references public.career_paths (id, user_id) on delete cascade;

create index roadmap_skill_progress_path_idx on public.roadmap_skill_progress (path_id) where path_id is not null;
create index roadmap_mission_progress_path_idx on public.roadmap_mission_progress (path_id) where path_id is not null;

-- Serialize promotions by authenticated user. The partial unique index remains
-- the final database guard if any writer bypasses this function.
create or replace function public.promote_career_path(p_path_id uuid)
returns public.career_paths
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := auth.uid();
  selected_path public.career_paths;
begin
  if actor_id is null then
    raise exception 'Authentication is required.' using errcode = '28000';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(actor_id::text, 0));

  select * into selected_path
  from public.career_paths
  where id = p_path_id and user_id = actor_id
  for update;

  if not found then
    raise exception 'Career path was not found for the authenticated user.' using errcode = 'P0002';
  end if;

  update public.career_paths
  set status = 'archived'
  where user_id = actor_id and status = 'primary' and id <> p_path_id;

  update public.career_paths
  set status = 'primary'
  where id = p_path_id and user_id = actor_id
  returning * into selected_path;

  -- Keep the pre-Career Paths profile field aligned for older clients.
  update public.profiles
  set target_role = selected_path.role_key
  where user_id = actor_id;

  return selected_path;
end;
$$;

revoke all on function public.promote_career_path(uuid) from public, anon;
grant execute on function public.promote_career_path(uuid) to authenticated;
