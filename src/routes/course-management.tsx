import { useState, useEffect } from "react";
import { AlertTriangle, CheckCircle, PlusCircle, Search, BookOpen } from "lucide-react";
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
import { fetchAdminCourses, createCourse, type CourseRecord, type CoursePagination } from "@/lib/courses";

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

export default function CourseManagement() {
  const [courses, setCourses] = useState<CourseRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [pagination, setPagination] = useState<CoursePagination | null>(null);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [tier, setTier] = useState("");
  const [hours, setHours] = useState("");
  const [image, setImage] = useState("");

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    fetchCourseList(1, "", pageSize);
  }, []);

  // placeholder for background tasks (batch polling removed)

  const fetchCourseList = async (page: number = 1, search: string = "", size?: number) => {
    try {
      setLoading(true);
      const limit = size ?? pageSize;
      const response = await fetchAdminCourses(page, limit, search);
      setCourses(response.courses || []);
      setPagination(response.pagination);
      setCurrentPage(page);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load courses");
      setTimeout(() => setError(""), 4000);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const payload = { title, category, description, tier, hours, image };
      const course = await createCourse(payload);
      setSuccessMessage("Course created successfully.");
      setTimeout(() => setSuccessMessage(""), 3000);
      setShowCreateModal(false);
      setTitle(""); setCategory(""); setDescription(""); setTier(""); setHours("");
      fetchCourseList(1, searchTerm, pageSize);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create course");
      setTimeout(() => setError(""), 4000);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    fetchCourseList(1, value, pageSize);
  };

  const handlePageChange = (page: number) => {
    fetchCourseList(page, searchTerm, pageSize);
  };

  // course management only: removed certificate bulk helpers

  return (
    <AdminPageShell withSidebar searchPlaceholder="Search courses...">
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Course Management</h1>
          <p className="admin-page-subtitle">Create and manage the courses available for enrollment.</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <PlusCircle className="h-4 w-4" /> Create New Course
        </Button>
      </div>

      {/* Error/Success Messages */}
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

      {/* Filters */}
      <div className="admin-toolbar mt-6">
        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search courses..."
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="admin-search-input pr-9"
          />
        </div>
      </div>

      {/* Courses Table */}
      <div className="admin-card mt-6">
        {loading ? (
          <div className="admin-empty-state">
            <p className="text-sm text-muted-foreground">Loading courses...</p>
          </div>
        ) : courses.length === 0 ? (
          <div className="admin-empty-state">
            <div className="admin-empty-icon">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">No courses yet</p>
              <p className="mt-1 text-sm text-muted-foreground">Create your first course to get started.</p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Category</th>
                  <th>Tier</th>
                  <th>Hours</th>
                  <th>Created</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {courses.map((course) => (
                  <tr key={course.id}>
                    <td className="font-medium text-foreground">{course.title}</td>
                    <td className="text-muted-foreground">{course.category}</td>
                    <td>
                      {course.tier ? <Badge variant="muted">{course.tier}</Badge> : <span className="text-muted-foreground">—</span>}
                    </td>
                    <td className="text-muted-foreground">{course.hours}</td>
                    <td className="text-muted-foreground">{new Date(course.created_at).toLocaleDateString()}</td>
                    <td className="text-right">
                      <Button size="sm" variant="outline" className="h-8" onClick={() => { window.location.href = `/courses/${course.id}`; }}>
                        View
                      </Button>
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
              <span className="font-medium text-foreground">{pagination.total}</span> courses
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <Label className="text-sm text-muted-foreground">Per page</Label>
                <Select
                  value={String(pageSize)}
                  onValueChange={(val) => {
                    const n = Number(val);
                    setPageSize(n);
                    fetchCourseList(1, searchTerm, n);
                  }}
                >
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
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage - 1)}
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
                          onClick={() => handlePageChange(pageNumber)}
                        >
                          {pageNumber}
                        </Button>
                      );
                    })}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage + 1)}
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
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-lg w-full">
          <DialogHeader>
            <DialogTitle>Create New Course</DialogTitle>
            <DialogDescription>Add a new course. Modules and materials can be added later.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateCourse} className="grid gap-5">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="course-title">Title</Label>
                <Input id="course-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Course title" required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="course-category">Category</Label>
                <Input id="course-category" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="e.g., Safety" />
              </div>
              <div className="grid gap-2 md:col-span-2">
                <Label htmlFor="course-description">Description</Label>
                <Input id="course-description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Short description" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="course-tier">Tier</Label>
                <Input id="course-tier" value={tier} onChange={(e) => setTier(e.target.value)} placeholder="e.g., Beginner" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="course-hours">Hours</Label>
                <Input id="course-hours" value={hours} onChange={(e) => setHours(e.target.value)} placeholder="e.g., 8" />
              </div>
              {/* Image upload will be added later; leaving placeholder out for now */}
            </div>

            <div className="admin-dialog-footer">
              <Button type="button" variant="outline" onClick={() => setShowCreateModal(false)}>Cancel</Button>
              <Button type="submit" disabled={loading}>{loading ? "Creating..." : "Create course"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </AdminPageShell>
  );
}