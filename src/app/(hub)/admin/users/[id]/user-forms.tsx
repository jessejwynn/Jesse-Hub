"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  deleteUser,
  resetPassword,
  setUserActive,
  updateUserDetails,
  type FormState,
} from "../actions";

function Message({ state }: { state: FormState }) {
  if (state.error) return <p className="text-sm text-destructive">{state.error}</p>;
  if (state.success) return <p className="text-sm text-green-600">{state.success}</p>;
  return null;
}

export function DetailsForm({
  user,
  isSelf,
}: {
  user: { id: string; name: string | null; email: string; is_super_admin: boolean };
  isSelf: boolean;
}) {
  const [state, action, pending] = useActionState<FormState, FormData>(updateUserDetails, {});

  return (
    <form action={action} className="grid gap-4">
      <input type="hidden" name="user_id" value={user.id} />
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="name">Name</Label>
          <Input id="name" name="name" defaultValue={user.name ?? ""} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" defaultValue={user.email} required />
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="is_super_admin"
          defaultChecked={user.is_super_admin}
          disabled={isSelf}
          className="size-4 accent-primary"
        />
        Super admin (can create projects and users, and sees everything)
      </label>
      {/* A disabled checkbox isn't submitted, so keep your own access explicitly. */}
      {isSelf && <input type="hidden" name="is_super_admin" value="on" />}
      <div className="flex items-center gap-4">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save"}
        </Button>
        <Message state={state} />
      </div>
    </form>
  );
}

export function PasswordForm({ userId }: { userId: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(resetPassword, {});
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={action} className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
      <input type="hidden" name="user_id" value={userId} />
      <div className="grid gap-2">
        <Label htmlFor="password">New password</Label>
        <Input id="password" name="password" type="text" minLength={8} autoComplete="off" required />
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : "Set password"}
      </Button>
      <div className="sm:col-span-2">
        <Message state={state} />
      </div>
    </form>
  );
}

export function DangerZone({
  userId,
  label,
  deactivated,
  isSelf,
}: {
  userId: string;
  label: string;
  deactivated: boolean;
  isSelf: boolean;
}) {
  const [activeState, activeAction, activePending] = useActionState<FormState, FormData>(setUserActive, {});
  const [deleteState, deleteAction, deletePending] = useActionState<FormState, FormData>(deleteUser, {});
  const [confirmText, setConfirmText] = useState("");

  if (isSelf) {
    return <p className="text-sm text-muted-foreground">You can&apos;t deactivate or delete your own account.</p>;
  }

  return (
    <div className="grid gap-6">
      <form action={activeAction} className="grid gap-2">
        <input type="hidden" name="user_id" value={userId} />
        <input type="hidden" name="active" value={deactivated ? "true" : "false"} />
        <p className="text-sm text-muted-foreground">
          {deactivated
            ? "This account is deactivated and can't sign in. Reactivating restores access to the same projects."
            : "Deactivating stops this person signing in but keeps their account, projects and history."}
        </p>
        <div className="flex items-center gap-4">
          <Button type="submit" variant="outline" disabled={activePending}>
            {deactivated ? "Reactivate account" : "Deactivate account"}
          </Button>
          <Message state={activeState} />
        </div>
      </form>

      <form action={deleteAction} className="grid gap-2">
        <input type="hidden" name="user_id" value={userId} />
        <p className="text-sm text-muted-foreground">
          Deleting removes the account and all its project memberships. This can&apos;t be undone. Type{" "}
          <span className="font-mono font-medium text-foreground">delete</span> to confirm.
        </p>
        <div className="flex flex-wrap items-center gap-4">
          <Input
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            className="max-w-40"
            aria-label={`Type delete to confirm deleting ${label}`}
          />
          <Button type="submit" variant="destructive" disabled={confirmText !== "delete" || deletePending}>
            {deletePending ? "Deleting…" : "Delete user"}
          </Button>
          <Message state={deleteState} />
        </div>
      </form>
    </div>
  );
}
