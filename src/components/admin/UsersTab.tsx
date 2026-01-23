import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface User {
  id: string;
  email: string;
  full_name: string | null;
  role: string;
  created_at: string;
  onboarding_completed: boolean;
}

export default function UsersTab() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);

  useEffect(() => {
    fetchCurrentUserRole();
    fetchUsers();
  }, []);

  // 🔒 Get logged-in user role
  const fetchCurrentUserRole = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { data } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    setCurrentUserRole(data?.role ?? null);
  };

  // 📥 Fetch all users (admins included)
  const fetchUsers = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("profiles")
      .select(
        "id, email, full_name, role, created_at, onboarding_completed"
      )
      .order("created_at", { ascending: false });

    if (!error && data) setUsers(data);
    setLoading(false);
  };

  // 🔁 Promote / Demote (ADMIN ONLY)
  const toggleRole = async (userId: string, role: string) => {
    if (currentUserRole !== "admin") return;

    const newRole = role === "admin" ? "user" : "admin";

    const { error } = await supabase
      .from("profiles")
      .update({ role: newRole })
      .eq("id", userId);

    if (!error) fetchUsers();
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1246C9] mx-auto" />
          <p className="mt-2 text-[#5B6B8A]">Loading users...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex justify-between items-center">
        <CardTitle>All Users ({users.length})</CardTitle>
        <Button size="sm" variant="outline" onClick={fetchUsers}>
          Refresh
        </Button>
      </CardHeader>

      <CardContent>
        <div className="overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead className="hidden md:table-cell">Name</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden lg:table-cell">Joined</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {users.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">{u.email}</TableCell>

                  <TableCell className="hidden md:table-cell">
                    {u.full_name || "—"}
                  </TableCell>

                  <TableCell>
                    <Badge
                      className={
                        u.role === "admin"
                          ? "bg-[#FFD84D] text-[#0B1F3B]"
                          : ""
                      }
                    >
                      {u.role}
                    </Badge>
                  </TableCell>

                  <TableCell>
                    <Badge
                      variant={
                        u.onboarding_completed ? "outline" : "secondary"
                      }
                    >
                      {u.onboarding_completed
                        ? "Active"
                        : "Onboarding"}
                    </Badge>
                  </TableCell>

                  <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                    {new Date(u.created_at).toLocaleDateString()}
                  </TableCell>

                  <TableCell>
                    {currentUserRole === "admin" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => toggleRole(u.id, u.role)}
                      >
                        {u.role === "admin" ? "Demote" : "Promote"}
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
