"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { createTemplate, type FormState } from "./actions";

export function NewTemplateForm({
  code,
  templates,
}: {
  code: string;
  templates: { id: string; name: string }[];
}) {
  const [state, action, pending] = useActionState<FormState, FormData>(createTemplate, {});

  return (
    <form action={action} className="grid gap-4 sm:grid-cols-[2fr_1.5fr_auto] sm:items-end">
      <input type="hidden" name="code" value={code} />
      <div className="grid gap-2">
        <Label htmlFor="template_name">Name</Label>
        <Input id="template_name" name="name" placeholder="e.g. Export order" required />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="copy_from">Start from</Label>
        <NativeSelect id="copy_from" name="copy_from" defaultValue="">
          <option value="">Blank template</option>
          {templates.map((t) => (
            <option key={t.id} value={t.id}>
              Copy of {t.name}
            </option>
          ))}
        </NativeSelect>
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Creating…" : "Create template"}
      </Button>
      {state.error && <p className="text-sm text-destructive sm:col-span-3">{state.error}</p>}
    </form>
  );
}
