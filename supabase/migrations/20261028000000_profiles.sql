-- Step 1: profiles and super admin flag.
-- One profile per auth user. Created automatically when a user is created.

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  name text,
  is_super_admin boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Used by RLS policies. security definer so it can read profiles without
-- triggering the profiles policies again (avoids recursion).
create or replace function public.is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (select is_super_admin from public.profiles where id = (select auth.uid())),
    false
  );
$$;

revoke all on function public.is_super_admin() from public;
grant execute on function public.is_super_admin() to authenticated;

-- Users can read their own profile; super admins can read every profile.
create policy "profiles: read own or super admin"
  on public.profiles for select
  to authenticated
  using (id = (select auth.uid()) or public.is_super_admin());

-- Users can change their own name only. is_super_admin and email are
-- protected by the column grants below.
create policy "profiles: update own"
  on public.profiles for update
  to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

revoke insert, update, delete on public.profiles from anon, authenticated;
grant update (name) on public.profiles to authenticated;

-- Create a profile row whenever an auth user is created.
-- is_super_admin is never taken from user metadata; it is set separately
-- with the service role.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, name)
  values (new.id, new.email, new.raw_user_meta_data ->> 'name');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Keep profiles.email in sync if an auth email changes.
create or replace function public.handle_user_email_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.profiles set email = new.email where id = new.id;
  return new;
end;
$$;

create trigger on_auth_user_email_changed
  after update of email on auth.users
  for each row
  when (old.email is distinct from new.email)
  execute function public.handle_user_email_change();
