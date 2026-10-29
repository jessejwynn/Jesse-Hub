import "server-only";
import { createClient } from "@supabase/supabase-js";

// Service-role client. Bypasses RLS. Only use on the server, and only after
// checking that the caller is a super admin.
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}
