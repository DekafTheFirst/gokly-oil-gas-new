import { useState, useEffect } from "react";
import { Users, BookOpen, CheckCircle2, AlertCircle, Plus, ChevronDown } from "lucide-react";
import { AdminPageShell } from "@/components/educert/AdminPageShell";
import { useAuth } from "@/context/AuthContext";
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

interface Course {
  id: number;
  title: string;
  category: string;
  description: string;
  tier: string;
  hours: string;
  created_at: string;
}

interface Module {
  id: number;
  name: string;
  description: string;
  scheduled_date: string;
  has_assessment: boolean;
}

interface Trainer {
  id: number;
  name: string;
  email: string;
}

export default function Trainer() {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [expandedCourse, setExpandedCourse] = useState<number | null>(null);

  // Form states
  const [newModule, setNewModule] = useState({
    name: "",
    description: "",
    scheduled_date: "",
    has_assessment: false,
  });
  const [qrToken, setQrToken] = useState("");
  const [showQrModal, setShowQrModal] = useState(false);

  // Fetch trainer's assigned courses
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        const response = await fetch("/api/courses/trainer/my-courses", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) throw new Error("Failed to fetch courses");
        const data = await response.json();
        setCourses(data.courses || []);
        setError("");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load courses");
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  // Fetch course details with modules
  const fetchCourseDetails = async (courseId: number) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/courses/${courseId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Failed to fetch course details");
      const data = await response.json();
      setSelectedCourse(data.course);
      setModules(data.modules || []);
      setTrainers(data.trainers || []);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load course details");
    }
  };

  // Create module
  const handleCreateModule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourse || !newModule.name || !newModule.scheduled_date) {
      setError("Please fill in all required fields");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/modules", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          course_id: selectedCourse.id,
          ...newModule,
        }),
      });

      if (!response.ok) throw new Error("Failed to create module");
      setSuccessMessage("Module created successfully");
      setNewModule({
        name: "",
        description: "",
        scheduled_date: "",
        has_assessment: false,
      });
      fetchCourseDetails(selectedCourse.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create module");
    }
  };

  // Generate QR attendance token
  const handleGenerateQrToken = async (moduleId: number) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/modules/${moduleId}/qr-token`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error("Failed to generate QR token");
      const data = await response.json();
      setQrToken(data.token);
      setShowQrModal(true);
      setSuccessMessage("QR token generated (valid for 60 seconds)");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate QR token");
    }
  };

  if (loading) {
    return (
      <AdminPageShell withSidebar searchPlaceholder="Search courses...">
        <p className="text-muted-foreground">Loading courses...</p>
      </AdminPageShell>
    );
  }

  return (
    <AdminPageShell withSidebar searchPlaceholder="Search courses...">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-extrabold leading-tight md:text-5xl">Trainer Dashboard</h1>
          <p className="mt-2 text-muted-foreground">Manage your courses, modules, and student attendance.</p>
        </div>
      </div>

      {error && (
        <div className="mt-6 flex items-center gap-3 rounded-lg bg-red-50 p-4 text-sm text-red-800">
          <AlertCircle className="h-5 w-5" />
          {error}
        </div>
      )}

      {successMessage && (
        <div className="mt-6 flex items-center gap-3 rounded-lg bg-green-50 p-4 text-sm text-green-800">
          <CheckCircle2 className="h-5 w-5" />
          {successMessage}
        </div>
      )}

      {/* Assigned Courses */}
      <section className="mt-8 rounded-2xl bg-card p-6 shadow-[var(--shadow-card)]">
        <div className="mb-6">
          <h2 className="text-2xl font-bold">Your Courses</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {courses.length} course{courses.length !== 1 ? "s" : ""} assigned to you
          </p>
        </div>

        {courses.length === 0 ? (
          <p className="text-muted-foreground">No courses assigned yet.</p>
        ) : (
          <div className="space-y-3">
            {courses.map((course) => (
              <div key={course.id} className="rounded-lg border border-border bg-background p-4">
                <button
                  onClick={() => {
                    setExpandedCourse(expandedCourse === course.id ? null : course.id);
                    if (expandedCourse !== course.id) {
                      fetchCourseDetails(course.id);
                    }
                  }}
                  className="flex w-full items-center justify-between gap-3"
                >
                  <div className="flex items-start gap-4">
                    <div className="grid h-10 w-10 place-items-center rounded-md bg-primary/10">
                      <BookOpen className="h-5 w-5 text-primary" />
                    </div>
                    <div className="text-left">
                      <h3 className="font-semibold">{course.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {course.category} • {course.hours} hours
                      </p>
                    </div>
                  </div>
                  <ChevronDown
                    className={`h-5 w-5 transition-transform ${
                      expandedCourse === course.id ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {expandedCourse === course.id && (
                  <div className="mt-4 space-y-4 border-t border-border pt-4">
                    {/* Modules List */}
                    <div>
                      <h4 className="font-semibold">Modules</h4>
                      {modules.length === 0 ? (
                        <p className="mt-2 text-sm text-muted-foreground">No modules created yet.</p>
                      ) : (
                        <div className="mt-3 space-y-2">
                          {modules.map((module) => (
                            <div
                              key={module.id}
                              className="flex items-center justify-between rounded-md bg-muted p-3"
                            >
                              <div>
                                <p className="font-medium">{module.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {new Date(module.scheduled_date).toLocaleDateString()}
                                  {module.has_assessment && " • Has Assessment"}
                                </p>
                              </div>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleGenerateQrToken(module.id)}
                              >
                                QR Token
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Create Module Dialog */}
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button className="w-full" variant="outline">
                          <Plus className="h-4 w-4" /> Add Module
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                          <DialogTitle>Create Module</DialogTitle>
                          <DialogDescription>Add a new module to {course.title}</DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleCreateModule} className="grid gap-4 py-4">
                          <div className="grid gap-2">
                            <Label htmlFor="module-name">Module Name</Label>
                            <Input
                              id="module-name"
                              value={newModule.name}
                              onChange={(e) =>
                                setNewModule((prev) => ({ ...prev, name: e.target.value }))
                              }
                              placeholder="e.g., Introduction to Well Control"
                            />
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor="module-description">Description</Label>
                            <Input
                              id="module-description"
                              value={newModule.description}
                              onChange={(e) =>
                                setNewModule((prev) => ({ ...prev, description: e.target.value }))
                              }
                              placeholder="Brief module description"
                            />
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor="module-date">Scheduled Date</Label>
                            <Input
                              id="module-date"
                              type="datetime-local"
                              value={newModule.scheduled_date}
                              onChange={(e) =>
                                setNewModule((prev) => ({
                                  ...prev,
                                  scheduled_date: e.target.value,
                                }))
                              }
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <input
                              id="has-assessment"
                              type="checkbox"
                              checked={newModule.has_assessment}
                              onChange={(e) =>
                                setNewModule((prev) => ({
                                  ...prev,
                                  has_assessment: e.target.checked,
                                }))
                              }
                              className="h-4 w-4 rounded border-border"
                            />
                            <Label htmlFor="has-assessment">Include Assessment</Label>
                          </div>
                          <Button type="submit" className="w-full">
                            Create Module
                          </Button>
                        </form>
                      </DialogContent>
                    </Dialog>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* QR Token Modal */}
      <Dialog open={showQrModal} onOpenChange={setShowQrModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>QR Attendance Token</DialogTitle>
            <DialogDescription>Valid for 60 seconds. Generate a new one if expired.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="rounded-lg border border-border bg-muted p-4">
              <p className="text-center text-sm font-medium text-muted-foreground">Token</p>
              <p className="font-mono text-center text-xl font-bold">{qrToken}</p>
            </div>
            <p className="text-xs text-muted-foreground">
              Share this token with students or display it for scanning.
            </p>
          </div>
          <Button onClick={() => setShowQrModal(false)} className="w-full">
            Close
          </Button>
        </DialogContent>
      </Dialog>
    </AdminPageShell>
  );
}
