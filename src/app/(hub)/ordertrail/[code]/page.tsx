import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAppProject } from "@/lib/access";
import { ROLE_LABELS } from "@/lib/roles";

export default async function OrderTrailProjectPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const project = await requireAppProject("ordertrail", code);

  return (
    <div className="grid gap-6">
      <div>
        <Link href="/ordertrail" className="text-sm text-muted-foreground hover:underline">
          ← OrderTrail
        </Link>
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-semibold">{project.name}</h1>
          <Badge variant="secondary">{project.role ? ROLE_LABELS[project.role] : "Super admin"}</Badge>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="opacity-60">
          <CardHeader>
            <CardTitle>Orders</CardTitle>
            <CardDescription>Coming in step 4.</CardDescription>
          </CardHeader>
        </Card>
        <Link href={`/ordertrail/${project.code}/templates`}>
          <Card className="h-full transition-colors hover:bg-accent">
            <CardHeader>
              <CardTitle>SOP templates</CardTitle>
              <CardDescription>
                {project.canManage ? "Create and edit the document checklists for orders." : "See which documents each order needs."}
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>
      </div>
    </div>
  );
}
