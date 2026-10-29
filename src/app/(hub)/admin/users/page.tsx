import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { requireSuperAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { CreateUserForm } from "./create-user-form";

export default async function UsersPage() {
  await requireSuperAdmin();
  const supabase = await createClient();
  const { data: users } = await supabase
    .from("profiles")
    .select("id, email, name, is_super_admin, created_at")
    .order("created_at");

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
              <TableHead>Created</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users?.map((u) => (
              <TableRow key={u.id}>
                <TableCell>{u.name ?? "—"}</TableCell>
                <TableCell>{u.email}</TableCell>
                <TableCell>{u.is_super_admin ? "Super admin" : "User"}</TableCell>
                <TableCell>{new Date(u.created_at).toLocaleDateString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
