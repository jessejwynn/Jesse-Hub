import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getCurrentProfile } from "@/lib/auth";
import { signOut } from "@/app/login/actions";

export default async function HubLayout({ children }: { children: React.ReactNode }) {
  const profile = await getCurrentProfile();

  return (
    <div className="min-h-svh">
      <header className="border-b">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
          <Link href="/" className="font-semibold">
            Jesse Hub
          </Link>
          <nav className="flex items-center gap-2 text-sm">
            {profile.is_super_admin && (
              <>
                <Button asChild variant="ghost" size="sm">
                  <Link href="/admin/projects">Projects</Link>
                </Button>
                <Button asChild variant="ghost" size="sm">
                  <Link href="/admin/users">Users</Link>
                </Button>
              </>
            )}
            <span className="hidden text-muted-foreground sm:inline">
              {profile.name ?? profile.email}
            </span>
            <form action={signOut}>
              <Button type="submit" variant="outline" size="sm">
                Sign out
              </Button>
            </form>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
    </div>
  );
}
