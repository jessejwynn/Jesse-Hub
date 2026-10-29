import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAuthInfo } from "@/lib/admin-users";
import { requireSuperAdmin } from "@/lib/auth";
import { ROLE_LABELS, type Role } from "@/lib/roles";
import { createClient } from "@/lib/supabase/server";
import { DangerZone, DetailsForm, PasswordForm } from "./user-forms";

export default async function UserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const me = await requireSuperAdmin();
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: user }, { data: memberships }, authInfo] = await Promise.all([
    supabase.from("profiles").select("id, name, email, is_super_admin").eq("id", id).maybeSingle(),
    supabase.from("project_members").select("role, projects (id, name, code)").eq("user_id", id),
    getAuthInfo(id),
  ]);
  if (!user) notFound();

  const isSelf = user.id === me.id;
  const label = user.name ?? user.email;

  return (
    <div className="grid gap-6">
      <div>
        <Link href="/admin/users" className="text-sm text-muted-foreground hover:underline">
          ← Users
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-xl font-semibold">{label}</h1>
          {isSelf && <Badge variant="secondary">You</Badge>}
          {authInfo?.deactivated && <Badge variant="destructive">Deactivated</Badge>}
        </div>
        <p className="text-sm text-muted-foreground">
          Last sign-in:{" "}
          {authInfo?.lastSignIn ? new Date(authInfo.lastSignIn).toLocaleString() : "never"}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Details</CardTitle>
        </CardHeader>
        <CardContent>
          <DetailsForm key={`${user.name}-${user.email}-${user.is_super_admin}`} user={user} isSelf={isSelf} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Projects</CardTitle>
        </CardHeader>
        <CardContent>
          {!memberships?.length ? (
            <p className="text-sm text-muted-foreground">Not in any projects. Add them from a project&apos;s Manage page.</p>
          ) : (
            <ul className="grid gap-2">
              {memberships.map((m) => {
                const p = m.projects as unknown as { id: string; name: string; code: string };
                return (
                  <li key={p.id} className="flex items-center justify-between gap-4 text-sm">
                    <Link href={`/admin/projects/${p.id}`} className="hover:underline">
                      {p.name} <span className="font-mono text-muted-foreground">{p.code}</span>
                    </Link>
                    <Badge variant="secondary">{ROLE_LABELS[m.role as Role]}</Badge>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Reset password</CardTitle>
        </CardHeader>
        <CardContent>
          <PasswordForm userId={user.id} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Deactivate or delete</CardTitle>
        </CardHeader>
        <CardContent>
          <DangerZone
            userId={user.id}
            label={label}
            deactivated={authInfo?.deactivated ?? false}
            isSelf={isSelf}
          />
        </CardContent>
      </Card>
    </div>
  );
}
