import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { getAppProjects } from "@/lib/access";
import { ROLE_LABELS } from "@/lib/roles";

export default async function OrderTrailPage() {
  const projects = await getAppProjects("ordertrail");

  return (
    <div className="grid gap-4">
      <h1 className="text-xl font-semibold">OrderTrail</h1>
      {projects.length === 0 ? (
        <p className="text-muted-foreground">You aren&apos;t in any OrderTrail projects yet.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => (
            <Link key={p.id} href={`/ordertrail/${p.code}`}>
              <Card className="transition-colors hover:bg-accent">
                <CardHeader className="flex flex-row items-center justify-between gap-2">
                  <div className="min-w-0">
                    <CardTitle className="truncate">{p.name}</CardTitle>
                    <p className="font-mono text-sm text-muted-foreground">{p.code}</p>
                  </div>
                  <Badge variant="secondary">{p.role ? ROLE_LABELS[p.role] : "Super admin"}</Badge>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
