import type { Role } from "@/lib/roles";

// Roles that can upload documents at all. Viewers never can.
export const UPLOAD_ROLES = ["manager", "staff"] as const satisfies readonly Role[];

export type TemplateItem = {
  id?: string;
  name: string;
  required: boolean;
  notes: string;
  upload_roles: Role[] | null; // null = anyone who can upload
};

export type Template = {
  id: string;
  name: string;
  description: string | null;
  items: TemplateItem[];
};
