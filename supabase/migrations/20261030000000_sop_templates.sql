-- Step 3: SOP templates. Each project has its own templates; each template is
-- an ordered list of document slots. Orders (step 4) copy these slots, so
-- editing a template later doesn't change existing orders.

create table public.sop_templates (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  name text not null check (length(trim(name)) > 0),
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index sop_templates_project_id_idx on public.sop_templates (project_id);

create table public.sop_template_items (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references public.sop_templates (id) on delete cascade,
  name text not null check (length(trim(name)) > 0),
  position integer not null,
  required boolean not null default true,
  notes text,
  -- Roles allowed to upload to this slot. null = anyone who can upload.
  upload_roles public.project_role[]
);
create index sop_template_items_template_id_idx on public.sop_template_items (template_id, position);

alter table public.sop_templates enable row level security;
alter table public.sop_template_items enable row level security;

-- Templates: anyone with OrderTrail access to the project can read them;
-- managers (and super admins) can create, edit and delete.
create policy "sop_templates: read with app access"
  on public.sop_templates for select to authenticated
  using (public.has_app_access('ordertrail', project_id));

create policy "sop_templates: managers insert"
  on public.sop_templates for insert to authenticated
  with check (
    public.has_app_access('ordertrail', project_id)
    and public.has_project_role(project_id, array['manager']::public.project_role[])
  );

create policy "sop_templates: managers update"
  on public.sop_templates for update to authenticated
  using (
    public.has_app_access('ordertrail', project_id)
    and public.has_project_role(project_id, array['manager']::public.project_role[])
  )
  with check (
    public.has_app_access('ordertrail', project_id)
    and public.has_project_role(project_id, array['manager']::public.project_role[])
  );

create policy "sop_templates: managers delete"
  on public.sop_templates for delete to authenticated
  using (
    public.has_app_access('ordertrail', project_id)
    and public.has_project_role(project_id, array['manager']::public.project_role[])
  );

-- Items follow their template's project.
create or replace function public.can_manage_template(p_template_id uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.sop_templates t
    where t.id = p_template_id
      and public.has_app_access('ordertrail', t.project_id)
      and public.has_project_role(t.project_id, array['manager']::public.project_role[])
  );
$$;
revoke all on function public.can_manage_template(uuid) from public;
grant execute on function public.can_manage_template(uuid) to authenticated;

create policy "sop_template_items: read with template"
  on public.sop_template_items for select to authenticated
  using (exists (select 1 from public.sop_templates t where t.id = template_id));

create policy "sop_template_items: managers insert"
  on public.sop_template_items for insert to authenticated
  with check (public.can_manage_template(template_id));

create policy "sop_template_items: managers update"
  on public.sop_template_items for update to authenticated
  using (public.can_manage_template(template_id))
  with check (public.can_manage_template(template_id));

create policy "sop_template_items: managers delete"
  on public.sop_template_items for delete to authenticated
  using (public.can_manage_template(template_id));

revoke all on public.sop_templates, public.sop_template_items from anon;

-- Save a template's name, description and full item list in one transaction.
-- Runs as the caller, so the RLS policies above decide whether it's allowed.
-- p_items: [{ "id"?: uuid, "name": text, "required": bool, "notes"?: text,
--             "upload_roles"?: ["manager","staff"] | null }, ...] in order.
create or replace function public.save_sop_template(
  p_template_id uuid,
  p_name text,
  p_description text,
  p_items jsonb
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_item jsonb;
  v_pos integer := 0;
  v_keep uuid[] := '{}';
  v_id uuid;
begin
  if not public.can_manage_template(p_template_id) then
    raise exception 'Not allowed to edit this template' using errcode = '42501';
  end if;

  update public.sop_templates
  set name = trim(p_name),
      description = nullif(trim(coalesce(p_description, '')), ''),
      updated_at = now()
  where id = p_template_id;

  for v_item in select * from jsonb_array_elements(coalesce(p_items, '[]'::jsonb))
  loop
    v_pos := v_pos + 1;
    v_id := nullif(v_item ->> 'id', '')::uuid;

    if v_id is not null and exists (
      select 1 from public.sop_template_items where id = v_id and template_id = p_template_id
    ) then
      update public.sop_template_items set
        name = trim(v_item ->> 'name'),
        position = v_pos,
        required = coalesce((v_item ->> 'required')::boolean, true),
        notes = nullif(trim(coalesce(v_item ->> 'notes', '')), ''),
        upload_roles = case
          when jsonb_typeof(v_item -> 'upload_roles') = 'array'
          then array(select jsonb_array_elements_text(v_item -> 'upload_roles'))::public.project_role[]
          else null end
      where id = v_id;
    else
      insert into public.sop_template_items (template_id, name, position, required, notes, upload_roles)
      values (
        p_template_id,
        trim(v_item ->> 'name'),
        v_pos,
        coalesce((v_item ->> 'required')::boolean, true),
        nullif(trim(coalesce(v_item ->> 'notes', '')), ''),
        case
          when jsonb_typeof(v_item -> 'upload_roles') = 'array'
          then array(select jsonb_array_elements_text(v_item -> 'upload_roles'))::public.project_role[]
          else null end
      )
      returning id into v_id;
    end if;

    v_keep := v_keep || v_id;
  end loop;

  delete from public.sop_template_items
  where template_id = p_template_id and not (id = any (v_keep));
end;
$$;

revoke all on function public.save_sop_template(uuid, text, text, jsonb) from public;
grant execute on function public.save_sop_template(uuid, text, text, jsonb) to authenticated;
