import { useEffect, useState } from "react";
import { ShieldCheck, AlertTriangle, PlusCircle, Edit3, Trash2, User } from "lucide-react";
import { AdminPageShell } from "@/components/educert/AdminPageShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  fetchAllUsers,
  createUser,
  updateUser,
  deleteUser,
  type UserRecord,
  type UserPagination,
  type UserRole,
} from "@/lib/users";

const userRoles: UserRole[] = ["ADMIN", "TRAINER", "STUDENT"];

export default function UserManagement() {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [pagination, setPagination] = useState<UserPagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | UserRole>("all");

  const [showUserModal, setShowUserModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingUser, setEditingUser] = useState<UserRecord | null>(null);
  const [firstName, setFirstName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("STUDENT");
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchUsers(1, "", "all", pageSize);
  }, []);

  const fetchUsers = async (
    page: number = 1,
    search: string = "",
    roleValue: "all" | UserRole = "all",
    size?: number,
  ) => {
    try {
      setLoading(true);
      const limit = size ?? pageSize;
      const response = await fetchAllUsers(page, limit, search, roleValue);
      setUsers(response.users);
      setPagination(response.pagination);
      setCurrentPage(page);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load users");
      setTimeout(() => setError(""), 4000);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    fetchUsers(1, value, roleFilter, pageSize);
  };

  const handleRoleFilterChange = (value: "all" | UserRole) => {
    setRoleFilter(value);
    fetchUsers(1, searchTerm, value, pageSize);
  };

  const openCreateModal = () => {
    setIsEditing(false);
    setEditingUser(null);
    setFirstName("");
    setMiddleName("");
    setLastName("");
    setEmail("");
    setPassword("");
    setRole("STUDENT");
    setShowUserModal(true);
  };

  const openEditModal = (user: UserRecord) => {
    setIsEditing(true);
    setEditingUser(user);
    setFirstName(user.first_name);
    setMiddleName(user.middle_name ?? "");
    setLastName(user.last_name);
    setEmail(user.email);
    setPassword("");
    setRole(user.role);
    setShowUserModal(true);
  };

  const closeModal = () => {
    setShowUserModal(false);
    setIsEditing(false);
    setEditingUser(null);
  };

  const handleSaveUser = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      setActionLoading(true);
      if (isEditing && editingUser) {
        const payload: Record<string, unknown> = {
          first_name: firstName,
          middle_name: middleName || null,
          last_name: lastName,
          email,
          role,
        };
        if (password.trim().length > 0) {
          payload.password = password;
        }
        await updateUser(editingUser.id, payload);
        setSuccessMessage("User updated successfully.");
      } else {
        await createUser({ first_name: firstName, middle_name: middleName || undefined, last_name: lastName, email, password, role });
        setSuccessMessage("User created successfully.");
      }
      closeModal();
      setTimeout(() => setSuccessMessage(""), 4000);
      fetchUsers(currentPage, searchTerm, roleFilter, pageSize);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save user.");
      setTimeout(() => setError(""), 4000);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteUser = async (userId: number) => {
    try {
      setActionLoading(true);
      await deleteUser(userId);
      setSuccessMessage("User deleted successfully.");
      setTimeout(() => setSuccessMessage(""), 4000);
      fetchUsers(currentPage, searchTerm, roleFilter, pageSize);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to delete user.");
      setTimeout(() => setError(""), 4000);
    } finally {
      setActionLoading(false);
    }
  };

  const pageFrom = pagination ? (pagination.page - 1) * pagination.limit + 1 : 0;
  const pageTo = pagination ? Math.min(pagination.total, pagination.page * pagination.limit) : 0;

  return (
    <AdminPageShell withSidebar searchPlaceholder="Search users...">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-extrabold leading-tight md:text-5xl">User Management</h1>
          <p className="mt-2 text-muted-foreground">Manage admins, trainers and trainees from a single admin panel.</p>
        </div>
        <div className="flex gap-3">
          <Button onClick={openCreateModal}>
            <PlusCircle className="h-4 w-4" /> Create New User
          </Button>
        </div>
      </div>

      {error && (
        <div className="mt-6 flex items-center gap-3 rounded-lg bg-red-50 p-4 text-sm text-red-800">
          <AlertTriangle className="h-5 w-5" />
          {error}
        </div>
      )}

      {successMessage && (
        <div className="mt-6 flex items-center gap-3 rounded-lg bg-green-50 p-4 text-sm text-green-800">
          <Badge variant="default">Success</Badge>
          <span>{successMessage}</span>
        </div>
      )}

      <div className="mt-8 flex flex-wrap items-center gap-4">
        <div className="flex gap-2 flex-wrap">
          <Button
            variant={roleFilter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => handleRoleFilterChange("all")}
          >
            All ({users.length})
          </Button>
          <Button
            variant={roleFilter === "ADMIN" ? "default" : "outline"}
            size="sm"
            onClick={() => handleRoleFilterChange("ADMIN")}
          >
            Admins
          </Button>
          <Button
            variant={roleFilter === "TRAINER" ? "default" : "outline"}
            size="sm"
            onClick={() => handleRoleFilterChange("TRAINER")}
          >
            Trainers
          </Button>
          <Button
            variant={roleFilter === "STUDENT" ? "default" : "outline"}
            size="sm"
            onClick={() => handleRoleFilterChange("STUDENT")}
          >
            Trainees
          </Button>
        </div>
        <Input
          placeholder="Search users..."
          value={searchTerm}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="max-w-xs"
        />
        
      </div>

      <div className="mt-6 rounded-2xl bg-card shadow-[var(--shadow-card)] overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <p className="text-muted-foreground">Loading users...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="p-8 text-center">
            <ShieldCheck className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No users found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-6 py-4 text-sm font-semibold">No.</th>
                  <th className="px-6 py-4 text-sm font-semibold">Name</th>
                  <th className="px-6 py-4 text-sm font-semibold">Email</th>
                  <th className="px-6 py-4 text-sm font-semibold">Role</th>
                  <th className="px-6 py-4 text-sm font-semibold">Joined</th>
                  <th className="px-6 py-4 text-sm font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {users.map((user, index) => (
                  <tr key={user.id} className="hover:bg-muted/30">
                    <td className="px-6 py-4 text-sm">{pagination ? pageFrom + index : index + 1}</td>
                    <td className="px-6 py-4 text-sm font-medium">{user.name}</td>
                    <td className="px-6 py-4 text-sm">{user.email}</td>
                    <td className="px-6 py-4">
                      <Badge variant={user.role === "ADMIN" ? "default" : user.role === "TRAINER" ? "secondary" : "outline"}>
                        {user.role}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-2">
                        <Button size="sm" variant="outline" onClick={() => openEditModal(user)}>
                          <Edit3 className="h-3.5 w-3.5" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="outline" className="text-destructive border-destructive hover:bg-destructive/10">
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete user</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete {user.name}? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteUser(user.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 bg-muted/50 border-t">
            <div className="text-sm text-muted-foreground">
              Showing {pageFrom} to {pageTo} of {pagination.total} users
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Label className="text-sm">Per page</Label>
                <Select value={String(pageSize)} onValueChange={(val) => { const n = Number(val); setPageSize(n); setCurrentPage(1); fetchUsers(1, searchTerm, roleFilter, n); }}>
                  <SelectTrigger className="w-24 h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[10, 25, 50, 100].map((n) => (
                      <SelectItem key={n} value={String(n)}>
                        {n}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchUsers(Math.max(1, currentPage - 1), searchTerm, roleFilter, pageSize)}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, index) => {
                    const pageNumber = Math.max(1, Math.min(pagination.totalPages - 4, currentPage - 2)) + index;
                    if (pageNumber > pagination.totalPages) {
                      return null;
                    }
                    return (
                      <Button
                        key={pageNumber}
                        variant={pageNumber === currentPage ? "default" : "outline"}
                        size="sm"
                        onClick={() => fetchUsers(pageNumber, searchTerm, roleFilter, pageSize)}
                      >
                        {pageNumber}
                      </Button>
                    );
                  })}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchUsers(Math.min(pagination.totalPages, currentPage + 1), searchTerm, roleFilter, pageSize)}
                  disabled={currentPage === pagination.totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      <Dialog open={showUserModal} onOpenChange={setShowUserModal}>
        <DialogContent className="max-w-lg w-full">
          <DialogHeader>
            <DialogTitle>{isEditing ? "Edit User" : "Create New User"}</DialogTitle>
            <DialogDescription>
              {isEditing ? "Update user details and optionally change the password." : "Add a new admin, trainer, or trainee."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveUser} className="grid gap-4 py-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="user-first-name">First name</Label>
                <Input
                  id="user-first-name"
                  value={firstName}
                  onChange={(event) => setFirstName(event.target.value)}
                  placeholder="Jane"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="user-middle-name">Middle name</Label>
                <Input
                  id="user-middle-name"
                  value={middleName}
                  onChange={(event) => setMiddleName(event.target.value)}
                  placeholder="A."
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="user-last-name">Last name</Label>
                <Input
                  id="user-last-name"
                  value={lastName}
                  onChange={(event) => setLastName(event.target.value)}
                  placeholder="Doe"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="user-email">Email address</Label>
                <Input
                  id="user-email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="jane.doe@example.com"
                  required
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="user-role">Role</Label>
                <Select value={role} onValueChange={(value) => setRole(value as UserRole)}>
                  <SelectTrigger id="user-role">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    {userRoles.map((roleOption) => (
                      <SelectItem key={roleOption} value={roleOption}>
                        {roleOption}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="user-password">Password</Label>
                <Input
                  id="user-password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder={isEditing ? "Leave blank to keep password" : "Create a password"}
                  required={!isEditing}
                />
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <Button type="button" variant="outline" onClick={closeModal}>
                Cancel
              </Button>
              <Button type="submit" disabled={actionLoading}>
                {actionLoading ? "Saving..." : isEditing ? "Save changes" : "Create user"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </AdminPageShell>
  );
}
