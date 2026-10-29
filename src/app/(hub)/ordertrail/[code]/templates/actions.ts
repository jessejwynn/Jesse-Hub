"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAppProject } from "@/lib/access";
import { UPLOAD_ROLES, type TemplateItem } from "@/lib/ordertrail/templates";
import { createClient } from "@/lib/supabase/server";

export type FormState = { error?: string; success?: string };

async function requireManager(code: string) {
  const project = await requireAppProject("ordertrail", code);
  if (!project.canManage) throw new Error("Only managers can edit templates.");
  return project;
}

export async function createTemplate(_prev: FormState, formData: FormData): Promise<FormState> {
  const code = String(formData.get("code") ?? "");
  const project = await requireManager(code);
  const name = String(formData.get("name") ?? "").trim();
  const copyFrom = String(formData.get("copy_from") ?? "");
  if (!name) return { error: "Name is required." };

  const supabase = await createClient();
  const { data: template, error } = await supabase
    .from("sop_templates")
    .insert({ project_id: project.id, name })
    .select("id")
    .single();
  if (error) return { error: error.message };

  if (copyFrom) {
    const { data: source } = await supabase
      .from("sop_templates")
      .select("description, sop_template_items (name, position, required, notes, upload_roles)")
      .eq("id", copyFrom)
      .eq("project_id", project.id)
      .maybeSingle();
    if (source) {
      const items = [...(source.sop_template_items ?? [])].sort((a, b) => a.position - b.position);
      const { error: rpcError } = await supabase.rpc("save_sop_template", {
        p_template_id: template.id,
        p_name: name,
        p_description: source.description,
        p_items: items.map(({ name, required, notes, upload_roles }) => ({ name, required, notes, upload_roles })),
      });
      if (rpcError) return { error: `Template created, but copying slots failed: ${rpcError.message}` };
    }
  }

  revalidatePath(`/ordertrail/${project.code}/templates`);
  redirect(`/ordertrail/${project.code}/templates/${template.id}`);
}

function cleanItems(raw: unknown): TemplateItem[] | string {
  if (!Array.isArray(raw)) return "Invalid slots.";
  const items: TemplateItem[] = [];
  for (const r of raw) {
    const name = String(r?.name ?? "").trim();
    if (!name) return "Every slot needs a name.";
    const roles = Array.isArray(r?.upload_roles)
      ? (r.upload_roles as unknown[]).filter((x): x is (typeof UPLOAD_ROLES)[number] =>
          (UPLOAD_ROLES as readonly unknown[]).includes(x),
        )
      : null;
    if (roles && roles.length === 0) return `"${name}": pick at least one role that can upload.`;
    items.push({
      id: typeof r?.id === "string" ? r.id : undefined,
      name,
      required: r?.required !== false,
      notes: String(r?.notes ?? "").trim(),
      // Every upload role ticked = no restriction.
      upload_roles: roles && roles.length < UPLOAD_ROLES.length ? roles : null,
    });
  }
  return items;
}

export async function saveTemplate(
  code: string,
  templateId: string,
  input: { name: string; description: string; items: unknown },
): Promise<FormState> {
  const project = await requireManager(code);
  const name = input.name.trim();
  if (!name) return { error: "Template name is required." };
  const items = cleanItems(input.items);
  if (typeof items === "string") return { error: items };

  const supabase = await createClient();
  const { error } = await supabase.rpc("save_sop_template", {
    p_template_id: templateId,
    p_name: name,
    p_description: input.description,
    p_items: items,
  });
  if (error) return { error: error.message };

  revalidatePath(`/ordertrail/${project.code}/templates`);
  revalidatePath(`/ordertrail/${project.code}/templates/${templateId}`);
  return { success: "Saved." };
}

export async function deleteTemplate(code: string, templateId: string): Promise<FormState> {
  const project = await requireManager(code);
  const supabase = await createClient();
  const { error } = await supabase
    .from("sop_templates")
    .delete()
    .eq("id", templateId)
    .eq("project_id", project.id);
  if (error) return { error: error.message };

  revalidatePath(`/ordertrail/${project.code}/templates`);
  redirect(`/ordertrail/${project.code}/templates`);
}
