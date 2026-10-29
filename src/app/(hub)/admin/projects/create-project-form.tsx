"use client";

import { useActionState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createProject, type FormState } from "./actions";

export function CreateProjectForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(createProject, {});
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={action} className="grid gap-4 sm:grid-cols-[2fr_1fr_auto] sm:items-end">
      <div className="grid gap-2">
        <Label htmlFor="name">Name</Label>
        <Input id="name" name="name" placeholder="e.g. MCI Logistics" required />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="code">Code</Label>
        <Input id="code" name="code" placeholder="e.g. MCI" className="uppercase placeholder:normal-case" maxLength={20} required />
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Creating…" : "Create project"}
      </Button>
      {(state.error || state.success) && (
        <p className={`text-sm sm:col-span-3 ${state.error ? "text-destructive" : "text-green-600"}`}>
          {state.error ?? state.success}
        </p>
      )}
    </form>
  );
}
