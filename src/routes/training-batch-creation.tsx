import { useMemo, useRef, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Check,
  ChevronRight,
  CircleHelp,
  Clock3,
  FileText,
  MapPin,
  Plus,
  RefreshCw,
  Save,
  ShieldCheck,
  Trash2,
  Users,
} from "lucide-react";
import { AdminPageShell } from "@/components/educert/AdminPageShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface CourseModule {
  name: string;
  detail: string;
  type: string;
  date: string;
  time: string;
  venue: string;
}

interface CourseOption {
  id: string;
  name: string;
  detail: string;
  deliveryMode: string;
  totalHours: number;
  modules: CourseModule[];
}

interface SeatAllocation {
  id: number;
  organization: string;
  agreement: string;
  detail: string;
  quota: number;
  utilized: number;
  seats: number;
}

const COURSE_OPTIONS: CourseOption[] = [
  {
    id: "iwcf-level-4",
    name: "Advanced Offshore Well Control IWCF Level 4",
    detail: "Subsea & Surface Combined",
    deliveryMode: "Physical Yard / Hands-On Simulation",
    totalHours: 40,
    modules: [
      { name: "Well Control Fundamentals & Pressure Calculations", detail: "Classroom Theory • 8 Contact Hours", type: "Classroom", date: "2025-02-15", time: "08:30 – 12:30 WAT", venue: "PH Terminal — Classroom Block A, Rm 204" },
      { name: "Subsea BOP Stack & Wellhead Equipment Drills", detail: "High-Pressure Simulator Bay • 10 Contact Hours", type: "Sim Bay", date: "2025-02-16", time: "08:30 – 16:30 WAT", venue: "PH Terminal — DrillSIM 5000 Cyber Chair Bay 4" },
      { name: "Driller's Method & Volumetric Well Kill Practicals", detail: "Heavy Mock Rig Floor Practicals • 12 Contact Hours", type: "Rig Floor", date: "2025-02-17", time: "08:00 – 17:00 WAT", venue: "PH Terminal — High-Pressure Simulator Bay 4" },
      { name: "IWCF Assessor Examination & Practical Assessment", detail: "Formal Invigilated Exam • 10 Contact Hours", type: "Exam Suite", date: "2025-02-19", time: "09:00 – 14:00 WAT", venue: "PH Terminal — Accredited Testing Lab B" },
    ],
  },
  {
    id: "bosiet",
    name: "BOSIET with CA-EBS",
    detail: "Digital Delivery & In-Water Wet Drills",
    deliveryMode: "Physical Yard / Practical Pool",
    totalHours: 18,
    modules: [
      { name: "Offshore Safety & Emergency Response", detail: "Classroom Theory • 6 Contact Hours", type: "Classroom", date: "2025-02-22", time: "08:30 – 14:30 WAT", venue: "Warri Shorebase — Training Room 1" },
      { name: "Firefighting & Self-Rescue", detail: "Practical Simulation • 6 Contact Hours", type: "Sim Bay", date: "2025-02-23", time: "08:30 – 15:30 WAT", venue: "Warri Shorebase — Fire Ground" },
      { name: "Helicopter Underwater Escape Training", detail: "Pool Practical • 6 Contact Hours", type: "Pool", date: "2025-02-24", time: "08:00 – 16:00 WAT", venue: "Warri Shorebase — Survival Wet Bay" },
    ],
  },
  {
    id: "mistdo",
    name: "MISTDO Inductions",
    detail: "Downstream Depot Certification",
    deliveryMode: "Physical Classroom",
    totalHours: 16,
    modules: [
      { name: "Workplace Safety & Hazard Identification", detail: "Classroom Theory • 8 Contact Hours", type: "Classroom", date: "2025-03-02", time: "09:00 – 17:00 WAT", venue: "Onne Deepwater Center — Classroom 302" },
      { name: "Emergency Response & Site Procedures", detail: "Practical Session • 8 Contact Hours", type: "Practical", date: "2025-03-03", time: "09:00 – 17:00 WAT", venue: "Onne Deepwater Center — Training Bay" },
    ],
  },
  {
    id: "iadc-wellsharp",
    name: "IADC WellSharp Supervisor Rotary Drilling Stack",
    detail: "Accredited Rotary Drilling Syllabus",
    deliveryMode: "Physical Yard / Hands-On Simulation",
    totalHours: 20,
    modules: [
      { name: "Drilling Operations & Risk Controls", detail: "Classroom Theory • 8 Contact Hours", type: "Classroom", date: "2025-03-10", time: "08:30 – 16:30 WAT", venue: "PH Terminal — Rig Theory Theatre 1" },
      { name: "Well Control Simulation", detail: "Simulator Practical • 12 Contact Hours", type: "Sim Bay", date: "2025-03-11", time: "08:00 – 17:00 WAT", venue: "PH Terminal — DrillSIM 5000 Cyber Chair Bay 4" },
    ],
  },
  {
    id: "h2s-alive",
    name: "H2S Alive & Breathing Apparatus Operational Refresher",
    detail: "Safety Refresher",
    deliveryMode: "Hybrid",
    totalHours: 8,
    modules: [
      { name: "H2S Awareness & Breathing Apparatus", detail: "Theory and Practical • 8 Contact Hours", type: "Hybrid", date: "2025-03-18", time: "08:30 – 16:30 WAT", venue: "Port Harcourt Terminal — Safety Training Bay" },
    ],
  },
];

const LOCATION_OPTIONS = [
  "Port Harcourt Terminal / Yard (Trans-Amadi Industrial Complex)",
  "Warri Shorebase & Marine Operations Annex",
  "Onne Oil and Gas Free Zone (OGFTZ Platform)",
  "Lagos Island Marine Training Center",
];

const INITIAL_ALLOCATIONS: SeatAllocation[] = [
  { id: 1, organization: "Shell Nigeria (SNEPCo)", agreement: "SOW-2025-SNEPCO-09A", detail: "Deepwater Bonga Asset Drill Crew & Subsea Systems", quota: 50, utilized: 32, seats: 18 },
  { id: 2, organization: "Chevron Nigeria Ltd", agreement: "ENG-2025-CHEV-01", detail: "Escravos Gas-to-Liquids Rotary Techs & Deep Drilling", quota: 50, utilized: 35, seats: 5 },
  { id: 3, organization: "Open Public Enrollment", agreement: "Self-Funded", detail: "Independent Petroleum Engineers & Wellsite Consultants", quota: 10, utilized: 6, seats: 2 },
];

function SectionHeading({ number, title, description }: { number: string; title: string; description: string }) {
  return (
    <div className="flex items-start gap-3 border-b border-border pb-4">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary/10 font-heading text-sm font-bold text-primary">{number}</span>
      <div>
        <h2 className="font-heading text-lg font-semibold">{title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

export default function TrainingBatchCreation() {
  const navigate = useNavigate();
  const formRef = useRef<HTMLFormElement>(null);
  const [courseId, setCourseId] = useState(COURSE_OPTIONS[0].id);
  const [batchName, setBatchName] = useState("Q1 IWCF Level 4 Rotary Drillers Training Batch A");
  const [batchCode, setBatchCode] = useState("BTCH-2025-IWCF-014");
  const [location, setLocation] = useState(LOCATION_OPTIONS[0]);
  const [capacity, setCapacity] = useState(25);
  const [quorum, setQuorum] = useState(10);
  const [allocations, setAllocations] = useState(INITIAL_ALLOCATIONS);
  const [nextAllocationId, setNextAllocationId] = useState(4);

  const selectedCourse = COURSE_OPTIONS.find((course) => course.id === courseId) ?? COURSE_OPTIONS[0];
  const assignedSeats = useMemo(
    () => allocations.reduce((total, allocation) => total + Math.max(0, allocation.seats), 0),
    [allocations],
  );
  const availableSeats = capacity - assignedSeats;

  const regenerateCode = () => {
    const year = new Date().getFullYear();
    const suffix = Math.floor(100 + Math.random() * 900);
    setBatchCode(`BTCH-${year}-DEMO-${suffix}`);
  };

  const updateAllocation = (id: number, seats: number) => {
    setAllocations((current) => current.map((allocation) => allocation.id === id
      ? { ...allocation, seats: Math.max(0, Number.isFinite(seats) ? seats : 0) }
      : allocation));
  };

  const addAllocation = () => {
    setAllocations((current) => [
      ...current,
      {
        id: nextAllocationId,
        organization: "New Organization",
        agreement: "SOW-TBD",
        detail: "Organization allocation",
        quota: 0,
        utilized: 0,
        seats: 0,
      },
    ]);
    setNextAllocationId((id) => id + 1);
  };

  const handleSave = (status: "Draft" | "Ready") => {
    if (status === "Ready" && !formRef.current?.reportValidity()) return;
    if (assignedSeats > capacity) {
      toast.error("Allocated seats cannot exceed the batch capacity.");
      return;
    }
    toast.info(`${status} preview is ready. This UI prototype does not save batch data.`);
  };

  return (
    <AdminPageShell withSidebar searchPlaceholder="Search certification, rig crew, batch...">
      <div className="page-padding mx-auto max-w-6xl space-y-6">
        <div>
          <button
            type="button"
            className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition hover:text-foreground"
            onClick={() => navigate("/training/batches")}
          >
            <ArrowLeft className="h-4 w-4" />
            Batches
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="text-foreground">Create Batch</span>
          </button>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="admin-page-title">Create Training Batch</h1>
              <p className="admin-page-subtitle max-w-2xl">
                Schedule a training batch, configure venue logistics, and allocate candidate capacity.
              </p>
            </div>
            <Badge variant="outline" className="border-amber-300 bg-amber-50 text-amber-900">Unsaved UI prototype</Badge>
          </div>
        </div>

        <div className="rounded-lg border border-amber-300/70 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          This form is a visual prototype. Saving will validate the preview, but will not create a batch in the system.
        </div>

        <form ref={formRef} onSubmit={(event: FormEvent<HTMLFormElement>) => {
          event.preventDefault();
          handleSave("Ready");
        }} className="space-y-5">
          <section className="rounded-xl border border-border bg-card p-5 shadow-sm sm:p-6">
            {/* <div className="mb-5 flex flex-wrap items-start justify-between gap-3 rounded-lg border border-primary/15 bg-primary/5 p-4">
              <div className="flex gap-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary"><FileText className="h-4 w-4" /></span>
                <div>
                  <p className="font-semibold">Engagement context attached</p>
                  <p className="mt-1 text-sm text-muted-foreground">Shell Nigeria (SNEPCo) — SOW-2025-SNEPCO-09A</p>
                  <p className="mt-1 text-sm text-muted-foreground">Advanced Offshore Well Control IWCF Level 4</p>
                  <p className="mt-2 text-xs text-primary">Seats and accreditation criteria are shown as sample contract context.</p>
                </div>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={() => toast.info("Engagement details are not connected in this UI prototype.")}>View SOW</Button>
            </div> */}

            <SectionHeading number="01" title="Course & Training Batch Details" description="Choose an accredited course and identify the training batch." />
            <div className="mt-5 grid gap-5 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="batch-course">Select Course Module <span className="text-destructive">*</span></Label>
                <Select
                  value={courseId}
                  onValueChange={(value) => {
                    setCourseId(value);
                    const course = COURSE_OPTIONS.find((option) => option.id === value);
                    if (course) setBatchName(`${course.name} Training Batch`);
                  }}
                >
                  <SelectTrigger id="batch-course"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {COURSE_OPTIONS.map((course) => (
                      <SelectItem key={course.id} value={course.id}>{course.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex items-center gap-1.5 text-xs text-emerald-700"><ShieldCheck className="h-3.5 w-3.5" />Accreditation criteria pre-mapped to this course.</div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="batch-name">Training Batch Name <span className="text-destructive">*</span></Label>
                <Input id="batch-name" required value={batchName} onChange={(event) => setBatchName(event.target.value)} />
                <p className="text-xs text-muted-foreground">Public designation visible to sponsors and candidate certificates.</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="batch-code">Batch Reference ID</Label>
                <div className="flex gap-2">
                  <Input id="batch-code" readOnly value={batchCode} className="font-mono" />
                  <Button type="button" variant="outline" aria-label="Regenerate batch reference" onClick={regenerateCode}><RefreshCw className="h-4 w-4" /><span className="sr-only">Regenerate</span></Button>
                </div>
                <p className="text-xs text-muted-foreground">Generated reference for this preview.</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="batch-notes">Training batch notes</Label>
                <Textarea id="batch-notes" placeholder="Add operational notes for this training batch..." className="min-h-20" />
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-border bg-card p-5 shadow-sm sm:p-6">
            <SectionHeading number="02" title="Module Scheduling & Venue Logistics" description="Configure dates, session times, and venue cells for the course modules." />
            <div className="mt-5 grid gap-5 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="delivery-mode">Delivery modality</Label>
                <Input id="delivery-mode" value={selectedCourse.deliveryMode} readOnly />
                <p className="text-xs text-muted-foreground">Modality is defined by the course specification.</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="batch-location">Batch Primary Base / Shore Terminal <span className="text-destructive">*</span></Label>
                <Select value={location} onValueChange={setLocation}>
                  <SelectTrigger id="batch-location"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {LOCATION_OPTIONS.map((option) => <SelectItem key={option} value={option}>{option}</SelectItem>)}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">Sample base location for the sessions below.</p>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="font-heading font-semibold">Course modules timeline &amp; cell assignment</h3>
                <p className="mt-1 text-sm text-muted-foreground">{selectedCourse.modules.length} modules • sample schedule</p>
              </div>
              <Badge variant="secondary">{selectedCourse.totalHours} Total Contact Hours</Badge>
            </div>
            <div className="mt-4 space-y-3">
              {selectedCourse.modules.map((module, index) => (
                <article key={`${courseId}-${module.name}`} className="rounded-lg border border-border/80 p-4">
                  <div className="flex flex-wrap items-start gap-3">
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-sm font-bold text-primary">{String(index + 1).padStart(2, "0")}</span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="font-semibold">{module.name}</h4>
                        <Badge variant="outline">{module.type}</Badge>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">{module.detail}</p>
                    </div>
                  </div>
                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    <div className="space-y-1.5">
                      <Label htmlFor={`session-date-${index}`} className="text-xs">Session date</Label>
                      <Input id={`session-date-${index}`} type="date" defaultValue={module.date} />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor={`session-time-${index}`} className="text-xs">Time &amp; shift</Label>
                      <Input id={`session-time-${index}`} defaultValue={module.time} />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor={`session-venue-${index}`} className="text-xs">Assigned venue cell</Label>
                      <Input id={`session-venue-${index}`} defaultValue={module.venue} />
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="rounded-xl border border-border bg-card p-5 shadow-sm sm:p-6">
            <SectionHeading number="03" title="Capacity & Mobilization" description="Set the registration limit and minimum quorum for this training batch." />
            <div className="mt-5 grid gap-5 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="capacity">Maximum Capacity <span className="text-destructive">*</span></Label>
                <div className="relative">
                  <Users className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input id="capacity" type="number" min={1} required className="pl-9" value={capacity} onChange={(event) => setCapacity(Math.max(1, Number(event.target.value) || 1))} />
                </div>
                <p className="text-xs text-muted-foreground">Hard registration limit for candidate slots.</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="quorum">Minimum Quorum Threshold</Label>
                <div className="relative">
                  <Users className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input id="quorum" type="number" min={1} max={capacity} className="pl-9" value={quorum} onChange={(event) => setQuorum(Math.max(1, Math.min(capacity, Number(event.target.value) || 1)))} />
                </div>
                <p className="text-xs text-muted-foreground">Minimum trainee count for operational mobilization.</p>
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-border bg-card p-5 shadow-sm sm:p-6">
            <SectionHeading number="04" title="Multi-Organization Seat Allocation" description="Allocate sample training batch seats across contract quotas and open enrollment." />
            <div className="mt-5 grid gap-4 sm:grid-cols-3">
              <div className="rounded-lg bg-muted/50 p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Capacity distribution</p>
                <p className="mt-2 text-xl font-bold">{assignedSeats} / {capacity} seats</p>
              </div>
              <div className="rounded-lg bg-muted/50 p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Available seats</p>
                <p className={`mt-2 text-xl font-bold ${availableSeats < 0 ? "text-destructive" : ""}`}>{availableSeats < 0 ? `${Math.abs(availableSeats)} over capacity` : availableSeats}</p>
              </div>
              <div className="rounded-lg bg-muted/50 p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Assigned capacity</p>
                <p className="mt-2 text-xl font-bold">{capacity ? Math.min(100, Math.round((assignedSeats / capacity) * 100)) : 0}%</p>
              </div>
            </div>
            <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-semibold">Organization &amp; contract quotas</p>
                <p className="mt-1 text-sm text-muted-foreground">Seat counts are local preview values only.</p>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={addAllocation}><Plus className="h-4 w-4" />Add Corporate Allocation</Button>
            </div>
            <div className="mt-4 space-y-3">
              {allocations.map((allocation) => {
                const remaining = Math.max(0, allocation.quota - allocation.utilized);
                return (
                  <article key={allocation.id} className="grid gap-4 rounded-lg border border-border/80 p-4 md:grid-cols-[minmax(0,1fr)_120px_36px] md:items-center">
                    <div className="min-w-0">
                      <p className="font-semibold">{allocation.organization}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{allocation.agreement} · {allocation.detail}</p>
                      <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
                        <span>{allocation.quota} agreed</span>
                        <span>·</span>
                        <span>{allocation.utilized} previously trained</span>
                        <span>·</span>
                        <span>{remaining} remaining quota</span>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor={`allocation-${allocation.id}`} className="text-xs">Assigned seats</Label>
                      <Input
                        id={`allocation-${allocation.id}`}
                        type="number"
                        min={0}
                        max={remaining || undefined}
                        value={allocation.seats}
                        onChange={(event) => updateAllocation(allocation.id, Number(event.target.value))}
                      />
                    </div>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      aria-label={`Remove ${allocation.organization} allocation`}
                      onClick={() => setAllocations((current) => current.filter((item) => item.id !== allocation.id))}
                    >
                      <Trash2 className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </article>
                );
              })}
            </div>
            <div className={`mt-4 flex items-start gap-2 rounded-lg p-3 text-sm ${availableSeats < 0 ? "bg-destructive/5 text-destructive" : "bg-emerald-50 text-emerald-800"}`}>
              {availableSeats < 0 ? <CircleHelp className="mt-0.5 h-4 w-4 shrink-0" /> : <Check className="mt-0.5 h-4 w-4 shrink-0" />}
              <p>{availableSeats < 0
                ? `Allocated seats exceed capacity by ${Math.abs(availableSeats)}. Reduce allocations to continue.`
                : `${assignedSeats} seats mapped across ${allocations.length} sample allocations; ${availableSeats} seats remain unassigned.`}</p>
            </div>
          </section>

          <section className="rounded-xl border border-border bg-muted/30 p-5 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary"><MapPin className="h-4 w-4" /></span>
                <div>
                  <h2 className="font-heading font-semibold">Yard inspection &amp; audit standard</h2>
                  <p className="mt-1 text-sm text-muted-foreground">Sample facility details for the selected terminal.</p>
                </div>
              </div>
              <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-800"><ShieldCheck className="mr-1 h-3.5 w-3.5" />IWCF Class A Certified</Badge>
            </div>
            <div className="mt-4 grid gap-4 border-t border-border pt-4 sm:grid-cols-3">
              <div><p className="text-xs text-muted-foreground">Facility rating</p><p className="mt-1 font-medium">{location.startsWith("Port Harcourt") ? "Port Harcourt High-Pressure Bay 4" : location.split(" (")[0]}</p></div>
              <div><p className="text-xs text-muted-foreground">Simulator type</p><p className="mt-1 font-medium">DrillSIM 5000 Cyber Chair</p></div>
              <div><p className="text-xs text-muted-foreground">Assessor ratio</p><p className="mt-1 font-medium">1 : 8 (Safety Mandate Compliant)</p></div>
            </div>
          </section>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-5">
            <p className="flex items-center gap-2 text-sm text-muted-foreground"><Clock3 className="h-4 w-4" />Lifecycle state: Draft Training Batch <span className="hidden sm:inline">(not visible in candidate self-service)</span></p>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" onClick={() => navigate("/training/batches")}>Cancel</Button>
              <Button type="button" variant="outline" onClick={() => handleSave("Draft")}>
                <Save className="h-4 w-4" />Save Draft
              </Button>
              <Button type="submit">
                <Check className="h-4 w-4" />Save &amp; Ready
              </Button>
            </div>
          </div>
        </form>
      </div>
    </AdminPageShell>
  );
}
