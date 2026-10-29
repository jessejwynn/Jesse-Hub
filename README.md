# Jesse Hub

One Next.js site hosting several apps under `/<app>` routes. First app: **OrderTrail** (`/ordertrail`). See `claude.md` for the full plan.

Stack: Next.js (App Router, TypeScript), Supabase (Postgres, Auth, Storage, RLS), Tailwind + shadcn/ui, Vercel.

## Setup (hosted Supabase)

1. Create a project at [supabase.com](https://supabase.com).
2. In **Authentication → Sign In / Providers**, turn off **Allow new users to sign up**. Only the super admin creates accounts.
3. Copy `.env.example` to `.env.local` and fill it in from **Project Settings → API Keys**:
   - `NEXT_PUBLIC_SUPABASE_URL`: the project URL
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`: the publishable key (or legacy `anon` key)
   - `SUPABASE_SECRET_KEY`: the secret key (or legacy `service_role` key). Server only.
4. Link the project and apply the database migrations:
   ```bash
   npx supabase login
   npx supabase link --project-ref <your-project-ref>
   npm run db:push
   ```
5. Create the first super admin:
   ```bash
   npm run create-super-admin -- you@example.com 'a-strong-password' "Your Name"
   ```
6. Run the app and sign in:
   ```bash
   npm run dev
   ```
   Open http://localhost:3000. As super admin, use **Users** in the header to create more accounts.

## Setup (local Supabase, needs Docker)

```bash
npm run db:start      # prints the local URL and keys for .env.local
npm run db:reset      # re-applies all migrations
npm run create-super-admin -- you@example.com 'a-strong-password' "Your Name"
npm run dev
```

## Layout

- `src/app/login`: sign-in page and sign-in/out actions
- `src/app/(hub)`: signed-in area. `/` is the app launcher, `/admin/users` is super-admin user management, `/ordertrail` is the first app
- `src/lib/supabase`: Supabase clients (browser, server, service-role admin) and session middleware
- `src/lib/apps.ts`: list of apps shown in the launcher
- `supabase/migrations`: database schema and RLS policies
- `scripts/create-super-admin.mjs`: creates or promotes the first super admin
