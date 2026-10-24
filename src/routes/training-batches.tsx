import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowDownToLine,
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Check,
  ChevronDown,
  CircleAlert,
  Clock3,
  Eye,
  MapPin,
  Plus,
  Search,
  Users,
} from "lucide-react";
import { AdminPageShell } from "@/components/educert/AdminPageShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

type BatchStatus = "In Progress" | "Ready" | "Upcoming" | "Completed" | "Cancelled";

interface Batch {
  code: string;
  course: string;
  module: string;
  dates: string;
  schedule: string;
  seats: number;
  capacity: number;
  trainees: string[];
  trainer: string;
  assistantTrainer?: string;
  location: string;
  terminal: string;
  status: BatchStatus;
}

const SAMPLE_BATCHES: Batch[] = [
  {
    code: "BTCH-2025-012",
    course: "Advanced Offshore Well Control IWCF Level 4",
    module: "Subsea & Surface Combined",
    dates: "15 Feb – 20 Feb 2025",
    schedule: "5 Days (40 Contact Hrs)",
    seats: 25,
    capacity: 25,
    trainees: ["AB", "TO", "EO", "+22"],
    trainer: "Dr. Alabo Briggs",
    assistantTrainer: "Engr. Tari",
    location: "PH Yard - Rig Sim Bay 4",
    terminal: "Port Harcourt Terminal",
    status: "In Progress",
  },
  {
    code: "BTCH-2025-015",
    course: "BOSIET with CA-EBS (OPITO Approved)",
    module: "Offshore Emergency & Survival",
    dates: "22 Feb – 24 Feb 2025",
    schedule: "3 Days (Practical Pool)",
    seats: 18,
    capacity: 20,
    trainees: ["SK", "DA", "BM", "+15"],
    trainer: "Capt. Emeka Okoye",
    assistantTrainer: "Pool Master Kalu",
    location: "Warri Survival Wet Bay",
    terminal: "Warri Shorebase",
    status: "Ready",
  },
  {
    code: "BTCH-2025-018",
    course: "MISTDO Offshore Safety Induction",
    module: "DPR / NUPRC Mandatory",
    dates: "02 Mar – 04 Mar 2025",
    schedule: "3 Days (24 Contact Hrs)",
    seats: 12,
    capacity: 30,
    trainees: ["JH", "RN", "+10"],
    trainer: "Engr. Tari Allison",
    assistantTrainer: "Auditor Brown",
    location: "Classroom 302 & Bay",
    terminal: "Onne Deepwater Center",
    status: "Upcoming",
  },
  {
    code: "BTCH-2025-009",
    course: "HUET Helicopter Underwater Escape",
    module: "Simulation Tank",
    dates: "05 Feb – 07 Feb 2025",
    schedule: "Archived 10 Feb",
    seats: 16,
    capacity: 16,
    trainees: ["FG", "WE", "+14"],
    trainer: "Engr. Stella Nwosu",
    assistantTrainer: "Rescue Diver O.",
    location: "PH Survival Wet Bay 1",
    terminal: "Port Harcourt Terminal",
    status: "Completed",
  },
  {
    code: "BTCH-2025-008",
    course: "Emergency Response Team Leader (ERTL)",
    module: "Weather Suspended",
    dates: "11 Feb – 13 Feb 2025",
    schedule: "Postponed to March",
    seats: 14,
    capacity: 15,
    trainees: ["KA", "TR", "+12"],
    trainer: "Capt. Emeka Okoye",
    assistantTrainer: undefined,
    location: "Warri Marine Dock Bay",
    terminal: "Warri Shorebase",
    status: "Cancelled",
  },
  {
    code: "BTCH-2025-021",
    course: "High Voltage Switching Operations (Offshore)",
    module: "Power & Electrical Safety",
    dates: "26 Feb – 28 Feb 2025",
    schedule: "3 Days (Simulator Labs)",
    seats: 15,
    capacity: 16,
    trainees: ["LA", "MK", "OT", "+12"],
    trainer: "Dr. Alabo Briggs",
    location: "PH Electrical Lab Bay 2",
    terminal: "Port Harcourt Terminal",
    status: "Ready",
  },
];

const STATUS_STYLES: Record<BatchStatus, string> = {
  "In Progress": "border-primary/20 bg-primary/10 text-primary",
  Ready: "border-emerald-200 bg-emerald-50 text-emerald-800",
  Upcoming: "border-amber-200 bg-amber-50 text-amber-800",
  Completed: "border-border bg-muted text-muted-foreground",
  Cancelled: "border-destructive/20 bg-destructive/5 text-destructive",
};

function exportSchedule(batches: Batch[]) {
  const escapeCsv = (value: string) => `"${value.replace(/"/g, '""')}"`;
  const rows = [
    ["Batch Ref", "Course", "Dates", "Trainees", "Capacity", "Trainer", "Location", "Status"],
    ...batches.map((batch) => [
      batch.code,
      batch.course,
      batch.dates,
      String(batch.seats),
      String(batch.capacity),
      batch.trainer,
      batch.location,
      batch.status,
    ]),
  ];
  const blob = new Blob([rows.map((row) => row.map(escapeCsv).join(",")).join("\n")], {
    type: "text/csv;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "training-batch-schedule.csv";
  link.click();
  URL.revokeObjectURL(url);
}

export default function TrainingBatches() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [courseFilter, setCourseFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [locationFilter, setLocationFilter] = useState("all");

  const filteredBatches = useMemo(() => {
    const query = search.trim().toLowerCase();
    return SAMPLE_BATCHES.filter((batch) => {
      const matchesSearch = !query || [
        batch.code,
        batch.course,
        batch.trainer,
        batch.assistantTrainer ?? "",
      ].some((value) => value.toLowerCase().includes(query));
      const matchesCourse = courseFilter === "all" || batch.course === courseFilter;
      const matchesStatus = statusFilter === "all" || batch.status === statusFilter;
      const matchesLocation = locationFilter === "all" || batch.terminal === locationFilter;
      return matchesSearch && matchesCourse && matchesStatus && matchesLocation;
    });
  }, [search, courseFilter, statusFilter, locationFilter]);

  return (
    <AdminPageShell withSidebar searchPlaceholder="Search certification, rig crew, batch...">
      <div className="page-padding space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-primary">
              <CalendarDays className="h-4 w-4" />
              Operations Logistics &amp; Scheduling
            </div>
            <h1 className="admin-page-title">Training Batches</h1>
            <p className="admin-page-subtitle max-w-2xl">
              Manage scheduled training batches, venue logistics, trainer assignments, and trainee capacity across yard and offshore simulations.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => exportSchedule(filteredBatches)}>
              <ArrowDownToLine className="h-4 w-4" />
              Export Schedule
            </Button>
            <Button onClick={() => navigate("/training/batches/create")}>
              <Plus className="h-4 w-4" />
              Create Batch
            </Button>
          </div>
        </div>

        <div className="rounded-lg border border-amber-300/70 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          <span className="font-semibold">UI prototype:</span> The batch records below are sample data. Changes are not saved.
        </div>

        <section aria-label="Batch overview" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {[
            { label: "Upcoming", value: "14", caption: "Training batches scheduled for Q1/Q2", icon: CalendarDays, color: "text-sky-700 bg-sky-50" },
            { label: "Ready", value: "6", caption: "Batches fully provisioned", icon: Check, color: "text-emerald-700 bg-emerald-50" },
            { label: "In Progress", value: "8", caption: "Active in bays & classrooms", icon: Clock3, color: "text-primary bg-primary/10" },
            { label: "Completed", value: "42", caption: "Certified & archived", icon: Check, color: "text-muted-foreground bg-muted" },
            { label: "Cancelled", value: "2", caption: "Rescheduled / weather hold", icon: CircleAlert, color: "text-amber-800 bg-amber-50" },
          ].map(({ label, value, caption, icon: Icon, color }) => (
            <div key={label} className="rounded-xl border border-border bg-card p-4 shadow-sm">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-medium text-muted-foreground">{label}</p>
                <span className={`grid h-8 w-8 place-items-center rounded-lg ${color}`}><Icon className="h-4 w-4" /></span>
              </div>
              <p className="mt-2 font-heading text-2xl font-bold">{value}</p>
              <p className="mt-1 text-xs text-muted-foreground">{caption}</p>
            </div>
          ))}
        </section>

        <section className="space-y-4 rounded-xl border border-border bg-card p-4 shadow-sm sm:p-5" aria-label="Batch filters">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-heading text-lg font-semibold">Scheduled training batches</h2>
              <p className="text-sm text-muted-foreground">Filter the sample schedule by course, status, or terminal.</p>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CalendarDays className="h-4 w-4" />
              Current Month / Q1 2025
              <ChevronDown className="h-4 w-4" />
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                aria-label="Search batches"
                className="pl-9"
                placeholder="Search batch code, course, trainer..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
            <Select value={courseFilter} onValueChange={setCourseFilter}>
              <SelectTrigger aria-label="Filter by course"><SelectValue placeholder="All Courses" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Courses</SelectItem>
                {[...new Set(SAMPLE_BATCHES.map((batch) => batch.course))].map((course) => (
                  <SelectItem key={course} value={course}>{course}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger aria-label="Filter by status"><SelectValue placeholder="All Statuses" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {(["In Progress", "Ready", "Upcoming", "Completed", "Cancelled"] as BatchStatus[]).map((status) => (
                  <SelectItem key={status} value={status}>{status}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={locationFilter} onValueChange={setLocationFilter}>
              <SelectTrigger aria-label="Filter by location"><SelectValue placeholder="All Locations" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Locations</SelectItem>
                {[...new Set(SAMPLE_BATCHES.map((batch) => batch.terminal))].map((location) => (
                  <SelectItem key={location} value={location}>{location}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </section>

        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          <div className="overflow-x-auto">
            <table className="admin-table min-w-[1050px]">
              <thead>
                <tr>
                  <th>Batch Ref / Course Module</th>
                  <th>Dates &amp; Schedule</th>
                  <th>Capacity &amp; Seats</th>
                  <th>Trainees</th>
                  <th>Trainer</th>
                  <th>Location / Bay</th>
                  <th>Status</th>
                  <th className="text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredBatches.map((batch) => {
                  const fill = Math.round((batch.seats / batch.capacity) * 100);
                  return (
                    <tr key={batch.code}>
                      <td className="max-w-[270px]">
                        <span className="font-mono text-xs font-semibold text-primary">{batch.code}</span>
                        <p className="mt-1 font-semibold text-foreground">{batch.course}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">{batch.module}</p>
                      </td>
                      <td className="whitespace-nowrap">
                        <p className="font-medium">{batch.dates}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{batch.schedule}</p>
                      </td>
                      <td className="min-w-32">
                        <p className="font-semibold">{batch.seats} / {batch.capacity}</p>
                        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                          <div className="h-full rounded-full bg-primary" style={{ width: `${fill}%` }} />
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">{fill}% {fill === 100 ? "Full" : "Open"}</p>
                      </td>
                      <td>
                        <div className="flex -space-x-2">
                          {batch.trainees.map((trainee, index) => (
                            <span key={`${batch.code}-${trainee}`} className={`grid h-7 min-w-7 place-items-center rounded-full border-2 border-card px-1 text-[10px] font-bold ${index === batch.trainees.length - 1 ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary"}`}>
                              {trainee}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="min-w-36">
                        <p className="font-medium">{batch.trainer}</p>
                        <p className="mt-1 text-xs text-muted-foreground">Lead</p>
                        {batch.assistantTrainer && <p className="mt-1 text-xs text-muted-foreground">+ {batch.assistantTrainer}</p>}
                      </td>
                      <td className="min-w-40">
                        <p className="flex items-center gap-1.5 font-medium"><MapPin className="h-3.5 w-3.5 shrink-0 text-primary" />{batch.location}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{batch.terminal}</p>
                      </td>
                      <td><Badge variant="outline" className={STATUS_STYLES[batch.status]}>{batch.status}</Badge></td>
                      <td className="text-right">
                        <Button
                          aria-label={`Preview ${batch.code}`}
                          size="icon"
                          variant="ghost"
                          onClick={() => toast.info("Batch details are not connected in this UI prototype.")}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
                {filteredBatches.length === 0 && (
                  <tr><td colSpan={8} className="py-12 text-center text-sm text-muted-foreground">No sample batches match these filters.</td></tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-5 py-4 text-sm text-muted-foreground">
            <span>Showing {filteredBatches.length ? 1 : 0}–{filteredBatches.length} of {filteredBatches.length} sample batches</span>
            <div className="flex items-center gap-2">
              <span className="mr-2 hidden sm:inline">Sample schedule</span>
              <Button size="icon" variant="outline" disabled aria-label="Previous page"><ArrowLeft className="h-4 w-4" /></Button>
              <Button size="icon" variant="outline" disabled aria-label="Next page"><ArrowRight className="h-4 w-4" /></Button>
            </div>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">DPR &amp; OPITO Audit Sync</p>
                <h2 className="mt-1 font-heading text-lg font-semibold">Accredited roster compliance</h2>
              </div>
              <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-800">Active</Badge>
            </div>
            <div className="mt-5 flex items-center gap-4">
              <div className="grid h-14 w-14 shrink-0 place-items-center rounded-full border-4 border-primary/20 text-sm font-bold text-primary">98%</div>
              <div>
                <p className="font-medium">Accredited roster compliance</p>
                <p className="mt-1 text-sm text-muted-foreground">All 6 ready training batches have valid OPITO/IWCF training vouchers.</p>
              </div>
            </div>
            <div className="mt-5 flex items-center justify-between border-t border-border pt-4 text-sm">
              <span className="text-muted-foreground">Next audit inspection</span>
              <span className="font-semibold">28 Feb 2025</span>
            </div>
          </section>
          <section className="rounded-xl border border-amber-300/70 bg-amber-50 p-5">
            <div className="flex items-start gap-3">
              <CircleAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-800" />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold uppercase tracking-wider text-amber-900">Emergency reschedule</p>
                <h2 className="mt-1 font-heading text-lg font-semibold text-amber-950">2 batches on standby status</h2>
                <p className="mt-2 text-sm leading-6 text-amber-900">BTCH-2025-008 is suspended due to offshore weather advisories. Reassign trainees into Bay 2 classrooms.</p>
                <Button className="mt-4" variant="outline" onClick={() => toast.info("Fast allocation is not connected in this UI prototype.")}>
                  <Users className="h-4 w-4" />
                  Launch Fast Allocation
                </Button>
              </div>
            </div>
          </section>
        </div>
      </div>
    </AdminPageShell>
  );
}
