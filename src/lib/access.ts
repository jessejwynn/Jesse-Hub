import "server-only";
import { notFound } from "next/navigation";
import { APPS, type AppInfo } from "@/lib/apps";
import { getCurrentProfile } from "@/lib/auth";
import type { Role } from "@/lib/roles";
import { createClient } from "@/lib/supabase/server";

export type AppProject = {
  id: string;
  name: string;
  code: string;
  role: Role | null; // null = super admin who isn't a member
};

// Apps the current user can open from the launcher.
export async function getAccessibleApps(): Promise<AppInfo[]> {
  const profile = await getCurrentProfile();
  if (profile.is_super_admin) return APPS;

  const supabase = await createClient();
  const { data } = await supabase.from("app_access").select("app").eq("user_id", profile.id);
  const slugs = new Set((data ?? []).map((r) => r.app as string));
  return APPS.filter((a) => slugs.has(a.slug));
}

// Projects the current user can use in an app, with their role in each.
export async function getAppProjects(app: string): Promise<AppProject[]> {
  const profile = await getCurrentProfile();
  const supabase = await createClient();

  const { data: memberships } = await supabase
    .from("project_members")
    .select("project_id, role")
    .eq("user_id", profile.id);
  const roleByProject = new Map(
    (memberships ?? []).map((m) => [m.project_id as string, m.role as Role]),
  );

  if (profile.is_super_admin) {
    const { data: projects } = await supabase
      .from("projects")
      .select("id, name, code")
      .order("name");
    return (projects ?? []).map((p) => ({ ...p, role: roleByProject.get(p.id) ?? null }));
  }

  const { data: rows } = await supabase
    .from("app_access")
    .select("project_id, projects (id, name, code)")
    .eq("user_id", profile.id)
    .eq("app", app);

  return (rows ?? [])
    .map((r) => r.projects as unknown as { id: string; name: string; code: string } | null)
    .filter((p): p is { id: string; name: string; code: string } => p !== null)
    .map((p) => ({ ...p, role: roleByProject.get(p.id) ?? null }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

// One project by code, if the current user can use it in this app. 404 otherwise.
export async function requireAppProject(app: string, code: string): Promise<AppProject> {
  const projects = await getAppProjects(app);
  const project = projects.find((p) => p.code === code.toUpperCase());
  if (!project) notFound();
  return project;
}
