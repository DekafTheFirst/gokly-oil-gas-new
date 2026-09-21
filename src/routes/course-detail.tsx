import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AdminPageShell } from "@/components/educert/AdminPageShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, BookOpen, Clock, Users, MapPin, Calendar, Award, AlertCircle } from "lucide-react";
import { fetchCourses } from "@/lib/courses";

export default function CourseDetail() {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const [course, setCourse] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (courseId) {
      loadCourseDetail(parseInt(courseId));
    }
  }, [courseId]);

  const loadCourseDetail = async (id: number) => {
    try {
      setLoading(true);
      const courses = await fetchCourses();
      const foundCourse = courses.find(c => c.id === id);
      
      if (foundCourse) {
        setCourse(foundCourse);
      } else {
        setError("Course not found");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load course");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <AdminPageShell withSidebar>
        <div className="flex items-center justify-center min-h-[400px]">
          <p className="text-muted-foreground">Loading course details...</p>
        </div>
      </AdminPageShell>
    );
  }

  if (error || !course) {
    return (
      <AdminPageShell withSidebar>
        <div className="flex flex-col items-center justify-center min-h-[400px]">
          <AlertCircle className="h-16 w-16 text-destructive mb-4" />
          <h2 className="text-2xl font-bold text-foreground mb-2">Error</h2>
          <p className="text-muted-foreground">{error || "Course not found"}</p>
          <Button onClick={() => navigate("/training/course-management")} className="mt-4">
            Back to Course Management
          </Button>
        </div>
      </AdminPageShell>
    );
  }

  return (
    <AdminPageShell withSidebar>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="lg" onClick={() => navigate("/training/course-management")} className="h-12">
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to Courses
          </Button>
        </div>

        {/* Course Header */}
        <Card className="border-2">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <Badge variant={course.status === "PUBLISHED" ? "default" : "secondary"} className="text-sm px-3 py-1">
                    {course.status || "DRAFT"}
                  </Badge>
                  {course.code && (
                    <Badge variant="outline" className="text-sm px-3 py-1">
                      {course.code}
                    </Badge>
                  )}
                </div>
                <CardTitle className="text-3xl font-bold">{course.title}</CardTitle>
                <CardDescription className="text-base mt-2">{course.category}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {course.short_description && (
              <p className="text-base text-muted-foreground">{course.short_description}</p>
            )}
          </CardContent>
        </Card>

        {/* Course Details Grid */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card className="border-2">
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                Duration & Delivery
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-base">
                  {course.duration_value || course.hours} {course.duration_unit || "hours"}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="text-base">{course.delivery_mode || "Physical"}</span>
              </div>
              {course.tier && (
                <div className="flex items-center gap-3">
                  <Award className="h-4 w-4 text-muted-foreground" />
                  <span className="text-base">{course.tier}</span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-2">
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Class Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {course.min_class_size && course.max_class_size && (
                <div className="flex items-center gap-3">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-base">
                    {course.min_class_size} - {course.max_class_size} students
                  </span>
                </div>
              )}
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-base">Created {new Date(course.created_at).toLocaleDateString()}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Description */}
        {course.description && (
          <Card className="border-2">
            <CardHeader>
              <CardTitle className="text-xl">Course Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-base leading-relaxed">{course.description}</p>
            </CardContent>
          </Card>
        )}

        {/* Prerequisites */}
        {course.prerequisite_required && course.prerequisite_description && (
          <Card className="border-2 bg-amber-50 dark:bg-amber-950/20">
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2 text-amber-800 dark:text-amber-200">
                <AlertCircle className="h-5 w-5" />
                Prerequisites
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-base">{course.prerequisite_description}</p>
            </CardContent>
          </Card>
        )}

        {/* Settings */}
        <Card className="border-2">
          <CardHeader>
            <CardTitle className="text-xl">Course Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {course.individual_enrollment_enabled && (
                <Badge variant="default" className="text-sm px-3 py-1.5">
                  ✓ Individual Enrollment
                </Badge>
              )}
              {course.certificate_enabled && (
                <Badge variant="default" className="text-sm px-3 py-1.5">
                  ✓ Certificate Enabled
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminPageShell>
  );
}