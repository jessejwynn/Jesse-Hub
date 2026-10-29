import Link from "next/link";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { APPS } from "@/lib/apps";
import { requireSuperAdmin } from "@/lib/auth";
import type { Role } from "@/lib/roles";
import { createClient } from "@/lib/supabase/server";
import { EditProjectForm } from "./edit-project-form";
import { AddMemberForm, MemberRow } from "./member-forms";

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireSuperAdmin();
  const { id } = await params;
  const supabase = await createClient();

  const { data: project } = await supabase
    .from("projects")
    .select("id, name, code")
    .eq("id", id)
    .maybeSingle();
  if (!project) notFound();

  const [{ data: members }, { data: access }, { data: users }] = await Promise.all([
    supabase
      .from("project_members")
      .select("user_id, role, profiles (name, email)")
      .eq("project_id", id)
      .order("created_at"),
    supabase.from("app_access").select("user_id, app").eq("project_id", id),
    supabase.from("profiles").select("id, name, email").order("email"),
  ]);

  const memberIds = new Set((members ?? []).map((m) => m.user_id));
  const nonMembers = (users ?? [])
    .filter((u) => !memberIds.has(u.id))
    .map((u) => ({ id: u.id, label: u.name ? `${u.name} (${u.email})` : u.email }));

  return (
    <div className="grid gap-6">
      <div>
        <Link href="/admin/projects" className="text-sm text-muted-foreground hover:underline">
          ← Projects
        </Link>
        <h1 className="text-xl font-semibold">
          {project.name} <span className="font-mono text-muted-foreground">{project.code}</span>
        </h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Project details</CardTitle>
        </CardHeader>
        <CardContent>
          <EditProjectForm key={`${project.name}-${project.code}`} project={project} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Add member</CardTitle>
        </CardHeader>
        <CardContent>
          <AddMemberForm projectId={project.id} users={nonMembers} apps={APPS} />
        </CardContent>
      </Card>

      <div className="grid gap-2">
        <h2 className="font-semibold">Members</h2>
        <div className="rounded-md border">
          {members?.length === 0 && <p className="p-4 text-sm text-muted-foreground">No members yet.</p>}
          {members?.map((m) => {
            const profile = m.profiles as unknown as { name: string | null; email: string };
            return (
              <MemberRow
                key={m.user_id}
                projectId={project.id}
                apps={APPS}
                member={{
                  userId: m.user_id,
                  name: profile.name,
                  email: profile.email,
                  role: m.role as Role,
                  apps: (access ?? []).filter((a) => a.user_id === m.user_id).map((a) => a.app),
                }}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
