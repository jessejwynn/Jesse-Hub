import Link from "next/link";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getAccessibleApps } from "@/lib/access";

export default async function HomePage() {
  const apps = await getAccessibleApps();

  return (
    <div className="grid gap-4">
      <h1 className="text-xl font-semibold">Apps</h1>
      {apps.length === 0 ? (
        <p className="text-muted-foreground">
          You don&apos;t have access to any apps yet. Ask the administrator to add you to a project.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {apps.map((app) => (
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
      )}
    </div>
  );
}
