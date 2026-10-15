-- NOVA Trade: isolated user accounts and voluntary team tree.
-- Apply ONLY to a new, dedicated NOVA Supabase project. Never to SalonOS / Barbercraft databases.
-- All trading values remain fictitious; no commissions from recruiting or depositing.
begin;

create table if not exists public.nova_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default 'Participant',
  created_at timestamptz not null default now(),
  constraint nova_profile_display_len check (char_length(display_name) between 2 and 40)
);

create table if not exists public.nova_teams (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null unique references public.nova_profiles(id) on delete cascade,
  name text not null,
  invite_code uuid not null unique default gen_random_uuid(),
  created_at timestamptz not null default now(),
  constraint nova_team_name_len check (char_length(btrim(name)) between 2 and 32)
);

-- The referral graph is a ONE-PARENT mentor/team relationship, not a payout structure.
-- Owning a team and having a mentor can coexist; this permits a voluntary hierarchy.
create table if not exists public.nova_referrals (
  child_id uuid primary key references public.nova_profiles(id) on delete cascade,
  parent_id uuid not null references public.nova_profiles(id) on delete cascade,
  share_display_name boolean not null default false,
  joined_at timestamptz not null default now(),
  constraint nova_no_self_referral check (child_id <> parent_id)
);
create index if not exists nova_referrals_parent_idx on public.nova_referrals(parent_id);

alter table public.nova_profiles enable row level security;
alter table public.nova_teams enable row level security;
alter table public.nova_referrals enable row level security;

revoke all on public.nova_profiles, public.nova_teams, public.nova_referrals from anon, authenticated;
grant select on public.nova_profiles, public.nova_teams to authenticated;

drop policy if exists "nova_profile_self_read" on public.nova_profiles;
create policy "nova_profile_self_read" on public.nova_profiles
  for select to authenticated using (id = (select auth.uid()));

drop policy if exists "nova_team_owner_read" on public.nova_teams;
create policy "nova_team_owner_read" on public.nova_teams
  for select to authenticated using (owner_id = (select auth.uid()));

-- No direct client-side SELECT/INSERT/UPDATE/DELETE on referral edges.
-- SECURITY DEFINER functions below expose only consent-controlled information.

create or replace function public.nova_register_profile()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.nova_profiles(id,display_name)
  values(new.id,'Participant')
  on conflict (id) do nothing;
  return new;
end;
$$;
revoke all on function public.nova_register_profile() from public, anon, authenticated;

drop trigger if exists nova_on_auth_user_created on auth.users;
create trigger nova_on_auth_user_created after insert on auth.users
  for each row execute function public.nova_register_profile();

create or replace function public.nova_require_verified()
returns uuid
language plpgsql security definer set search_path = ''
as $$
declare v_id uuid;
begin
  v_id := (select auth.uid());
  if v_id is null then
    raise exception 'Autentificare necesară' using errcode='28000';
  end if;
  if not exists (select 1 from auth.users u where u.id=v_id and u.email_confirmed_at is not null) then
    raise exception 'Confirmă adresa de email înainte de a folosi echipele' using errcode='28000';
  end if;
  return v_id;
end;
$$;
revoke all on function public.nova_require_verified() from public, anon, authenticated;

create or replace function public.nova_update_display_name(p_name text)
returns void
language plpgsql security definer set search_path = ''
as $$
declare v_id uuid; v_name text;
begin
  v_id := public.nova_require_verified();
  v_name := btrim(coalesce(p_name,''));
  if char_length(v_name) not between 2 and 40 then
    raise exception 'Numele trebuie să aibă între 2 și 40 de caractere';
  end if;
  update public.nova_profiles set display_name=v_name where id=v_id;
end;
$$;

create or replace function public.nova_create_team(p_name text)
returns uuid
language plpgsql security definer set search_path = ''
as $$
declare v_id uuid; v_name text; v_team uuid;
begin
  v_id := public.nova_require_verified();
  v_name := btrim(coalesce(p_name,''));
  if char_length(v_name) not between 2 and 32 then
    raise exception 'Numele echipei trebuie să aibă între 2 și 32 de caractere';
  end if;
  insert into public.nova_teams(owner_id,name)
    values(v_id,v_name) returning id into v_team;
  return v_team;
exception when unique_violation then
  raise exception 'Ai deja o echipă; o poți redenumi';
end;
$$;

create or replace function public.nova_rename_team(p_name text)
returns void
language plpgsql security definer set search_path = ''
as $$
declare v_id uuid; v_name text;
begin
  v_id := public.nova_require_verified();
  v_name := btrim(coalesce(p_name,''));
  if char_length(v_name) not between 2 and 32 then
    raise exception 'Numele echipei trebuie să aibă între 2 și 32 de caractere';
  end if;
  update public.nova_teams set name=v_name where owner_id=v_id;
  if not found then raise exception 'Mai întâi creează o echipă'; end if;
end;
$$;

-- Invite codes are random, long UUIDs, not sequential IDs. Hash/expiry/rate-limits
-- must be added for a production service at scale. No commissions or XP assigned.
create or replace function public.nova_preview_team(p_code uuid)
returns table(team_name text)
language sql security definer set search_path = ''
as $$
  select t.name from public.nova_teams t where t.invite_code=p_code limit 1
$$;

create or replace function public.nova_join_team(p_code uuid)
returns void
language plpgsql security definer set search_path = ''
as $$
declare v_child uuid; v_parent uuid;
begin
  v_child := public.nova_require_verified();
  select t.owner_id into v_parent from public.nova_teams t
    where t.invite_code=p_code;
  if v_parent is null then raise exception 'Cod de echipă invalid'; end if;
  if v_parent = v_child then raise exception 'Nu poți să te inviți singur'; end if;
  if exists (select 1 from public.nova_referrals r where r.child_id=v_child) then
    raise exception 'Ai deja un invitator. Poți părăsi echipa înainte de altă invitație';
  end if;
  -- Lock advisory relation for both accounts to serialize conflicting
  -- join operations (including two users inviting each other simultaneously).
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(least(v_child,v_parent)::text || ':' || greatest(v_child,v_parent)::text, 0));
  if exists (select 1 from public.nova_referrals r where r.child_id=v_child) then
    raise exception 'Ai deja un invitator';
  end if;
  -- Reject cycles: parent must not already be a descendant of child.
  if exists (
    with recursive ancestors(id,path) as (
      select v_parent, array[v_parent]::uuid[]
      union all
      select r.parent_id, a.path || r.parent_id
      from ancestors a join public.nova_referrals r on r.child_id=a.id
      where not (r.parent_id = any(a.path))
    )
    select 1 from ancestors where id=v_child
  ) then
    raise exception 'Invitația ar crea o referință circulară';
  end if;
  insert into public.nova_referrals(child_id,parent_id) values(v_child,v_parent);
exception when unique_violation then
  raise exception 'Ai deja un invitator';
end;
$$;

create or replace function public.nova_leave_parent()
returns void
language plpgsql security definer set search_path = ''
as $$
declare v_id uuid;
begin
  v_id := public.nova_require_verified();
  delete from public.nova_referrals where child_id=v_id;
end;
$$;

create or replace function public.nova_set_share_name(p_share boolean)
returns void
language plpgsql security definer set search_path = ''
as $$
declare v_id uuid;
begin
  v_id := public.nova_require_verified();
  update public.nova_referrals
    set share_display_name=coalesce(p_share,false) where child_id=v_id;
end;
$$;

create or replace function public.nova_my_parent()
returns table(team_name text, parent_display_name text, share_enabled boolean)
language plpgsql security definer set search_path = ''
as $$
declare v_id uuid;
begin
  v_id := public.nova_require_verified();
  return query
    select t.name, p.display_name, r.share_display_name
    from public.nova_referrals r
      join public.nova_teams t on t.owner_id=r.parent_id
      join public.nova_profiles p on p.id=r.parent_id
    where r.child_id=v_id;
end;
$$;

create or replace function public.nova_my_team_members()
returns table(display_name text, joined_at timestamptz, sharing_enabled boolean)
language plpgsql security definer set search_path = ''
as $$
declare v_id uuid;
begin
  v_id := public.nova_require_verified();
  return query
    select
      case when r.share_display_name then p.display_name else 'Participant anonim'::text end,
      r.joined_at,
      r.share_display_name
    from public.nova_referrals r
      join public.nova_profiles p on p.id=r.child_id
    where r.parent_id=v_id
    order by r.joined_at desc
    limit 500;
end;
$$;

-- Explicit grants only for authenticated users. No anon access to team functions.
revoke all on function public.nova_update_display_name(text) from public, anon;
revoke all on function public.nova_create_team(text) from public, anon;
revoke all on function public.nova_rename_team(text) from public, anon;
revoke all on function public.nova_preview_team(uuid) from public, anon;
revoke all on function public.nova_join_team(uuid) from public, anon;
revoke all on function public.nova_leave_parent() from public, anon;
revoke all on function public.nova_set_share_name(boolean) from public, anon;
revoke all on function public.nova_my_parent() from public, anon;
revoke all on function public.nova_my_team_members() from public, anon;

grant execute on function public.nova_update_display_name(text) to authenticated;
grant execute on function public.nova_create_team(text) to authenticated;
grant execute on function public.nova_rename_team(text) to authenticated;
grant execute on function public.nova_preview_team(uuid) to authenticated;
grant execute on function public.nova_join_team(uuid) to authenticated;
grant execute on function public.nova_leave_parent() to authenticated;
grant execute on function public.nova_set_share_name(boolean) to authenticated;
grant execute on function public.nova_my_parent() to authenticated;
grant execute on function public.nova_my_team_members() to authenticated;

commit;
