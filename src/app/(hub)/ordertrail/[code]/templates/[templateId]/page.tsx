import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { requireAppProject } from "@/lib/access";
import type { Template } from "@/lib/ordertrail/templates";
import { ROLE_LABELS, type Role } from "@/lib/roles";
import { createClient } from "@/lib/supabase/server";
import { TemplateEditor } from "./template-editor";

export default async function TemplatePage({
  params,
}: {
  params: Promise<{ code: string; templateId: string }>;
}) {
  const { code, templateId } = await params;
  const project = await requireAppProject("ordertrail", code);
  const supabase = await createClient();

  const { data } = await supabase
    .from("sop_templates")
    .select("id, name, description, sop_template_items (id, name, position, required, notes, upload_roles)")
    .eq("id", templateId)
    .eq("project_id", project.id)
    .maybeSingle();
  if (!data) notFound();

  const template: Template = {
    id: data.id,
    name: data.name,
    description: data.description,
    items: [...(data.sop_template_items ?? [])]
      .sort((a, b) => a.position - b.position)
      .map((i) => ({
        id: i.id,
        name: i.name,
        required: i.required,
        notes: i.notes ?? "",
        upload_roles: i.upload_roles as Role[] | null,
      })),
  };

  return (
    <div className="grid gap-6">
      <div>
        <Link href={`/ordertrail/${project.code}/templates`} className="text-sm text-muted-foreground hover:underline">
          ← Templates
        </Link>
        <h1 className="text-xl font-semibold">{template.name}</h1>
        {!project.canManage && template.description && (
          <p className="text-sm text-muted-foreground">{template.description}</p>
        )}
      </div>

      {project.canManage ? (
        <TemplateEditor code={project.code} template={template} />
      ) : (
        <ol className="grid gap-2">
          {template.items.length === 0 && <p className="text-sm text-muted-foreground">No slots yet.</p>}
          {template.items.map((item, i) => (
            <li key={item.id} className="grid gap-1 rounded-md border p-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm text-muted-foreground">{i + 1}.</span>
                <span className="font-medium">{item.name}</span>
                {item.required ? <Badge variant="secondary">Required</Badge> : <Badge variant="outline">Optional</Badge>}
                {item.upload_roles && (
                  <Badge variant="outline">
                    Upload: {item.upload_roles.map((r) => ROLE_LABELS[r]).join(", ")} only
                  </Badge>
                )}
              </div>
              {item.notes && <p className="pl-5 text-sm text-muted-foreground">{item.notes}</p>}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
