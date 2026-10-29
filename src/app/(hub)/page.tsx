import Link from "next/link";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { APPS } from "@/lib/apps";

// App launcher. Filtering by app_access comes with step 2 (projects & members).
export default function HomePage() {
  return (
    <div className="grid gap-4">
      <h1 className="text-xl font-semibold">Apps</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {APPS.map((app) => (
          <Link key={app.slug} href={`/${app.slug}`}>
            <Card className="transition-colors hover:bg-accent">
              <CardHeader>
                <CardTitle>{app.name}</CardTitle>
                <CardDescription>{app.description}</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
