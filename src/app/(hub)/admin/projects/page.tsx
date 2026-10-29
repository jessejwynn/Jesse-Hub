import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { requireSuperAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { CreateProjectForm } from "./create-project-form";

export default async function ProjectsPage() {
  await requireSuperAdmin();
  const supabase = await createClient();
  const { data: projects } = await supabase
    .from("projects")
    .select("id, name, code, project_members (count)")
    .order("name");

  return (
    <div className="grid gap-6">
      <h1 className="text-xl font-semibold">Projects</h1>

      <Card>
        <CardHeader>
          <CardTitle>Create project</CardTitle>
        </CardHeader>
        <CardContent>
          <CreateProjectForm />
        </CardContent>
      </Card>

      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Members</TableHead>
              <TableHead className="w-0" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {projects?.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-muted-foreground">
                  No projects yet.
                </TableCell>
              </TableRow>
            )}
            {projects?.map((p) => (
              <TableRow key={p.id}>
                <TableCell className="font-mono">{p.code}</TableCell>
                <TableCell>
                  <Link href={`/admin/projects/${p.id}`} className="underline-offset-4 hover:underline">
                    {p.name}
                  </Link>
                </TableCell>
                <TableCell>{(p.project_members as unknown as { count: number }[])[0]?.count ?? 0}</TableCell>
                <TableCell>
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/admin/projects/${p.id}`}>Manage</Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
