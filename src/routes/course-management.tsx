import { useState, useEffect } from "react";
import { ShieldCheck, AlertTriangle, X, CheckCircle, User, PlusCircle } from "lucide-react";
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
import { fetchCourses, createCourse, type CourseRecord } from "@/lib/courses";

export default function CourseManagement() {
  const [courses, setCourses] = useState<CourseRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [tier, setTier] = useState("");
  const [hours, setHours] = useState("");
  const [image, setImage] = useState("");

  // Filters
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchCourseList();
  }, []);

  // placeholder for background tasks (batch polling removed)

  const fetchCourseList = async () => {
    try {
      setLoading(true);
      const data = await fetchCourses();
      setCourses(data || []);
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
      fetchCourseList();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create course");
      setTimeout(() => setError(""), 4000);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
  };

  const handlePageChange = (page: number) => {
    // placeholder for future pagination
  };

  // course management only: removed certificate bulk helpers

  return (
    <AdminPageShell withSidebar searchPlaceholder="Search courses...">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-extrabold leading-tight md:text-5xl">Course Management</h1>
          <p className="mt-2 text-muted-foreground">Manage Courses</p>
        </div>
        <div className="flex gap-3">
          <Button onClick={() => setShowCreateModal(true)}>
            <PlusCircle className="h-4 w-4" /> Create New Course
          </Button>
        </div>
        </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="mt-6 flex items-center gap-3 rounded-lg bg-red-50 p-4 text-sm text-red-800">
          <AlertTriangle className="h-5 w-5" />
          {error}
        </div>
      )}

      {successMessage && (
        <div className="mt-6 flex items-center gap-3 rounded-lg bg-green-50 p-4 text-sm text-green-800">
          <CheckCircle className="h-5 w-5" />
          {successMessage}
        </div>
      )}

      {/* Filters */}
      <div className="mt-8 flex flex-wrap gap-4">
        <Input
          placeholder="Search courses..."
          value={searchTerm}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="max-w-xs"
        />
      </div>

      {/* Courses Table */}
      <div className="mt-6 rounded-2xl bg-card shadow-[var(--shadow-card)] overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <p className="text-muted-foreground">Loading certificates...</p>
          </div>
        ) : courses.length === 0 ? (
          <div className="p-8 text-center">
            <ShieldCheck className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No courses found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Title</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Category</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Tier</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Hours</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Created</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {courses.map((course) => (
                  <tr key={course.id} className="hover:bg-muted/30">
                    <td className="px-6 py-4 text-sm font-medium">{course.title}</td>
                    <td className="px-6 py-4 text-sm">{course.category}</td>
                    <td className="px-6 py-4 text-sm">{course.tier}</td>
                    <td className="px-6 py-4 text-sm">{course.hours}</td>
                    <td className="px-6 py-4 text-sm">{new Date(course.created_at).toLocaleDateString()}</td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => { window.location.href = `/courses/${course.id}`; }}>
                          View
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination placeholder for future enhancement */}
        <div className="px-6 py-4 bg-muted/50 border-t text-sm text-muted-foreground">Courses: {courses.length}</div>
      </div>
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-lg w-full">
          <DialogHeader>
            <DialogTitle>Create New Course</DialogTitle>
            <DialogDescription>Add a new course. Modules and materials can be added later.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateCourse} className="grid gap-4 py-4">
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

            <div className="flex gap-2 justify-end pt-2">
              <Button type="button" variant="outline" onClick={() => setShowCreateModal(false)}>Cancel</Button>
              <Button type="submit" disabled={loading}>{loading ? "Creating..." : "Create course"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </AdminPageShell>
  );
}