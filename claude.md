## Platform structure
- One Next.js site hosting multiple apps under /<app> routes (first: /ordertrail)
- Shared auth, users, projects and permissions across apps
- Home page after login = app launcher showing only apps the user can access
- Add table: app_access (user_id, app, project_id)

# APP 1 - OrderTrail – SOP Checklist App

## Goal
A web app for managing orders by SOP. When an order is entered, its SOP checklist appears with one slot per required document (PO, SO, Surat Jalan, Delivery, SI, etc.). Users upload files to each slot, and others can view and download them.

## Stack
- Next.js (App Router, TypeScript)
- Supabase: Postgres, Auth, Storage (files), Row Level Security
- Tailwind CSS + shadcn/ui
- Hosted on Vercel

## Core features
1. **Auth:** email/password login and logout. No public sign-up. Only the super admin (owner) creates users.
2. **Projects:** multiple projects (e.g. MCI, OIM). Each has its own SOP templates, orders and members. Users see only the projects they belong to.
3. **Roles (per project):**
   - Super admin: create projects and users, assign members (global)
   - Manager: edit the project's SOP templates, create and edit orders
   - Staff: upload and download documents, tick checklist items
   - Viewer: view and download only
   - A user can have different roles in different projects.
   - Optional: limit uploads for a slot to certain roles.
4. **SOP templates:** a template is an ordered list of steps or document slots (name, required?, notes).
5. **Orders:** create an order (order number, customer, date, notes), pick a template, and the checklist is generated automatically.
6. **Checklist slots:** status (pending/uploaded/done), file upload, view, download, uploaded-by and timestamp, multiple files or versions per slot.
7. **Search and filter:** find orders by number, customer, status or date.

## Data model (draft)
- profiles (id = auth user, name, is_super_admin)
- projects (id, name, code)
- project_members (project_id, user_id, role)
- sop_templates (id, project_id, name)
- sop_template_items (id, template_id, name, position, required)
- orders (id, project_id, template_id, order_no, customer, date, status, notes)
- order_items (id, order_id, name, position, status, completed_by, completed_at)
- order_files (id, order_item_id, storage_path, file_name, uploaded_by, uploaded_at)

Use Supabase RLS so every query is scoped to the projects the user belongs to. Store files in a private bucket at `project/{project_id}/order/{order_id}/...` and serve them with signed URLs.

## Future
- Inventory and stock opname, per project.
- UI language: English and/or Indonesian (to be decided).

## Open questions
- Do document slots vary by order type? If so, use multiple templates per project.

## Build order
1. Supabase setup, auth, super admin user creation
2. Projects, members, roles, RLS
3. SOP templates
4. Orders and checklist generation
5. File upload and download
6. Search, mobile polish, deploy
