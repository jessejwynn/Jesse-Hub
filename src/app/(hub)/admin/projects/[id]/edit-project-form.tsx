"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateProject, type FormState } from "../actions";

export function EditProjectForm({ project }: { project: { id: string; name: string; code: string } }) {
  const [state, action, pending] = useActionState<FormState, FormData>(updateProject, {});

  return (
    <form action={action} className="grid gap-4 sm:grid-cols-[2fr_1fr_auto] sm:items-end">
      <input type="hidden" name="project_id" value={project.id} />
      <div className="grid gap-2">
        <Label htmlFor="project_name">Name</Label>
        <Input id="project_name" name="name" defaultValue={project.name} required />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="project_code">Code</Label>
        <Input
          id="project_code"
          name="code"
          defaultValue={project.code}
          className="uppercase"
          maxLength={20}
          required
        />
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : "Save"}
      </Button>
      {(state.error || state.success) && (
        <p className={`text-sm sm:col-span-3 ${state.error ? "text-destructive" : "text-green-600"}`}>
          {state.error ?? state.success}
        </p>
      )}
      <p className="text-xs text-muted-foreground sm:col-span-3">
        Changing the code changes this project&apos;s web address in the apps (e.g. /ordertrail/{project.code}).
      </p>
    </form>
  );
}
