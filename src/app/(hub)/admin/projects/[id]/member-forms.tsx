"use client";

import { useActionState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import type { AppInfo } from "@/lib/apps";
import { ROLE_LABELS, ROLES, type Role } from "@/lib/roles";
import { addMember, removeMember, updateMember, type FormState } from "../actions";

function RoleSelect({ defaultValue, id }: { defaultValue?: Role; id?: string }) {
  return (
    <NativeSelect id={id} name="role" defaultValue={defaultValue ?? "staff"} required>
      {ROLES.map((r) => (
        <option key={r} value={r}>
          {ROLE_LABELS[r]}
        </option>
      ))}
    </NativeSelect>
  );
}

function AppCheckboxes({ apps, checked }: { apps: AppInfo[]; checked: (slug: string) => boolean }) {
  return (
    <div className="flex flex-wrap gap-3">
      {apps.map((app) => (
        <label key={app.slug} className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="apps"
            value={app.slug}
            defaultChecked={checked(app.slug)}
            className="size-4 accent-primary"
          />
          {app.name}
        </label>
      ))}
    </div>
  );
}

export function AddMemberForm({
  projectId,
  users,
  apps,
}: {
  projectId: string;
  users: { id: string; label: string }[];
  apps: AppInfo[];
}) {
  const [state, action, pending] = useActionState<FormState, FormData>(addMember, {});
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) formRef.current?.reset();
  }, [state]);

  if (users.length === 0) {
    return <p className="text-sm text-muted-foreground">Every user is already a member. Create more users on the Users page.</p>;
  }

  return (
    <form ref={formRef} action={action} className="grid gap-4">
      <input type="hidden" name="project_id" value={projectId} />
      <div className="grid gap-4 sm:grid-cols-[2fr_1fr]">
        <div className="grid gap-2">
          <Label htmlFor="user_id">User</Label>
          <NativeSelect id="user_id" name="user_id" required defaultValue="">
            <option value="" disabled>
              Choose a user…
            </option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.label}
              </option>
            ))}
          </NativeSelect>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="new_role">Role</Label>
          <RoleSelect id="new_role" />
        </div>
      </div>
      <div className="grid gap-2">
        <span className="text-sm font-medium">Apps</span>
        <AppCheckboxes apps={apps} checked={() => true} />
      </div>
      <div className="flex items-center gap-4">
        <Button type="submit" disabled={pending}>
          {pending ? "Adding…" : "Add member"}
        </Button>
        {state.error && <p className="text-sm text-destructive">{state.error}</p>}
        {state.success && <p className="text-sm text-green-600">{state.success}</p>}
      </div>
    </form>
  );
}

export function MemberRow({
  projectId,
  member,
  apps,
}: {
  projectId: string;
  member: { userId: string; name: string | null; email: string; role: Role; apps: string[] };
  apps: AppInfo[];
}) {
  const [state, action, pending] = useActionState<FormState, FormData>(updateMember, {});

  return (
    <div className="grid gap-3 border-b p-4 last:border-b-0 md:grid-cols-[1.5fr_1fr_1.5fr_auto] md:items-center">
      <div className="min-w-0">
        <div className="truncate font-medium">{member.name ?? member.email}</div>
        {member.name && <div className="truncate text-sm text-muted-foreground">{member.email}</div>}
      </div>
      <form id={`m-${member.userId}`} action={action} className="contents">
        <input type="hidden" name="project_id" value={projectId} />
        <input type="hidden" name="user_id" value={member.userId} />
        <RoleSelect defaultValue={member.role} />
        <AppCheckboxes apps={apps} checked={(slug) => member.apps.includes(slug)} />
      </form>
      <div className="flex items-center gap-2">
        <Button type="submit" form={`m-${member.userId}`} size="sm" disabled={pending}>
          {pending ? "Saving…" : "Save"}
        </Button>
        <form
          action={removeMember}
          onSubmit={(e) => {
            if (!window.confirm(`Remove ${member.name ?? member.email} from this project?`)) e.preventDefault();
          }}
        >
          <input type="hidden" name="project_id" value={projectId} />
          <input type="hidden" name="user_id" value={member.userId} />
          <Button type="submit" size="sm" variant="ghost" className="text-destructive">
            Remove
          </Button>
        </form>
        {state.error && <span className="text-sm text-destructive">{state.error}</span>}
        {state.success && <span className="text-sm text-green-600">{state.success}</span>}
      </div>
    </div>
  );
}
