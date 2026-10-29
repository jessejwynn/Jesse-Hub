"use client";

import { useActionState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createUser, type CreateUserState } from "./actions";

export function CreateUserForm() {
  const [state, action, pending] = useActionState<CreateUserState, FormData>(createUser, {});
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={action} className="grid gap-4 sm:grid-cols-2">
      <div className="grid gap-2">
        <Label htmlFor="name">Name</Label>
        <Input id="name" name="name" />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" required />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="password">Temporary password</Label>
        <Input id="password" name="password" type="text" minLength={8} required />
      </div>
      <div className="flex items-center gap-2 sm:self-end sm:pb-2">
        <Checkbox id="is_super_admin" name="is_super_admin" />
        <Label htmlFor="is_super_admin">Super admin</Label>
      </div>
      <div className="flex items-center gap-4 sm:col-span-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Creating…" : "Create user"}
        </Button>
        {state.error && <p className="text-sm text-destructive">{state.error}</p>}
        {state.success && <p className="text-sm text-green-600">{state.success}</p>}
      </div>
    </form>
  );
}
