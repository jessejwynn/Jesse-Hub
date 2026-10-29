"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ROLE_LABELS } from "@/lib/roles";
import { UPLOAD_ROLES, type Template, type TemplateItem } from "@/lib/ordertrail/templates";
import { deleteTemplate, saveTemplate, type FormState } from "../actions";

type Row = TemplateItem & { key: string };

let nextKey = 0;
const newKey = () => `new-${nextKey++}`;

export function TemplateEditor({ code, template }: { code: string; template: Template }) {
  const [name, setName] = useState(template.name);
  const [description, setDescription] = useState(template.description ?? "");
  const [rows, setRows] = useState<Row[]>(() =>
    template.items.map((i) => ({ ...i, key: i.id ?? newKey() })),
  );
  const [dirty, setDirty] = useState(false);
  const [state, setState] = useState<FormState>({});
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [pending, startTransition] = useTransition();

  function change(fn: (rows: Row[]) => Row[]) {
    setRows(fn);
    setDirty(true);
    setState({});
  }
  const update = (key: string, patch: Partial<Row>) =>
    change((rs) => rs.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  const move = (index: number, delta: number) =>
    change((rs) => {
      const next = [...rs];
      const [row] = next.splice(index, 1);
      next.splice(index + delta, 0, row);
      return next;
    });
  const remove = (key: string) => change((rs) => rs.filter((r) => r.key !== key));
  const add = () =>
    change((rs) => [...rs, { key: newKey(), name: "", required: true, notes: "", upload_roles: null }]);

  function toggleRole(row: Row, role: (typeof UPLOAD_ROLES)[number], on: boolean) {
    const current = row.upload_roles ?? [...UPLOAD_ROLES];
    const next = on ? [...new Set([...current, role])] : current.filter((r) => r !== role);
    update(row.key, { upload_roles: next.length === UPLOAD_ROLES.length ? null : next });
  }

  function save() {
    startTransition(async () => {
      const result = await saveTemplate(code, template.id, {
        name,
        description,
        items: rows.map(({ id, name, required, notes, upload_roles }) => ({ id, name, required, notes, upload_roles })),
      });
      setState(result);
      if (result.success) setDirty(false);
    });
  }

  function removeTemplate() {
    startTransition(async () => {
      const result = await deleteTemplate(code, template.id);
      if (result?.error) setState(result);
    });
  }

  return (
    <div className="grid gap-6">
      <div className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="name">Template name</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setDirty(true);
            }}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="description">Description (optional)</Label>
          <Input
            id="description"
            value={description}
            placeholder="When to use this template"
            onChange={(e) => {
              setDescription(e.target.value);
              setDirty(true);
            }}
          />
        </div>
      </div>

      <div className="grid gap-2">
        <h2 className="font-semibold">Document slots</h2>
        {rows.length === 0 && (
          <p className="text-sm text-muted-foreground">No slots yet. Add one for each document, e.g. PO, SO, Surat Jalan.</p>
        )}
        <ol className="grid gap-3">
          {rows.map((row, i) => {
            const roles = row.upload_roles ?? [...UPLOAD_ROLES];
            return (
              <li key={row.key} className="grid gap-3 rounded-md border p-3">
                <div className="flex items-start gap-2">
                  <span className="mt-2 w-6 shrink-0 text-right text-sm text-muted-foreground">{i + 1}.</span>
                  <Input
                    value={row.name}
                    placeholder="Document name, e.g. Purchase Order (PO)"
                    onChange={(e) => update(row.key, { name: e.target.value })}
                    aria-label={`Slot ${i + 1} name`}
                  />
                  <div className="flex shrink-0 gap-1">
                    <Button type="button" variant="ghost" size="sm" disabled={i === 0} onClick={() => move(i, -1)} aria-label="Move up">
                      ↑
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={i === rows.length - 1}
                      onClick={() => move(i, 1)}
                      aria-label="Move down"
                    >
                      ↓
                    </Button>
                    <Button type="button" variant="ghost" size="sm" className="text-destructive" onClick={() => remove(row.key)}>
                      Remove
                    </Button>
                  </div>
                </div>
                <div className="grid gap-3 pl-8">
                  <Textarea
                    value={row.notes}
                    placeholder="Notes or instructions (optional)"
                    rows={2}
                    onChange={(e) => update(row.key, { notes: e.target.value })}
                    aria-label={`Slot ${i + 1} notes`}
                  />
                  <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={row.required}
                        onChange={(e) => update(row.key, { required: e.target.checked })}
                        className="size-4 accent-primary"
                      />
                      Required
                    </label>
                    <span className="flex flex-wrap items-center gap-3">
                      <span className="text-muted-foreground">Who can upload:</span>
                      {UPLOAD_ROLES.map((role) => (
                        <label key={role} className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={roles.includes(role)}
                            onChange={(e) => toggleRole(row, role, e.target.checked)}
                            className="size-4 accent-primary"
                          />
                          {ROLE_LABELS[role]}
                        </label>
                      ))}
                    </span>
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
        <div>
          <Button type="button" variant="outline" onClick={add}>
            + Add slot
          </Button>
        </div>
      </div>

      <div className="sticky bottom-0 flex flex-wrap items-center gap-4 border-t bg-background py-3" style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}>
        <Button type="button" onClick={save} disabled={pending || !dirty}>
          {pending ? "Saving…" : "Save template"}
        </Button>
        {dirty && !state.error && <span className="text-sm text-muted-foreground">Unsaved changes</span>}
        {state.error && <span className="text-sm text-destructive">{state.error}</span>}
        {state.success && !dirty && <span className="text-sm text-green-600">{state.success}</span>}
        <div className="ml-auto flex items-center gap-2">
          {confirmDelete ? (
            <>
              <span className="text-sm">Delete this template?</span>
              <Button type="button" variant="destructive" size="sm" onClick={removeTemplate} disabled={pending}>
                Yes, delete
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={() => setConfirmDelete(false)}>
                Cancel
              </Button>
            </>
          ) : (
            <Button type="button" variant="ghost" size="sm" className="text-destructive" onClick={() => setConfirmDelete(true)}>
              Delete template
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
