import "server-only";
import type { User } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";

export type AuthInfo = { lastSignIn: string | null; deactivated: boolean };

function toInfo(u: User): AuthInfo {
  const bannedUntil = u.banned_until ? new Date(u.banned_until) : null;
  return {
    lastSignIn: u.last_sign_in_at ?? null,
    deactivated: !!bannedUntil && bannedUntil > new Date(),
  };
}

// Sign-in info for every user, keyed by user id. Call only after requireSuperAdmin.
export async function getAuthInfoMap(): Promise<Map<string, AuthInfo>> {
  const admin = createAdminClient();
  const map = new Map<string, AuthInfo>();
  for (let page = 1; ; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) break;
    data.users.forEach((u) => map.set(u.id, toInfo(u)));
    if (data.users.length < 1000) break;
  }
  return map;
}

export async function getAuthInfo(userId: string): Promise<AuthInfo | null> {
  const admin = createAdminClient();
  const { data } = await admin.auth.admin.getUserById(userId);
  return data.user ? toInfo(data.user) : null;
}
