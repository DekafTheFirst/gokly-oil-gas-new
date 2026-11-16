import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BookOpen,
  Building2,
  Check,
  ExternalLink,
  Loader2,
  Search,
  Trash2,
  UserPlus,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
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
import {
  fetchOrganizationTrainees,
  type OrganizationTrainee,
} from "@/lib/organizations";
import { fetchTrainingBatches, type TrainingBatchListItem } from "@/lib/training-batches";

export function EngagementTraineesTab({
  engagement,
  onTraineesChanged,
}: {
  engagement: EngagementRecord;
  onTraineesChanged?: () => void;
}) {
  const navigate = useNavigate();
  const items = engagement.items ?? [];
  const organizationId = engagement.organization_id || null;
  const [trainees, setTrainees] = useState<EngagementTrainee[]>([]);
  const [loading, setLoading] = useState(true);
  const [poolTrainees, setPoolTrainees] = useState<OrganizationTrainee[]>([]);
  const [poolLoading, setPoolLoading] = useState(false);
  const [batchesByCourse, setBatchesByCourse] = useState<Record<number, TrainingBatchListItem[]>>({});
  const [pickerItem, setPickerItem] = useState<EngagementItem | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [pickerSearch, setPickerSearch] = useState("");
  const [pickerBatchId, setPickerBatchId] = useState("");
  const [adding, setAdding] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

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

  // Load the organization's trainee pool once — the picker sources from it.
  useEffect(() => {
    if (!organizationId) return;
    let cancelled = false;
    setPoolLoading(true);
    fetchOrganizationTrainees(organizationId)
      .then((response) => {
        if (!cancelled) setPoolTrainees(response.trainees);
      })
      .catch((error) => {
        console.error("Failed to load organization trainee pool:", error);
        if (!cancelled) toast.error("Failed to load the organization's trainee pool");
      })
      .finally(() => {
        if (!cancelled) setPoolLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [organizationId]);

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

  const openPicker = (item: EngagementItem) => {
    setPickerItem(item);
    setSelectedIds(new Set());
    setPickerSearch("");
    setPickerBatchId("");
  };

  const pickerCandidates = useMemo(() => {
    if (!pickerItem) return [];
    const onRoster = new Set(traineesForItem(pickerItem.id).map((t) => t.email.toLowerCase()));
    const q = pickerSearch.trim().toLowerCase();
    return poolTrainees.filter((trainee) => {
      if (onRoster.has(trainee.email.toLowerCase())) return false;
      if (!q) return true;
      return trainee.full_name.toLowerCase().includes(q) || trainee.email.toLowerCase().includes(q);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pickerItem, poolTrainees, trainees, pickerSearch]);

  const toggleSelected = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleConfirmPicker = async () => {
    if (!pickerItem || !selectedIds.size) return;
    const batchId = pickerBatchId || null;
    setAdding(true);
    try {
      const response = await addEngagementTrainees(
        engagement.id,
        Array.from(selectedIds).map((organizationTraineeId) => ({
          organization_trainee_id: organizationTraineeId,
          engagement_item_id: pickerItem.id,
          batch_id: batchId,
        })),
      );
      if (response.added > 0) {
        toast.success(`Added ${response.added} ${response.added === 1 ? "trainee" : "trainees"} to ${pickerItem.course_name}.`);
      }
      if (response.skipped.length) {
        toast.warning(`${response.skipped.length} selection${response.skipped.length === 1 ? "" : "s"} skipped — first reason: ${response.skipped[0].reason}`);
      }
      setPickerItem(null);
      await loadTrainees();
      onTraineesChanged?.();
    } catch (error) {
      console.error("Failed to add trainees:", error);
      toast.error(error instanceof Error ? error.message : "Failed to add trainees");
    } finally {
      setAdding(false);
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
      onTraineesChanged?.();
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
        <p className="mt-1 text-xs text-slate-500">Add training items to the engagement before assigning trainees.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {organizationId ? (
        <div className="flex flex-col gap-3 rounded-xl border border-emerald-200 bg-emerald-50/60 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="flex items-center gap-2 text-xs text-emerald-900">
            <Building2 className="h-4 w-4 shrink-0" />
            Trainees are picked from {engagement.organization_name || "this organization's"} trainee pool.
          </p>
          <Button
            size="sm"
            variant="outline"
            className="shrink-0 border-emerald-300 bg-white"
            onClick={() => navigate(`/training/organization-management/${encodeURIComponent(organizationId)}?tab=trainees`)}
          >
            <ExternalLink className="h-4 w-4" />
            Manage org trainees
          </Button>
        </div>
      ) : (
        <div className="rounded-xl border border-amber-200 bg-amber-50/60 px-4 py-3 text-xs text-amber-900">
          This engagement has no organization linked, so there is no trainee pool to pick from. Link an organization
          to the engagement to manage trainees here.
        </div>
      )}

      {items.map((item) => {
        const itemTrainees = traineesForItem(item.id);
        const agreed = Number(item.agreed_quantity) || 0;
        const courseBatches = item.course_id ? batchesByCourse[item.course_id] ?? [] : [];
        const remaining = Math.max(0, agreed - itemTrainees.length);
        const fill = agreed ? Math.min(100, Math.round((itemTrainees.length / agreed) * 100)) : 0;

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
                    {itemTrainees.length} of {agreed} agreed trainees assigned
                    {remaining > 0 ? ` · ${remaining} remaining` : " · quota full"}
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Button
                  size="sm"
                  disabled={!organizationId || (agreed > 0 && remaining === 0) || poolLoading}
                  onClick={() => openPicker(item)}
                >
                  {poolLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
                  Add trainees
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
                <Users className="h-6 w-6 text-slate-300" />
                <p className="text-sm font-semibold text-slate-700">No trainees assigned yet</p>
                <p className="max-w-lg text-xs leading-relaxed text-slate-500">
                  Pick trainees from the organization's pool. Anyone with a portal account is enrolled automatically;
                  others stay on the roster until they activate their account.
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

      <Dialog open={Boolean(pickerItem)} onOpenChange={(open) => { if (!open && !adding) setPickerItem(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add trainees — {pickerItem?.course_name}</DialogTitle>
            <DialogDescription>
              Select people from {engagement.organization_name || "the organization"}'s trainee pool. Trainees already
              on this item's roster are hidden.
            </DialogDescription>
          </DialogHeader>
          {pickerItem?.course_id && (batchesByCourse[pickerItem.course_id] ?? []).length > 0 && (
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold text-slate-600">Batch</span>
              <Select value={pickerBatchId || "none"} onValueChange={(value) => setPickerBatchId(value === "none" ? "" : value)}>
                <SelectTrigger className="h-9 flex-1 text-xs" aria-label="Batch for selected trainees">
                  <SelectValue placeholder="No batch (roster only)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No batch (roster only)</SelectItem>
                  {(batchesByCourse[pickerItem.course_id] ?? []).map((batch) => (
                    <SelectItem key={batch.id} value={batch.id}>
                      {batch.batch_code} — {batch.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search name or email..."
                value={pickerSearch}
                onChange={(event) => setPickerSearch(event.target.value)}
                className="border-slate-200 bg-white pl-9"
              />
            </div>
            <div className="max-h-72 overflow-y-auto rounded-md border border-slate-200 bg-white">
            {pickerCandidates.length === 0 ? (
              <p className="px-4 py-8 text-center text-xs text-slate-500">
                {poolLoading ? "Loading trainee pool…" : "No matching trainees in the pool."}
              </p>
            ) : (
              pickerCandidates.map((trainee) => {
                const checked = selectedIds.has(trainee.id);
                return (
                  <label
                    key={trainee.id}
                    className={`flex cursor-pointer items-center gap-3 border-b border-slate-100 px-3 py-2.5 text-sm last:border-b-0 hover:bg-slate-50 ${checked ? "bg-emerald-50/60" : ""}`}
                  >
                    <Checkbox checked={checked} onCheckedChange={() => toggleSelected(trainee.id)} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold text-slate-900">{trainee.full_name}</span>
                      <span className="block truncate text-xs text-slate-500">{trainee.email}</span>
                    </span>
                    {trainee.account_active ? (
                      <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-800">Active</Badge>
                    ) : trainee.invite_pending ? (
                      <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-800">Invite pending</Badge>
                    ) : (
                      <Badge variant="outline" className="border-slate-200 bg-slate-50 text-slate-600">No account</Badge>
                    )}
                    {checked && <Check className="h-4 w-4 text-emerald-600" />}
                  </label>
                );
              })
            )}
            </div>
          </div>
          <p className="text-xs text-slate-500">
            {selectedIds.size} selected
            {pickerBatchId ? " · will be assigned to the selected batch" : ""}
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPickerItem(null)} disabled={adding}>
              Cancel
            </Button>
            <Button onClick={() => void handleConfirmPicker()} disabled={adding || !selectedIds.size}>
              {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
              {adding ? "Adding…" : `Add ${selectedIds.size || ""} trainee${selectedIds.size === 1 ? "" : "s"}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
