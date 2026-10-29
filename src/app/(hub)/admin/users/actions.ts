"use server";

import { revalidatePath } from "next/cache";
import { requireSuperAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export type CreateUserState = { error?: string; success?: string };

export async function createUser(
  _prev: CreateUserState,
  formData: FormData,
): Promise<CreateUserState> {
  await requireSuperAdmin();

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const name = String(formData.get("name") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const makeSuperAdmin = formData.get("is_super_admin") === "on";

  if (!email || !password) return { error: "Email and password are required." };
  if (password.length < 8) return { error: "Password must be at least 8 characters." };

  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name: name || null },
  });
  if (error) return { error: error.message };

  if (makeSuperAdmin) {
    const { error: flagError } = await admin
      .from("profiles")
      .update({ is_super_admin: true })
      .eq("id", data.user.id);
    if (flagError) return { error: `User created, but setting super admin failed: ${flagError.message}` };
  }

  revalidatePath("/admin/users");
  return { success: `Created ${email}.` };
}
