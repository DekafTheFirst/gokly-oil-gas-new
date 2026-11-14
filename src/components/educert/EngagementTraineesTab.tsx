import { useEffect, useRef, useState } from "react";
import {
  BookOpen,
  FileUp,
  Loader2,
  Trash2,
  Upload,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  addEngagementTrainees,
  fetchEngagementTrainees,
  removeEngagementTrainee,
  updateEngagementTraineeBatch,
  type EngagementItem,
  type EngagementRecord,
  type EngagementTrainee,
} from "@/lib/engagements";
import { fetchTrainingBatches, type TrainingBatchListItem } from "@/lib/training-batches";

// Minimal CSV parser handling quoted fields and commas inside quotes.
function parseCsvLine(line: string): string[] {
  const cells: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (inQuotes) {
      if (char === '"' && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        current += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      cells.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  cells.push(current);
  return cells.map((cell) => cell.trim());
}

interface ParsedTrainee {
  full_name: string;
  email: string;
  phone?: string;
}

function parseTraineeCsv(text: string): ParsedTrainee[] {
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  if (!lines.length) return [];

  const header = parseCsvLine(lines[0]).map((cell) => cell.toLowerCase());
  const hasHeader = header.some((cell) => ["name", "full_name", "email"].includes(cell));
  const rows = hasHeader ? lines.slice(1) : lines;

  const nameIdx = hasHeader ? header.findIndex((cell) => ["name", "full_name", "trainee", "trainee_name"].includes(cell)) : 0;
  const emailIdx = hasHeader ? header.findIndex((cell) => cell === "email" || cell === "email_address") : 1;
  const phoneIdx = hasHeader ? header.findIndex((cell) => ["phone", "phone_number", "tel", "mobile"].includes(cell)) : 2;

  return rows
    .map((line) => {
      const cells = parseCsvLine(line);
      const pick = (idx: number, fallback = "") => (idx >= 0 ? cells[idx] ?? fallback : fallback);
      return {
        full_name: pick(nameIdx < 0 ? 0 : nameIdx),
        email: pick(emailIdx < 0 ? 1 : emailIdx),
        phone: phoneIdx >= 0 ? pick(phoneIdx) || undefined : undefined,
      };
    })
    .filter((row) => row.full_name || row.email);
}

export function EngagementTraineesTab({ engagement }: { engagement: EngagementRecord }) {
  const items = engagement.items ?? [];
  const [trainees, setTrainees] = useState<EngagementTrainee[]>([]);
  const [loading, setLoading] = useState(true);
  const [batchesByCourse, setBatchesByCourse] = useState<Record<number, TrainingBatchListItem[]>>({});
  const [defaultBatchByItem, setDefaultBatchByItem] = useState<Record<string, string>>({});
  const [uploadingItemId, setUploadingItemId] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const fileInputs = useRef<Record<string, HTMLInputElement | null>>({});

  const loadTrainees = async () => {
    try {
      const response = await fetchEngagementTrainees(engagement.id);
      setTrainees(response.trainees);
    } catch (error) {
      console.error("Failed to load engagement trainees:", error);
      toast.error("Failed to load the trainee roster");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchEngagementTrainees(engagement.id)
      .then((response) => {
        if (!cancelled) setTrainees(response.trainees);
      })
      .catch((error) => {
        console.error("Failed to load engagement trainees:", error);
        if (!cancelled) toast.error("Failed to load the trainee roster");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [engagement.id]);

  // Lazily fetch schedulable batches for each item's course.
  useEffect(() => {
    const courseIds = Array.from(
      new Set(items.map((item) => item.course_id).filter((id): id is number => typeof id === "number")),
    );
    courseIds.forEach((courseId) => {
      if (batchesByCourse[courseId]) return;
      fetchTrainingBatches(1, 100, "", "", String(courseId), "")
        .then((response) => {
          setBatchesByCourse((prev) => ({
            ...prev,
            [courseId]: response.batches.filter((batch) => batch.status !== "CANCELLED"),
          }));
        })
        .catch(() => {
          setBatchesByCourse((prev) => ({ ...prev, [courseId]: [] }));
        });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [engagement.id, items]);

  const traineesForItem = (itemId: string) => trainees.filter((t) => t.engagement_item_id === itemId);

  const handleFile = async (item: EngagementItem, file: File) => {
    const parsed = parseTraineeCsv(await file.text());
    if (!parsed.length) {
      toast.error("No trainee rows found in that file. Expected columns: name, email, phone.");
      return;
    }
    const batchId = defaultBatchByItem[item.id] || null;
    setUploadingItemId(item.id);
    try {
      const response = await addEngagementTrainees(
        engagement.id,
        parsed.map((row) => ({ ...row, engagement_item_id: item.id, batch_id: batchId })),
      );
      if (response.added > 0) {
        toast.success(`Added ${response.added} ${response.added === 1 ? "trainee" : "trainees"} to ${item.course_name}.`);
      }
      if (response.skipped.length) {
        toast.warning(`${response.skipped.length} row${response.skipped.length === 1 ? "" : "s"} skipped — first reason: ${response.skipped[0].reason}`);
      }
      await loadTrainees();
    } catch (error) {
      console.error("Failed to upload trainees:", error);
      toast.error(error instanceof Error ? error.message : "Failed to upload trainees");
    } finally {
      setUploadingItemId(null);
      if (fileInputs.current[item.id]) fileInputs.current[item.id]!.value = "";
    }
  };

  const handleBatchChange = async (trainee: EngagementTrainee, batchId: string) => {
    try {
      await updateEngagementTraineeBatch(engagement.id, trainee.id, batchId || null);
      setTrainees((prev) => prev.map((t) => (t.id === trainee.id ? { ...t, batch_id: batchId || null } : t)));
    } catch (error) {
      console.error("Failed to update trainee batch:", error);
      toast.error("Failed to update the trainee's batch");
    }
  };

  const handleRemove = async (trainee: EngagementTrainee) => {
    setRemovingId(trainee.id);
    try {
      await removeEngagementTrainee(engagement.id, trainee.id);
      setTrainees((prev) => prev.filter((t) => t.id !== trainee.id));
      toast.success(`${trainee.full_name} removed from the roster.`);
    } catch (error) {
      console.error("Failed to remove trainee:", error);
      toast.error("Failed to remove the trainee");
    } finally {
      setRemovingId(null);
    }
  };

  if (loading) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500 shadow-sm">
        Loading trainee roster…
      </div>
    );
  }

  if (!items.length) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-10 text-center shadow-sm">
        <Users className="mx-auto h-8 w-8 text-slate-300" />
        <p className="mt-3 text-sm font-semibold text-slate-700">No training items on this engagement</p>
        <p className="mt-1 text-xs text-slate-500">Add training items to the engagement before uploading trainees.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {items.map((item) => {
        const itemTrainees = traineesForItem(item.id);
        const agreed = Number(item.agreed_quantity) || 0;
        const courseBatches = item.course_id ? batchesByCourse[item.course_id] ?? [] : [];
        const remaining = Math.max(0, agreed - itemTrainees.length);
        const fill = agreed ? Math.min(100, Math.round((itemTrainees.length / agreed) * 100)) : 0;
        const uploading = uploadingItemId === item.id;

        return (
          <section key={item.id} className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <div className="flex min-w-0 items-start gap-3">
                <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-emerald-800">
                  <BookOpen className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="break-words text-sm font-bold text-slate-900">
                    {item.course_name || "Untitled training item"}
                  </h3>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {itemTrainees.length} of {agreed} agreed trainees uploaded
                    {remaining > 0 ? ` · ${remaining} remaining` : " · quota full"}
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {item.course_id && courseBatches.length > 0 && (
                  <Select
                    value={defaultBatchByItem[item.id] || "none"}
                    onValueChange={(value) =>
                      setDefaultBatchByItem((prev) => ({ ...prev, [item.id]: value === "none" ? "" : value }))
                    }
                  >
                    <SelectTrigger className="h-9 w-52 text-xs" aria-label={`Default batch for ${item.course_name}`}>
                      <SelectValue placeholder="No batch (roster only)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No batch (roster only)</SelectItem>
                      {courseBatches.map((batch) => (
                        <SelectItem key={batch.id} value={batch.id}>
                          {batch.batch_code} — {batch.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                <input
                  ref={(el) => { fileInputs.current[item.id] = el; }}
                  type="file"
                  accept=".csv,text/csv"
                  className="hidden"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) void handleFile(item, file);
                  }}
                />
                <Button
                  size="sm"
                  variant="outline"
                  disabled={uploading || (agreed > 0 && remaining === 0)}
                  onClick={() => fileInputs.current[item.id]?.click()}
                >
                  {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileUp className="h-4 w-4" />}
                  {uploading ? "Uploading…" : "Upload CSV"}
                </Button>
              </div>
            </div>

            <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
              <div
                className={`h-full rounded-full ${fill >= 100 ? "bg-emerald-600" : "bg-emerald-500"}`}
                style={{ width: `${agreed ? fill : 0}%` }}
              />
            </div>

            {itemTrainees.length === 0 ? (
              <div className="flex flex-col items-center gap-2 rounded-lg bg-slate-50 px-4 py-8 text-center">
                <Upload className="h-6 w-6 text-slate-300" />
                <p className="text-sm font-semibold text-slate-700">No trainees uploaded yet</p>
                <p className="max-w-lg text-xs leading-relaxed text-slate-500">
                  Upload a CSV with columns <code className="rounded bg-slate-200 px-1">full_name, email, phone</code> (a header row is optional).
                  Trainees matching an existing account are enrolled automatically; others stay on the roster until they register.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-slate-200">
                <table className="admin-table min-w-[640px]">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Phone</th>
                      <th>Batch</th>
                      <th>Status</th>
                      <th className="text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {itemTrainees.map((trainee) => (
                      <tr key={trainee.id}>
                        <td className="font-semibold">{trainee.full_name}</td>
                        <td>{trainee.email}</td>
                        <td className="text-sm text-slate-600">{trainee.phone || "—"}</td>
                        <td>
                          {item.course_id && courseBatches.length > 0 ? (
                            <Select
                              value={trainee.batch_id || "none"}
                              onValueChange={(value) => void handleBatchChange(trainee, value === "none" ? "" : value)}
                            >
                              <SelectTrigger className="h-8 w-52 text-xs" aria-label={`Batch for ${trainee.full_name}`}>
                                <SelectValue placeholder="No batch" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">No batch</SelectItem>
                                {courseBatches.map((batch) => (
                                  <SelectItem key={batch.id} value={batch.id}>
                                    {batch.batch_code} — {batch.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            <span className="text-xs text-slate-500">{trainee.batch_name || "—"}</span>
                          )}
                        </td>
                        <td>
                          {trainee.enrollment_id ? (
                            <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-800">Enrolled</Badge>
                          ) : (
                            <Badge variant="outline" className="border-slate-200 bg-slate-50 text-slate-600">Roster only</Badge>
                          )}
                        </td>
                        <td className="text-right">
                          <Button
                            size="icon"
                            variant="ghost"
                            aria-label={`Remove ${trainee.full_name}`}
                            disabled={removingId === trainee.id}
                            onClick={() => void handleRemove(trainee)}
                          >
                            {removingId === trainee.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4 text-red-600" />}
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}
