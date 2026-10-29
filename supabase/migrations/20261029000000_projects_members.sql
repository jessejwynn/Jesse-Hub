-- Step 2: projects, members, per-project roles, app access, RLS.

create type public.project_role as enum ('manager', 'staff', 'viewer');

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text not null unique check (code ~ '^[A-Z0-9_-]{1,20}$'),
  created_at timestamptz not null default now()
);

create table public.project_members (
  project_id uuid not null references public.projects (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  role public.project_role not null,
  created_at timestamptz not null default now(),
  primary key (project_id, user_id)
);
create index project_members_user_id_idx on public.project_members (user_id);

-- Which apps a member can use in a project. Must be a member first;
-- removing the member removes their app access too.
create table public.app_access (
  user_id uuid not null,
  app text not null check (app ~ '^[a-z0-9-]+$'),
  project_id uuid not null,
  primary key (user_id, app, project_id),
  foreign key (project_id, user_id)
    references public.project_members (project_id, user_id) on delete cascade
);
create index app_access_project_id_idx on public.app_access (project_id);

alter table public.projects enable row level security;
alter table public.project_members enable row level security;
alter table public.app_access enable row level security;

-- Helpers for RLS. security definer so they read membership without
-- re-triggering the policies that call them.

create or replace function public.is_project_member(p_project_id uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.project_members
    where project_id = p_project_id and user_id = (select auth.uid())
  );
$$;

-- Caller's role in a project, or null if not a member.
create or replace function public.project_role(p_project_id uuid)
returns public.project_role
language sql stable security definer set search_path = ''
as $$
  select role from public.project_members
  where project_id = p_project_id and user_id = (select auth.uid());
$$;

-- True if the caller has one of the given roles in the project.
-- Super admins pass every role check.
create or replace function public.has_project_role(
  p_project_id uuid,
  p_roles public.project_role[]
)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select public.is_super_admin() or exists (
    select 1 from public.project_members
    where project_id = p_project_id
      and user_id = (select auth.uid())
      and role = any (p_roles)
  );
$$;

-- True if the caller can use an app in a project. Super admins can use all.
create or replace function public.has_app_access(p_app text, p_project_id uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select public.is_super_admin() or exists (
    select 1 from public.app_access
    where app = p_app and project_id = p_project_id
      and user_id = (select auth.uid())
  );
$$;

-- True if the caller shares at least one project with the given user.
create or replace function public.shares_project_with(p_user_id uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1
    from public.project_members mine
    join public.project_members theirs on theirs.project_id = mine.project_id
    where mine.user_id = (select auth.uid()) and theirs.user_id = p_user_id
  );
$$;

revoke all on function public.is_project_member(uuid) from public;
revoke all on function public.project_role(uuid) from public;
revoke all on function public.has_project_role(uuid, public.project_role[]) from public;
revoke all on function public.has_app_access(text, uuid) from public;
revoke all on function public.shares_project_with(uuid) from public;
grant execute on function public.is_project_member(uuid) to authenticated;
grant execute on function public.project_role(uuid) to authenticated;
grant execute on function public.has_project_role(uuid, public.project_role[]) to authenticated;
grant execute on function public.has_app_access(text, uuid) to authenticated;
grant execute on function public.shares_project_with(uuid) to authenticated;

-- projects: members can read; only super admins can create, edit or delete.
create policy "projects: read if member or super admin"
  on public.projects for select to authenticated
  using (public.is_super_admin() or public.is_project_member(id));

create policy "projects: super admin insert"
  on public.projects for insert to authenticated
  with check (public.is_super_admin());

create policy "projects: super admin update"
  on public.projects for update to authenticated
  using (public.is_super_admin()) with check (public.is_super_admin());

create policy "projects: super admin delete"
  on public.projects for delete to authenticated
  using (public.is_super_admin());

-- project_members: members see everyone in their projects; only super
-- admins assign members and roles.
create policy "project_members: read if same project or super admin"
  on public.project_members for select to authenticated
  using (public.is_super_admin() or public.is_project_member(project_id));

create policy "project_members: super admin insert"
  on public.project_members for insert to authenticated
  with check (public.is_super_admin());

create policy "project_members: super admin update"
  on public.project_members for update to authenticated
  using (public.is_super_admin()) with check (public.is_super_admin());

create policy "project_members: super admin delete"
  on public.project_members for delete to authenticated
  using (public.is_super_admin());

-- app_access: users see their own rows; super admins see and manage all.
create policy "app_access: read own or super admin"
  on public.app_access for select to authenticated
  using (user_id = (select auth.uid()) or public.is_super_admin());

create policy "app_access: super admin insert"
  on public.app_access for insert to authenticated
  with check (public.is_super_admin());

create policy "app_access: super admin delete"
  on public.app_access for delete to authenticated
  using (public.is_super_admin());

-- profiles: also let users see the names of people in their projects.
create policy "profiles: read teammates"
  on public.profiles for select to authenticated
  using (public.shares_project_with(id));

-- No anonymous access to any of these tables.
revoke all on public.projects, public.project_members, public.app_access from anon;
