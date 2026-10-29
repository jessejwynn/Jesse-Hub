import Link from "next/link";
import { Badge } from "@/components/ui/badge";
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
    <div className="grid gap-4">
      <div>
        <Link href="/ordertrail" className="text-sm text-muted-foreground hover:underline">
          ← OrderTrail
        </Link>
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-semibold">{project.name}</h1>
          <Badge variant="secondary">{project.role ? ROLE_LABELS[project.role] : "Super admin"}</Badge>
        </div>
      </div>
      <p className="text-muted-foreground">SOP templates and orders arrive in steps 3 and 4.</p>
    </div>
  );
}
