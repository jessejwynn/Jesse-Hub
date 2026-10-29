import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAppProject } from "@/lib/access";
import { createClient } from "@/lib/supabase/server";
import { NewTemplateForm } from "./new-template-form";

export default async function TemplatesPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const project = await requireAppProject("ordertrail", code);
  const supabase = await createClient();
  const { data: templates } = await supabase
    .from("sop_templates")
    .select("id, name, description, sop_template_items (count)")
    .eq("project_id", project.id)
    .order("name");

  return (
    <div className="grid gap-6">
      <div>
        <Link href={`/ordertrail/${project.code}`} className="text-sm text-muted-foreground hover:underline">
          ← {project.name}
        </Link>
        <h1 className="text-xl font-semibold">SOP templates</h1>
        <p className="text-sm text-muted-foreground">
          Each template is the list of documents an order needs. Pick one when creating an order.
        </p>
      </div>

      {project.canManage && (
        <Card>
          <CardHeader>
            <CardTitle>New template</CardTitle>
          </CardHeader>
          <CardContent>
            <NewTemplateForm code={project.code} templates={(templates ?? []).map(({ id, name }) => ({ id, name }))} />
          </CardContent>
        </Card>
      )}

      {templates?.length === 0 ? (
        <p className="text-muted-foreground">
          No templates yet.{project.canManage ? "" : " A manager needs to create one."}
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {templates?.map((t) => {
            const count = (t.sop_template_items as unknown as { count: number }[])[0]?.count ?? 0;
            return (
              <Link key={t.id} href={`/ordertrail/${project.code}/templates/${t.id}`}>
                <Card className="h-full transition-colors hover:bg-accent">
                  <CardHeader>
                    <CardTitle>{t.name}</CardTitle>
                    <CardDescription>
                      {count} {count === 1 ? "slot" : "slots"}
                      {t.description ? ` · ${t.description}` : ""}
                    </CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
