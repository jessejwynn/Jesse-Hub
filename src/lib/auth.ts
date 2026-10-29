import "server-only";
import { redirect } from "next/navigation";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

export type Profile = {
  id: string;
  email: string;
  name: string | null;
  is_super_admin: boolean;
};

// Current user's profile. Redirects to /login if not signed in.
export const getCurrentProfile = cache(async (): Promise<Profile> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, email, name, is_super_admin")
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/login");
  return profile;
});

export async function requireSuperAdmin(): Promise<Profile> {
  const profile = await getCurrentProfile();
  if (!profile.is_super_admin) redirect("/");
  return profile;
}
