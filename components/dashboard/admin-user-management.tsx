"use client";

import { useCallback, useEffect, useState } from "react";
import { Search, Plus, Edit, Trash2, Users, Mail, Shield, User } from "lucide-react";

import { DetailField } from "@/components/dashboard/user-request-detail-modal";
import { PROFILE_INFO_POPUP_INNER_PANEL_CLASS } from "@/lib/profile-popup-styles";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { apiUrl } from "@/lib/api-url";
import { cn } from "@/lib/utils";

interface User {
  id: number;
  email: string;
  name: string | null;
  role: string;
  created_at?: string;
}

interface UserFormData {
  email: string;
  password: string;
  name: string;
  role: string;
}

export function AdminUserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [detailUser, setDetailUser] = useState<User | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<UserFormData>({
    email: "",
    password: "",
    name: "",
    role: "user",
  });

  // Fetch users from backend
  const fetchUsers = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      const token = localStorage.getItem("token");
      const response = await fetch(apiUrl("/api/users"), {
        headers: {
          "Authorization": token ? `Bearer ${token}` : "",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch users");
      }

      const data = await response.json();
      setUsers(data);
      setError(null);
    } catch (err) {
      console.error("Error fetching users:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch users");
    } finally {
      if (showLoading) setLoading(false);
    }
  }, []);

  // Search users
  const searchUsers = useCallback(async (query: string) => {
    if (!query.trim()) {
      await fetchUsers();
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(apiUrl(`/api/users/search/${encodeURIComponent(query)}`), {
        headers: {
          "Authorization": token ? `Bearer ${token}` : "",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to search users");
      }

      const data = await response.json();
      setUsers(data);
      setError(null);
    } catch (err) {
      console.error("Error searching users:", err);
      setError(err instanceof Error ? err.message : "Failed to search users");
    }
  }, [fetchUsers]);

  // Create or update user
  const saveUser = async () => {
    try {
      const token = localStorage.getItem("token");
      let response;

      const isEditing = Boolean(editingUser);
      if (editingUser) {
        // Update existing user
        response = await fetch(apiUrl(`/api/users/${editingUser.id}`), {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "Authorization": token ? `Bearer ${token}` : "",
          },
          body: JSON.stringify(formData),
        });
      } else {
        // Create new user (always User role)
        response = await fetch(apiUrl("/api/users"), {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": token ? `Bearer ${token}` : "",
          },
          body: JSON.stringify({ ...formData, role: "user" }),
        });
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to save user");
      }

      const savedUser = (await response.json()) as User;
      setUsers((prev) => {
        if (isEditing) {
          return prev.map((user) =>
            user.id === savedUser.id ? savedUser : user
          );
        }
        return [
          savedUser,
          ...prev.filter((user) => user.id !== savedUser.id),
        ];
      });

      // Reset form and refresh users
      setFormData({ email: "", password: "", name: "", role: "user" });
      setIsAddDialogOpen(false);
      setIsEditDialogOpen(false);
      setEditingUser(null);
      void fetchUsers(false);
    } catch (err) {
      console.error("Error saving user:", err);
      setError(err instanceof Error ? err.message : "Failed to save user");
    }
  };

  // Delete user
  const deleteUser = async (userId: number) => {
    if (!confirm("Are you sure you want to delete this user?")) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(apiUrl(`/api/users/${userId}`), {
        method: "DELETE",
        headers: {
          "Authorization": token ? `Bearer ${token}` : "",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to delete user");
      }

      fetchUsers();
    } catch (err) {
      console.error("Error deleting user:", err);
      setError(err instanceof Error ? err.message : "Failed to delete user");
    }
  };

  const openUserDetail = async (user: User) => {
    setDetailUser(user);
    setDetailError(null);
    setIsDetailDialogOpen(true);
    setDetailLoading(true);

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(apiUrl(`/api/users/${user.id}`), {
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to load user details");
      }

      const data = (await response.json()) as User;
      setDetailUser(data);
    } catch (err) {
      console.error("Error fetching user details:", err);
      setDetailError(
        err instanceof Error ? err.message : "Failed to load user details"
      );
    } finally {
      setDetailLoading(false);
    }
  };

  const closeUserDetail = () => {
    setIsDetailDialogOpen(false);
    setDetailUser(null);
    setDetailError(null);
    setDetailLoading(false);
  };

  // Open edit dialog
  const openEditDialog = (user: User) => {
    setEditingUser(user);
    setFormData({
      email: user.email,
      password: "",
      name: user.name || "",
      role: user.role,
    });
    setIsEditDialogOpen(true);
  };

  // Handle search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchUsers(searchQuery);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, searchUsers]);

  // Initial load
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage user accounts and permissions
          </p>
        </div>
        <Dialog
          open={isAddDialogOpen}
          onOpenChange={(open) => {
            setIsAddDialogOpen(open);
            if (open) {
              setEditingUser(null);
              setFormData({ email: "", password: "", name: "", role: "user" });
            }
          }}
        >
          <DialogTrigger asChild>
            <Button variant="outline" className="border-[#008B8B] text-[#008B8B] hover:bg-[#008B8B]/10">
              <Plus className="mr-2 h-4 w-4" />
              Add New User
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Add New User</DialogTitle>
              <DialogDescription>
                Create a new user account. New users are assigned the User role.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="user@example.com"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Enter password"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="John Doe"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={saveUser}
                disabled={!formData.email || !formData.password}
              >
                Create User
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search users by email or name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Error Message */}
      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-800">
          {error}
        </div>
      )}

      {/* Users Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-muted-foreground">Loading users...</div>
          </div>
        ) : users.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No Users Found</h3>
            <p className="text-muted-foreground text-center mb-4">
              {searchQuery ? "No users match your search criteria." : "No users have been created yet."}
            </p>
            {!searchQuery && (
              <Button onClick={() => setIsAddDialogOpen(true)} className="bg-[#008B8B] hover:bg-[#006b6b]">
                <Plus className="mr-2 h-4 w-4" />
                Add First User
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow className="border-slate-200 hover:bg-slate-50">
                  <TableHead className="h-auto px-5 py-4 text-[10px] font-medium leading-tight text-muted-foreground sm:text-[11px]">
                    ID
                  </TableHead>
                  <TableHead className="h-auto px-5 py-4 text-[10px] font-medium leading-tight text-muted-foreground sm:text-[11px]">
                    Name
                  </TableHead>
                  <TableHead className="h-auto px-5 py-4 text-[10px] font-medium leading-tight text-muted-foreground sm:text-[11px]">
                    Email id
                  </TableHead>
                  <TableHead className="h-auto px-5 py-4 text-[10px] font-medium leading-tight text-muted-foreground sm:text-[11px]">
                    Role
                  </TableHead>
                  <TableHead className="h-auto px-5 py-4 text-[10px] font-medium leading-tight text-muted-foreground sm:text-[11px]">
                    Created
                  </TableHead>
                  <TableHead className="h-auto px-5 py-4 text-right text-[10px] font-medium leading-tight text-muted-foreground sm:text-[11px]">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow
                    key={user.id}
                    className="border-slate-100 transition-colors hover:bg-slate-50/60"
                  >
                    <TableCell className="font-medium">{user.id}</TableCell>
                    <TableCell>
                      <button
                        type="button"
                        onClick={() => void openUserDetail(user)}
                        className={cn(
                          "inline-flex max-w-full items-center gap-2 rounded-md text-left font-medium transition-colors",
                          "text-[#008B8B] hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#008B8B]/35"
                        )}
                      >
                        <User
                          className="h-4 w-4 shrink-0 text-muted-foreground"
                          aria-hidden
                        />
                        <span className="truncate">{user.name?.trim() || "—"}</span>
                      </button>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <a
                          href={`mailto:${encodeURIComponent(user.email)}`}
                          className="truncate text-foreground no-underline hover:underline"
                        >
                          {user.email}
                        </a>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className={cn(
                        "inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium",
                        user.role === "admin" 
                          ? "bg-purple-100 text-purple-800" 
                          : "bg-blue-100 text-blue-800"
                      )}>
                        <Shield className="h-3 w-3" />
                        {user.role}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {user.created_at ? new Date(user.created_at).toLocaleDateString() : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openEditDialog(user)}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => deleteUser(user.id)}
                          className="text-red-600 hover:text-red-700 hover:border-red-300"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* User details */}
      <Dialog
        open={isDetailDialogOpen}
        onOpenChange={(open) => {
          if (!open) closeUserDetail();
        }}
      >
        <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-lg">
          <DialogHeader className="border-b border-border px-6 py-4 pr-12 text-left">
            <DialogTitle className="text-base font-bold sm:text-lg">
              User details
            </DialogTitle>
          </DialogHeader>

          <div className="px-6 py-5">
            {detailLoading ? (
              <div className="flex min-h-[8rem] items-center justify-center">
                <p className="text-sm text-muted-foreground">
                  Loading user details…
                </p>
              </div>
            ) : detailError ? (
              <p className="text-sm text-red-600">{detailError}</p>
            ) : detailUser ? (
              <section aria-label="User account information">
                <div
                  className={cn(
                    PROFILE_INFO_POPUP_INNER_PANEL_CLASS,
                    "px-4 py-4 sm:px-5 sm:py-5"
                  )}
                >
                  <dl className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-x-6 sm:gap-y-5">
                    <DetailField label="Name">
                      <span className="text-sm font-semibold text-foreground">
                        {detailUser.name?.trim() || "—"}
                      </span>
                    </DetailField>
                    <DetailField label="Email id">
                      <a
                        href={`mailto:${encodeURIComponent(detailUser.email)}`}
                        className="break-all text-sm font-medium text-[#008B8B] no-underline hover:underline"
                      >
                        {detailUser.email}
                      </a>
                    </DetailField>
                    <DetailField label="Role">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium capitalize",
                          detailUser.role === "admin"
                            ? "bg-purple-100 text-purple-800"
                            : "bg-blue-100 text-blue-800"
                        )}
                      >
                        <Shield className="h-3.5 w-3.5" aria-hidden />
                        {detailUser.role}
                      </span>
                    </DetailField>
                    <DetailField label="Created">
                      {detailUser.created_at ? (
                        <time
                          className="block text-sm font-medium text-foreground"
                          dateTime={detailUser.created_at}
                        >
                          {new Date(detailUser.created_at).toLocaleString(
                            undefined,
                            {
                              dateStyle: "medium",
                              timeStyle: "short",
                            }
                          )}
                        </time>
                      ) : (
                        <span className="text-sm font-medium text-foreground">
                          —
                        </span>
                      )}
                    </DetailField>
                  </dl>
                </div>
              </section>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update user details and permissions.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="user@example.com"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-password">Password (leave blank to keep current)</Label>
              <Input
                id="edit-password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Enter new password"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-name">Name</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="John Doe"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-role">Role</Label>
              <Select
                value={formData.role}
                onValueChange={(value) => setFormData({ ...formData, role: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={saveUser}
              disabled={!formData.email}
            >
              Update User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
