import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle, PlusCircle, Edit3, Trash2, Search, Users } from "lucide-react";
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
  type UserRoleCounts,
} from "@/lib/users";

const userRoles: UserRole[] = ["ADMIN", "TRAINER", "STUDENT"];
const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];
const EMPTY_COUNTS: UserRoleCounts = { all: 0, ADMIN: 0, TRAINER: 0, STUDENT: 0 };

export default function UserManagement() {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [pagination, setPagination] = useState<UserPagination | null>(null);
  const [counts, setCounts] = useState<UserRoleCounts>(EMPTY_COUNTS);
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
      // Tab badges come from the server so they stay stable while switching tabs
      // and still reflect the active search term.
      setCounts(response.counts ?? EMPTY_COUNTS);
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

  return (
    <AdminPageShell withSidebar searchPlaceholder="Search users...">
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">User Management</h1>
          <p className="admin-page-subtitle">Manage admins, trainers and trainees from a single admin panel.</p>
        </div>
        <Button onClick={openCreateModal}>
          <PlusCircle className="h-4 w-4" /> Create New User
        </Button>
      </div>

      {error && (
        <div className="mt-6 flex items-start gap-3 rounded-xl border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMessage && (
        <div className="mt-6 flex items-start gap-3 rounded-xl border border-success/20 bg-success/5 p-4 text-sm text-success">
          <CheckCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      <div className="admin-toolbar mt-6 justify-between">
        <div className="admin-segmented">
          <button type="button" data-active={roleFilter === "all"} onClick={() => handleRoleFilterChange("all")}>
            All ({counts.all})
          </button>
          <button type="button" data-active={roleFilter === "ADMIN"} onClick={() => handleRoleFilterChange("ADMIN")}>
            Admins ({counts.ADMIN})
          </button>
          <button type="button" data-active={roleFilter === "TRAINER"} onClick={() => handleRoleFilterChange("TRAINER")}>
            Trainers ({counts.TRAINER})
          </button>
          <button type="button" data-active={roleFilter === "STUDENT"} onClick={() => handleRoleFilterChange("STUDENT")}>
            Trainees ({counts.STUDENT})
          </button>
        </div>
        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="admin-search-input pr-9"
          />
        </div>
      </div>

      <div className="admin-card mt-6">
        {loading ? (
          <div className="admin-empty-state">
            <p className="text-sm text-muted-foreground">Loading users...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="admin-empty-state">
            <div className="admin-empty-icon">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">No users found</p>
              <p className="mt-1 text-sm text-muted-foreground">Try adjusting your search or filters.</p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>No.</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Joined</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user, index) => (
                  <tr key={user.id}>
                    <td className="text-muted-foreground">{pagination ? pagination.from + index : index + 1}</td>
                    <td className="font-medium text-foreground">{user.name}</td>
                    <td className="text-muted-foreground">{user.email}</td>
                    <td>
                      <Badge variant={user.role === "ADMIN" ? "info" : user.role === "TRAINER" ? "warning" : "muted"}>
                        {user.role}
                      </Badge>
                    </td>
                    <td className="text-muted-foreground">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="outline" className="h-8 w-8 p-0" onClick={() => openEditModal(user)} title="Edit user">
                          <Edit3 className="h-3.5 w-3.5" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="outline" className="h-8 w-8 border-destructive/40 p-0 text-destructive hover:bg-destructive/10 hover:text-destructive" title="Delete user">
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

        {pagination && !loading && pagination.total > 0 && (
          <div className="admin-pagination-bar">
            <div className="text-sm text-muted-foreground">
              Showing <span className="font-medium text-foreground">{pagination.from}</span> to{" "}
              <span className="font-medium text-foreground">{pagination.to}</span> of{" "}
              <span className="font-medium text-foreground">{pagination.total}</span> users
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Label className="text-sm text-muted-foreground">Per page</Label>
                <Select value={String(pageSize)} onValueChange={(val) => { const n = Number(val); setPageSize(n); fetchUsers(1, searchTerm, roleFilter, n); }}>
                  <SelectTrigger className="w-24 h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PAGE_SIZE_OPTIONS.map((n) => (
                      <SelectItem key={n} value={String(n)}>
                        {n}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {pagination.totalPages > 1 && (
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
              )}
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
          <form onSubmit={handleSaveUser} className="grid gap-5">
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

            <div className="admin-dialog-footer">
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
