import { useState, useEffect } from "react";
import { CheckCircle2, AlertCircle, Clock, Users } from "lucide-react";
import { PageShell } from "@/components/educert/PageShell";
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

interface Module {
  id: number;
  name: string;
  description: string;
  scheduled_date: string;
  has_assessment: boolean;
}

interface Attendance {
  status: string;
  marked_at: string;
}

interface Assessment {
  score?: number;
  passed?: boolean;
  graded_at?: string;
}

export default function ModuleDetail({ moduleId }: { moduleId: number }) {
  const [module, setModule] = useState<Module | null>(null);
  const [attendance, setAttendance] = useState<Attendance | null>(null);
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [attendanceToken, setAttendanceToken] = useState("");
  const [submittingAttendance, setSubmittingAttendance] = useState(false);

  useEffect(() => {
    fetchModuleDetails();
  }, [moduleId]);

  const fetchModuleDetails = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/modules/${moduleId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Failed to fetch module details");
      const data = await response.json();
      setModule(data.module);
      setAttendance(data.attendance || null);
      setAssessment(data.assessment || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load module details");
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAttendance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!attendanceToken) {
      setError("Please enter the attendance token");
      return;
    }

    try {
      setSubmittingAttendance(true);
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/modules/${moduleId}/attendance/qr`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ token: attendanceToken }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to mark attendance");
      }

      setSuccessMessage("Attendance marked successfully!");
      setAttendanceToken("");
      setTimeout(() => fetchModuleDetails(), 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to mark attendance");
    } finally {
      setSubmittingAttendance(false);
    }
  };

  if (loading) {
    return (
      <PageShell>
        <p className="text-muted-foreground">Loading module details...</p>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <div className="mx-auto max-w-2xl">
        {/* Module Header */}
        {module && (
          <div className="mb-6 rounded-xl border border-border bg-card p-6">
            <h1 className="text-3xl font-bold">{module.name}</h1>
            <p className="mt-2 text-muted-foreground">{module.description}</p>
            <div className="mt-4 flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                <span>{new Date(module.scheduled_date).toLocaleDateString()}</span>
              </div>
              {module.has_assessment && (
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary" />
                  <span>Assessment included</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 flex items-center gap-3 rounded-lg bg-red-50 p-4 text-sm text-red-800">
            <AlertCircle className="h-5 w-5" />
            {error}
          </div>
        )}

        {/* Success Message */}
        {successMessage && (
          <div className="mb-6 flex items-center gap-3 rounded-lg bg-green-50 p-4 text-sm text-green-800">
            <CheckCircle2 className="h-5 w-5" />
            {successMessage}
          </div>
        )}

        {/* Attendance Section */}
        <div className="mb-6 rounded-xl border border-border bg-card p-6">
          <h2 className="mb-4 text-xl font-bold">Attendance</h2>

          {attendance ? (
            <div className="flex items-center gap-3 rounded-lg bg-green-50 p-4">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <div>
                <p className="font-semibold text-green-900">Marked as {attendance.status}</p>
                <p className="text-sm text-green-800">
                  {new Date(attendance.marked_at).toLocaleString()}
                </p>
              </div>
            </div>
          ) : (
            <Dialog>
              <DialogTrigger asChild>
                <Button className="w-full">Mark Attendance</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Mark Attendance</DialogTitle>
                  <DialogDescription>
                    Enter the token provided by your trainer
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleMarkAttendance} className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="token">Attendance Token</Label>
                    <Input
                      id="token"
                      value={attendanceToken}
                      onChange={(e) => setAttendanceToken(e.target.value)}
                      placeholder="Enter token from trainer"
                      disabled={submittingAttendance}
                    />
                  </div>
                  <Button type="submit" disabled={submittingAttendance} className="w-full">
                    {submittingAttendance ? "Submitting..." : "Submit Attendance"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* Assessment Section */}
        {module?.has_assessment && (
          <div className="rounded-xl border border-border bg-card p-6">
            <h2 className="mb-4 text-xl font-bold">Assessment</h2>

            {assessment?.score !== undefined ? (
              <div className="space-y-4">
                <div className="rounded-lg bg-muted p-4">
                  <p className="text-sm text-muted-foreground">Your Score</p>
                  <p className="mt-1 text-3xl font-bold">{assessment.score}%</p>
                </div>
                <div className={`rounded-lg p-4 ${assessment.passed ? "bg-green-50" : "bg-red-50"}`}>
                  <p
                    className={`font-semibold ${
                      assessment.passed ? "text-green-900" : "text-red-900"
                    }`}
                  >
                    {assessment.passed ? "Passed" : "Not Passed"}
                  </p>
                  <p
                    className={`text-sm ${
                      assessment.passed ? "text-green-800" : "text-red-800"
                    }`}
                  >
                    {assessment.graded_at
                      ? `Graded on ${new Date(assessment.graded_at).toLocaleDateString()}`
                      : "Pending grading"}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground">Assessment pending</p>
            )}
          </div>
        )}
      </div>
    </PageShell>
  );
}
