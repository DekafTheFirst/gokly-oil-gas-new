import { useMemo, useRef, useState, type FormEvent, type ReactNode, type SelectHTMLAttributes } from "react";
import { useNavigate } from "react-router-dom";
import {
  BadgeCheck,
  Bookmark,
  ChevronDown,
  ChevronRight,
  CircleCheck,
  ClipboardList,
  FileText,
  Gavel,
  Handshake,
  Minus,
  Plus,
  Rocket,
  Save,
  Tag,
  Trash2,
  Users,
  X,
  Eye,
} from "lucide-react";
import { AdminPageShell } from "@/components/educert/AdminPageShell";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import yardImage from "@/assets/drilling-engineers.jpg";

interface CourseModule {
  name: string;
  detail: string;
  type: string;
  date: string;
  time: string;
  venue: string;
  venues: string[];
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
  initials: string;
  organization: string;
  agreement: string;
  detail: string;
  quota: number;
  utilized: number;
  seats: number;
  kind: "corporate" | "public";
}

const COURSE_OPTIONS: CourseOption[] = [
  {
    id: "iwcf-l4",
    name: "Advanced Offshore Well Control IWCF Level 4 (Subsea & Surface)",
    detail: "Subsea & Surface Combined",
    deliveryMode: "Physical Yard / Hands-On Simulation",
    totalHours: 40,
    modules: [
      {
        name: "Well Control Fundamentals & Pressure Calculations",
        detail: "Classroom Theory • 8 Contact Hours",
        type: "Classroom",
        date: "2025-02-15",
        time: "08:30 – 12:30 WAT",
        venue: "PH Terminal — Classroom Block A, Rm 204",
        venues: ["PH Terminal — Classroom Block A, Rm 204", "PH Terminal — Rig Theory Theatre 1", "PH Terminal — Briefing Room 3"],
      },
      {
        name: "Subsea BOP Stack & Wellhead Equipment Drills",
        detail: "High-Pressure Simulator Bay • 10 Contact Hours",
        type: "Sim Bay",
        date: "2025-02-16",
        time: "08:30 – 16:30 WAT",
        venue: "PH Terminal — DrillSIM 5000 Cyber Chair Bay 4",
        venues: ["PH Terminal — DrillSIM 5000 Cyber Chair Bay 4", "PH Terminal — BOP Pressure Test Cell B", "PH Terminal — Subsea Simulation Pod 2"],
      },
      {
        name: "Driller's Method & Volumetric Well Kill Practicals",
        detail: "Heavy Mock Rig Floor Practicals • 12 Contact Hours",
        type: "Rig Floor",
        date: "2025-02-17",
        time: "08:00 – 17:00 WAT",
        venue: "PH Terminal — High-Pressure Simulator Bay 4",
        venues: ["PH Terminal — High-Pressure Simulator Bay 4", "PH Terminal — Rig Floor Mock-up Yard C", "PH Terminal — Choke Manifold Lab 1"],
      },
      {
        name: "IWCF Assessor Examination & Practical Assessment",
        detail: "Formal Invigilated Exam & Practical Benchmarking • 10 Contact Hours",
        type: "Exam Suite",
        date: "2025-02-19",
        time: "09:00 – 14:00 WAT",
        venue: "PH Terminal — Accredited Testing Lab B",
        venues: ["PH Terminal — Accredited Testing Lab B", "PH Terminal — Assessor Examination Suite A"],
      },
    ],
  },
  {
    id: "bosiet-ebs",
    name: "BOSIET with CA-EBS (Digital Delivery & In-Water Wet Drills)",
    detail: "Offshore Emergency & Survival",
    deliveryMode: "Physical Yard / Practical Pool",
    totalHours: 18,
    modules: [
      {
        name: "Offshore Safety & Emergency Response",
        detail: "Classroom Theory • 6 Contact Hours",
        type: "Classroom",
        date: "2025-02-22",
        time: "08:30 – 14:30 WAT",
        venue: "Warri Shorebase — Training Room 1",
        venues: ["Warri Shorebase — Training Room 1", "Warri Shorebase — Marine Operations Annex"],
      },
      {
        name: "Firefighting & Self-Rescue",
        detail: "Practical Simulation • 6 Contact Hours",
        type: "Sim Bay",
        date: "2025-02-23",
        time: "08:30 – 15:30 WAT",
        venue: "Warri Shorebase — Fire Ground",
        venues: ["Warri Shorebase — Fire Ground", "Warri Shorebase — Marine Operations Annex"],
      },
      {
        name: "Helicopter Underwater Escape Training",
        detail: "Pool Practical • 6 Contact Hours",
        type: "Pool",
        date: "2025-02-24",
        time: "08:00 – 16:00 WAT",
        venue: "Warri Shorebase — Survival Wet Bay",
        venues: ["Warri Shorebase — Survival Wet Bay", "Warri Shorebase — Training Pool"],
      },
    ],
  },
  {
    id: "mistdo",
    name: "MISTDO Inductions - Downstream Depot Certification",
    detail: "DPR / NUPRC Mandatory",
    deliveryMode: "Physical Yard / Classroom",
    totalHours: 24,
    modules: [
      {
        name: "Workplace Safety & Hazard Identification",
        detail: "Classroom Theory • 8 Contact Hours",
        type: "Classroom",
        date: "2025-03-02",
        time: "09:00 – 17:00 WAT",
        venue: "Onne Deepwater Center — Classroom 302",
        venues: ["Onne Deepwater Center — Classroom 302", "Onne Deepwater Center — Main Briefing Room"],
      },
      {
        name: "Emergency Response & Site Procedures",
        detail: "Practical Session • 8 Contact Hours",
        type: "Practical",
        date: "2025-03-03",
        time: "09:00 – 17:00 WAT",
        venue: "Onne Deepwater Center — Training Bay",
        venues: ["Onne Deepwater Center — Training Bay", "Onne Deepwater Center — Classroom 302"],
      },
      {
        name: "Assessment & Certification",
        detail: "Invigilated Assessment • 8 Contact Hours",
        type: "Exam Suite",
        date: "2025-03-04",
        time: "09:00 – 17:00 WAT",
        venue: "Onne Deepwater Center — Assessment Room",
        venues: ["Onne Deepwater Center — Assessment Room", "Onne Deepwater Center — Classroom 302"],
      },
    ],
  },
  {
    id: "iadc-wellsharp",
    name: "IADC WellSharp Supervisor Rotary Drilling Stack",
    detail: "Accredited Rotary Drilling Syllabus",
    deliveryMode: "Physical Yard / Hands-On Simulation",
    totalHours: 20,
    modules: [
      {
        name: "Drilling Operations & Risk Controls",
        detail: "Classroom Theory • 8 Contact Hours",
        type: "Classroom",
        date: "2025-03-10",
        time: "08:30 – 16:30 WAT",
        venue: "PH Terminal — Rig Theory Theatre 1",
        venues: ["PH Terminal — Rig Theory Theatre 1", "PH Terminal — Classroom Block A, Rm 204"],
      },
      {
        name: "Well Control Simulation",
        detail: "Simulator Practical • 12 Contact Hours",
        type: "Sim Bay",
        date: "2025-03-11",
        time: "08:00 – 17:00 WAT",
        venue: "PH Terminal — DrillSIM 5000 Cyber Chair Bay 4",
        venues: ["PH Terminal — DrillSIM 5000 Cyber Chair Bay 4", "PH Terminal — BOP Pressure Test Cell B"],
      },
    ],
  },
  {
    id: "h2s-alive",
    name: "H2S Alive & Breathing Apparatus Operational Refresher",
    detail: "Safety Refresher",
    deliveryMode: "Hybrid",
    totalHours: 8,
    modules: [
      {
        name: "H2S Awareness & Breathing Apparatus",
        detail: "Theory and Practical • 8 Contact Hours",
        type: "Hybrid",
        date: "2025-03-18",
        time: "08:30 – 16:30 WAT",
        venue: "Port Harcourt Terminal — Safety Training Bay",
        venues: ["Port Harcourt Terminal — Safety Training Bay", "Port Harcourt Terminal — Classroom Block A"],
      },
    ],
  },
];

const LOCATIONS = [
  { id: "ph-yard", label: "Port Harcourt Terminal / Yard (Trans-Amadi Industrial Complex)" },
  { id: "warri-base", label: "Warri Shorebase & Marine Operations Annex" },
  { id: "onne-freezone", label: "Onne Oil and Gas Free Zone (OGFTZ Platform)" },
  { id: "lagos-hub", label: "Lagos Island Marine Training Center" },
];

const INITIAL_ALLOCATIONS: SeatAllocation[] = [
  {
    id: 1,
    initials: "SH",
    organization: "Shell Nigeria (SNEPCo)",
    agreement: "SOW-2025-SNEPCO-09A",
    detail: "Deepwater Bonga Asset Drill Crew & Subsea Systems",
    quota: 50,
    utilized: 32,
    seats: 18,
    kind: "corporate",
  },
  {
    id: 2,
    initials: "CV",
    organization: "Chevron Nigeria Ltd",
    agreement: "ENG-2025-CHEV-01",
    detail: "Escravos Gas-to-Liquids Rotary Techs & Deep Drilling",
    quota: 50,
    utilized: 35,
    seats: 5,
    kind: "corporate",
  },
  {
    id: 3,
    initials: "SE",
    organization: "Open Public Enrollment",
    agreement: "Self-Funded",
    detail: "Independent Petroleum Engineers & Wellsite Consultants",
    quota: 10,
    utilized: 6,
    seats: 2,
    kind: "public",
  },
];

function SectionHeading({
  number,
  title,
  description,
  badge,
}: {
  number: string;
  title: string;
  description: string;
  badge?: string;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 pb-1">
      <div className="flex items-center gap-3">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[#006030]/10 text-sm font-bold text-[#006030]">
          {number}
        </span>
        <div>
          <h2 className="text-base font-semibold leading-tight text-[#121c2a]">{title}</h2>
          <p className="mt-1 text-xs text-[#3f4940]">{description}</p>
        </div>
      </div>
      {badge && (
        <span className="rounded-full bg-[#afeec2] px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-[#336e4b]">
          {badge}
        </span>
      )}
    </div>
  );
}

function FieldLabel({ children, htmlFor }: { children: ReactNode; htmlFor?: string }) {
  return (
    <label htmlFor={htmlFor} className="flex items-center justify-between gap-2 text-xs font-semibold text-[#121c2a]">
      {children}
    </label>
  );
}

function NativeSelect({
  value,
  onChange,
  children,
  className = "",
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={onChange}
        className={`w-full appearance-none rounded-lg border-0 bg-[#eff4ff] px-3 py-3 pr-10 text-sm text-[#121c2a] outline-none transition focus:bg-white focus:ring-2 focus:ring-[#1b7a43] ${className}`}
        {...props}
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[#3f4940]" />
    </div>
  );
}

function ActionButton({
  children,
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export default function TrainingBatchCreation() {
  const navigate = useNavigate();
  const formRef = useRef<HTMLFormElement>(null);
  const [courseId, setCourseId] = useState(COURSE_OPTIONS[0].id);
  const [batchName, setBatchName] = useState("Q1 IWCF Level 4 Rotary Drillers Training Batch A");
  const [batchCode, setBatchCode] = useState("BTCH-2025-IWCF-014");
  const [locationId, setLocationId] = useState(LOCATIONS[0].id);
  const [capacity, setCapacity] = useState(25);
  const [quorum, setQuorum] = useState(10);
  const [allocations, setAllocations] = useState(INITIAL_ALLOCATIONS);
  const [contextVisible, setContextVisible] = useState(true);
  const [nextAllocationId, setNextAllocationId] = useState(4);

  const selectedCourse = COURSE_OPTIONS.find((course) => course.id === courseId) ?? COURSE_OPTIONS[0];
  const selectedLocation = LOCATIONS.find((location) => location.id === locationId) ?? LOCATIONS[0];
  const assignedSeats = useMemo(
    () => allocations.reduce((total, allocation) => total + Math.max(0, allocation.seats), 0),
    [allocations],
  );
  const unallocatedSeats = capacity - assignedSeats;
  const totalContractQuota = allocations.reduce((total, allocation) => total + allocation.quota, 0);
  const totalCommitment = allocations.reduce((total, allocation) => total + allocation.quota, 0);
  const committedPercent = capacity ? Math.min(100, Math.round((assignedSeats / capacity) * 100)) : 0;

  const regenerateCode = () => {
    const year = new Date().getFullYear();
    const suffix = Math.floor(100 + Math.random() * 900);
    setBatchCode(`BTCH-${year}-IWCF-${suffix}`);
  };

  const setAllocationSeats = (id: number, value: number) => {
    setAllocations((current) =>
      current.map((allocation) =>
        allocation.id === id
          ? { ...allocation, seats: Math.max(0, Math.min(value, allocation.quota - allocation.utilized)) }
          : allocation,
      ),
    );
  };

  const addAllocation = () => {
    setAllocations((current) => [
      ...current,
      {
        id: nextAllocationId,
        initials: "OR",
        organization: "New Organization",
        agreement: "SOW-TBD",
        detail: "Organization training batch allocation",
        quota: 10,
        utilized: 0,
        seats: 0,
        kind: "corporate",
      },
    ]);
    setNextAllocationId((id) => id + 1);
  };

  const handleSave = (status: "Draft" | "Ready") => {
    if (status === "Ready" && !formRef.current?.reportValidity()) return;
    if (assignedSeats > capacity) {
      toast.error("Allocated seats cannot exceed the training batch capacity.");
      return;
    }
    toast.info(`${status} preview is ready. This UI prototype does not save training batch data.`);
  };

  return (
    <AdminPageShell withSidebar searchPlaceholder="Search certification, rig crew, batch...">
      <div className="min-h-full bg-[#f8f9ff] font-[Inter,sans-serif] text-[#121c2a]">
        <div className="sticky top-16 z-30 flex flex-col justify-between gap-3 bg-white/95 px-6 py-3 shadow-sm backdrop-blur-md md:flex-row md:items-center">
          <div className="flex min-w-0 flex-col gap-1">
            <div className="flex items-center gap-1 text-xs font-semibold text-[#3f4940]">
              <button type="button" onClick={() => navigate("/training/batches")} className="transition-colors hover:text-[#006030]">Batches</button>
              <ChevronRight className="h-3.5 w-3.5" />
              <span className="font-semibold text-[#006030]">Create Batch</span>
            </div>
            <div className="flex flex-wrap items-baseline gap-3">
              <h1 className="text-4xl font-bold leading-tight tracking-tight text-[#121c2a]" style={{ fontFamily: "'Work Sans', sans-serif" }}>
                Create Training Batch
              </h1>
              <span className="inline-flex items-center gap-2 rounded-full bg-[#e6eeff] px-3 py-1.5 text-xs font-semibold text-[#3f4940]">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#8a6400]" />
                Form State: Unsaved Draft
              </span>
            </div>
            <p className="max-w-3xl text-sm leading-relaxed text-[#3f4940]">
              Schedule a new training batch, configure yard venue logistics, assign certified instructors, and allocate corporate engagement quotas.
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <ActionButton type="button" onClick={() => navigate("/training/batches")} className="bg-[#eff4ff] text-[#121c2a] hover:bg-[#e6eeff]">
              <X className="h-[18px] w-[18px]" />Cancel
            </ActionButton>
            <ActionButton type="button" onClick={() => handleSave("Draft")} className="bg-[#dee9fc] text-[#006030] hover:bg-[#d9e3f6]">
              <Bookmark className="h-[18px] w-[18px]" />Save Draft
            </ActionButton>
            <ActionButton type="button" onClick={() => handleSave("Ready")} className="bg-[#1b7a43] text-white shadow-sm hover:bg-[#006030] hover:shadow">
              <BadgeCheck className="h-[18px] w-[18px]" />Save &amp; Ready
            </ActionButton>
          </div>
        </div>

        <div className="mx-auto flex w-full max-w-[1280px] flex-col gap-12 p-6">
          {contextVisible && (
            <section className="relative flex flex-col justify-between gap-4 overflow-hidden rounded-xl bg-[#eff4ff] p-6 shadow-sm sm:flex-row sm:items-center">
              <span className="absolute bottom-0 left-0 top-0 w-1.5 bg-[#1b7a43]" />
              <div className="flex items-center gap-6 pl-1">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-[#1b7a43]/10 text-[#006030]">
                  <FileText className="h-6 w-6" />
                </span>
                <div className="flex min-w-0 flex-col gap-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#006030]">Engagement Context Attached</span>
                  <p className="text-sm font-semibold text-[#121c2a]">
                    Shell Nigeria (SNEPCo) —{" "}
                    <span className="rounded bg-[#dee9fc] px-1.5 py-0.5 font-mono text-xs font-medium text-[#3f4940]">SOW-2025-SNEPCO-09A</span>
                    {" "}(Advanced Offshore Well Control IWCF Level 4)
                  </p>
                  <p className="text-xs text-[#3f4940]">Seats and accreditation criteria automatically pre-mapped to this statement of work.</p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2 self-end sm:self-center">
                <ActionButton type="button" onClick={() => toast.info("Engagement details are not connected in this UI prototype.")} className="bg-[#e6eeff] px-3 py-2 text-xs text-[#121c2a] hover:bg-[#dee9fc]">
                  <Eye className="h-4 w-4" />View SOW
                </ActionButton>
                <button type="button" aria-label="Dismiss engagement context" onClick={() => setContextVisible(false)} className="p-2 text-[#3f4940] transition-colors hover:text-red-700">
                  <X className="h-[18px] w-[18px]" />
                </button>
              </div>
            </section>
          )}

          <form
            ref={formRef}
            onSubmit={(event: FormEvent<HTMLFormElement>) => {
              event.preventDefault();
              handleSave("Ready");
            }}
            className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12"
          >
            <div className="flex flex-col gap-12 lg:col-span-8">
              <section className="flex flex-col gap-6 rounded-xl bg-white p-6 shadow-sm">
                <SectionHeading
                  number="01"
                  title="Course & Training Batch Foundation"
                  description="Standardized petroleum syllabus and identifier taxonomy."
                  badge="Accredited Rig Syllabus"
                />
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div className="flex flex-col gap-2 md:col-span-2">
                    <FieldLabel htmlFor="batch-course">
                      <span>Select Course Module <span className="text-[#ba1a1a]">*</span></span>
                      <span className="text-[11px] font-normal text-[#3f4940]">IWCF / OPITO Verified</span>
                    </FieldLabel>
                    <NativeSelect
                      id="batch-course"
                      value={courseId}
                      onChange={(event) => {
                        const course = COURSE_OPTIONS.find((option) => option.id === event.target.value);
                        setCourseId(event.target.value);
                        if (course) setBatchName("Q1 " + course.name.split(" (")[0] + " Training Batch A");
                      }}
                    >
                      {COURSE_OPTIONS.map((course) => <option key={course.id} value={course.id}>{course.name}</option>)}
                    </NativeSelect>
                  </div>

                  <div className="flex flex-col gap-2 md:col-span-2">
                    <FieldLabel htmlFor="batch-name">Training Batch Designation Name <span className="text-[#ba1a1a]">*</span></FieldLabel>
                    <Input
                      id="batch-name"
                      required
                      value={batchName}
                      onChange={(event) => setBatchName(event.target.value)}
                      className="h-auto rounded-lg border-0 bg-[#eff4ff] px-3 py-3 text-sm text-[#121c2a] shadow-none placeholder:text-[#3f4940] focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-[#1b7a43]"
                    />
                    <span className="text-[11px] text-[#3f4940]">Public designation visible to corporate sponsors and candidate certificates.</span>
                  </div>

                  <div className="flex flex-col gap-2">
                    <FieldLabel htmlFor="batch-code">
                      <span>Batch Reference ID</span>
                      <span className="font-mono text-[10px] text-[#006030]">AUTO-SYSTEM</span>
                    </FieldLabel>
                    <div className="flex items-center gap-2 rounded-lg bg-[#eff4ff] px-3 py-3 focus-within:ring-2 focus-within:ring-[#1b7a43]">
                      <Tag className="h-[18px] w-[18px] text-[#006030]" />
                      <input
                        id="batch-code"
                        type="text"
                        value={batchCode}
                        onChange={(event) => setBatchCode(event.target.value)}
                        className="w-full bg-transparent font-mono text-xs font-semibold text-[#121c2a] outline-none"
                      />
                      <button type="button" onClick={regenerateCode} className="text-[11px] font-semibold uppercase tracking-wider text-[#3f4940] hover:text-[#006030]">Regen</button>
                    </div>
                  </div>
                </div>
              </section>

              <section className="flex flex-col gap-6 rounded-xl bg-white p-6 shadow-sm">
                <SectionHeading
                  number="02"
                  title="Module Scheduling & Venue Logistics"
                  description="Configure dates, times, and venue locations for each module in this training batch."
                />

                <div className="flex items-center gap-3 rounded-xl border border-[#becabd]/30 bg-[#eff4ff] p-3">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[#1b7a43] text-white shadow-sm">
                    <ClipboardList className="h-5 w-5" />
                  </span>
                  <div className="flex min-w-0 flex-col gap-1">
                    <span className="text-xs font-bold text-[#121c2a]">{selectedCourse.deliveryMode}</span>
                    <span className="text-[11px] text-[#3f4940]">Modality defined at course specification level and locked for standardized certification compliance.</span>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <FieldLabel htmlFor="batch-location">
                    <span>Batch Primary Base / Shore Terminal <span className="text-[#ba1a1a]">*</span></span>
                    <span className="text-[11px] font-normal text-[#3f4940]">Applies default logistics to all modules</span>
                  </FieldLabel>
                  <NativeSelect id="batch-location" value={locationId} onChange={(event) => setLocationId(event.target.value)}>
                    {LOCATIONS.map((location) => <option key={location.id} value={location.id}>{location.label}</option>)}
                  </NativeSelect>
                </div>

                <div className="flex flex-col gap-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#3f4940]">
                      Course Modules Timeline &amp; Cell Assignment ({selectedCourse.modules.length} Modules)
                    </span>
                    <span className="font-mono text-[11px] font-semibold text-[#006030]">{selectedCourse.totalHours} Total Contact Hours</span>
                  </div>
                  {selectedCourse.modules.map((module, index) => (
                    <article key={`${courseId}-${module.name}`} className="flex flex-col gap-3 rounded-xl border border-[#becabd]/20 bg-[#eff4ff] p-3 shadow-sm">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex min-w-0 items-center gap-3">
                          <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[#006030]/10 text-xs font-bold text-[#006030]">{index + 1}</span>
                          <div className="min-w-0">
                            <span className="block text-sm font-bold text-[#121c2a]">{module.name}</span>
                            <span className="mt-0.5 block text-[11px] text-[#3f4940]">{module.detail}</span>
                          </div>
                        </div>
                        <span className={`shrink-0 rounded px-2 py-1 font-mono text-[10px] font-semibold uppercase ${module.type === "Classroom" ? "bg-[#dee9fc] text-[#3f4940]" : module.type === "Exam Suite" ? "bg-[#afeec2] text-[#336e4b]" : "bg-[#1b7a43]/20 text-[#006030]"}`}>
                          {module.type}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 gap-3 pt-1 sm:grid-cols-3">
                        <div className="flex flex-col gap-1.5">
                          <label htmlFor={`session-date-${index}`} className="text-[11px] font-semibold text-[#121c2a]">Session Date</label>
                          <Input id={`session-date-${index}`} type="date" defaultValue={module.date} className="h-auto rounded-lg border-0 bg-white px-3 py-2 text-xs text-[#121c2a] shadow-none focus-visible:ring-2 focus-visible:ring-[#1b7a43]" />
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label htmlFor={`session-time-${index}`} className="text-[11px] font-semibold text-[#121c2a]">Time &amp; Shift</label>
                          <Input id={`session-time-${index}`} defaultValue={module.time} className="h-auto rounded-lg border-0 bg-white px-3 py-2 text-xs text-[#121c2a] shadow-none focus-visible:ring-2 focus-visible:ring-[#1b7a43]" />
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label htmlFor={`session-venue-${index}`} className="text-[11px] font-semibold text-[#121c2a]">Assigned Venue Cell</label>
                          <NativeSelect id={`session-venue-${index}`} defaultValue={module.venue} className="rounded-lg bg-white px-3 py-2 text-xs">
                            {module.venues.map((venue) => <option key={venue}>{venue}</option>)}
                          </NativeSelect>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </section>

              <section className="flex flex-col gap-6 rounded-xl bg-white p-6 shadow-sm">
                <SectionHeading
                  number="04"
                  title="Capacity"
                  description="Configure automated gating thresholds to govern simulator seat allocations."
                />
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="flex flex-col gap-2 rounded-xl bg-[#eff4ff] p-3">
                    <FieldLabel htmlFor="capacity">
                      <span>Maximum Capacity <span className="text-[#ba1a1a]">*</span></span>
                      <span className="font-bold text-[#006030]">{capacity} Seats Total</span>
                    </FieldLabel>
                    <div className="flex items-center gap-3">
                      <Input
                        id="capacity"
                        type="number"
                        min={1}
                        max={40}
                        required
                        value={capacity}
                        onChange={(event) => setCapacity(Math.max(1, Number(event.target.value) || 1))}
                        className="h-auto w-28 rounded-lg border-0 bg-white px-3 py-2 text-center text-xl font-bold text-[#121c2a] shadow-none focus-visible:ring-2 focus-visible:ring-[#1b7a43]"
                      />
                      <span className="text-xs leading-tight text-[#3f4940]">Hard registration limit. Portal will prevent over-subscription once {capacity} candidate slots are confirmed.</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 rounded-xl bg-[#eff4ff] p-3">
                    <FieldLabel htmlFor="quorum">
                      <span>Minimum Quorum Threshold</span>
                      <span className="font-bold text-[#6c4d00]">{quorum} Trainees Req.</span>
                    </FieldLabel>
                    <div className="flex items-center gap-3">
                      <Input
                        id="quorum"
                        type="number"
                        min={1}
                        max={capacity}
                        value={quorum}
                        onChange={(event) => setQuorum(Math.max(1, Math.min(capacity, Number(event.target.value) || 1)))}
                        className="h-auto w-28 rounded-lg border-0 bg-white px-3 py-2 text-center text-xl font-bold text-[#121c2a] shadow-none focus-visible:ring-2 focus-visible:ring-[#1b7a43]"
                      />
                      <span className="text-xs leading-tight text-[#3f4940]">Threshold for operational mobilization. Batch triggers auto-alert to Lead Assessor 48 hrs prior if unfulfilled.</span>
                    </div>
                  </div>
                </div>
              </section>

              <section className="flex flex-col gap-6 rounded-xl bg-white p-6 shadow-sm">
                <div className="flex flex-col justify-between gap-4 border-b border-[#becabd]/20 pb-3 sm:flex-row sm:items-center">
                  <div className="flex items-center gap-4">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[#006030]/10 text-base font-bold text-[#006030]">05</span>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-base font-semibold leading-tight text-[#121c2a]">Multi-Organization Seat Allocation</h2>
                        <span className="rounded bg-[#1b7a43]/10 px-2 py-1 text-[11px] font-bold text-[#006030]">Quotas &amp; SOWs</span>
                      </div>
                      <p className="mt-1 text-xs text-[#3f4940]">Associate this training batch's seats with commercial corporate SOW quotas or open enrollment streams.</p>
                    </div>
                  </div>
                  <ActionButton type="button" onClick={addAllocation} className="self-start bg-[#1b7a43] text-xs text-white shadow-sm hover:bg-[#006030] sm:self-auto">
                    <Plus className="h-[18px] w-[18px]" />+ Add Corporate Allocation
                  </ActionButton>
                </div>

                <div className="flex flex-col gap-3 rounded-xl border border-[#becabd]/30 bg-[#eff4ff] p-3 shadow-sm">
                  <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="flex items-center gap-2">
                        <Users className="h-5 w-5 text-[#006030]" />
                        <span className="text-xs font-bold uppercase tracking-wide text-[#121c2a]">Capacity Distribution:</span>
                        <span className="font-mono text-sm font-bold text-[#121c2a]">{assignedSeats} / {capacity} Seats Allocated</span>
                      </div>
                      <span className="inline-flex items-center gap-1.5 rounded border border-[#1b7a43]/20 bg-[#1b7a43]/10 px-2 py-1 font-mono text-[11px] font-semibold text-[#006030]">
                        <Handshake className="h-3.5 w-3.5" />Total SOW Trainees Agreed Across Contracts: {totalCommitment} Trainees
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-[#afeec2] px-3 py-1 text-[11px] font-bold text-[#336e4b]">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#006030]" />{committedPercent}% Fully Committed
                      </span>
                      <span className="rounded-full bg-[#dee9fc] px-3 py-1 text-[11px] font-semibold text-[#3f4940]">{Math.max(0, unallocatedSeats)} Unallocated</span>
                    </div>
                  </div>
                  <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-white shadow-sm">
                    {allocations.map((allocation) => (
                      <div
                        key={allocation.id}
                        title={`${allocation.organization}: ${allocation.seats} seats`}
                        className={`h-full transition-all ${allocation.kind === "public" ? "bg-[#fcbc22]" : allocation.id === 1 ? "bg-[#1b7a43]" : "bg-[#2f6947]"}`}
                        style={{ width: `${capacity ? (allocation.seats / capacity) * 100 : 0}%` }}
                      />
                    ))}
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#becabd]/20 pt-2 text-[11px] text-[#3f4940]">
                    <div className="flex flex-wrap gap-x-4 gap-y-1.5">
                      {allocations.map((allocation) => (
                        <span key={allocation.id} className="inline-flex items-center gap-1.5 font-medium text-[#121c2a]">
                          <span className={`h-2 w-2 rounded-full ${allocation.kind === "public" ? "bg-[#fcbc22]" : allocation.id === 1 ? "bg-[#1b7a43]" : "bg-[#2f6947]"}`} />
                          {allocation.organization} ({allocation.seats} seats • {capacity ? Math.round((allocation.seats / capacity) * 100) : 0}% batch • {allocation.quota ? Math.round((allocation.seats / allocation.quota) * 100) : 0}% SOW)
                        </span>
                      ))}
                    </div>
                    <span className="inline-flex items-center gap-1.5 font-bold text-[#006030]"><CircleCheck className="h-3.5 w-3.5" />Ready for Roster Mapping</span>
                  </div>
                </div>

                <div className="overflow-hidden rounded-xl border border-[#becabd]/30 bg-white shadow-sm">
                  <div className="hidden grid-cols-12 gap-3 border-b border-[#becabd]/20 bg-[#dee9fc]/60 px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-[#3f4940] md:grid">
                    <div className="col-span-4">Organization &amp; Contract SOW</div>
                    <div className="col-span-2">Agreed Trainees / Contract Quota</div>
                    <div className="col-span-2">Previously Trained / Utilized</div>
                    <div className="col-span-1 text-center">Remaining Quota</div>
                    <div className="col-span-2 text-center">Assigned This Batch</div>
                    <div className="col-span-1 text-right">Action</div>
                  </div>
                  {allocations.map((allocation) => {
                    const remaining = Math.max(0, allocation.quota - allocation.utilized);
                    const utilization = allocation.quota ? Math.round((allocation.utilized / allocation.quota) * 100) : 0;
                    return (
                      <div key={allocation.id} className="grid grid-cols-1 items-center gap-3 border-b border-[#becabd]/20 px-4 py-4 transition-colors last:border-0 hover:bg-[#eff4ff] md:grid-cols-12">
                        <div className="flex min-w-0 items-center gap-3 md:col-span-4">
                          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[#8a6400]/20 text-xs font-bold text-[#6c4d00] shadow-sm">{allocation.initials}</span>
                          <div className="flex min-w-0 flex-col">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="text-xs font-bold text-[#121c2a]">{allocation.organization}</span>
                              <span className="rounded bg-[#e6eeff] px-1.5 py-0.5 font-mono text-[10px] font-semibold text-[#3f4940]">{allocation.agreement}</span>
                            </div>
                            <span className="truncate text-[11px] text-[#3f4940]">{allocation.detail}</span>
                          </div>
                        </div>
                        <div className="flex flex-col gap-1 md:col-span-2">
                          <span className="flex items-center gap-1.5 font-mono text-xs font-bold text-[#121c2a]"><FileText className="h-3.5 w-3.5 text-[#006030]" />{allocation.quota} Agreed Trainees</span>
                          <span className="text-[10px] leading-tight text-[#3f4940]">SLA SOW Commitment</span>
                        </div>
                        <div className="flex flex-col gap-1.5 md:col-span-2">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-[#3f4940]">{allocation.utilized} completed</span>
                            <span className="font-mono text-[10px] font-semibold text-[#121c2a]">{utilization}%</span>
                          </div>
                          <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#dee9fc]">
                            <div className="h-full bg-[#006030]" style={{ width: `${utilization}%` }} />
                          </div>
                        </div>
                        <div className="flex items-center justify-between md:col-span-1 md:flex-col md:justify-center">
                          <span className="font-mono text-xs font-bold text-[#006030]">{remaining} left</span>
                          <span className="text-[10px] text-[#3f4940]">Available</span>
                        </div>
                        <div className="flex items-center justify-between md:col-span-2 md:justify-center">
                          <span className="text-xs font-medium text-[#3f4940] md:hidden">Assigned this batch</span>
                          <div className="flex items-center overflow-hidden rounded-lg border border-[#becabd]/30 bg-white shadow-sm">
                            <button type="button" title="Decrease seats" onClick={() => setAllocationSeats(allocation.id, allocation.seats - 1)} className="flex h-7 w-7 items-center justify-center text-xs font-bold text-[#3f4940] transition-colors hover:bg-[#dee9fc] hover:text-[#121c2a]"><Minus className="h-3 w-3" /></button>
                            <input
                              aria-label={`Seats assigned to ${allocation.organization}`}
                              type="number"
                              min={0}
                              max={remaining}
                              value={allocation.seats}
                              onChange={(event) => setAllocationSeats(allocation.id, Number(event.target.value))}
                              className="h-7 w-10 bg-transparent text-center text-xs font-bold text-[#006030] outline-none"
                            />
                            <button type="button" title="Increase seats" onClick={() => setAllocationSeats(allocation.id, allocation.seats + 1)} className="flex h-7 w-7 items-center justify-center text-xs font-bold text-[#3f4940] transition-colors hover:bg-[#dee9fc] hover:text-[#121c2a]"><Plus className="h-3 w-3" /></button>
                          </div>
                        </div>
                        <div className="flex items-center justify-between md:col-span-1 md:justify-end">
                          <span className="text-xs font-medium text-[#3f4940] md:hidden">Action</span>
                          <button type="button" aria-label={`Remove ${allocation.organization}`} onClick={() => setAllocations((current) => current.filter((item) => item.id !== allocation.id))} className="p-2 text-[#3f4940] transition-colors hover:text-red-700">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#becabd]/20 bg-[#eff4ff] px-4 py-3 text-xs">
                    <span className="font-bold text-[#121c2a]">Total training batch seats allocated: {assignedSeats} / {capacity}</span>
                    <span className="font-mono font-semibold text-[#006030]">{totalContractQuota} trainees agreed across contracts</span>
                  </div>
                </div>
              </section>
            </div>

            <aside className="flex flex-col gap-6 lg:col-span-4">
              <section className="flex flex-col overflow-hidden rounded-xl bg-white shadow-sm">
                <div className="relative h-44 w-full">
                  <img src={yardImage} alt="Oil and gas engineers working at an industrial drilling rig" className="h-full w-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#27313f]/80 via-transparent to-transparent" />
                  <div className="absolute bottom-3 left-3 right-3 text-white">
                    <span className="rounded bg-[#006030] px-2 py-1 text-[10px] font-bold uppercase tracking-wider">Yard Inspection Verified</span>
                    <h3 className="mt-2 text-sm font-bold text-white" style={{ fontFamily: "'Work Sans', sans-serif" }}>{selectedLocation.id === "ph-yard" ? "Port Harcourt High-Pressure Bay 4" : selectedLocation.label.split(" / ")[0]}</h3>
                  </div>
                </div>
                <div className="flex flex-col gap-3 p-6">
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="text-[#3f4940]">Facility Rating</span>
                    <span className="flex items-center gap-1.5 font-semibold text-[#121c2a]"><BadgeCheck className="h-4 w-4 text-[#6c4d00]" />IWCF Class A Certified</span>
                  </div>
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="text-[#3f4940]">Simulator Type</span>
                    <span className="text-right font-semibold text-[#121c2a]">DrillSIM 5000 Cyber Chair</span>
                  </div>
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="text-[#3f4940]">Assessor Ratio</span>
                    <span className="text-right font-semibold text-[#121c2a]">1 : 8 (Safety Mandate Compliant)</span>
                  </div>
                </div>
              </section>

              <section className="flex flex-col gap-2 rounded-xl bg-[#dee9fc]/60 p-6">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#006030]">
                  <Gavel className="h-4 w-4" />NUPRC &amp; IWCF Audit Standard
                </div>
                <p className="text-xs leading-relaxed text-[#3f4940]">
                  All candidates must have verifiable NOGIC JQS candidate registration numbers submitted at least 48 hours prior to start date for certification filing.
                </p>
              </section>
            </aside>

            <div className="flex flex-col justify-between gap-4 rounded-xl bg-white p-6 shadow-md sm:flex-row sm:items-center lg:col-span-12">
              <div className="flex flex-col">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[#3f4940]">Lifecycle State</span>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#8a6400]" />
                  <span className="text-sm font-bold text-[#121c2a]">Draft Training Batch</span>
                  <span className="text-xs text-[#3f4940]">(Not yet visible in Candidate Self-Service)</span>
                </div>
              </div>
              <div className="flex w-full flex-wrap justify-end gap-2 sm:w-auto">
                <ActionButton type="button" onClick={() => navigate("/training/batches")} className="bg-[#eff4ff] text-[#121c2a] hover:bg-[#e6eeff]">
                  <X className="h-[18px] w-[18px]" />Cancel
                </ActionButton>
                <ActionButton type="button" onClick={() => handleSave("Draft")} className="bg-[#dee9fc] text-[#006030] hover:bg-[#d9e3f6]">
                  <Save className="h-[18px] w-[18px]" />Save Draft
                </ActionButton>
                <ActionButton type="submit" onClick={(event) => {
                  event.preventDefault();
                  handleSave("Ready");
                }} className="bg-[#1b7a43] px-6 text-white shadow-md hover:bg-[#006030] hover:shadow-lg">
                  <Rocket className="h-[18px] w-[18px]" />Save &amp; Ready
                </ActionButton>
              </div>
            </div>
          </form>
        </div>
      </div>
    </AdminPageShell>
  );
}
