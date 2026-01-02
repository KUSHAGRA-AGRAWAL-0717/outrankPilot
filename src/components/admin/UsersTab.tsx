// UsersTab.tsx
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable } from "../DataTable";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { toast } from "sonner";

interface User {
  id: string;
  email: string;
  full_name: string | null;
  role: string;
  projects_count: number;
  total_tokens?: number;
  subscription_status: string | null;
  created_at: string;
}

export default function UsersTab() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    full_name: "",
    role: "user"
  });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const { data, error } = await supabase.rpc("get_users_with_stats");
      
      if (error) {
        console.error("Error loading users:", error);
        toast.error("Failed to load users");
        return;
      }
      
      setUsers(
  (data || []).map(u => ({
    ...u,
    total_tokens: u.total_tokens ?? 0,
    projects_count: u.projects_count ?? 0
  }))
);

    } catch (err) {
      console.error("Error:", err);
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const updateRole = async (userId: string, role: string) => {
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ role })
        .eq("id", userId);

      if (error) throw error;

      toast.success("Role updated successfully");
      loadUsers();
    } catch (err) {
      console.error("Error updating role:", err);
      toast.error("Failed to update role");
    }
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setEditForm({
      full_name: user.full_name || "",
      role: user.role
    });
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingUser) return;

    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: editForm.full_name,
          role: editForm.role
        })
        .eq("id", editingUser.id);

      if (error) throw error;

      toast.success("User updated successfully");
      setIsEditDialogOpen(false);
      setEditingUser(null);
      loadUsers();
    } catch (err) {
      console.error("Error updating user:", err);
      toast.error("Failed to update user");
    }
  };

  const filteredUsers = users.filter(u => 
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    u.full_name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">User Management ({users.length})</h2>
        <Input 
          placeholder="Search users..." 
          value={search} 
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
      </div>

      <DataTable
        columns={[
          { 
            key: "email", 
            header: "Email", 
            cell: (row) => (
              <div className="font-medium">{row.email}</div>
            )
          },
          { 
            key: "full_name", 
            header: "Name", 
            cell: (row) => row.full_name || "—" 
          },
          { 
            key: "role", 
            header: "Role", 
            cell: (row) => (
              <Select 
                value={row.role} 
                onValueChange={(v) => updateRole(row.id, v)}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            )
          },
          { 
            key: "subscription_status", 
            header: "Plan", 
            cell: (row) => (
              <Badge variant={row.subscription_status === "active" ? "default" : "secondary"}>
                {row.subscription_status === "active" ? "Pro" : "Free"}
              </Badge>
            )
          },
          { 
            key: "projects_count", 
            header: "Projects",
            cell: (row) => (
              <div className="text-center">{row.projects_count}</div>
            )
          },
          { 
            key: "total_tokens", 
            header: "AI Tokens",
            cell: (row) => (
              <div className="text-center">
                {(row.total_tokens ?? 0).toLocaleString()}
              </div>
            )
          },
          { 
            key: "actions", 
            header: "Actions",
            cell: (row) => (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => handleEditUser(row)}
              >
                Edit
              </Button>
            )
          }
        ]}
        data={filteredUsers}
        loading={loading}
      />

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update user information for {editingUser?.email}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="full_name">Full Name</Label>
              <Input
                id="full_name"
                value={editForm.full_name}
                onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                placeholder="Enter full name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select 
                value={editForm.role} 
                onValueChange={(v) => setEditForm({ ...editForm, role: v })}
              >
                <SelectTrigger id="role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={editingUser?.email || ""} disabled />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Projects</Label>
                <Input value={editingUser?.projects_count || 0} disabled />
              </div>
              <div className="space-y-2">
                <Label>AI Tokens</Label>
                <Input
  value={(editingUser?.total_tokens ?? 0).toLocaleString()}
  disabled
/>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button 
              variant="outline" 
              onClick={() => setIsEditDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleSaveEdit}>
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}