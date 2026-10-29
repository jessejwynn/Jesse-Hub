"use server";

import { revalidatePath } from "next/cache";
import { isAppSlug } from "@/lib/apps";
import { requireSuperAdmin } from "@/lib/auth";
import { isRole } from "@/lib/roles";
import { createClient } from "@/lib/supabase/server";

export type FormState = { error?: string; success?: string };

export async function createProject(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireSuperAdmin();
  const name = String(formData.get("name") ?? "").trim();
  const code = String(formData.get("code") ?? "").trim().toUpperCase();

  if (!name) return { error: "Name is required." };
  if (!/^[A-Z0-9_-]{1,20}$/.test(code)) {
    return { error: "Code must be 1–20 letters, numbers, - or _." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("projects").insert({ name, code });
  if (error) {
    return { error: error.code === "23505" ? `Code ${code} is already used.` : error.message };
  }

  revalidatePath("/admin/projects");
  return { success: `Created ${name}.` };
}

export async function updateProject(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireSuperAdmin();
  const id = String(formData.get("project_id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const code = String(formData.get("code") ?? "").trim().toUpperCase();

  if (!name) return { error: "Name is required." };
  if (!/^[A-Z0-9_-]{1,20}$/.test(code)) {
    return { error: "Code must be 1–20 letters, numbers, - or _." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("projects").update({ name, code }).eq("id", id);
  if (error) {
    return { error: error.code === "23505" ? `Code ${code} is already used.` : error.message };
  }

  revalidatePath("/admin/projects");
  revalidatePath(`/admin/projects/${id}`);
  return { success: "Saved." };
}

function selectedApps(formData: FormData): string[] {
  return formData.getAll("apps").map(String).filter(isAppSlug);
}

async function replaceAppAccess(projectId: string, userId: string, apps: string[]) {
  const supabase = await createClient();
  const { error: delError } = await supabase
    .from("app_access")
    .delete()
    .eq("project_id", projectId)
    .eq("user_id", userId);
  if (delError) return delError.message;

  if (apps.length > 0) {
    const { error } = await supabase
      .from("app_access")
      .insert(apps.map((app) => ({ project_id: projectId, user_id: userId, app })));
    if (error) return error.message;
  }
  return null;
}

export async function addMember(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireSuperAdmin();
  const projectId = String(formData.get("project_id") ?? "");
  const userId = String(formData.get("user_id") ?? "");
  const role = formData.get("role");

  if (!projectId || !userId) return { error: "Pick a user." };
  if (!isRole(role)) return { error: "Pick a role." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("project_members")
    .insert({ project_id: projectId, user_id: userId, role });
  if (error) {
    return { error: error.code === "23505" ? "That user is already a member." : error.message };
  }

  const appError = await replaceAppAccess(projectId, userId, selectedApps(formData));
  if (appError) return { error: `Member added, but app access failed: ${appError}` };

  revalidatePath(`/admin/projects/${projectId}`);
  return { success: "Member added." };
}

export async function updateMember(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireSuperAdmin();
  const projectId = String(formData.get("project_id") ?? "");
  const userId = String(formData.get("user_id") ?? "");
  const role = formData.get("role");
  if (!isRole(role)) return { error: "Pick a role." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("project_members")
    .update({ role })
    .eq("project_id", projectId)
    .eq("user_id", userId);
  if (error) return { error: error.message };

  const appError = await replaceAppAccess(projectId, userId, selectedApps(formData));
  if (appError) return { error: appError };

  revalidatePath(`/admin/projects/${projectId}`);
  return { success: "Saved." };
}

export async function removeMember(formData: FormData): Promise<void> {
  await requireSuperAdmin();
  const projectId = String(formData.get("project_id") ?? "");
  const userId = String(formData.get("user_id") ?? "");

  const supabase = await createClient();
  await supabase
    .from("project_members")
    .delete()
    .eq("project_id", projectId)
    .eq("user_id", userId);

  revalidatePath(`/admin/projects/${projectId}`);
}
