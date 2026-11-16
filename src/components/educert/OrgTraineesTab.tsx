import { useEffect, useRef, useState } from "react";
import {
  Download,
  FileUp,
  Loader2,
  MailWarning,
  Search,
  Trash2,
  Upload,
  UserPlus,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import {
  addOrganizationTrainees,
  fetchOrganizationTrainees,
  previewOrganizationTrainees,
  removeOrganizationTrainee,
  resendOrganizationTraineeInvite,
  type OrganizationTrainee,
  type OrganizationTraineePreviewStatus,
} from "@/lib/organizations";

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

// Excel exports long numbers as scientific notation (e.g. 2.34801E+12).
// Expand it back to digits; note Excel may already have truncated precision,
// so the real fix is formatting the column as Text in Excel.
function normalizePhone(raw?: string): string | undefined {
  let value = (raw || "").trim();
  if (!value) return undefined;
  if (/^\d+(\.\d+)?[eE][+-]?\d+$/.test(value)) {
    const expanded = Number(value);
    if (Number.isFinite(expanded)) value = expanded.toFixed(0);
  }
  const hadPlus = value.startsWith("+");
  const digits = value.replace(/\D/g, "");
  if (!digits) return undefined;
  return hadPlus ? `+${digits}` : digits;
}

function rowsToTrainees(rows: unknown[][]): ParsedTrainee[] {
  if (!rows.length) return [];

  const header = rows[0].map((cell) => String(cell ?? "").trim().toLowerCase());
  const hasHeader = header.some((cell) => ["name", "full_name", "email"].includes(cell));
  const body = hasHeader ? rows.slice(1) : rows;

  const nameIdx = hasHeader ? header.findIndex((cell) => ["name", "full_name", "trainee", "trainee_name"].includes(cell)) : 0;
  const emailIdx = hasHeader ? header.findIndex((cell) => cell === "email" || cell === "email_address") : 1;
  const phoneIdx = hasHeader ? header.findIndex((cell) => ["phone", "phone_number", "tel", "mobile"].includes(cell)) : 2;

  return body
    .map((cells) => {
      const pick = (idx: number, fallback = "") =>
        idx >= 0 && idx < cells.length ? String(cells[idx] ?? fallback) : fallback;
      return {
        full_name: pick(nameIdx < 0 ? 0 : nameIdx).trim(),
        email: pick(emailIdx < 0 ? 1 : emailIdx).trim(),
        phone: normalizePhone(phoneIdx >= 0 ? pick(phoneIdx) : ""),
      };
    })
    .filter((row) => row.full_name || row.email);
}

function parseTraineeCsv(text: string): ParsedTrainee[] {
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  return rowsToTrainees(lines.map(parseCsvLine));
}

async function parseTraineeSheet(file: File): Promise<ParsedTrainee[]> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array" });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) return [];
  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, raw: true, defval: "" });
  return rowsToTrainees(rows);
}

function accountBadge(trainee: OrganizationTrainee) {
  if (!trainee.user_id) {
    return <Badge variant="outline" className="border-slate-200 bg-slate-50 text-slate-600">No account</Badge>;
  }
  if (trainee.invite_pending) {
    return <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-800">Invite pending</Badge>;
  }
  if (trainee.account_active) {
    return <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-800">Active</Badge>;
  }
  return <Badge variant="outline" className="border-slate-200 bg-slate-50 text-slate-600">Inactive</Badge>;
}

export function OrgTraineesTab({ organizationId }: { organizationId: string }) {
  const [trainees, setTrainees] = useState<OrganizationTrainee[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [uploading, setUploading] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [resendingId, setResendingId] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [addForm, setAddForm] = useState({ full_name: "", email: "", phone: "" });
  const [adding, setAdding] = useState(false);
  const [previewRows, setPreviewRows] = useState<ParsedTrainee[] | null>(null);
  const [previewStatuses, setPreviewStatuses] = useState<Record<string, OrganizationTraineePreviewStatus>>({});
  const [previewLoading, setPreviewLoading] = useState(false);
  const fileInput = useRef<HTMLInputElement | null>(null);

  const loadTrainees = async () => {
    try {
      const response = await fetchOrganizationTrainees(organizationId);
      setTrainees(response.trainees);
    } catch (error) {
      console.error("Failed to load organization trainees:", error);
      toast.error("Failed to load the trainee pool");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchOrganizationTrainees(organizationId)
      .then((response) => {
        if (!cancelled) setTrainees(response.trainees);
      })
      .catch((error) => {
        console.error("Failed to load organization trainees:", error);
        if (!cancelled) toast.error("Failed to load the trainee pool");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [organizationId]);

  const filtered = trainees.filter((trainee) => {
    if (!search.trim()) return true;
    const q = search.trim().toLowerCase();
    return trainee.full_name.toLowerCase().includes(q) || trainee.email.toLowerCase().includes(q);
  });

  const reportUpload = (response: Awaited<ReturnType<typeof addOrganizationTrainees>>) => {
    const parts = [`${response.added} added`];
    if (response.accounts_created) parts.push(`${response.accounts_created} account${response.accounts_created === 1 ? "" : "s"} created`);
    if (response.invites_sent) parts.push(`${response.invites_sent} invite${response.invites_sent === 1 ? "" : "s"} sent`);
    if (response.invites_failed) parts.push(`${response.invites_failed} invite${response.invites_failed === 1 ? "" : "s"} failed`);
    if (response.skipped.length) parts.push(`${response.skipped.length} skipped`);
    if (response.invites_failed) {
      toast.warning(`Upload finished: ${parts.join(", ")}. Some invite emails could not be sent — use Resend later.`);
    } else {
      toast.success(`Upload finished: ${parts.join(", ")}.`);
    }
    if (response.skipped.length) {
      console.warn("Skipped trainee rows:", response.skipped);
    }
  };

  const handleFile = async (file: File) => {
    const isSheet = /\.(xlsx|xls)$/i.test(file.name);
    const parsed = isSheet ? await parseTraineeSheet(file) : parseTraineeCsv(await file.text());
    if (!parsed.length) {
      toast.error("No trainee rows found in that file. Expected columns: name, email, phone.");
      return;
    }
    setPreviewRows(parsed);
    setPreviewStatuses({});
    setPreviewLoading(true);
    previewOrganizationTrainees(organizationId, parsed)
      .then((response) => setPreviewStatuses(response.statuses))
      .catch((error) => console.error("Failed to preview trainees:", error))
      .finally(() => setPreviewLoading(false));
  };

  const handleConfirmUpload = async () => {
    if (!previewRows?.length) return;
    setUploading(true);
    try {
      const response = await addOrganizationTrainees(organizationId, previewRows);
      reportUpload(response);
      setPreviewRows(null);
      await loadTrainees();
    } catch (error) {
      console.error("Failed to upload trainees:", error);
      toast.error(error instanceof Error ? error.message : "Failed to upload trainees");
    } finally {
      setUploading(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  };

  const handleAddOne = async () => {
    if (!addForm.full_name.trim() || !addForm.email.trim()) {
      toast.error("Name and email are required.");
      return;
    }
    setAdding(true);
    try {
      const response = await addOrganizationTrainees(organizationId, [
        { full_name: addForm.full_name.trim(), email: addForm.email.trim(), phone: addForm.phone.trim() || undefined },
      ]);
      reportUpload(response);
      setAddOpen(false);
      setAddForm({ full_name: "", email: "", phone: "" });
      await loadTrainees();
    } catch (error) {
      console.error("Failed to add trainee:", error);
      toast.error(error instanceof Error ? error.message : "Failed to add trainee");
    } finally {
      setAdding(false);
    }
  };

  const handleResend = async (trainee: OrganizationTrainee) => {
    setResendingId(trainee.id);
    try {
      const response = await resendOrganizationTraineeInvite(organizationId, trainee.id);
      toast.success(response.message);
      await loadTrainees();
    } catch (error) {
      console.error("Failed to resend invite:", error);
      toast.error(error instanceof Error ? error.message : "Failed to resend the invite");
    } finally {
      setResendingId(null);
    }
  };

  const handleRemove = async (trainee: OrganizationTrainee) => {
    setRemovingId(trainee.id);
    try {
      await removeOrganizationTrainee(organizationId, trainee.id);
      setTrainees((prev) => prev.filter((t) => t.id !== trainee.id));
      toast.success(`${trainee.full_name} removed from the trainee pool.`);
    } catch (error) {
      console.error("Failed to remove trainee:", error);
      toast.error("Failed to remove the trainee");
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search name or email..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <input
            ref={fileInput}
            type="file"
            accept=".csv,.xlsx,.xls,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void handleFile(file);
            }}
          />
          <Button variant="outline" size="sm" asChild>
            <a href="/templates/trainee-upload-template.xlsx" download="trainee-upload-template.xlsx">
              <Download className="h-4 w-4" />
              Template
            </a>
          </Button>
          <Button variant="outline" size="sm" disabled={uploading} onClick={() => fileInput.current?.click()}>
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileUp className="h-4 w-4" />}
            {uploading ? "Uploading…" : "Upload file"}
          </Button>
          <Button size="sm" onClick={() => setAddOpen(true)}>
            <UserPlus className="h-4 w-4" />
            Add trainee
          </Button>
        </div>
      </div>

      <p className="text-xs leading-relaxed text-muted-foreground">
        This pool holds the organization's trainee accounts. Upload an Excel or CSV file with columns{" "}
        <code className="rounded bg-muted px-1">full_name, email, phone</code> (header optional). New emails get a
        portal account and a set-password invite; existing accounts are linked automatically. Pick from this list
        when building engagement rosters.
       
      </p>

      {loading ? (
        <div className="rounded-xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500 shadow-sm">
          Loading trainee pool…
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-10 text-center shadow-sm">
          <Users className="h-8 w-8 text-slate-300" />
          <p className="text-sm font-semibold text-slate-700">
            {trainees.length ? "No trainees match your search" : "No trainees in this pool yet"}
          </p>
          <p className="max-w-md text-xs text-slate-500">
            Upload an Excel/CSV file or add a trainee to start building this organization's roster.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="admin-table min-w-[720px]">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Account</th>
                <th>Added</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((trainee) => (
                <tr key={trainee.id}>
                  <td className="font-semibold">{trainee.full_name}</td>
                  <td>{trainee.email}</td>
                  <td className="text-sm text-slate-600">{trainee.phone || "—"}</td>
                  <td>{accountBadge(trainee)}</td>
                  <td className="text-sm text-slate-500">
                    {trainee.created_at ? new Date(trainee.created_at).toLocaleDateString() : "—"}
                  </td>
                  <td className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      {trainee.user_id && trainee.invite_pending && (
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={resendingId === trainee.id}
                          onClick={() => void handleResend(trainee)}
                        >
                          {resendingId === trainee.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <MailWarning className="h-4 w-4 text-amber-600" />
                          )}
                          Resend
                        </Button>
                      )}
                      <Button
                        size="icon"
                        variant="ghost"
                        aria-label={`Remove ${trainee.full_name}`}
                        disabled={removingId === trainee.id}
                        onClick={() => void handleRemove(trainee)}
                      >
                        {removingId === trainee.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4 text-red-600" />
                        )}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add trainee</DialogTitle>
            <DialogDescription>
              Creates a trainee pool entry — and a portal account with an invite email if the address is new.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-1.5">
              <Label htmlFor="org-trainee-name">Full name</Label>
              <Input
                id="org-trainee-name"
                value={addForm.full_name}
                onChange={(e) => setAddForm((f) => ({ ...f, full_name: e.target.value }))}
                placeholder="e.g. Amara Okafor"
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="org-trainee-email">Email</Label>
              <Input
                id="org-trainee-email"
                type="email"
                value={addForm.email}
                onChange={(e) => setAddForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="trainee@company.com"
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="org-trainee-phone">Phone (optional)</Label>
              <Input
                id="org-trainee-phone"
                value={addForm.phone}
                onChange={(e) => setAddForm((f) => ({ ...f, phone: e.target.value }))}
                placeholder="+234..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)} disabled={adding}>
              Cancel
            </Button>
            <Button onClick={() => void handleAddOne()} disabled={adding}>
              {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              {adding ? "Adding…" : "Add trainee"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(previewRows)} onOpenChange={(open) => { if (!open && !uploading) setPreviewRows(null); }}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Review upload — {previewRows?.length ?? 0} trainee{previewRows?.length === 1 ? "" : "s"}</DialogTitle>
            <DialogDescription>
              Check the rows below before importing. New emails get a portal account and an invite email; existing
              accounts are linked. Duplicates already in the pool are skipped.
            </DialogDescription>
          </DialogHeader>
          {(() => {
            const dupes = previewRows
              ? previewRows.length - new Set(previewRows.map((r) => r.email.trim().toLowerCase()).filter(Boolean)).size
              : 0;
            return dupes > 0 ? (
              <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                {dupes} duplicate email{dupes === 1 ? "" : "s"} appear more than once in this file — only the first
                occurrence will be imported.
              </p>
            ) : null;
          })()}
          {previewLoading ? (
            <p className="flex items-center gap-2 text-xs text-slate-500">
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Checking accounts…
            </p>
          ) : (
            (() => {
              const rows = previewRows ?? [];
              const seen = new Set<string>();
              let inPool = 0;
              let existing = 0;
              let fresh = 0;
              for (const row of rows) {
                const email = row.email.trim().toLowerCase();
                if (!email || seen.has(email)) continue;
                seen.add(email);
                const status = previewStatuses[email];
                if (status?.in_pool) inPool += 1;
                else if (status?.has_account) existing += 1;
                else fresh += 1;
              }
              if (!inPool && !existing && !fresh) return null;
              return (
                <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
                  <span className="font-semibold text-slate-800">{fresh}</span> new (account + invite),{" "}
                  <span className="font-semibold text-slate-800">{existing}</span> existing account
                  {existing === 1 ? "" : "s"} (linked, no invite)
                  {inPool ? <>, <span className="font-semibold text-slate-800">{inPool}</span> already in pool (skipped)</> : null}
                </p>
              );
            })()
          )}
          <div className="max-h-80 overflow-y-auto rounded-lg border border-slate-200">
            <table className="admin-table min-w-[560px] [&_td]:px-6 [&_td]:py-3.5 [&_th]:px-6 [&_th]:py-3.5">
              <thead>
                <tr>
                  <th className="w-10">#</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Import</th>
                </tr>
              </thead>
              <tbody>
                {(previewRows ?? []).map((row, index) => {
                  const status = previewStatuses[row.email.trim().toLowerCase()];
                  return (
                  <tr key={index}>
                    <td className="text-slate-400">{index + 1}</td>
                    <td className="font-semibold">{row.full_name || <span className="text-red-500">Missing</span>}</td>
                    <td>{row.email || <span className="text-red-500">Missing</span>}</td>
                    <td className="text-sm text-slate-600">{row.phone || "—"}</td>
                    <td>
                      {!row.email.trim() || !status ? (
                        <span className="text-xs text-slate-400">—</span>
                      ) : status.in_pool ? (
                        <Badge variant="outline" className="border-slate-200 bg-slate-50 text-slate-600">In pool</Badge>
                      ) : status.has_account ? (
                        <Badge variant="outline" className="border-blue-200 bg-blue-50 text-blue-800">Existing account</Badge>
                      ) : (
                        <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-800">New account</Badge>
                      )}
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPreviewRows(null)} disabled={uploading}>
              Cancel
            </Button>
            <Button onClick={() => void handleConfirmUpload()} disabled={uploading}>
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              {uploading ? "Importing…" : `Import ${previewRows?.length ?? 0} trainee${previewRows?.length === 1 ? "" : "s"}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
