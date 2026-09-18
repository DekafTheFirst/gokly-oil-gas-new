import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle, PlusCircle, Edit3, Trash2, Search, Users, Power, PowerOff, User, Mail, Lock, Phone, MapPin, Building, Globe, Eye, EyeOff, Sparkles, MoreVertical } from "lucide-react";
import { toast } from "sonner";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  fetchAllUsers,
  createUser,
  updateUser,
  deleteUser,
  toggleUserActivation,
  type UserRecord,
  type UserPagination,
  type UserRole,
  type UserRoleCounts,
} from "@/lib/users";

const userRoles: UserRole[] = ["ADMIN", "TRAINER", "TRAINEE"];
const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];
const EMPTY_COUNTS: UserRoleCounts = { all: 0, ADMIN: 0, TRAINER: 0, TRAINEE: 0 };

export default function UserManagement() {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [pagination, setPagination] = useState<UserPagination | null>(null);
  const [counts, setCounts] = useState<UserRoleCounts>(EMPTY_COUNTS);
  const [loading, setLoading] = useState(true);
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
  const [role, setRole] = useState<UserRole>("TRAINEE");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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
      toast.error("Failed to load users", {
        description: err instanceof Error ? err.message : "Unable to fetch users"
      });
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
    setRole("TRAINEE");
    setPhone("");
    setAddress("");
    setCity("");
    setCountry("");
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
    setPhone(user.phone ?? "");
    setAddress(user.address ?? "");
    setCity(user.city ?? "");
    setCountry(user.country ?? "");
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
        if (phone.trim().length > 0) {
          payload.phone = phone;
        }
        if (address.trim().length > 0) {
          payload.address = address;
        }
        if (city.trim().length > 0) {
          payload.city = city;
        }
        if (country.trim().length > 0) {
          payload.country = country;
        }
        await updateUser(editingUser.id, payload);
        toast.success("User updated successfully");
      } else {
        await createUser({ 
          first_name: firstName, 
          middle_name: middleName || undefined, 
          last_name: lastName, 
          email, 
          password, 
          role,
          phone: phone || undefined,
          address: address || undefined,
          city: city || undefined,
          country: country || undefined,
        });
        toast.success("User created successfully");
      }
      closeModal();
      fetchUsers(currentPage, searchTerm, roleFilter, pageSize);
    } catch (err) {
      toast.error("Unable to save user", {
        description: err instanceof Error ? err.message : "Failed to save user"
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteUser = async (userId: number) => {
    try {
      setActionLoading(true);
      await deleteUser(userId);
      toast.success("User deleted successfully");
      fetchUsers(currentPage, searchTerm, roleFilter, pageSize);
    } catch (err) {
      toast.error("Unable to delete user", {
        description: err instanceof Error ? err.message : "Failed to delete user"
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleActivation = async (user: UserRecord) => {
    try {
      setActionLoading(true);
      await toggleUserActivation(user.id, !user.is_active);
      toast.success(`User ${!user.is_active ? "activated" : "deactivated"} successfully`);
      fetchUsers(currentPage, searchTerm, roleFilter, pageSize);
    } catch (err) {
      toast.error("Unable to change user status", {
        description: err instanceof Error ? err.message : "Failed to change user status"
      });
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
          <button type="button" data-active={roleFilter === "TRAINEE"} onClick={() => handleRoleFilterChange("TRAINEE")}>
            Trainees ({counts.TRAINEE})
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
                  <th>Status</th>
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
                    <td>
                      <Badge variant={user.is_active ? "success" : "destructive"}>
                        {user.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </td>
                    <td className="text-muted-foreground">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="h-8 w-8 p-0 data-[state=open]:bg-muted"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleToggleActivation(user)}>
                            {user.is_active ? (
                              <>
                                <PowerOff className="mr-2 h-4 w-4" />
                                <span>Deactivate</span>
                              </>
                            ) : (
                              <>
                                <Power className="mr-2 h-4 w-4" />
                                <span>Activate</span>
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openEditModal(user)}>
                            <Edit3 className="mr-2 h-4 w-4" />
                            <span>Edit</span>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <DropdownMenuItem className="text-destructive focus:text-destructive">
                                <Trash2 className="mr-2 h-4 w-4" />
                                <span>Delete</span>
                              </DropdownMenuItem>
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
                        </DropdownMenuContent>
                      </DropdownMenu>
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
        <DialogContent className="max-w-2xl w-full border-0 shadow-xl bg-white/95 backdrop-blur-sm">
          <DialogHeader className="space-y-2 pb-4">
            <div className="flex items-center gap-3">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg">
                {isEditing ? <Edit3 className="w-6 h-6 text-white" /> : <Sparkles className="w-6 h-6 text-white" />}
              </div>
              <div>
                <DialogTitle className="text-2xl font-bold">{isEditing ? "Edit User" : "Create New User"}</DialogTitle>
                <DialogDescription className="text-sm">
                  {isEditing ? "Update user details and optionally change the password." : "Add a new admin, trainer, or trainee to the platform."}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <form onSubmit={handleSaveUser} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="user-first-name" className="text-sm font-medium">First Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="user-first-name"
                    value={firstName}
                    onChange={(event) => setFirstName(event.target.value)}
                    placeholder="Jane"
                    className="pl-10 h-11 border-gray-200 focus:border-green-500 focus:ring-green-500/20"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="user-middle-name" className="text-sm font-medium">Middle Name</Label>
                <Input
                  id="user-middle-name"
                  value={middleName}
                  onChange={(event) => setMiddleName(event.target.value)}
                  placeholder="Optional"
                  className="h-11 border-gray-200 focus:border-green-500 focus:ring-green-500/20"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="user-last-name" className="text-sm font-medium">Last Name</Label>
                <Input
                  id="user-last-name"
                  value={lastName}
                  onChange={(event) => setLastName(event.target.value)}
                  placeholder="Doe"
                  className="h-11 border-gray-200 focus:border-green-500 focus:ring-green-500/20"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="user-email" className="text-sm font-medium">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="user-email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="jane.doe@example.com"
                    className="pl-10 h-11 border-gray-200 focus:border-green-500 focus:ring-green-500/20"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="user-phone" className="text-sm font-medium">Phone (Optional)</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="user-phone"
                    type="tel"
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                    placeholder="+1 234 567 890"
                    className="pl-10 h-11 border-gray-200 focus:border-green-500 focus:ring-green-500/20"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="user-role" className="text-sm font-medium">Role</Label>
                <Select value={role} onValueChange={(value) => setRole(value as UserRole)}>
                  <SelectTrigger id="user-role" className="h-11 border-gray-200 focus:border-green-500 focus:ring-green-500/20">
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
              <div className="space-y-2">
                <Label htmlFor="user-password" className="text-sm font-medium">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="user-password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder={isEditing ? "Leave blank to keep password" : "Create a password"}
                    className="pl-10 pr-12 h-11 border-gray-200 focus:border-green-500 focus:ring-green-500/20"
                    required={!isEditing}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-sm font-medium">Location Information (Optional)</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="user-address"
                      value={address}
                      onChange={(event) => setAddress(event.target.value)}
                      placeholder="Street address"
                      className="pl-10 h-11 border-gray-200 focus:border-green-500 focus:ring-green-500/20"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="relative">
                    <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="user-city"
                      value={city}
                      onChange={(event) => setCity(event.target.value)}
                      placeholder="City"
                      className="pl-10 h-11 border-gray-200 focus:border-green-500 focus:ring-green-500/20"
                    />
                  </div>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="user-country"
                      value={country}
                      onChange={(event) => setCountry(event.target.value)}
                      placeholder="Country"
                      className="pl-10 h-11 border-gray-200 focus:border-green-500 focus:ring-green-500/20"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t">
              <Button type="button" variant="outline" onClick={closeModal} className="h-11 px-6">
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={actionLoading}
                className="h-11 px-6 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-medium shadow-lg shadow-green-500/25 transition-all duration-200"
              >
                {actionLoading ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Saving...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    {isEditing ? "Save Changes" : "Create User"}
                    <CheckCircle className="w-4 h-4" />
                  </span>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </AdminPageShell>
  );
}
