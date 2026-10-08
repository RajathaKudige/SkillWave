-- Ensure profile creation always has a matching primary career path.
-- This follows 202610080001_career_paths.sql and keeps the existing client
-- contract: onboarding continues to upsert public.profiles as before.

create or replace function public.initialize_career_path_for_profile(
  p_user_id uuid,
  p_role_key text,
  p_preserve_existing_primary boolean,
  p_raise_for_invalid_role boolean,
  p_read_profile_role boolean default false
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  role_key text := p_role_key;
  path_id uuid;
  primary_path_id uuid;
  failed_constraint text;
begin
  if p_user_id is null then
    raise exception 'A user ID is required to initialize a career path.' using errcode = '22023';
  end if;

  -- Use the same lock key as promote_career_path so initialization and
  -- promotion serialize on the same user, including duplicate attempts.
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_user_id::text, 0));

  if p_read_profile_role then
    select profile.target_role into role_key
    from public.profiles profile
    where profile.user_id = p_user_id
    for update;
    if not found then
      return null;
    end if;
  end if;

  if role_key is null or pg_catalog.btrim(role_key) = '' then
    if p_raise_for_invalid_role then
      raise exception 'Cannot initialize a primary career path: profiles.target_role is empty.' using errcode = '22023';
    end if;
    raise warning 'Career path initialization skipped for user %: profiles.target_role is empty.', p_user_id;
    return null;
  end if;

  -- career_paths_role_key_check is the database's canonical catalog guard.
  -- Reuse a saved path for this role; never create a second path for it.
  begin
    insert into public.career_paths (user_id, role_key, status)
    values (p_user_id, role_key, 'exploration')
    on conflict (user_id, role_key) do nothing
    returning id into path_id;
  exception when check_violation then
    get stacked diagnostics failed_constraint = constraint_name;
    if failed_constraint = 'career_paths_role_key_check' then
      if p_raise_for_invalid_role then
        raise exception 'Cannot initialize a primary career path: role key "%" is not in the roadmap catalog.', role_key using errcode = '22023';
      end if;
      raise warning 'Career path initialization skipped for user %: role key "%" is not in the roadmap catalog.', p_user_id, role_key;
      return null;
    end if;
    raise;
  end;

  if path_id is null then
    select path.id into path_id
    from public.career_paths path
    where path.user_id = p_user_id and path.role_key = role_key;
  end if;

  if path_id is null then
    raise exception 'Career path initialization could not find or create the selected role.';
  end if;

  if p_preserve_existing_primary then
    select path.id into primary_path_id
    from public.career_paths path
    where path.user_id = p_user_id and path.status = 'primary';
    if found then
      return primary_path_id;
    end if;
  end if;

  update public.career_paths
  set status = 'archived'
  where user_id = p_user_id and status = 'primary' and id <> path_id;

  update public.career_paths
  set status = 'primary'
  where id = path_id and user_id = p_user_id;

  return path_id;
end;
$$;

revoke all on function public.initialize_career_path_for_profile(uuid, text, boolean, boolean, boolean)
  from public, anon, authenticated;

create or replace function public.initialize_primary_path_before_profile_insert()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.initialize_career_path_for_profile(new.user_id, new.target_role, false, true, false);
  return new;
end;
$$;

revoke all on function public.initialize_primary_path_before_profile_insert() from public, anon, authenticated;

create trigger profiles_initialize_primary_career_path
  before insert on public.profiles
  for each row execute function public.initialize_primary_path_before_profile_insert();

-- Repair profiles created in the interval after Phase 2A and before this
-- trigger existed. Existing primaries are preserved; invalid roles warn and
-- remain unchanged rather than being mapped to a guessed catalog role.
do $$
declare
  profile_row record;
begin
  for profile_row in
    select profile.user_id
    from public.profiles profile
    where not exists (
      select 1
      from public.career_paths path
      where path.user_id = profile.user_id and path.status = 'primary'
    )
  loop
    perform public.initialize_career_path_for_profile(profile_row.user_id, null, true, false, true);
  end loop;
end;
$$;
