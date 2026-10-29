import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getAuthInfoMap } from "@/lib/admin-users";
import { requireSuperAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { CreateUserForm } from "./create-user-form";

export default async function UsersPage() {
  await requireSuperAdmin();
  const supabase = await createClient();
  const [{ data: users }, authInfo] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, email, name, is_super_admin, created_at")
      .order("created_at"),
    getAuthInfoMap(),
  ]);

  return (
    <div className="grid gap-6">
      <h1 className="text-xl font-semibold">Users</h1>

      <Card>
        <CardHeader>
          <CardTitle>Create user</CardTitle>
        </CardHeader>
        <CardContent>
          <CreateUserForm />
        </CardContent>
      </Card>

      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Last sign-in</TableHead>
              <TableHead className="w-0" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {users?.map((u) => {
              const info = authInfo.get(u.id);
              return (
                <TableRow key={u.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {u.name ?? "—"}
                      {info?.deactivated && <Badge variant="destructive">Deactivated</Badge>}
                    </div>
                  </TableCell>
                  <TableCell>{u.email}</TableCell>
                  <TableCell>{u.is_super_admin ? "Super admin" : "User"}</TableCell>
                  <TableCell>
                    {info?.lastSignIn ? new Date(info.lastSignIn).toLocaleDateString() : "Never"}
                  </TableCell>
                  <TableCell>
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/admin/users/${u.id}`}>Manage</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
