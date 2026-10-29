"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
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

export type FormState = { error?: string; success?: string };

// A ban this long is effectively permanent until reactivated.
const DEACTIVATED_BAN = "876000h";

async function targetUser(formData: FormData) {
  const me = await requireSuperAdmin();
  const userId = String(formData.get("user_id") ?? "");
  return { me, userId, isSelf: userId === me.id };
}

function refresh(userId: string) {
  revalidatePath("/admin/users");
  revalidatePath(`/admin/users/${userId}`);
}

export async function updateUserDetails(_prev: FormState, formData: FormData): Promise<FormState> {
  const { userId, isSelf } = await targetUser(formData);
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const superAdmin = formData.get("is_super_admin") === "on";

  if (!email) return { error: "Email is required." };
  if (isSelf && !superAdmin) return { error: "You can't remove your own super admin access." };

  const admin = createAdminClient();
  const { data: current } = await admin.from("profiles").select("email").eq("id", userId).single();
  if (!current) return { error: "User not found." };

  if (current.email !== email) {
    // Profile email follows automatically via the database trigger.
    const { error } = await admin.auth.admin.updateUserById(userId, { email, email_confirm: true });
    if (error) return { error: error.message };
  }

  const { error } = await admin
    .from("profiles")
    .update({ name: name || null, is_super_admin: superAdmin })
    .eq("id", userId);
  if (error) return { error: error.message };

  refresh(userId);
  return { success: "Saved." };
}

export async function resetPassword(_prev: FormState, formData: FormData): Promise<FormState> {
  const { userId } = await targetUser(formData);
  const password = String(formData.get("password") ?? "");
  if (password.length < 8) return { error: "Password must be at least 8 characters." };

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.updateUserById(userId, { password });
  if (error) return { error: error.message };
  return { success: "Password changed. Share it with the user privately." };
}

export async function setUserActive(_prev: FormState, formData: FormData): Promise<FormState> {
  const { userId, isSelf } = await targetUser(formData);
  const active = formData.get("active") === "true";
  if (isSelf && !active) return { error: "You can't deactivate your own account." };

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.updateUserById(userId, {
    ban_duration: active ? "none" : DEACTIVATED_BAN,
  });
  if (error) return { error: error.message };

  refresh(userId);
  return { success: active ? "Account reactivated." : "Account deactivated. They can no longer sign in." };
}

export async function deleteUser(_prev: FormState, formData: FormData): Promise<FormState> {
  const { userId, isSelf } = await targetUser(formData);
  if (isSelf) return { error: "You can't delete your own account." };

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.deleteUser(userId);
  if (error) return { error: error.message };

  revalidatePath("/admin/users");
  redirect("/admin/users");
}
