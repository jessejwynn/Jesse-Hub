// Apps hosted on this site. Each lives under /<slug>.
export type AppInfo = {
  slug: string;
  name: string;
  description: string;
};

export const APPS: AppInfo[] = [
  {
    slug: "ordertrail",
    name: "OrderTrail",
    description: "SOP checklists and documents for each order.",
  },
];

export function isAppSlug(value: unknown): value is string {
  return APPS.some((a) => a.slug === value);
}
