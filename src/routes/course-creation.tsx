import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AdminPageShell } from "@/components/educert/AdminPageShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Trash2,
  BookOpen,
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Quote,
  Link2,
  Table,
  Monitor,
  Building2,
  Share2,
  Shield,
  ShieldCheck,
  Info,
  Star,
  Clock,
  MapPin,
  Users,
  Award,
  RefreshCw,
  FileText,
  Trash,
  Save,
  Layers,
  ChevronDown,
  ChevronUp,
  Upload,
  PieChart,
  Lightbulb,
  Route,
  Pencil,
  GripVertical,
  QrCode,
  Lock,
  Fingerprint,
  Smartphone,
  Sparkles,
} from "lucide-react";
import { createCourse, fetchCourses } from "@/lib/courses";
import type { CourseModule, CourseRecord } from "@/lib/courses";
import {
  buildCoursePayload,
  calculateTotalModuleHours,
  fileToBase64,
} from "@/lib/course-submission";
import {
  buildSampleCourse,
  createDemoThumbnailFile,
} from "@/lib/course-autofill";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  collectStepErrors as collectSchemaErrors,
  collectModuleErrors,
  type FieldErrors,
} from "@/lib/course-creation-validation";

const COURSE_CATEGORIES = [
  "HSF & Safety",
  "Technical & Engineering",
  "Emergency & First Aid",
  "Fire Safety",
  "Oil & Gas / Downstream Operations",
  "Other",
];

const TIERS = ["FOUNDATION", "INTERMEDIATE", "ADVANCED"];

const CERTIFICATE_TEMPLATES = [
  {
    id: "gold-foil",
    name: "Gokly Industrial Gold Foil & Guilloche Standard",
    description: "Premium gold foil design with guilloche patterns",
    image: "/certificates/gold-foil-template.svg",
    preview: "Certificate with gold foil border and guilloche security patterns"
  },
  {
    id: "classic-blue",
    name: "Classic Blue Professional",
    description: "Traditional blue border with professional layout",
    image: "/certificates/classic-blue-template.svg",
    preview: "Classic blue certificate with professional styling"
  },
  {
    id: "modern-minimal",
    name: "Modern Minimal",
    description: "Clean, minimalist design for contemporary courses",
    image: "/certificates/modern-minimal-template.svg",
    preview: "Modern minimalist certificate design"
  },
  {
    id: "corporate-elegant",
    name: "Corporate Elegant",
    description: "Sophisticated design for corporate training programs",
    image: "/certificates/corporate-elegant-template.svg",
    preview: "Elegant corporate certificate design"
  },
  {
    id: "technical-precision",
    name: "Technical Precision",
    description: "Grid-based design for technical certifications",
    image: "/certificates/technical-precision-template.svg",
    preview: "Technical certificate with precision grid layout"
  },
] as const;

const EXTERNAL_CERT_AUTHORITIES = [
  {
    value: "NMDPRA",
    label: "NMDPRA — Nigerian Midstream and Downstream Petroleum Regulatory Authority",
    portal: "https://www.nmdpra.gov.ng",
    hint: "MISTDO courses: generation & official validation are strictly controlled by NMDPRA.",
  },
] as const;

const isMistdoCourse = (title: string, code: string) =>
  /mistdo/i.test(`${title || ""} ${code || ""}`);

/* Frontend-only enum of the expected external certification courses that can
   gate enrollment when Prerequisite Type = "External Certification".
   TODO: replace with the dedicated external-certifications module when it
   lands; until then the selection is stored in prerequisite_description. */
const EXTERNAL_PREREQUISITE_COURSES = [
  "IWCF Level 4 — Well Control Certification",
  "IADC WellSharp — Well Control",
  "H2S Alive / H2S Awareness",
  "BOSIET / HUET — Offshore Safety Induction",
  "Sea Survival & Personal Survival Techniques",
  "Fire Fighting & Fire Warden",
  "First Aid, CPR & AED",
  "Confined Space Entry & Rescue",
  "Working at Height & Fall Arrest",
  "NEBOSH International General Certificate (IGC)",
  "IOSH Managing Safely",
  "MISTDO — Downstream Safety Training",
];

/* First two (max 4-char) words of a course name, uppercased and hyphenated:
   "Fire Safety Training" -> "FIRE-SAFE". */
const titleWords = (title: string) =>
  title
    .replace(/[^a-zA-Z0-9 ]/g, "")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w.slice(0, 4).toUpperCase())
    .join("-");

/* Derive the GOK taxonomy code from a course name: GOK-WORD-WORD-NNN.
   The 3-digit serial is carried over from the previous code (unless a fresh
   one is requested) so live typing only changes the word part and the code
   never flickers. */
const buildCourseCode = (title: string, previousCode = "", freshSerial = false) => {
  const base = titleWords(title) || "GOK";
  const serial = freshSerial
    ? String(Math.floor(100 + Math.random() * 900))
    : /\d{3}$/.exec(previousCode)?.[0] ?? String(Math.floor(100 + Math.random() * 900));
  return `GOK-${base}-${serial}`;
};

/* Certificate ID prefix suggested from the course name: "FIRE-SAFE". */
const deriveIdPrefix = (title: string) => titleWords(title);

/* One-click certificate validity presets — each sets duration + unit together. */
const CERTIFICATE_DURATION_PRESETS = [
  { label: "6 months", duration: 6, unit: "Months" },
  { label: "1 year", duration: 1, unit: "Years" },
  { label: "2 years", duration: 2, unit: "Years" },
  { label: "3 years", duration: 3, unit: "Years" },
  { label: "5 years", duration: 5, unit: "Years" },
  { label: "10 years", duration: 10, unit: "Years" },
];

/* Normalise a stored duration + unit to months so the matching preset lights up. */
const validityDurationInMonths = (duration: number, unit: string) => {
  const u = (unit || "").toLowerCase();
  if (u.startsWith("day")) return Math.round(duration / 30);
  if (u.startsWith("year")) return duration * 12;
  return duration;
};

/* "2 Years" -> "2 years", "1 Year" -> "1 year" (never "yearss"). */
const formatValidityDuration = (duration: number, unit: string) => {
  const singular = (unit || "").split(" ")[0].toLowerCase().replace(/s$/, "");
  return `${duration} ${duration === 1 ? singular : `${singular}s`}`;
};

/* Inline red message rendered directly under a field that failed validation. */
function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p role="alert" className="flex items-start gap-1.5 text-[12px] font-medium text-rose-600">
      <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
      <span>{message}</span>
    </p>
  );
}

const DELIVERY_TYPES = [
  { value: "theory", label: "Theory" },
  { value: "practical", label: "Practical" },
  { value: "both", label: "Theory + Practical" },
] as const;

const DELIVERY_MODES = [
  {
    value: "PHYSICAL",
    label: "Physical Classroom",
    helper: "Instructor-led onsite campus lectures only",
    icon: Building2,
  },
  {
    value: "ONLINE",
    label: "Online E-learning",
    helper: "Fully online learning and assessment",
    icon: Monitor,
  },
  {
    value: "HYBRID",
    label: "Hybrid (Online + Physical)",
    helper: "Combines online learning with in-person sessions",
    icon: Share2,
  },
];

const STEPS = [
  { id: 1, label: "Basic Info" },
  { id: 2, label: "Modules & Assessments" },
  { id: 3, label: "Final Assessment" },
  { id: 4, label: "Completion Rules" },
  { id: 5, label: "Certificate" },
  { id: 6, label: "Review" },
];

const MODULE_ASSESSMENT_TYPES = [
  { value: "written", label: "Written Examination" },
  { value: "mcq", label: "Multiple Choice (Auto-graded)" },
  { value: "practical", label: "Practical / Rig Simulator" },
  { value: "oral", label: "Oral Examination / Defense" },
  { value: "trainer", label: "Trainer Field Evaluation" },
  { value: "other", label: "Other Compliance Criteria" },
] as const;

const DEFAULT_MODULE_ASSESSMENT = {
  assessment_type: "mcq",
  assessment_max_score: 100,
  assessment_pass_mark: 75,
  assessment_attempts_allowed: 3,
  assessment_required: true,
  assessment_description: "",
};

type FormData = {
  title: string;
  code: string;
  category: string;
  short_description: string;
  description: string;
  tier: string;
  duration_value: number;
  duration_unit: string;
  delivery_mode: string;
  status: string;
  min_class_size: number | null;
  max_class_size: number | null;
  prerequisite_required: boolean;
  prerequisite_type: "internal" | "external";
  prerequisite_course_id: number | null;
  prerequisite_description: string;
  individual_enrollment_enabled: boolean;
  certificate_enabled: boolean;
  // Certificate step (Step 5) — credential automation + template binding.
  // `certificate_enabled` gates issuance; the design fields below drive the
  // live preview + ID syntax builder (frontend-only until backend columns land).
  certificate_title: string;
  certificate_template: string;
  certificate_issuance_mode: "automatic" | "manual";
  certificate_validity_framework: string;
  certificate_validity_duration: number;
  certificate_validity_unit: string;
  certificate_id_prefix: string;
  certificate_id_separator: string;
  certificate_id_year_schema: string;
  certificate_id_sequence_type: string;
  // External certificate generation/validation (e.g. MISTDO, NMDPRA).
  certificate_external: boolean;
  certificate_authority: string;
  certificate_license_id: string;
  certificate_portal_url: string;
  thumbnail_url: string;
  thumbnail_file: File | null;
  modules: CourseModule[];
  expandedModules: number[];
  // Completion requirements
  attendance_required: boolean;
  attendance_percentage: number;
  strict_attendance: boolean;
  minimum_contact_hours: number;
  module_completion_mode: string;
  assessment_required: boolean;
  theory_passing_score: number;
  practical_required: boolean;
  sequential_progression: boolean;
  // Final overall assessment (Step 3); a non-null assessment means it is enabled.
  final_assessment: Assessment | null;
  // Assessments (module-level ones are edited inline in Step 2 via the module
  // payload; this array holds the sync'd module assessments + the final one)
  assessments: Assessment[];
};

type Assessment = {
  id: string;
  name: string;
  type: string;
  module_association: string;
  description: string;
  max_score: number;
  pass_mark: number;
  attempts_allowed: number;
  required: boolean;
};

/* ---------------------------------- bits ---------------------------------- */

function FinalAssessmentForm({ value, onChange, courseTitle, errors }: {
  value: Assessment;
  onChange: (field: keyof Assessment, v: any) => void;
  courseTitle: string;
  errors?: FieldErrors;
}) {
  const errCls = (field: string, base: string) =>
    errors?.[field] ? `${base} border-rose-500 focus-visible:ring-rose-500` : base;
  const [formData, setFormData] = useState({
    name: value.name,
    type: value.type,
    description: value.description,
    max_score: value.max_score,
    pass_mark: value.pass_mark,
    attempts_allowed: value.attempts_allowed,
    required: value.required,
  });

  // Keep the local editor in sync when the gate re-creates the final object.
  useEffect(() => {
    setFormData({
      name: value.name,
      type: value.type,
      description: value.description,
      max_score: value.max_score,
      pass_mark: value.pass_mark,
      attempts_allowed: value.attempts_allowed,
      required: value.required,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value.id]);

  const set = (field: keyof typeof formData, v: any) => {
    setFormData((prev) => ({ ...prev, [field]: v }));
    onChange(field as keyof Assessment, v);
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Assessment Name */}
      <div className="flex flex-col gap-1.5">
        <Label className="text-sm font-medium text-slate-700 flex items-center justify-between">
          <span>Final Assessment Name <span className="text-red-500">*</span></span>
          <span className="text-[11px] text-slate-400">Capstone / whole-course evaluation</span>
        </Label>
        <Input
          placeholder={courseTitle?.trim() ? `${courseTitle.trim()} — Final Assessment` : "e.g. Final Capstone Examination"}
          value={formData.name}
          onChange={(e) => set("name", e.target.value)}
          className={errCls("final_assessment.name", "h-11 border-slate-200 bg-slate-50/70 text-sm")}
          required
        />
        <FieldError message={errors?.["final_assessment.name"]} />
      </div>

      {/* Type */}
      <div className="flex flex-col gap-1.5">
        <Label className="text-sm font-medium text-slate-700">
          Assessment Type <span className="text-red-500">*</span>
        </Label>
        <Select
          value={formData.type}
          onValueChange={(v) => set("type", v)}
        >
          <SelectTrigger className="h-11 border-slate-200 bg-slate-50/70 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {MODULE_ASSESSMENT_TYPES.map((t) => (
              <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Description */}
      <div className="flex flex-col gap-1.5">
        <Label className="text-sm font-medium text-slate-700 flex items-center justify-between">
          <span>Description & Grading Rubric</span>
          <span className="text-[11px] text-slate-400">Visible to assessors and candidate briefing</span>
        </Label>
        <Textarea
          placeholder="Assessment guidelines, rubric, and focus areas..."
          rows={3}
          value={formData.description}
          onChange={(e) => set("description", e.target.value)}
          className="border-slate-200 bg-slate-50/70 text-sm resize-none"
        />
      </div>

      {/* Score, Pass Mark, Attempts */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="flex flex-col gap-1.5">
          <Label className="text-sm font-medium text-slate-700">Maximum Score</Label>
          <div className="relative flex items-center">
            <Input
              type="number"
              value={formData.max_score === 0 || formData.max_score === undefined || formData.max_score === null ? "" : formData.max_score}
              onChange={(e) => {
                const value = e.target.value;
                if (value === "") {
                  set("max_score", 0);
                } else {
                  const numValue = parseInt(value);
                  if (!isNaN(numValue)) {
                    set("max_score", numValue);
                  }
                }
              }}
              onBlur={(e) => {
                const value = parseInt(e.target.value);
                if (isNaN(value) || value === 0) {
                  set("max_score", 100);
                } else {
                  set("max_score", value);
                }
              }}
              className={errCls("final_assessment.max_score", "h-11 border-slate-200 bg-slate-50/70 text-sm pr-12")}
            />
            <span className="absolute right-3 text-[12px] text-slate-400 font-bold">PTS</span>
          </div>
          <FieldError message={errors?.["final_assessment.max_score"]} />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label className="text-sm font-medium text-slate-700">Pass Mark / Cutoff</Label>
          <div className="relative flex items-center">
            <Input
              type="number"
              value={formData.pass_mark === 0 || formData.pass_mark === undefined || formData.pass_mark === null ? "" : formData.pass_mark}
              onChange={(e) => {
                const value = e.target.value;
                if (value === "") {
                  set("pass_mark", 0);
                } else {
                  const numValue = parseInt(value);
                  if (!isNaN(numValue)) {
                    set("pass_mark", numValue);
                  }
                }
              }}
              onBlur={(e) => {
                const value = parseInt(e.target.value);
                if (isNaN(value) || value === 0) {
                  set("pass_mark", 75);
                } else {
                  set("pass_mark", value);
                }
              }}
              className="h-11 border-slate-200 bg-slate-50/70 text-sm pr-10"
            />
            <span className="absolute right-3 text-[13px] text-slate-400 font-bold">%</span>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label className="text-sm font-medium text-slate-700">Attempts Allowed</Label>
          <Select
            value={formData.attempts_allowed.toString()}
            onValueChange={(value) => set("attempts_allowed", value === "unlimited" ? 999 : parseInt(value))}
          >
            <SelectTrigger className="h-11 border-slate-200 bg-slate-50/70 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">1 Attempt (Strict)</SelectItem>
              <SelectItem value="2">2 Attempts</SelectItem>
              <SelectItem value="3">3 Attempts (Standard)</SelectItem>
              <SelectItem value="5">5 Attempts</SelectItem>
              <SelectItem value="unlimited">Unlimited (Practice)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Required Checkbox */}
      <div className="flex items-start gap-3 p-3.5 rounded-lg bg-slate-50">
        <Checkbox
          id="required-assessment"
          checked={formData.required}
          onCheckedChange={(checked) => set("required", checked)}
        />
        <label htmlFor="required-assessment" className="flex flex-col cursor-pointer">
          <span className="text-sm font-semibold text-slate-700">Required for Course Completion</span>
          <span className="text-[12px] text-slate-500">Candidates cannot claim regulatory certification without achieving pass mark.</span>
        </label>
      </div>
    </div>
  );
}

function ModAssessmentFields({ index, module, updateModule, errors }: {
  index: number;
  module: CourseModule;
  updateModule: (index: number, field: keyof CourseModule, value: any) => void;
  errors?: FieldErrors;
}) {
  const errCls = (field: string, base: string) =>
    errors?.[field] ? `${base} border-rose-500 focus-visible:ring-rose-500` : base;
  return (
    <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-12">
      <div className="flex flex-col gap-1.5 md:col-span-6">
        <Label className="text-sm font-semibold text-slate-700">Assessment Type</Label>
        <Select
          value={module.assessment_type || "mcq"}
          onValueChange={(v) => updateModule(index, "assessment_type", v)}
        >
          <SelectTrigger className="h-10 bg-white text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {MODULE_ASSESSMENT_TYPES.map((t) => (
              <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-col gap-1.5 md:col-span-2">
        <Label className="text-sm font-semibold text-slate-700">Max Score</Label>
        <div className="relative">
          <Input
            type="number"
            min={1}
            value={(module.assessment_max_score ?? 100) === 0 || (module.assessment_max_score ?? 100) === undefined || (module.assessment_max_score ?? 100) === null ? "" : module.assessment_max_score ?? 100}
            onChange={(e) => {
              const value = e.target.value;
              if (value === "") {
                updateModule(index, "assessment_max_score", 0);
              } else {
                const numValue = parseInt(value);
                if (!isNaN(numValue)) {
                  updateModule(index, "assessment_max_score", numValue);
                }
              }
            }}
            onBlur={(e) => {
              const value = parseInt(e.target.value);
              if (isNaN(value) || value === 0) {
                updateModule(index, "assessment_max_score", 100);
              } else {
                updateModule(index, "assessment_max_score", Math.max(1, value));
              }
            }}
            className={errCls(`modules.${index}.assessment_max_score`, "h-10 bg-white pr-10 text-sm")}
          />
          <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] font-bold text-slate-400">PTS</span>
        </div>
        <FieldError message={errors?.[`modules.${index}.assessment_max_score`]} />
      </div>
      <div className="flex flex-col gap-1.5 md:col-span-2">
        <Label className="text-sm font-semibold text-slate-700">Pass Mark</Label>
        <div className="relative">
          <Input
            type="number"
            min={0}
            max={100}
            value={(module.assessment_pass_mark ?? 75) === 0 || (module.assessment_pass_mark ?? 75) === undefined || (module.assessment_pass_mark ?? 75) === null ? "" : module.assessment_pass_mark ?? 75}
            onChange={(e) => {
              const value = e.target.value;
              if (value === "") {
                updateModule(index, "assessment_pass_mark", 0);
              } else {
                const numValue = parseInt(value);
                if (!isNaN(numValue)) {
                  updateModule(index, "assessment_pass_mark", numValue);
                }
              }
            }}
            onBlur={(e) => {
              const value = parseInt(e.target.value);
              if (isNaN(value) || value === 0) {
                updateModule(index, "assessment_pass_mark", 75);
              } else {
                updateModule(index, "assessment_pass_mark", Math.min(100, Math.max(0, value)));
              }
            }}
            className={errCls(`modules.${index}.assessment_pass_mark`, "h-10 bg-white pr-8 text-sm")}
          />
          <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] font-bold text-slate-400">%</span>
        </div>
        <FieldError message={errors?.[`modules.${index}.assessment_pass_mark`]} />
      </div>
      <div className="flex flex-col gap-1.5 md:col-span-2">
        <Label className="text-sm font-semibold text-slate-700">Attempts</Label>
        <Select
          value={String(module.assessment_attempts_allowed ?? 3)}
          onValueChange={(v) => updateModule(index, "assessment_attempts_allowed", parseInt(v))}
        >
          <SelectTrigger className="h-10 bg-white text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">1</SelectItem>
            <SelectItem value="2">2</SelectItem>
            <SelectItem value="3">3</SelectItem>
            <SelectItem value="5">5</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-col gap-1.5 md:col-span-12">
        <Label className="text-sm font-semibold text-slate-700">Rubric / Instructions</Label>
        <Textarea
          value={module.assessment_description || ""}
          onChange={(e) => updateModule(index, "assessment_description", e.target.value)}
          placeholder="e.g. Verify wellhead isolation valve gauges within 90 seconds…"
          rows={2}
          className="resize-none bg-white text-sm"
        />
      </div>
      <div className="flex items-center gap-2 md:col-span-12">
        <Checkbox
          id={`module-assessment-required-${index}`}
          checked={module.assessment_required !== false}
          onCheckedChange={(checked) => updateModule(index, "assessment_required", checked)}
        />
        <Label htmlFor={`module-assessment-required-${index}`} className="cursor-pointer select-none text-sm font-medium text-slate-700">
          Required for course completion
        </Label>
      </div>
    </div>
  );
}

function ExternalCertCard({ external, authority, licenseId, portalUrl, onToggleExternal, onAuthority, onLicense, onPortal, errors }: {
  external: boolean;
  authority: string;
  licenseId: string;
  portalUrl: string;
  onToggleExternal: (v: boolean) => void;
  onAuthority: (v: string) => void;
  onLicense: (v: string) => void;
  onPortal: (v: string) => void;
  errors?: FieldErrors;
}) {
  const errCls = (field: string, base: string) =>
    errors?.[field] ? `${base} border-rose-500 focus-visible:ring-rose-500` : base;
  const known = EXTERNAL_CERT_AUTHORITIES.find((a) => a.value === (authority || "NMDPRA"));
  return (
    <SectionCard
      icon={Award}
      title="Certificate Generation & Validation"
      subtitle="Choose how certificates are generated and validated for this course"
    >
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          {/* Internal Option */}
          <button
            type="button"
            onClick={() => onToggleExternal(false)}
            className={`relative p-5 rounded-xl border transition-all text-left group ${
              !external
                ? "border-emerald-200 bg-gradient-to-br from-emerald-50 to-white shadow-sm"
                : "border-slate-200 bg-white hover:border-emerald-200 hover:shadow-sm"
            }`}
          >
            {!external && (
              <div className="absolute -top-2 -right-2">
                <div className="bg-emerald-500 text-white rounded-full p-1 shadow-md">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
              </div>
            )}
            <div className="flex items-start gap-3">
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-colors ${
                !external ? "bg-emerald-100" : "bg-slate-100 group-hover:bg-emerald-50"
              }`}>
                <ShieldCheck className={`h-5 w-5 transition-colors ${!external ? "text-emerald-600" : "text-slate-400 group-hover:text-emerald-500"}`} />
              </div>
              <div className="flex-1">
                <h4 className={`font-semibold transition-colors ${!external ? "text-emerald-900" : "text-slate-900 group-hover:text-emerald-800"}`}>Internal Generation</h4>
                <p className="text-sm text-slate-600 mt-1">
                  Certificates are generated and validated by this system
                </p>
              </div>
            </div>
          </button>

          {/* External Option */}
          <button
            type="button"
            onClick={() => onToggleExternal(true)}
            className={`relative p-5 rounded-xl border transition-all text-left group ${
              external
                ? "border-amber-200 bg-gradient-to-br from-amber-50 to-white shadow-sm"
                : "border-slate-200 bg-white hover:border-amber-200 hover:shadow-sm"
            }`}
          >
            {external && (
              <div className="absolute -top-2 -right-2">
                <div className="bg-amber-500 text-white rounded-full p-1 shadow-md">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
              </div>
            )}
            <div className="flex items-start gap-3">
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-colors ${
                external ? "bg-amber-100" : "bg-slate-100 group-hover:bg-amber-50"
              }`}>
                <Building2 className={`h-5 w-5 transition-colors ${external ? "text-amber-600" : "text-slate-400 group-hover:text-amber-500"}`} />
              </div>
              <div className="flex-1">
                <h4 className={`font-semibold transition-colors ${external ? "text-amber-900" : "text-slate-900 group-hover:text-amber-800"}`}>External Authority</h4>
                <p className="text-sm text-slate-600 mt-1">
                  Generated by external authority (e.g., NMDPRA)
                </p>
              </div>
            </div>
          </button>
        </div>

        {external && (
          <div className="space-y-4 pt-4 border-t border-slate-200">
            <div className="flex items-start gap-3 rounded-lg bg-amber-50 p-4">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
              <p className="text-[13px] leading-relaxed text-slate-600">
                <strong className="font-semibold text-slate-900">External generation.</strong>{" "}
                Generation and official validation are strictly controlled by the selected
                authority. Records can still be verified centrally via the license ID + portal.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <FieldLabel htmlFor="certificate_authority" required>External Authority</FieldLabel>
                <Select value={authority || "NMDPRA"} onValueChange={onAuthority}>
                  <SelectTrigger id="certificate_authority" className={errCls("certificate_authority", "h-11 border-slate-200 bg-slate-50/70 text-sm")}>
                    <SelectValue placeholder="Select authority" />
                  </SelectTrigger>
                  <SelectContent>
                    {EXTERNAL_CERT_AUTHORITIES.map((a) => (
                      <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FieldError message={errors?.["certificate_authority"]} />
                <p className="text-[11.5px] text-slate-400">{known?.hint}</p>
              </div>
              <div className="space-y-2">
                <FieldLabel htmlFor="certificate_license_id" required hint="Official accreditation ID">
                  Authority License ID
                </FieldLabel>
                <Input
                  id="certificate_license_id"
                  value={licenseId}
                  onChange={(e) => onLicense(e.target.value)}
                  placeholder="e.g. NMDPRA/MISTDO/2024/001"
                  className={errCls("certificate_license_id", "h-11 border-slate-200 bg-slate-50/70 font-mono text-sm focus-visible:bg-white")}
                  required
                />
                <FieldError message={errors?.["certificate_license_id"]} />
              </div>
            </div>
            <div className="space-y-2">
              <FieldLabel htmlFor="certificate_portal_url" hint="Central verification link">
                Official Verification Portal
              </FieldLabel>
              <Input
                id="certificate_portal_url"
                value={portalUrl}
                onChange={(e) => onPortal(e.target.value)}
                placeholder="https://www.nmdpra.gov.ng"
                inputMode="url"
                className="h-11 border-slate-200 bg-slate-50/70 text-sm focus-visible:bg-white"
              />
              {portalUrl?.trim() && (
                <a href={portalUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[12px] font-medium text-emerald-700 hover:underline">
                  Open portal <Link2 className="h-3 w-3" />
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    </SectionCard>
  );
}

function SectionCard({
  icon: Icon,
  title,
  subtitle,
  aside,
  children,
}: {
  icon: React.ElementType;
  title: string;
  subtitle: string;
  aside?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
      <div className="flex items-start gap-3 border-b border-slate-100 p-5 sm:p-6">
        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-semibold tracking-tight text-slate-900">{title}</h2>
          <p className="mt-0.5 text-[13px] leading-relaxed text-slate-500">{subtitle}</p>
        </div>
        {aside ? <div className="shrink-0 pl-2">{aside}</div> : null}
      </div>
      <div className="space-y-5 p-5 sm:p-6">{children}</div>
    </section>
  );
}

function FieldLabel({
  htmlFor,
  children,
  required,
  hint,
}: {
  htmlFor?: string;
  children: React.ReactNode;
  required?: boolean;
  hint?: React.ReactNode;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <Label htmlFor={htmlFor} className="text-[13px] font-medium text-slate-700">
        {children}
        {required && <span className="ml-0.5 text-rose-500">*</span>}
      </Label>
      {hint ? <span className="text-[11px] text-slate-400">{hint}</span> : null}
    </div>
  );
}

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 ${
        checked ? "bg-emerald-600" : "bg-slate-300"
      }`}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
          checked ? "translate-x-[22px]" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}

function CheckRow({ ok, children }: { ok: boolean; children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2 text-[12.5px] leading-snug">
      <CheckCircle2
        className={`mt-px h-3.5 w-3.5 shrink-0 ${ok ? "text-emerald-600" : "text-slate-300"}`}
      />
      <span className={ok ? "text-slate-600" : "text-slate-400"}>{children}</span>
    </li>
  );
}

/* --------------------------------- screen --------------------------------- */

export default function CourseCreation() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const syllabusRef = useRef<HTMLTextAreaElement | null>(null);
  const [availableCourses, setAvailableCourses] = useState<CourseRecord[]>([]);
  const [previousAttendancePercentage, setPreviousAttendancePercentage] = useState(80);
  const [certificateModalOpen, setCertificateModalOpen] = useState(false);
  // While true the course code is kept in sync with the course name as the
  // user types; typing a custom code by hand switches it off (clearing the
  // field or pressing Gen switches it back on).
  const [codeAuto, setCodeAuto] = useState(true);
  // Same idea as codeAuto: keep the certificate ID prefix in sync with the
  // course name until the user types a custom prefix by hand.
  const [idPrefixAuto, setIdPrefixAuto] = useState(true);
  // Field-level validation errors keyed by form field ("title",
  // "modules.0.name", …) — cleared as soon as the field is edited again.
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  // Fetch available courses for prerequisite selection
  useEffect(() => {
    const loadCourses = async () => {
      try {
        const courses = await fetchCourses();
        setAvailableCourses(courses);
      } catch (err) {
        console.error("Failed to fetch courses:", err);
        toast.error("Failed to load existing courses", {
          description: err instanceof Error ? err.message : "Unable to fetch courses",
        });
      }
    };
    loadCourses();
  }, []);

  const [formData, setFormData] = useState<FormData>({
    title: "",
    code: "",
    category: "",
    short_description: "",
    description: "",
    tier: "",
    duration_value: 40,
    duration_unit: "HOURS",
    delivery_mode: "PHYSICAL",
    min_class_size: null,
    max_class_size: null,
    prerequisite_required: false,
    prerequisite_type: "internal",
    prerequisite_course_id: null,
    prerequisite_description: "",
    individual_enrollment_enabled: true,
    certificate_enabled: true,
    // Certificate step (Step 5) design defaults — mirrors the reference
    // certificate canvas (title, Gold Foil template, auto issuance, 2-year
    // validity, hyphen / YY / 3-digit ID syntax). The ID prefix starts empty
    // on purpose: it is auto-suggested from the course name as they type.
    certificate_title: "Advanced Offshore Well Control & Blowout Prevention Qualification",
    certificate_template: "Gokly Industrial Gold Foil & Guilloche Standard",
    certificate_issuance_mode: "automatic",
    certificate_validity_framework: "Fixed Term Validity",
    certificate_validity_duration: 2,
    certificate_validity_unit: "Years",
    certificate_id_prefix: "",
    certificate_id_separator: "-",
    certificate_id_year_schema: "YY",
    certificate_id_sequence_type: "3-Digit (001...)",
    // External certificate generation/validation (Step 5). Defaults to internal;
    // MISTDO detection flips this to NMDPRA automatically (see below).
    certificate_external: false,
    certificate_authority: "",
    certificate_license_id: "",
    certificate_portal_url: "",
    thumbnail_url: "",
    thumbnail_file: null,
    status: "DRAFT",
    modules: [],
    expandedModules: [],
    // Completion requirements defaults
    attendance_required: true,
    attendance_percentage: 80,
    strict_attendance: false,
    minimum_contact_hours: 36,
    module_completion_mode: "strict",
    assessment_required: true,
    theory_passing_score: 75,
    practical_required: true,
    sequential_progression: true,
    // Final overall assessment defaults (Step 3 gate)
    final_assessment: null,
    // Assessments defaults (sync'd from module-level setup + final)
    assessments: [],
  });
  const totalModuleHours = calculateTotalModuleHours(formData.modules);

  /* Drop validation errors whose key matches ("certificate_authority" or any
     "certificate_authority.child" key) as soon as the field is edited. */
  const clearErrorsFor = (match: (key: string) => boolean) =>
    setFieldErrors((prev) => {
      const keys = Object.keys(prev).filter(match);
      if (keys.length === 0) return prev;
      const next = { ...prev };
      keys.forEach((k) => delete next[k]);
      return next;
    });

  /* --------------------------- demo autofill ---------------------------- */
  /* Six steps of fields make this form slow to drive repeatedly while the
     submission flow is being tested, so a sample course can be dropped in with
     one click (button), a URL flag, or `__goklyFillCourse()` in the console.
     Values come from lib/course-autofill, which is unit-tested against the real
     per-step schemas, so what lands here always passes validation. */

  /* Each fill gets a fresh title/code so courses created back to back never clash. */
  const autofillCount = useRef(0);
  const autofillBusy = useRef(false);
  const [autofilling, setAutofilling] = useState(false);

  const [searchParams] = useSearchParams();
  const autofillParam = searchParams.get("autofill");
  /* Dev builds always show the control; ?autofill=1|run reveals it in any build. */
  const showAutofill = import.meta.env.DEV || autofillParam !== null;

  const runAutofill = async (options: { silent?: boolean } = {}) => {
    if (autofillBusy.current) return;
    autofillBusy.current = true;
    setAutofilling(true);
    try {
      autofillCount.current += 1;
      const sample = buildSampleCourse(autofillCount.current);
      /* A fabricated file (not just a URL) keeps the upload phase in the run. */
      const picture = await createDemoThumbnailFile(sample.title);
      /* Mirror what updateModule/addModule keeps in sync for the review step:
         module assessments are keyed `mod-<index>`, the final one is "whole". */
      const moduleAssessments = sample.modules.flatMap((mod, index) =>
        mod.has_assessment
          ? [
              {
                id: `module-${index}-autofill`,
                name: `${mod.name} — Assessment`,
                type: mod.assessment_type || "mcq",
                module_association: `mod-${index}`,
                description: mod.assessment_description || "",
                max_score: mod.assessment_max_score || 100,
                pass_mark: mod.assessment_pass_mark || 75,
                attempts_allowed: mod.assessment_attempts_allowed || 1,
                required: mod.assessment_required ?? true,
              },
            ]
          : [],
      );

      setFormData((prev) => ({
        ...prev,
        title: sample.title,
        code: sample.code,
        category: sample.category,
        short_description: sample.short_description,
        description: sample.description,
        tier: sample.tier,
        duration_value: sample.duration_value,
        duration_unit: sample.duration_unit,
        delivery_mode: sample.delivery_mode,
        status: sample.status,
        min_class_size: sample.min_class_size,
        max_class_size: sample.max_class_size,
        minimum_contact_hours: sample.minimum_contact_hours,
        prerequisite_required: sample.prerequisite_required,
        prerequisite_type: sample.prerequisite_type,
        prerequisite_course_id: sample.prerequisite_course_id,
        prerequisite_description: sample.prerequisite_description,
        certificate_enabled: sample.certificate_enabled,
        certificate_external: sample.certificate_external,
        certificate_authority: sample.certificate_authority,
        certificate_license_id: sample.certificate_license_id,
        certificate_id_prefix: sample.certificate_id_prefix,
        thumbnail_file: picture,
        /* Same convention as the file input below: an object URL drives the
           preview. handleSubmit overwrites it with the uploaded URL before the
           API call, so a blob: URL can never reach the backend. */
        thumbnail_url: picture ? URL.createObjectURL(picture) : sample.thumbnail_url,
        modules: sample.modules,
        expandedModules: sample.expandedModules,
        final_assessment: sample.final_assessment,
        assessments: [...moduleAssessments, sample.final_assessment],
      }));

      /* The sample satisfies every step, so anything left red is now stale. */
      setFieldErrors({});

      if (!options.silent) {
        toast.success("Demo data filled", {
          description: `${sample.title} — ${sample.modules.length} modules, final assessment on. Edit anything you need, then create the course.`,
        });
      }
    } finally {
      autofillBusy.current = false;
      setAutofilling(false);
    }
  };

  /* Bookmarking /training/course-creation?autofill=run opens the form pre-filled. */
  useEffect(() => {
    if (autofillParam === "run") void runAutofill({ silent: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* Console hook for scripted runs in dev. */
  useEffect(() => {
    if (!import.meta.env.DEV) return;
    window.__goklyFillCourse = () => runAutofill();
    return () => {
      window.__goklyFillCourse = undefined;
    };
  });

  /* Merge a red border + rose focus ring into an input's base classes when
     its field failed validation. (rose sorts after slate in Tailwind's
     palette order, so border-rose-500 wins the cascade.) */
  const errCls = (field: string, base: string) =>
    fieldErrors[field] ? `${base} border-rose-500 focus-visible:ring-rose-500` : base;

  const updateFormData = (field: keyof FormData, value: any) => {
    clearErrorsFor((k) => k === field || k.startsWith(`${field}.`));
    setFormData((prev) => {
      const next = { ...prev, [field]: value };
      if (field === "delivery_mode" && value === "ONLINE") {
        next.modules = prev.modules.map((module) =>
          module.delivery_type === "practical" || module.delivery_type === "both"
            ? { ...module, delivery_type: "theory" }
            : module,
        );
      }
      // Keep the certificate preview title in sync with the course title until
      // the user customizes it on the Certificate step.
      if (field === "title" && typeof value === "string") {
        const defaultCertTitle =
          "Advanced Offshore Well Control & Blowout Prevention Qualification";
        // Follow the course title while the certificate title hasn't been customized.
        if (
          !prev.certificate_title ||
          prev.certificate_title === defaultCertTitle ||
          prev.certificate_title === prev.title
        ) {
          next.certificate_title = value.trim() || value;
        }
      }
      // Live-derive the course code from the course name while the code field
      // is still auto-managed, so the code updates as they type (no manual
      // refresh / Gen click needed).
      if (field === "title" && typeof value === "string" && codeAuto) {
        const trimmed = value.trim();
        next.code = trimmed ? buildCourseCode(trimmed, String(prev.code || "")) : "";
      }
      // Auto-suggest the certificate ID prefix from the course name while the
      // field is still auto-managed (stops as soon as it is typed by hand).
      if (field === "title" && typeof value === "string" && idPrefixAuto) {
        const derived = deriveIdPrefix(value);
        // Only push a new prefix when we have real words — if the title is
        // temporarily empty (user is backspacing) keep the last good value so
        // the preview never shows "e.g., FIRE-SAFE" mid-edit.
        if (derived) {
          next.certificate_id_prefix = derived;
        }
      }
      // Auto-suggest external NMDPRA certification when title/code looks like MISTDO.
      if ((field === "title" || field === "code") && !prev.certificate_external) {
        const title = field === "title" ? String(value) : prev.title;
        const code = field === "code" ? String(value) : prev.code;
        if (isMistdoCourse(title, code)) {
          next.certificate_external = true;
          next.certificate_authority = "NMDPRA";
          next.certificate_portal_url =
            prev.certificate_portal_url ||
            EXTERNAL_CERT_AUTHORITIES[0].portal;
        }
      }
      return next;
    });
  };

  const setExternalAuthority = (authority: string) => {
    clearErrorsFor((k) => k === "certificate_authority");
    const known = EXTERNAL_CERT_AUTHORITIES.find((a) => a.value === authority);
    setFormData((prev) => ({
      ...prev,
      certificate_authority: authority,
      certificate_portal_url: prev.certificate_portal_url || known?.portal || "",
    }));
  };

  const addModule = () => {
    clearErrorsFor((k) => k.startsWith("modules"));
    setFormData((prev) => ({
      ...prev,
      modules: [
        ...prev.modules,
        {
          name: "",
          description: "",
          scheduled_date: "",
          has_assessment: false,
          sort_order: prev.modules.length,
          materials: [],
          duration: 0,
          delivery_type: "both",
          ...DEFAULT_MODULE_ASSESSMENT,
        },
      ],
      expandedModules: [...prev.expandedModules, prev.modules.length],
    }));
  };

  const moduleAssessmentLabel = (type?: string) =>
    MODULE_ASSESSMENT_TYPES.find((t) => t.value === type)?.label || "Multiple Choice (Auto-graded)";

  const removeModule = (index: number) => {
    // Indices shift after removal, so drop every module-scoped error.
    clearErrorsFor((k) => k.startsWith("modules"));
    setFormData((prev) => {
      const modules = prev.modules.filter((_, i) => i !== index);
      // Rebuild module assessments for the surviving (re-indexed) modules.
      const moduleAssessments: Assessment[] = modules
        .map((mod, idx) => ({ mod, idx }))
        .filter(({ mod }) => mod.has_assessment)
        .map(({ mod, idx }) => {
          const survivingOriginal = prev.modules.findIndex(
            (m, oi) => oi !== index && m.name === mod.name && m.description === mod.description,
          );
          const existing = prev.assessments.find(
            (a) => a.module_association === `mod-${survivingOriginal === -1 ? idx : survivingOriginal}`,
          );
          return {
            id: existing?.id || `module-${idx}-${Date.now()}`,
            name: mod.name?.trim() ? `${mod.name.trim()} — Assessment` : `Module ${idx + 1} Assessment`,
            type: mod.assessment_type || "mcq",
            module_association: `mod-${idx}`,
            description: mod.assessment_description || "",
            max_score: mod.assessment_max_score ?? 100,
            pass_mark: mod.assessment_pass_mark ?? 75,
            attempts_allowed: mod.assessment_attempts_allowed ?? 3,
            required: mod.assessment_required ?? true,
          } as Assessment;
        });
      const finalList = prev.final_assessment
        ? [{ ...prev.final_assessment, module_association: "whole" }]
        : [];
      return {
        ...prev,
        modules,
        assessments: [...moduleAssessments, ...finalList],
        expandedModules: prev.expandedModules.filter((i) => i !== index).map((i) => (i > index ? i - 1 : i)),
      };
    });
  };

  const updateModule = (index: number, field: keyof CourseModule, value: any) => {
    clearErrorsFor((k) => k.startsWith(`modules.${index}.`));
    setFormData((prev) => {
      const modules = prev.modules.map((mod, i) => {
        if (i !== index) return mod;
        const next = { ...mod, [field]: value };
        if (field === "has_assessment" && value === false) {
          Object.assign(next, { ...DEFAULT_MODULE_ASSESSMENT, has_assessment: false });
        }
        if (field === "has_assessment" && value === true) {
          next.assessment_type = next.assessment_type || DEFAULT_MODULE_ASSESSMENT.assessment_type;
          next.assessment_max_score = next.assessment_max_score ?? DEFAULT_MODULE_ASSESSMENT.assessment_max_score;
          next.assessment_pass_mark = next.assessment_pass_mark ?? DEFAULT_MODULE_ASSESSMENT.assessment_pass_mark;
          next.assessment_attempts_allowed = next.assessment_attempts_allowed ?? DEFAULT_MODULE_ASSESSMENT.assessment_attempts_allowed;
          next.assessment_required = next.assessment_required ?? DEFAULT_MODULE_ASSESSMENT.assessment_required;
          next.assessment_description = next.assessment_description ?? "";
        }
        return next;
      });
      const moduleAssessments: Assessment[] = modules
        .map((mod, idx) => ({ mod, idx }))
        .filter(({ mod }) => mod.has_assessment)
        .map(({ mod, idx }) => {
          const modCode = `mod-${idx}`;
          const existing = prev.assessments.find((a) => a.module_association === modCode);
          return {
            id: existing?.id || `module-${idx}-${Date.now()}`,
            name: mod.name?.trim() ? `${mod.name.trim()} — Assessment` : `Module ${idx + 1} Assessment`,
            type: mod.assessment_type || "mcq",
            module_association: modCode,
            description: mod.assessment_description || "",
            max_score: mod.assessment_max_score ?? 100,
            pass_mark: mod.assessment_pass_mark ?? 75,
            attempts_allowed: mod.assessment_attempts_allowed ?? 3,
            required: mod.assessment_required ?? true,
          } as Assessment;
        });
      const finalList = prev.final_assessment
        ? [{ ...prev.final_assessment, module_association: "whole" }]
        : [];
      return { ...prev, modules, assessments: [...moduleAssessments, ...finalList] };
    });
  };

  const toggleModuleExpand = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      expandedModules: prev.expandedModules.includes(index)
        ? prev.expandedModules.filter(i => i !== index)
        : [...prev.expandedModules, index],
    }));
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const toggleFinalAssessment = (on: boolean) => {
    setFormData((prev) => {
      if (!on) {
        return {
          ...prev,
          final_assessment: null,
          assessments: prev.assessments.filter((a) => a.module_association !== "whole"),
        };
      }
      const final: Assessment = prev.final_assessment
        ? { ...prev.final_assessment, module_association: "whole" }
        : {
            id: `final-${Date.now()}`,
            name: prev.title?.trim() ? `${prev.title.trim()} — Final Assessment` : "Final Course Assessment",
            type: "written",
            module_association: "whole",
            description: "",
            max_score: 100,
            pass_mark: 75,
            attempts_allowed: 1,
            required: true,
          };
      return {
        ...prev,
        final_assessment: final,
        assessments: [...prev.assessments.filter((a) => a.module_association !== "whole"), final],
      };
    });
  };

  const updateFinalAssessment = (field: keyof Assessment, value: any) => {
    clearErrorsFor((k) => k.startsWith("final_assessment"));
    setFormData((prev) => {
      if (!prev.final_assessment) return prev;
      const final = { ...prev.final_assessment, [field]: value, module_association: "whole" };
      return {
        ...prev,
        final_assessment: final,
        assessments: [...prev.assessments.filter((a) => a.module_association !== "whole"), final],
      };
    });
  };

  const removeFinalAssessment = () => toggleFinalAssessment(false);

  /* re-generate a course code from the title + category (fresh serial) */
  const generateCode = () => {
    setCodeAuto(true);
    updateFormData("code", buildCourseCode(formData.title, formData.code, true));
  };

  /* markdown toolbar for the syllabus field */
  const wrapSelection = (before: string, after = before) => {
    const el = syllabusRef.current;
    if (!el) return;
    const { selectionStart: s, selectionEnd: e, value } = el;
    const next = value.slice(0, s) + before + value.slice(s, e) + after + value.slice(e);
    updateFormData("description", next);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(s + before.length, e + before.length);
    });
  };

  /* snap to important attendance percentages */
  const snapToImportantPercentage = (value: number): number => {
    const importantPercentages = [50, 60, 70, 75, 80, 85, 90, 95, 100];
    const snapThreshold = 2; // Snap if within 2% of an important value

    for (const important of importantPercentages) {
      if (Math.abs(value - important) <= snapThreshold) {
        return important;
      }
    }
    return value;
  };

  /* Field-level errors for a step (schemas live in course-creation-validation). */
  const collectStepErrors = (step: number): FieldErrors =>
    collectSchemaErrors(step, formData);

  const validateStep = (step: number): boolean =>
    Object.keys(collectStepErrors(step)).length === 0;

  /* When a module fails validation, expand it so the red fields are actually
     visible next to the toast. */
  const expandModulesWithErrors = (errors: FieldErrors) => {
    const indexes = new Set<number>();
    Object.keys(errors).forEach((k) => {
      const m = /^modules\.(\d+)\./.exec(k);
      if (m) indexes.add(parseInt(m[1], 10));
    });
    if (indexes.size === 0) return;
    setFormData((prev) => ({
      ...prev,
      expandedModules: Array.from(new Set([...prev.expandedModules, ...indexes])),
    }));
  };

  const handleNext = () => {
    const errors = collectStepErrors(currentStep);
    const messages = Object.values(errors);
    setFieldErrors(errors);
    if (messages.length === 0) {
      setCurrentStep((prev) => Math.min(prev + 1, STEPS.length));
    } else {
      expandModulesWithErrors(errors);
      toast.error("Some required fields are still empty or invalid on this step.", {
        description: `${messages.length} issue${messages.length === 1 ? "" : "s"}: ${messages
          .slice(0, 3)
          .join(" • ")}${messages.length > 3 ? " • …" : ""}`,
      });
    }
  };

  /* Validate a single module when its "Done" button is clicked: red-field the
     offending inputs and keep the card open on failure; collapse it only when
     it passes. */
  const validateModuleOnDone = (index: number): boolean => {
    const prefix = `modules.${index}.`;
    const mine = collectModuleErrors(collectStepErrors(2), index);
    // Replace (not just add) this module's errors so fixes are reflected.
    setFieldErrors((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((k) => {
        if (k.startsWith(prefix)) delete next[k];
      });
      return { ...next, ...mine };
    });
    const messages = Object.values(mine);
    if (messages.length === 0) return true;
    toast.error(`Module ${index + 1} still has issues to fix.`, {
      description: `${messages.length} issue${messages.length === 1 ? "" : "s"}: ${messages
        .slice(0, 3)
        .join(" • ")}${messages.length > 3 ? " • …" : ""}`,
    });
    return false;
  };

  const handleBack = () => {
    setFieldErrors({});
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = async (publish: boolean = false) => {
    // A slow save plus an eager Enter key can fire this twice, and a second run
    // would create a duplicate course — ignore submits while one is in flight.
    if (loading) return;
    // Validate every step up-front; if anything fails, jump to the first
    // offending step so the red fields sit next to the toast.
    const failing: { step: number; errors: FieldErrors }[] = [];
    for (let step = 1; step <= STEPS.length; step++) {
      const errors = collectStepErrors(step);
      if (Object.keys(errors).length > 0) failing.push({ step, errors });
    }
    if (failing.length > 0) {
      const merged: FieldErrors = {};
      failing.forEach(({ errors }) => Object.assign(merged, errors));
      const total = failing.reduce((n, f) => n + Object.keys(f.errors).length, 0);
      const first = failing[0];
      const firstMessages = Object.values(first.errors);
      setFieldErrors(merged);
      setCurrentStep(first.step);
      expandModulesWithErrors(merged);
      toast.error("Fix the highlighted fields before creating the course.", {
        description: `${total} issue${total === 1 ? "" : "s"} across ${
          failing.length
        } step${failing.length === 1 ? "" : "s"} — Step ${first.step}: ${firstMessages
          .slice(0, 3)
          .join(" • ")}${firstMessages.length > 3 ? " • …" : ""}`,
      });
      return;
    }
    setFieldErrors({});

    try {
      setLoading(true);

      // Set status based on whether we're publishing or saving as draft
      if (publish) {
        setFormData((prev) => ({ ...prev, status: "PUBLISHED" }));
      } else {
        setFormData((prev) => ({ ...prev, status: "DRAFT" }));
      }

      // Convert image to base64 if present
      let thumbnailBase64 = null;
      if (formData.thumbnail_file) {
        try {
          thumbnailBase64 = await fileToBase64(formData.thumbnail_file);
        } catch (uploadError) {
          toast.error("Failed to process course image", {
            description:
              uploadError instanceof Error ? uploadError.message : "Image processing failed",
          });
          return;
        }
      }

      // Single unified endpoint call
      const payload = buildCoursePayload(publish ? { ...formData, status: "PUBLISHED" } : { ...formData, status: "DRAFT" }, thumbnailBase64);
      delete payload.min_class_size;
      delete payload.max_class_size;
      const course = await createCourse(payload);

      toast.success(publish ? "Course created and published" : "Course created successfully", {
        description: publish ? "The course is now live and available for enrollment" : "The course has been added to the catalog as draft",
      });

      setSuccess(true);
      setTimeout(() => navigate(`/training/course/${course.id}`), 2000);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "The course could not be created.");
    } finally {
      setLoading(false);
    }
  };

  /* live spec-health signals shown in the right rail */
  const checks = [
    { ok: /^[A-Z]{3,}-[A-Z0-9-]{3,}$/.test(formData.code), text: "Course code follows GOK standard taxonomy" },
    { ok: formData.short_description.trim().length > 5, text: "Executive summary ready for catalog listing" },
    { ok: formData.modules.length > 0, text: "At least one module added" },
    { ok: !!formData.tier, text: "Course tier set" },
    { ok: !!formData.status, text: "Course status set" },
    { ok: formData.minimum_contact_hours > 0, text: "Contact hours configured" },
    { ok: formData.attendance_percentage >= 50, text: "Attendance threshold set" },
    { ok: formData.theory_passing_score >= 50, text: "Assessment cutoff configured" },
  ];
  const healthScore = Math.round((checks.filter((c) => c.ok).length / checks.length) * 100);

  /* --------------------------------- success -------------------------------- */

  if (success) {
    return (
      <AdminPageShell withSidebar>
        <div className="flex min-h-[420px] flex-col items-center justify-center">
          <div className="mb-5 rounded-full bg-emerald-600 p-4">
            <CheckCircle className="h-10 w-10 text-white" />
          </div>
          <h2 className="text-xl font-semibold text-slate-900">Course created</h2>
          <p className="mt-1 text-sm text-slate-500">Taking you to the course record…</p>
        </div>
      </AdminPageShell>
    );
  }

  /* ---------------------------------- steps --------------------------------- */

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-5">
            <SectionCard
              icon={FileText}
              title="Course Identification & Nomenclature"
              subtitle="Standard operational nomenclature adhering to offshore syllabus regulations."
              
            >
              <div className="space-y-2">
                <FieldLabel htmlFor="title" required hint="Accredited qualification title">
                  Course Name
                </FieldLabel>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => updateFormData("title", e.target.value)}
                  onBlur={() => {
                    // "Done typing" pass: refill the code if it is still
                    // auto-managed but currently empty (e.g. cleared earlier).
                    if (codeAuto && formData.title.trim() && !formData.code) {
                      updateFormData("code", buildCourseCode(formData.title, ""));
                    }
                  }}
                  placeholder="Enter course name"
                  className={errCls("title", "h-11 border-slate-200 bg-slate-50/70 text-sm focus-visible:bg-white")}
                  required
                />
                <FieldError message={fieldErrors.title} />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <FieldLabel htmlFor="code" required hint="Statutory taxonomy">
                    Course Code
                  </FieldLabel>
                  <div className="relative">
                    <Input
                      id="code"
                      value={formData.code}
                      onChange={(e) => {
                        const v = e.target.value.toUpperCase();
                        // Hand-editing the code stops the live title→code sync;
                        // clearing the field (or pressing Gen) resumes it.
                        setCodeAuto(v === "");
                        updateFormData("code", v);
                      }}
                      placeholder="GOK-WELL-402-EXP"
                      className={errCls("code", "h-11 border-slate-200 bg-slate-50/70 pr-[72px] font-mono text-sm tracking-wide focus-visible:bg-white")}
                      required
                    />
                    <button
                      type="button"
                      onClick={generateCode}
                      title="Regenerate code from course name"
                      className="absolute right-1.5 top-1.5 inline-flex h-8 items-center gap-1 rounded-md border border-slate-200 bg-white px-2 text-[11px] font-medium text-slate-600 hover:border-emerald-200 hover:text-emerald-700"
                    >
                      <RefreshCw className="h-3 w-3" />
                      Gen
                    </button>
                  </div>
                  <FieldError message={fieldErrors.code} />
                </div>

                <div className="space-y-2">
                  <FieldLabel htmlFor="category" required>
                    Discipline / Category
                  </FieldLabel>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => updateFormData("category", value)}
                  >
                    <SelectTrigger
                      id="category"
                      className={errCls("category", "h-11 border-slate-200 bg-slate-50/70 text-sm data-[state=open]:bg-white")}
                    >
                      <SelectValue placeholder="Select discipline" />
                    </SelectTrigger>
                    <SelectContent>
                      {COURSE_CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FieldError message={fieldErrors.category} />
                </div>
              </div>

              <div className="space-y-2">
                <FieldLabel
                  htmlFor="short_description"
                  required
                  hint={`${formData.short_description.length} / 250 characters`}
                >
                  Short Description
                </FieldLabel>
                <Textarea
                  id="short_description"
                  value={formData.short_description}
                  onChange={(e) => updateFormData("short_description", e.target.value)}
                  placeholder="Enter short description"
                  rows={3}
                  maxLength={250}
                  className={errCls("short_description", "resize-none border-slate-200 bg-slate-50/70 text-sm leading-relaxed focus-visible:bg-white")}
                  required
                />
                <FieldError message={fieldErrors.short_description} />
                <p className="text-[11.5px] text-slate-400">
                  Shown directly in public training index search results and trainee enrollment portals.
                </p>
              </div>

              <div className="space-y-2">
                <FieldLabel htmlFor="thumbnail" required hint="Recommended size: 1200x630px (2:1 ratio)">
                  Course Background Picture
                </FieldLabel>
                <div className="relative">
                  <input
                    id="thumbnail"
                    type="file"
                    accept="image/jpeg,image/png,image/gif,image/webp,.jpg,.jpeg,.png,.gif,.webp"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        updateFormData("thumbnail_file", file);
                        // Create preview URL
                        const previewUrl = URL.createObjectURL(file);
                        updateFormData("thumbnail_url", previewUrl);
                      }
                    }}
                    className="hidden"
                  />
                  <div
                    onClick={() => document.getElementById('thumbnail')?.click()}
                    className={`relative cursor-pointer rounded-xl border-2 border-dashed transition-all ${
                      fieldErrors.thumbnail_file
                        ? "border-rose-400 bg-rose-50/40"
                        : formData.thumbnail_url || formData.thumbnail_file
                        ? "border-emerald-300 bg-emerald-50/50"
                        : "border-slate-300 bg-slate-50 hover:border-emerald-300 hover:bg-emerald-50/50"
                    }`}
                  >
                    {formData.thumbnail_url || formData.thumbnail_file ? (
                      <div className="relative aspect-[2/1] w-full overflow-hidden rounded-lg">
                        <img
                          src={formData.thumbnail_url}
                          alt="Course background preview"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                          <div className="text-white text-center">
                            <Upload className="h-6 w-6 mx-auto mb-2" />
                            <p className="text-sm font-medium">Click to change image</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            updateFormData("thumbnail_file", null);
                            updateFormData("thumbnail_url", "");
                          }}
                          className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1.5 hover:bg-red-600 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="aspect-[2/1] w-full flex flex-col items-center justify-center p-8">
                        <Upload className="h-12 w-12 text-slate-400 mb-3" />
                        <p className="text-sm font-medium text-slate-700 mb-1">
                          Upload course background picture
                        </p>
                        <p className="text-xs text-slate-500 text-center">
                          Drag and drop or click to browse
                        </p>
                        <p className="text-[10px] text-slate-400 mt-2">
                          JPG, PNG, GIF or WEBP up to 5MB
                        </p>
                      </div>
                    )}
                  </div>
                </div>
                <FieldError message={fieldErrors.thumbnail_file} />
                {formData.thumbnail_file && (
                  <p className="text-[11px] text-emerald-600 flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    {formData.thumbnail_file.name} ({(formData.thumbnail_file.size / 1024 / 1024).toFixed(2)} MB)
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <FieldLabel
                  htmlFor="description"
                  required
                  hint={`${formData.description.trim().length} characters (min 50)`}
                >
                  Detailed Syllabus & Operational Scope
                </FieldLabel>
                <div className={errCls("description", "overflow-hidden rounded-lg border border-slate-200")}>
                  <div className="flex items-center gap-0.5 border-b border-slate-200 bg-slate-50 px-2 py-1.5">
                    {[
                      { icon: Bold, action: () => wrapSelection("**"), label: "Bold" },
                      { icon: Italic, action: () => wrapSelection("_"), label: "Italic" },
                      { icon: Underline, action: () => wrapSelection("<u>", "</u>"), label: "Underline" },
                    ].map(({ icon: Ico, action, label }) => (
                      <button
                        key={label}
                        type="button"
                        aria-label={label}
                        onClick={action}
                        className="rounded p-1.5 text-slate-500 hover:bg-white hover:text-slate-900"
                      >
                        <Ico className="h-3.5 w-3.5" />
                      </button>
                    ))}
                    <span className="mx-1.5 h-4 w-px bg-slate-200" />
                    {[
                      { icon: List, action: () => wrapSelection("\n- ", ""), label: "Bulleted list" },
                      { icon: ListOrdered, action: () => wrapSelection("\n1. ", ""), label: "Numbered list" },
                      { icon: Quote, action: () => wrapSelection("\n> ", ""), label: "Quote" },
                      { icon: Link2, action: () => wrapSelection("[", "](url)"), label: "Link" },
                      { icon: Table, action: () => wrapSelection("\n| A | B |\n| --- | --- |\n", ""), label: "Table" },
                    ].map(({ icon: Ico, action, label }) => (
                      <button
                        key={label}
                        type="button"
                        aria-label={label}
                        onClick={action}
                        className="rounded p-1.5 text-slate-500 hover:bg-white hover:text-slate-900"
                      >
                        <Ico className="h-3.5 w-3.5" />
                      </button>
                    ))}
                    <span className="ml-auto text-[10.5px] font-medium tracking-wide text-slate-400">
                      Markdown supported
                    </span>
                  </div>
                  <Textarea
                    id="description"
                    ref={syllabusRef}
                    value={formData.description}
                    onChange={(e) => updateFormData("description", e.target.value)}
                    placeholder="Enter detailed course description"
                    rows={8}
                    className="resize-y rounded-none border-0 text-sm leading-relaxed focus-visible:ring-0"
                  />
                </div>
                <FieldError message={fieldErrors.description} />
              </div>
            </SectionCard>

            <SectionCard
              icon={Layers}
              title="Delivery Parameters"
              subtitle="Define the course tier and training delivery mode."
            >
              <div className="space-y-6">
                <div className="space-y-2">
                  <FieldLabel htmlFor="tier" required>Course Tier</FieldLabel>
                  <Select value={formData.tier} onValueChange={(value) => updateFormData("tier", value)}>
                    <SelectTrigger id="tier" className={errCls("tier", "h-11 border-slate-200 bg-slate-50/70 text-sm")}>
                      <SelectValue placeholder="Select difficulty level" />
                    </SelectTrigger>
                    <SelectContent>
                      {TIERS.map((tier) => (
                        <SelectItem key={tier} value={tier}>
                          {tier}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FieldError message={fieldErrors.tier} />
                </div>

                <div className="space-y-3">
                  <FieldLabel required>Delivery Mode</FieldLabel>
                  <div className="grid gap-3 sm:grid-cols-3">
                    {DELIVERY_MODES.map((mode) => {
                      const active = formData.delivery_mode === mode.value;
                      const Ico = mode.icon;
                      return (
                        <button
                          key={mode.value}
                          type="button"
                          onClick={() => updateFormData("delivery_mode", mode.value)}
                          aria-pressed={active}
                          className={`relative rounded-lg border p-3.5 text-left transition-colors ${
                            active
                              ? "border-emerald-500 bg-emerald-50/80 ring-1 ring-emerald-500"
                              : "border-slate-200 bg-slate-50/70 hover:border-slate-300"
                          }`}
                        >
                          <span className="absolute right-3 top-3">
                            {active ? (
                              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                            ) : (
                              <span className="block h-4 w-4 rounded-full border border-slate-300 bg-white" />
                            )}
                          </span>
                          <Ico
                            className={`mb-2.5 h-4 w-4 ${active ? "text-emerald-700" : "text-slate-500"}`}
                          />
                          <span
                            className={`block text-[13px] font-semibold ${
                              active ? "text-emerald-900" : "text-slate-800"
                            }`}
                        >
                          {mode.label}
                        </span>
                        <span
                          className={`mt-1 block text-[11.5px] leading-snug ${
                            active ? "text-emerald-700/80" : "text-slate-500"
                          }`}
                        >
                          {mode.helper}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              </div>
            </SectionCard>

            <SectionCard
              icon={ShieldCheck}
              title="Course Prerequisites"
              subtitle="Set what learners must already complete or hold before they can enroll in this course."
              aside={
                <div className="flex items-center gap-2.5">
                  <span className="text-[11.5px] font-medium leading-tight text-slate-600">
                    Prerequisites
                    <br />
                    {formData.prerequisite_required ? "Required" : "Not required"}
                  </span>
                  <Toggle
                    checked={formData.prerequisite_required}
                    onChange={(v) => updateFormData("prerequisite_required", v)}
                    label="Require prerequisites before enrollment"
                  />
                </div>
              }
            >
              {formData.prerequisite_required ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <FieldLabel htmlFor="prerequisite_type" required>
                      What Must Come First
                    </FieldLabel>
                    <Select
                      value={formData.prerequisite_type}
                      onValueChange={(value: "internal" | "external") => updateFormData("prerequisite_type", value)}
                    >
                      <SelectTrigger
                        id="prerequisite_type"
                        className="h-11 border-slate-200 bg-slate-50/70 text-sm data-[state=open]:bg-white"
                      >
                        <SelectValue placeholder="Select what must come first" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="internal">Course on this platform</SelectItem>
                        <SelectItem value="external">External certification</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {formData.prerequisite_type === "internal" ? (
                    <div className="space-y-2">
                      <FieldLabel htmlFor="prerequisite_course_id" required>
                        Prerequisite Course
                      </FieldLabel>
                      {availableCourses.length > 0 ? (
                        <Select
                          value={formData.prerequisite_course_id?.toString() || ""}
                          onValueChange={(value) => updateFormData("prerequisite_course_id", value ? parseInt(value) : null)}
                        >
                          <SelectTrigger
                            id="prerequisite_course_id"
                            className={errCls("prerequisite_course_id", "h-11 border-slate-200 bg-slate-50/70 text-sm data-[state=open]:bg-white")}
                          >
                            <SelectValue placeholder="Select the course that must be completed first" />
                          </SelectTrigger>
                          <SelectContent>
                            {availableCourses.map((course) => (
                              <SelectItem key={course.id} value={course.id.toString()}>
                                {course.code ? `${course.code} - ` : ""}{course.title}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <div className="rounded-lg border border-amber-200 bg-amber-50/70 p-3.5 text-xs text-amber-800">
                          <p className="font-semibold text-amber-900">No existing courses found on this platform</p>
                          <p className="mt-1 text-amber-700">
                            Create at least one course first to select it as an internal prerequisite, or choose &quot;External certification&quot; above.
                          </p>
                        </div>
                      )}
                      <FieldError message={fieldErrors.prerequisite_course_id} />
                      <p className="flex items-center gap-1.5 text-[11.5px] text-emerald-700">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Learners must complete this course before they can enroll.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <FieldLabel htmlFor="prerequisite_description" required>
                        Prerequisite Certification
                      </FieldLabel>
                      <Select
                        value={formData.prerequisite_description}
                        onValueChange={(value) => updateFormData("prerequisite_description", value)}
                      >
                        <SelectTrigger
                          id="prerequisite_description"
                          className={errCls("prerequisite_description", "h-11 border-slate-200 bg-slate-50/70 text-sm data-[state=open]:bg-white")}
                        >
                          <SelectValue placeholder="Select the certification learners must hold" />
                        </SelectTrigger>
                        <SelectContent>
                          {/* Keep any earlier free-typed requirement selectable. */}
                          {formData.prerequisite_description &&
                            !EXTERNAL_PREREQUISITE_COURSES.includes(
                              formData.prerequisite_description,
                            ) && (
                              <SelectItem value={formData.prerequisite_description}>
                                {formData.prerequisite_description}
                              </SelectItem>
                            )}
                          {EXTERNAL_PREREQUISITE_COURSES.map((course) => (
                            <SelectItem key={course} value={course}>
                              {course}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FieldError message={fieldErrors.prerequisite_description} />
                      <p className="flex items-center gap-1.5 text-[11.5px] text-emerald-700">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Learners must already hold this certification before they can enroll.
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <p className="rounded-lg border border-dashed border-slate-200 bg-slate-50/60 px-4 py-5 text-center text-[12.5px] text-slate-500">
                  No prerequisites — anyone can enroll in this course right away. Turn on the switch
                  above to require a course or an external certification first.
                </p>
              )}
            </SectionCard>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            {/* Quick Metrics & Action Strip */}
            <div className="bg-white rounded-xl p-5 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-6 divide-x divide-slate-200">
                <div className="flex flex-col pr-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Modules</span>
                  <span className="text-2xl font-bold text-slate-900">{formData.modules.length} </span>
                </div>
                <div className="flex flex-col pl-6">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Materials</span>
                  <span className="text-2xl font-bold text-slate-900">
                    {formData.modules.reduce((total, m) => total + (m.materials?.length || 0), 0)} Files
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2.5 w-full sm:w-auto">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-1.5"
                >
                  <BookOpen className="h-4 w-4" />
                  Import Template
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={addModule}
                  className="flex items-center gap-1.5"
                >
                  <Plus className="h-4 w-4" />
                  Add New Module
                </Button>
              </div>
            </div>

            {/* Modules List */}
            <div className="space-y-4">
              {fieldErrors.modules && (
                <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3">
                  <FieldError message={fieldErrors.modules} />
                </div>
              )}
              {formData.modules.map((module, index) => {
                const isExpanded = formData.expandedModules.includes(index);
                const moduleHasErrors = Object.keys(fieldErrors).some((k) =>
                  k.startsWith(`modules.${index}.`),
                );
                return (
                  <Card
                    key={index}
                    className={cn(
                      "bg-white rounded-xl shadow-md overflow-hidden",
                      moduleHasErrors && "ring-2 ring-rose-400",
                    )}
                  >
                    {/* Module Header */}
                    <div className="bg-slate-50 p-5 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center text-slate-400 hover:text-slate-600 cursor-grab p-1 rounded hover:bg-slate-100">
                          <Layers className="h-5 w-5" />
                        </div>
                        <span className="px-2.5 py-1 rounded bg-emerald-100 text-emerald-700 text-[12px] font-bold tracking-wide">
                          MOD-{String(index + 1).padStart(3, '0')}
                        </span>
                        <div>
                          <h2 className="text-lg font-bold text-slate-900">
                            {module.name || `Module ${index + 1}`}
                          </h2>
                        </div>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <span className="px-2.5 py-1 rounded bg-slate-200 text-slate-700 text-[11px] font-bold flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          {module.duration ? `${module.duration} Hours` : "No Duration"}
                        </span>
                        <span className="px-2.5 py-1 rounded bg-slate-200 text-slate-700 text-[11px] font-bold flex items-center gap-1">
                          <FileText className="h-3.5 w-3.5" />
                          {module.materials?.length || 0} Files
                        </span>
                        <span className="px-2.5 py-1 rounded bg-slate-200 text-slate-700 text-[11px] font-bold flex items-center gap-1">
                          {module.delivery_type === "both" ? "Theory & Practical" : module.delivery_type === "theory" ? "Theory" : module.delivery_type === "practical" ? "Practical" : "Not Set"}
                        </span>
                        <div className="h-5 w-px bg-slate-200 mx-1"></div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleModuleExpand(index)}
                          className="text-slate-400 hover:text-slate-600 p-1.5"
                        >
                          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeModule(index)}
                          className="text-slate-400 hover:text-red-600 p-1.5"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Module Configuration */}
                    {isExpanded && (
                      <>
                      <div className="p-6 flex flex-col gap-6">
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
                          {/* Module Title */}
                          <div className="md:col-span-8 flex flex-col gap-1.5">
                            <Label className="text-sm font-semibold text-slate-700">
                              Module Title <span className="text-red-500">*</span>
                            </Label>
                            <Input
                              value={module.name}
                              onChange={(e) => updateModule(index, "name", e.target.value)}
                              placeholder="Module title"
                              className={errCls(`modules.${index}.name`, "h-10 text-sm")}
                              required
                            />
                            <FieldError message={fieldErrors[`modules.${index}.name`]} />
                          </div>

                          {/* Module Code */}
                          <div className="md:col-span-4 flex flex-col gap-1.5">
                            <Label className="text-sm font-semibold text-slate-700">Module Code</Label>
                            <Input
                              value={`MOD-${String(index + 1).padStart(3, '0')}`}
                              disabled
                              className="h-10 text-sm font-mono"
                            />
                          </div>

                          {/* Duration */}
                          <div className="md:col-span-4 flex flex-col gap-1.5">
                            <Label className="text-sm font-semibold text-slate-700">
                              Duration (Hours) <span className="text-red-500">*</span>
                            </Label>
                            <Input
                              type="number"
                              min={0}
                              max={10}
                              value={module.duration === 0 || module.duration === undefined || module.duration === null ? "" : module.duration || ""}
                              onKeyDown={(e) => {
                                if (["-", "e", "E", "+"].includes(e.key)) {
                                  e.preventDefault();
                                }
                              }}
                              onChange={(e) => {
                                const value = e.target.value;
                                if (value === "") {
                                  updateModule(index, "duration", 0);
                                } else {
                                  const numValue = parseFloat(value);
                                  if (!isNaN(numValue)) {
                                    updateModule(index, "duration", numValue);
                                  }
                                }
                              }}
                              onBlur={(e) => {
                                const value = parseFloat(e.target.value);
                                if (isNaN(value) || value === 0) {
                                  updateModule(index, "duration", 0);
                                } else {
                                  updateModule(index, "duration", Math.min(10, Math.max(0, value)));
                                }
                              }}
                              placeholder="Hours (max 10)"
                              className={errCls(`modules.${index}.duration`, "h-10 text-sm")}
                            />
                            <FieldError message={fieldErrors[`modules.${index}.duration`]} />
                          </div>

                          {/* Delivery Type */}
                          <div className="md:col-span-5 flex flex-col gap-1.5">
                            <Label className="text-sm font-semibold text-slate-700">Module Classification</Label>
                            <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-lg h-10 items-center">
                              {DELIVERY_TYPES.map((type) => {
                                const isSelected = module.delivery_type === type.value;
                                const practicalDisabled =
                                  formData.delivery_mode === "ONLINE" &&
                                  (type.value === "practical" || type.value === "both");
                                return (
                                  <button
                                    key={type.value}
                                    type="button"
                                    disabled={practicalDisabled}
                                    title={practicalDisabled ? "Practical module classifications are unavailable with Online E-learning delivery." : undefined}
                                    onClick={() => updateModule(index, "delivery_type", type.value)}
                                    className={cn(
                                      "h-full w-full flex items-center justify-center rounded px-1.5 text-[12px] font-semibold select-none",
                                      practicalDisabled && "cursor-not-allowed opacity-40",
                                      isSelected
                                        ? "bg-emerald-600 text-white shadow-sm cursor-default"
                                        : !practicalDisabled && "bg-transparent text-slate-600 hover:bg-slate-200 hover:text-slate-900 cursor-pointer"
                                    )}
                                  >
                                    <span className="pointer-events-none">{type.label}</span>
                                  </button>
                                );
                              })}
                            </div>
                            {formData.delivery_mode === "ONLINE" && (
                              <p className="text-[11px] text-slate-500">
                                Practical and Theory + Practical modules are unavailable with Online E-learning delivery.
                              </p>
                            )}
                          </div>

                          {/* Required Toggle */}
                          <div className="md:col-span-3 flex flex-col gap-1.5">
                            <Label className="text-sm font-semibold text-slate-700">Required</Label>
                            <div className="flex items-center gap-2 h-10">
                              <Checkbox
                                id={`module-required-${index}`}
                                checked={module.is_required !== false}
                                onCheckedChange={(checked) => updateModule(index, "is_required", checked)}
                              />
                              <Label htmlFor={`module-required-${index}`} className="cursor-pointer text-sm font-medium text-slate-700 select-none">
                                Mandatory
                              </Label>
                            </div>
                          </div>

                          {/* Description */}
                          <div className="md:col-span-12 flex flex-col gap-1.5">
                            <Label className="text-sm font-semibold text-slate-700">
                              Module Description <span className="text-red-500">*</span>
                            </Label>
                            <Textarea
                              value={module.description}
                              onChange={(e) => updateModule(index, "description", e.target.value)}
                              placeholder="Module syllabus and learning objectives..."
                              rows={3}
                              className={errCls(`modules.${index}.description`, "text-sm resize-none")}
                            />
                            <FieldError message={fieldErrors[`modules.${index}.description`]} />
                          </div>

                          {/* Per-module assessment setup — done with module creation */}
                          <div className="md:col-span-12 rounded-xl border border-slate-200 bg-slate-50/70 p-4">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                              <div className="flex items-center gap-2">
                                <FileText className="h-4 w-4 text-emerald-600" />
                                <span className="text-[13px] font-bold uppercase tracking-wider text-slate-900">
                                  Module Assessment
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-[12px] font-medium text-slate-500">
                                  {module.has_assessment ? "Enabled" : "No assessment"}
                                </span>
                                <Toggle
                                  checked={!!module.has_assessment}
                                  onChange={(v) => updateModule(index, "has_assessment", v)}
                                  label={`Module ${index + 1} assessment toggle`}
                                />
                              </div>
                            </div>
                            {module.has_assessment ? (
                              <ModAssessmentFields index={index} module={module} updateModule={updateModule} errors={fieldErrors} />
                            ) : (
                              <p className="mt-2 text-[12.5px] text-slate-500">
                                Turn on to configure this module's assessment now (type, score, pass mark, attempts).
                              </p>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Training Materials Section */}
                      <div className="bg-slate-50 rounded-xl p-5 flex flex-col gap-4 mt-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <FileText className="text-emerald-600 text-[20px]" />
                            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                              Training Materials ({module.materials?.length || 0} Attached)
                            </h3>
                          </div>
                          {/* <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="flex items-center gap-1 text-emerald-600 hover:text-emerald-700 bg-white"
                            onClick={() => document.getElementById(`file-upload-${index}`)?.click()}
                          >
                            <RefreshCw className="h-4 w-4" />
                            Upload Material
                          </Button> */}
                          <input
                            id={`file-upload-${index}`}
                            type="file"
                            multiple
                            accept=".pdf,.pptx,.xlsx,.mp4,.docx"
                            className="hidden"
                            onChange={(e) => {
                              const files = Array.from(e.target.files || []);
                              if (files.length > 0) {
                                updateModule(index, "materials", [
                                  ...(module.materials || []),
                                  ...files.map(file => ({
                                    name: file.name,
                                    size: file.size,
                                    type: file.type,
                                  }))
                                ]);
                              }
                              // reset so selecting the same file again still fires onChange
                              e.target.value = "";
                            }}
                          />
                        </div>

                        {/* Uploaded Files List */}
                        {/* Dropzone */}
                        <div 
                          className="group bg-white rounded-xl p-5 flex flex-col items-center justify-center gap-2 cursor-pointer border-2 border-dashed border-slate-300 hover:border-emerald-500 hover:bg-emerald-50/50 transition-all text-center"
                          onClick={() => document.getElementById(`file-upload-${index}`)?.click()}
                        >
                          <div className="h-10 w-10 rounded-full bg-slate-100 group-hover:bg-emerald-100 flex items-center justify-center text-slate-500 group-hover:text-emerald-600 transition-colors">
                            <Upload className="h-5 w-5" />
                          </div>
                          <span className="text-sm font-semibold text-slate-800 group-hover:text-emerald-900 transition-colors">
                            Drop PDF, PPTX, XLSX, MP4 or DOCX files to attach to this module
                          </span>
                          <span className="text-[11.5px] text-slate-500 group-hover:text-emerald-700/80 transition-colors">
                            Max single file payload 250MB • Trainee or Instructor visibility can be adjusted anytime
                          </span>
                        </div>

                        {module.materials && module.materials.length > 0 && (
                          <div className="flex flex-col gap-2.5">
                            {[...module.materials].reverse().map((file, fileIndex) => {
                              const originalIndex = module.materials.length - 1 - fileIndex;
                              return (
                              <div key={originalIndex} className="bg-white p-3.5 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
                                <div className="flex items-center gap-3">
                                  <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                                    <FileText className="h-5 w-5" />
                                  </div>
                                  <div className="flex flex-col">
                                    <span className="text-sm font-bold text-slate-900">{file.name}</span>
                                    <div className="flex items-center gap-3 text-[12px] text-slate-500">
                                      <span>{formatFileSize(file.size)}</span>
                                      <span>•</span>
                                      <span className="text-emerald-600 font-medium">Trainee Visible</span>
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-1 text-slate-400">
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      const newMaterials = module.materials?.filter((_, i) => i !== originalIndex) || [];
                                      updateModule(index, "materials", newMaterials);
                                    }}
                                    className="ml-auto p-1 hover:text-red-600"
                                  >
                                    <Trash className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                              );
                            })}
                          </div>
                        )}

                        
                      </div>

                      {/* Done Button */}
                      <div className="flex justify-end p-4 border-t border-slate-200">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            // Validate this module before collapsing it.
                            if (validateModuleOnDone(index)) {
                              toggleModuleExpand(index);
                            }
                          }}
                          className="flex items-center gap-1.5"
                        >
                          <CheckCircle className="h-4 w-4" />
                          Done
                        </Button>
                      </div>
                    </>
                  )}
                  </Card>
                );
              })}
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            {/* Header */}
            
{/* The gate */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                    <Award className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">Is there a final assessment?</h3>
                    <p className="text-sm text-slate-500">One capstone for the whole course. If not, move to next step.</p>
                  </div>
                </div>
                <div className="flex rounded-lg border border-slate-200 p-1 text-sm font-semibold">
                  <button
                    type="button"
                    onClick={() => toggleFinalAssessment(false)}
                    className={cn(
                      "rounded-md px-4 py-2 transition-colors",
                      !formData.final_assessment ? "bg-slate-900 text-white" : "text-slate-500 hover:text-slate-900",
                    )}
                  >
                    No
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleFinalAssessment(true)}
                    className={cn(
                      "rounded-md px-4 py-2 transition-colors",
                      formData.final_assessment ? "bg-emerald-600 text-white" : "text-slate-500 hover:text-slate-900",
                    )}
                  >
                    Yes
                  </button>
                </div>
              </div>
              {!formData.final_assessment ? (
                <div className="mt-4 rounded-lg bg-slate-50 p-4 text-sm text-slate-500">
                  No final assessment — Next moves straight to Completion Rules.
                </div>
              ) : (
                <div className="mt-6 border-t border-slate-100 pt-6">
                  <div className="mb-4 flex items-center justify-between">
                    <span className="rounded-md bg-amber-100 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-amber-700">
                      Final • Whole Course
                    </span>
                    <Button type="button" variant="ghost" size="sm" onClick={removeFinalAssessment} className="text-slate-400 hover:text-red-600">
                      <Trash className="h-4 w-4" /> Remove final
                    </Button>
                  </div>
                  <FinalAssessmentForm
                    value={formData.final_assessment}
                    courseTitle={formData.title}
                    onChange={updateFinalAssessment}
                    errors={fieldErrors}
                  />
                </div>
              )}
            </div>

            {/* Module assessment recap */}
            <div className="bg-white rounded-xl p-5 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <FileText className="text-emerald-600 h-5 w-5" />
                  <h2 className="text-lg font-semibold text-slate-900">Module Assessments</h2>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[12px] font-bold">
                    {formData.modules.filter((m) => m.has_assessment).length} of {formData.modules.length}
                  </span>
                </div>
                <Button type="button" variant="outline" size="sm" onClick={() => setCurrentStep(2)}>
                  Edit in Step 2
                </Button>
              </div>
              <ul className="mt-3 space-y-2">
                {formData.modules.map((m, i) => (
                  <li key={i} className="flex flex-wrap items-center gap-2 text-sm text-slate-700">
                    <span className="font-semibold text-slate-900">MOD-{String(i + 1).padStart(3, "0")}:</span>
                    <span className="truncate">{m.name || `Module ${i + 1}`}</span>
                    {m.has_assessment ? (
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-700">
                        {moduleAssessmentLabel(m.assessment_type)} • {m.assessment_max_score} pts
                      </span>
                    ) : (
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-500">
                        No assessment
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>

            

            {/* Score Weighting Card */}
            <div className="bg-white rounded-xl p-6 shadow-sm flex flex-col gap-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <PieChart className="text-emerald-600 h-5 w-5" />
                  <span className="text-[12px] font-bold uppercase tracking-wider text-slate-600">Score Weighting</span>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[11px] font-bold">
                  {formData.assessments.length > 0 ? '100% Allocated' : '0% Allocated'}
                </span>
              </div>

              {formData.assessments.length > 0 ? (
                <>
                  {/* Total Points Display */}
                  <div className="flex flex-col items-center justify-center pt-2">
                    <div className="relative w-44 h-44 flex items-center justify-center">
                      <div className="text-center">
                        <span className="text-3xl font-bold text-slate-900 leading-none">
                          {formData.assessments.reduce((total, assessment) => total + (Number(assessment.max_score) || 0), 0)}
                        </span>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mt-1 block">Total Points</span>
                      </div>
                    </div>
                  </div>

                  {/* Breakdown Legend */}
                  <div className="flex flex-col gap-2.5 pt-2">
                    {formData.assessments.map((assessment, index) => {
                      const totalScore = formData.assessments.reduce((total, item) => total + (Number(item.max_score) || 0), 0);
                      const percentage = totalScore > 0 ? Math.round(((Number(assessment.max_score) || 0) / totalScore) * 100) : 0;
                      const colors = ['bg-emerald-500', 'bg-amber-500', 'bg-blue-500', 'bg-purple-500', 'bg-pink-500'];
                      const color = colors[index % colors.length];

                      return (
                        <div key={assessment.id} className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50">
                          <div className="flex items-center gap-2.5">
                            <span className={`w-3 h-3 rounded-full ${color}`}></span>
                            <span className="text-sm text-slate-700">{assessment.name || `Assessment ${index + 1}`}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[12px] font-semibold text-slate-500">{percentage}%</span>
                            <span className="text-sm font-bold text-slate-900">{assessment.max_score} pts</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              ) : (
                <div className="text-center py-8 text-slate-500">
                  <Lightbulb className="h-8 w-8 mx-auto mb-2 text-slate-400" />
                  <p className="text-sm">Enable module assessments in Step 2 or add a final assessment above</p>
                </div>
              )}
            </div>

            {/* Assessment Design Guidelines */}
            <div className="bg-white rounded-xl p-5 shadow-sm flex flex-col gap-3">
              <div className="flex items-center gap-2 text-emerald-600 text-sm font-bold">
                <Lightbulb className="h-5 w-5" />
                <span>Final Assessment Guideline</span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 text-sm text-slate-500 leading-relaxed flex flex-col gap-2">
                <p>
                  Only add a final if the course needs a capstone check after all modules.
                  Otherwise leave it off — module assessments already cover completion.
                </p>
                <div className="flex items-center gap-1.5 text-emerald-600 text-[12px] font-semibold pt-1">
                  <CheckCircle className="h-4 w-4" />
                  <span>Complies with Nigerian Upstream Petroleum Regulatory Commission (NUPRC) guidelines.</span>
                </div>
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            {/* Attendance Requirements */}
            <SectionCard
              icon={Clock}
              title="Attendance Requirements"
              subtitle="Biometric clocking and physical contact verification"
              aside={
                <div className="flex items-center gap-2.5">
                  <span className="text-[11.5px] font-medium leading-tight text-slate-600">
                    {formData.attendance_required ? "Enforced" : "Disabled"}
                  </span>
                  <Toggle
                    checked={formData.attendance_required}
                    onChange={(v) => updateFormData("attendance_required", v)}
                    label="Attendance enforcement"
                  />
                </div>
              }
            >
              {formData.attendance_required && (
                <div className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <FieldLabel htmlFor="attendance_percentage">
                        Minimum Attendance Percentage
                      </FieldLabel>
                      <div className="flex items-baseline gap-1 bg-slate-50 px-3 py-1 rounded-lg">
                        <span className="text-lg font-bold text-emerald-700">
                          {formData.strict_attendance ? 100 : formData.attendance_percentage}
                        </span>
                        <span className="text-sm font-bold text-emerald-700">%</span>
                      </div>
                    </div>
                    <Slider
                      id="attendance_percentage"
                      value={[formData.attendance_percentage]}
                      onValueChange={(value) => {
                        const snapValue = snapToImportantPercentage(value[0]);
                        if (snapValue === 100 && !formData.strict_attendance) {
                          // Dragged all the way to 100 — auto-enable strict mode.
                          setPreviousAttendancePercentage(formData.attendance_percentage < 100 ? formData.attendance_percentage : 80);
                          updateFormData("strict_attendance", true);
                          updateFormData("attendance_percentage", 100);
                        } else if (snapValue < 100 && formData.strict_attendance) {
                          // Dragged away from 100 — auto-release strict mode.
                          updateFormData("strict_attendance", false);
                          updateFormData("attendance_percentage", snapValue);
                        } else {
                          updateFormData("attendance_percentage", snapValue);
                        }
                      }}
                      min={50}
                      max={100}
                      step={1}
                      disabled={formData.strict_attendance}
                      markpoints={[50, 75, 80, 100]}
                      className="w-full"
                    />
                    <div className="relative pt-1 text-[11px] font-medium text-slate-500 h-8">
                      <div className="absolute left-0 flex flex-col items-start" style={{ left: '0%' }}>
                        <span className="font-semibold text-slate-700">50%</span>
                        <span className="text-[10px]">Lenient</span>
                      </div>
                      <div className="absolute flex flex-col items-center" style={{ left: '50%', transform: 'translateX(-50%)' }}>
                        <span className="font-semibold text-slate-700">75%</span>
                        <span className="text-[10px]">Baseline</span>
                      </div>
                      <div className="absolute flex flex-col items-center" style={{ left: '60%', transform: 'translateX(-50%)' }}>
                        <span className="font-semibold text-emerald-700 font-bold">80%</span>
                        <span className="text-[10px] text-emerald-700">Standard</span>
                      </div>
                      <div className="absolute flex flex-col items-end" style={{ right: '0%' }}>
                        <span className="font-semibold text-slate-700">100%</span>
                        <span className="text-[10px]">Zero-Absence</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-12 gap-6 pt-2">
                    <div className="md:col-span-7 flex items-start gap-3 bg-slate-50 p-4 rounded-xl">
                      <Checkbox
                        id="strict_attendance"
                        checked={formData.strict_attendance}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setPreviousAttendancePercentage(formData.attendance_percentage);
                            updateFormData("strict_attendance", true);
                            updateFormData("attendance_percentage", 100);
                          } else {
                            updateFormData("strict_attendance", false);
                            updateFormData("attendance_percentage", previousAttendancePercentage);
                          }
                        }}
                      />
                      <label htmlFor="strict_attendance" className="flex flex-col cursor-pointer">
                        <span className="text-sm font-semibold text-slate-700">Must Attend All Sessions (100%)</span>
                        <span className="text-[12px] text-slate-500 leading-relaxed mt-0.5">
                          Overrides percentage slider to enforce zero-absence regime for high-risk operations.
                        </span>
                      </label>
                    </div>
                    <div className="md:col-span-5 flex flex-col justify-between bg-slate-50 p-4 rounded-xl">
                      <Label className="text-[12px] text-slate-500 font-medium">Minimum Contact Hours</Label>
                      <div className="flex items-center gap-2 mt-2">
                        <div className="relative flex-1">
                          <Input
                            type="number"
                            value={formData.minimum_contact_hours === 0 || formData.minimum_contact_hours === undefined || formData.minimum_contact_hours === null ? "" : formData.minimum_contact_hours}
                            onChange={(e) => {
                              const value = e.target.value;
                              if (value === "") {
                                updateFormData("minimum_contact_hours", 0);
                              } else {
                                const numValue = parseInt(value);
                                if (!isNaN(numValue)) {
                                  updateFormData("minimum_contact_hours", numValue);
                                }
                              }
                            }}
                            onBlur={(e) => {
                              const value = parseInt(e.target.value);
                              if (isNaN(value) || value === 0) {
                                updateFormData("minimum_contact_hours", 36);
                              } else {
                                updateFormData("minimum_contact_hours", Math.max(1, value));
                              }
                            }}
                            className={errCls("minimum_contact_hours", "text-lg font-bold px-3 py-1.5 rounded-lg")}
                          />
                          <span className="absolute right-3 top-2.5 text-[12px] font-semibold text-slate-400">HRS</span>
                        </div>
                        <Clock className="h-6 w-6 text-emerald-600" />
                      </div>
                      <FieldError message={fieldErrors.minimum_contact_hours} />
                      <span className="text-[11px] text-slate-500 mt-1.5">Classroom + Rig Simulator</span>
                    </div>
                  </div>
                </div>
              )}
            </SectionCard>

            {/* Module Completion Gating */}
            <SectionCard
              icon={Layers}
              title="Module Completion Gating"
              subtitle="Select prerequisite modules that trainees must clear before certification."
              aside={
                <span className="text-[12px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">
                  {formData.modules.length} Modules Configured
                </span>
              }
            >
              <div className="flex flex-col gap-3">
                {formData.modules.map((module, index) => (
                  <label
                    key={index}
                    className="flex items-center justify-between p-4 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Checkbox
                        checked={module.is_required !== false}
                        onCheckedChange={(checked) => updateModule(index, "is_required", checked)}
                      />
                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[12px] font-bold text-slate-500">MOD-{String(index + 1).padStart(3, '0')}</span>
                          <span className="text-sm font-semibold text-slate-700 truncate">{module.name || `Module ${index + 1}`}</span>
                        </div>
                        <span className="text-[12px] text-slate-500">{module.duration || 0} Credit Hrs • {module.delivery_type === "both" ? "Theory & Practical" : module.delivery_type}</span>
                      </div>
                    </div>
                    <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold shrink-0 ${
                      module.is_required !== false
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-slate-200 text-slate-600"
                    }`}>
                      {module.is_required !== false ? "MANDATORY" : "ELECTIVE"}
                    </span>
                  </label>
                ))}
              </div>

              <div className="bg-slate-50 p-4 rounded-xl flex flex-col gap-3 mt-4">
                <span className="text-[13px] font-semibold text-slate-700">Completion Enforcement Mode</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className="flex items-start gap-3 p-3 bg-white rounded-lg cursor-pointer shadow-sm">
                    <input
                      type="radio"
                      name="enforcement_mode"
                      checked={formData.module_completion_mode === "strict"}
                      onChange={() => updateFormData("module_completion_mode", "strict")}
                      className="mt-0.5 accent-emerald-600"
                    />
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-slate-700">Strict Clearance</span>
                      <span className="text-[12px] text-slate-500">All checked mandatory modules must attain 100% individual sign-off.</span>
                    </div>
                  </label>
                  <label className="flex items-start gap-3 p-3 bg-white rounded-lg cursor-pointer shadow-sm">
                    <input
                      type="radio"
                      name="enforcement_mode"
                      checked={formData.module_completion_mode === "weighted"}
                      onChange={() => updateFormData("module_completion_mode", "weighted")}
                      className="mt-0.5 accent-emerald-600"
                    />
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-slate-700">Weighted Average</span>
                      <span className="text-[12px] text-slate-500">Aggregate curriculum progress must be ≥ 85% with elective flexibility.</span>
                    </div>
                  </label>
                </div>
              </div>
            </SectionCard>

            {/* Assessment & Practical Gating */}
            <SectionCard
              icon={Award}
              title="Assessment & Practical Gating"
              subtitle="Exam scoring thresholds and field competence evaluation"
              aside={
                <div className="flex items-center gap-2.5">
                  <span className="text-[11.5px] font-medium leading-tight text-slate-600">
                    {formData.assessment_required ? "Active" : "Disabled"}
                  </span>
                  <Toggle
                    checked={formData.assessment_required}
                    onChange={(v) => updateFormData("assessment_required", v)}
                    label="Assessment enforcement"
                  />
                </div>
              }
            >
              {formData.assessment_required && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                    <div className="md:col-span-6 flex flex-col gap-2">
                      <FieldLabel htmlFor="theory_passing_score">
                        Theory Minimum Passing Score
                      </FieldLabel>
                      <div className="flex items-center gap-3">
                        <div className="relative flex-1">
                          <Input
                            id="theory_passing_score"
                            type="number"
                            value={formData.theory_passing_score === 0 || formData.theory_passing_score === undefined || formData.theory_passing_score === null ? "" : formData.theory_passing_score}
                            onChange={(e) => {
                              const value = e.target.value;
                              if (value === "") {
                                updateFormData("theory_passing_score", 0);
                              } else {
                                const numValue = parseInt(value);
                                if (!isNaN(numValue)) {
                                  updateFormData("theory_passing_score", numValue);
                                }
                              }
                            }}
                            onBlur={(e) => {
                              const value = parseInt(e.target.value);
                              if (isNaN(value) || value === 0) {
                                updateFormData("theory_passing_score", 75);
                              } else {
                                updateFormData("theory_passing_score", Math.max(50, Math.min(100, value)));
                              }
                            }}
                            min={50}
                            max={100}
                            className="text-lg font-bold px-4 pr-10 py-2.5 rounded-lg"
                          />
                          <span className="absolute right-3.5 top-2.5 font-bold text-slate-600">%</span>
                        </div>
                        <div className="px-3 py-2 bg-emerald-100 text-emerald-700 rounded-lg text-[12px] font-bold">
                          IWCF Compliant
                        </div>
                      </div>
                      <span className="text-[11px] text-slate-500">Mandated by Nigerian Upstream Petroleum Regulatory Commission.</span>
                    </div>
                    <div className="md:col-span-6 flex flex-col justify-between p-4 rounded-xl bg-slate-50">
                      <div className="flex items-center justify-between">
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-slate-700">Practical Rig Yard Sign-off</span>
                          <span className="text-[11px] text-slate-500">Simulator BOP emergency shut-in drills</span>
                        </div>
                        <Toggle
                          checked={formData.practical_required}
                          onChange={(v) => updateFormData("practical_required", v)}
                          label="Practical requirement"
                        />
                      </div>
                      <div className="flex items-center gap-1 text-[11px] text-emerald-700 font-semibold mt-2">
                        <Award className="h-4 w-4" />
                        <span>Requires Level 4 Assessor Credentials</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 text-slate-700">
                    <AlertTriangle className="h-6 w-6 text-amber-600 shrink-0 mt-0.5" />
                    <div className="flex flex-col text-[13px] leading-relaxed">
                      <span className="font-bold text-amber-700">Facility Prerequisite Warning</span>
                      <span>Requires certified on-site instructor physical sign-off at <strong>Training Yard BOP Skid</strong> prior to digital certificate release.</span>
                    </div>
                  </div>

                  <label className="flex items-start gap-3 p-4 rounded-xl bg-slate-50 cursor-pointer">
                    <Checkbox
                      id="sequential_progression"
                      checked={formData.sequential_progression}
                      onCheckedChange={(checked) => updateFormData("sequential_progression", checked)}
                    />
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-slate-700">Enforce Sequential Progression Gating</span>
                      <span className="text-[12px] text-slate-500 mt-0.5">
                        Trainee must pass Theory Assessment with ≥ {formData.theory_passing_score}% score before the system unlocks scheduling for the Practical Rig Session.
                      </span>
                    </div>
                  </label>
                </div>
              )}
            </SectionCard>
          </div>
        );

      case 5: {
        const sepChar =
          formData.certificate_id_separator === "slash"
            ? "/"
            : formData.certificate_id_separator === "dot"
              ? "."
              : "-";
        const yearPart =
          formData.certificate_id_year_schema === "YYYY"
            ? String(new Date().getFullYear())
            : formData.certificate_id_year_schema === "NONE"
              ? ""
              : String(new Date().getFullYear()).slice(-2);
        const seqSample = formData.certificate_id_sequence_type.startsWith("4-Digit")
          ? "0349"
          : formData.certificate_id_sequence_type.startsWith("UUID")
            ? "A3F9C2"
            : "349";
        const sampleId = [
          (formData.certificate_id_prefix || "").trim().toUpperCase(),
          yearPart,
          seqSample,
        ]
          .filter(Boolean)
          .join(sepChar);
        return (
          <div className={`grid gap-6 ${formData.certificate_enabled ? "lg:grid-cols-[minmax(0,1fr)_360px]" : ""}`}>
            <div className="space-y-5">
              <SectionCard
                icon={Award}
                title="Credential Automation"
                subtitle="Issue certificate upon successful course completion"
                aside={
                  <Toggle
                    checked={formData.certificate_enabled}
                    onChange={(v) => updateFormData("certificate_enabled", v)}
                    label="Issue certificate on completion"
                  />
                }
              >
                {!formData.certificate_enabled ? (
                  <p className="rounded-xl bg-slate-50 p-4 text-[13px] leading-relaxed text-slate-500">
                    Certificate issuance is{" "}
                    <strong className="font-semibold text-slate-700">off</strong> — trainees
                    can complete this course but no credential is generated. Turn issuance on
                    to answer whether generation stays internal or is handled by an external
                    authority, then configure the design, validity and ID syntax below.
                  </p>
                ) : (
                  <div className="space-y-5">
                    <div className="flex items-start gap-3 rounded-xl bg-slate-50 p-4">
                      <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" />
                      <p className="text-[13px] leading-relaxed text-slate-600">
                        Trainees achieving ≥ {formData.theory_passing_score}% on assessments,{" "}
                        {formData.strict_attendance
                          ? "100%"
                          : `${formData.attendance_percentage}%`}{" "}
                        attendance and {formData.minimum_contact_hours} contact hours
                        {formData.practical_required ? " with practical sign-off" : ""}{" "}
                        automatically qualify for this credential.
                      </p>
                    </div>
                  </div>
                )}
              </SectionCard>

              {formData.certificate_enabled && (
                <>
                  <ExternalCertCard
                    external={formData.certificate_external}
                    authority={formData.certificate_authority}
                    licenseId={formData.certificate_license_id}
                    portalUrl={formData.certificate_portal_url}
                    errors={fieldErrors}
                    onToggleExternal={(v) =>
                      setFormData((prev) => ({
                        ...prev,
                        certificate_external: v,
                        certificate_authority: v
                          ? prev.certificate_authority || "NMDPRA"
                          : prev.certificate_authority,
                        certificate_portal_url: v
                          ? prev.certificate_portal_url || EXTERNAL_CERT_AUTHORITIES[0].portal
                          : prev.certificate_portal_url,
                      }))
                    }
                    onAuthority={setExternalAuthority}
                    onLicense={(v) => updateFormData("certificate_license_id", v)}
                    onPortal={(v) => updateFormData("certificate_portal_url", v)}
                  />

                  {!formData.certificate_external && (
                    <>
                      <SectionCard
                        icon={Award}
                        title="Credential Design"
                        subtitle="Bound template and official credential nomenclature for internally generated certificates"
                      >
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <FieldLabel>Official Certificate Template</FieldLabel>
                            <Dialog open={certificateModalOpen} onOpenChange={setCertificateModalOpen}>
                              <DialogTrigger asChild>
                                <Button
                                  type="button"
                                  variant="outline"
                                  className="w-full justify-start h-auto p-4 border-slate-200 bg-slate-50 hover:bg-slate-100"
                                >
                                  <div className="flex items-center gap-3 w-full">
                                    <div className="h-10 w-14 shrink-0 rounded overflow-hidden border border-slate-200">
                                      <img
                                        src={CERTIFICATE_TEMPLATES.find(t => t.name === formData.certificate_template)?.image || "/certificates/gold-foil-template.svg"}
                                        alt="Selected template"
                                        className="w-full h-full object-cover"
                                      />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <p className="truncate text-[14px] font-bold text-slate-900">
                                        {formData.certificate_template}
                                      </p>
                                      <p className="text-[12px] text-slate-500">
                                        Click to change template
                                      </p>
                                    </div>
                                    <ChevronDown className="h-4 w-4 text-slate-400" />
                                  </div>
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                                <DialogHeader>
                                  <DialogTitle>Select Certificate Template</DialogTitle>
                                  <DialogDescription>
                                    Choose a certificate template design for this course. Templates define the visual style and layout of issued certificates.
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                                  {CERTIFICATE_TEMPLATES.map((template) => (
                                    <button
                                      key={template.id}
                                      type="button"
                                      onClick={() => {
                                        updateFormData("certificate_template", template.name);
                                        setCertificateModalOpen(false);
                                      }}
                                      className={`relative group rounded-xl border-2 transition-all ${
                                        formData.certificate_template === template.name
                                          ? "border-emerald-500 bg-emerald-50"
                                          : "border-slate-200 bg-white hover:border-emerald-300 hover:bg-slate-50"
                                      }`}
                                    >
                                      <div className="aspect-[4/3] bg-white rounded-lg overflow-hidden relative">
                                        <img
                                          src={template.image}
                                          alt={template.name}
                                          className="w-full h-full object-cover"
                                          onError={(e) => {
                                            // Fallback to placeholder if image fails to load
                                            e.currentTarget.style.display = 'none';
                                            e.currentTarget.parentElement!.innerHTML = `
                                              <div class="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200">
                                                <div class="text-center p-4">
                                                  <svg class="h-12 w-12 mx-auto text-slate-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                                  </svg>
                                                  <p class="text-xs font-medium text-slate-600">${template.name}</p>
                                                </div>
                                              </div>
                                            `;
                                          }}
                                        />
                                        {formData.certificate_template === template.name && (
                                          <div className="absolute top-2 right-2 bg-emerald-500 text-white rounded-full p-1 shadow-md">
                                            <CheckCircle2 className="h-4 w-4" />
                                          </div>
                                        )}
                                      </div>
                                      <div className="p-3">
                                        <h4 className="font-semibold text-sm text-slate-900">{template.name}</h4>
                                        <p className="text-xs text-slate-500 mt-1">{template.description}</p>
                                      </div>
                                    </button>
                                  ))}
                                </div>
                              </DialogContent>
                            </Dialog>
                          </div>

                          <div className="space-y-2">
                            <FieldLabel htmlFor="certificate_title" hint="Printed across the certificate banner">
                              Official Credential Nomenclature
                            </FieldLabel>
                            <div className="relative">
                              <Input
                                id="certificate_title"
                                value={formData.certificate_title}
                                onChange={(e) => updateFormData("certificate_title", e.target.value)}
                                className="h-11 border-slate-200 bg-slate-50/70 pr-10 text-sm focus-visible:bg-white"
                              />
                              <Pencil className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                            </div>
                            <p className="text-[11.5px] text-slate-400">
                              Displayed prominently across the core banner of the issued physical and
                              digital certificate.
                            </p>
                          </div>
                        </div>
                      </SectionCard>

              <SectionCard
                icon={ShieldCheck}
                title="Verification & Validity Protocols"
                subtitle="Determine sign-off rules and legal duration under industry oversight"
              >
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <label
                    className={`flex cursor-pointer flex-col gap-1 rounded-xl p-4 transition-all ${
                      formData.certificate_issuance_mode === "automatic"
                        ? "bg-emerald-50 ring-1 ring-emerald-600"
                        : "bg-slate-50 hover:bg-slate-100"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-slate-900">Automatic Issuance</span>
                      <input
                        type="radio"
                        name="cert_issuance_mode"
                        checked={formData.certificate_issuance_mode === "automatic"}
                        onChange={() => updateFormData("certificate_issuance_mode", "automatic")}
                        className="h-4 w-4 accent-emerald-600"
                      />
                    </div>
                    <span className="text-[12px] leading-snug text-slate-500">
                      System auto-triggers issuance the moment rules in Step 4 are met.
                    </span>
                  </label>
                  <label
                    className={`flex cursor-pointer flex-col gap-1 rounded-xl p-4 transition-all ${
                      formData.certificate_issuance_mode === "manual"
                        ? "bg-emerald-50 ring-1 ring-emerald-600"
                        : "bg-slate-50 hover:bg-slate-100"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-slate-900">Manual Sign-off</span>
                      <input
                        type="radio"
                        name="cert_issuance_mode"
                        checked={formData.certificate_issuance_mode === "manual"}
                        onChange={() => updateFormData("certificate_issuance_mode", "manual")}
                        className="h-4 w-4 accent-emerald-600"
                      />
                    </div>
                    <span className="text-[12px] leading-snug text-slate-500">
                      Instructor or admin manually verifies and triggers certificate release.{" "}
                      <RefreshCw className="inline h-3 w-3" />
                    </span>
                  </label>
                </div>

                <div className="grid grid-cols-1 gap-4 pt-2 sm:grid-cols-12">
                  <div className="space-y-2 sm:col-span-5">
                    <FieldLabel>Validity Framework</FieldLabel>
                    <Select
                      value={formData.certificate_validity_framework}
                      onValueChange={(v) => updateFormData("certificate_validity_framework", v)}
                    >
                      <SelectTrigger className="h-11 border-slate-200 bg-slate-50/70 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Fixed Term Validity">Fixed Term Validity</SelectItem>
                        <SelectItem value="Perpetual / Lifetime">Perpetual / Lifetime</SelectItem>
                        <SelectItem value="Renewable (CPD Cycle)">Renewable (CPD Cycle)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-6 sm:col-span-7">
                    <FieldLabel>Certificate Duration</FieldLabel>
                    <div className="flex flex-wrap gap-2">
                      {CERTIFICATE_DURATION_PRESETS.map((preset) => {
                        const disabled =
                          formData.certificate_validity_framework === "Perpetual / Lifetime";
                        const active =
                          validityDurationInMonths(
                            formData.certificate_validity_duration,
                            formData.certificate_validity_unit,
                          ) === validityDurationInMonths(preset.duration, preset.unit);
                        return (
                          <button
                            key={preset.label}
                            type="button"
                            disabled={disabled}
                            onClick={() => {
                              updateFormData("certificate_validity_duration", preset.duration);
                              updateFormData("certificate_validity_unit", preset.unit);
                            }}
                            className={`h-9 rounded-lg border px-3 text-[12.5px] font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                              active
                                ? "border-emerald-600 bg-emerald-50 text-emerald-700"
                                : "border-slate-200 bg-slate-50/70 text-slate-600 hover:border-slate-300 hover:bg-white"
                            }`}
                          >
                            {preset.label}
                          </button>
                        );
                      })}
                    </div>
                    <div className="flex flex-col  gap-2 mt-4">
                      <span className="text-[11.5px] font-medium text-slate-500">Custom</span>
                      <div className="flex items-center gap-2 mt-2">
                        <Input
                          type="number"
                          min={1}
                          aria-label="Custom duration amount"
                          value={formData.certificate_validity_duration === 0 || formData.certificate_validity_duration === undefined || formData.certificate_validity_duration === null ? "" : formData.certificate_validity_duration}
                          onChange={(e) => {
                            const value = e.target.value;
                            if (value === "") {
                              updateFormData("certificate_validity_duration", 0);
                            } else {
                              const numValue = parseInt(value);
                              if (!isNaN(numValue)) {
                                updateFormData("certificate_validity_duration", numValue);
                              }
                            }
                          }}
                          onBlur={(e) => {
                            const value = parseInt(e.target.value);
                            if (isNaN(value) || value === 0) {
                              updateFormData("certificate_validity_duration", 2);
                            } else {
                              updateFormData("certificate_validity_duration", Math.max(1, value));
                            }
                          }}
                          disabled={formData.certificate_validity_framework === "Perpetual / Lifetime"}
                          className="h-9 w-24 border-slate-200 bg-slate-50/70 text-sm"
                        />
                        <Select
                          value={formData.certificate_validity_unit}
                          onValueChange={(v) => updateFormData("certificate_validity_unit", v)}
                        >
                          <SelectTrigger
                            disabled={formData.certificate_validity_framework === "Perpetual / Lifetime"}
                            className="h-9 w-36 border-slate-200 bg-slate-50/70 text-sm"
                          >
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Days">Days</SelectItem>
                            <SelectItem value="Months">Months</SelectItem>
                            <SelectItem value="Years">Years</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-xl bg-slate-50 p-4">
                  <Info className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
                  <p className="text-[13px] leading-relaxed text-slate-500">
                    Fixed term validity auto-revokes verification status in public registry
                    upon lapse.
                  </p>
                </div>
              </SectionCard>

              <SectionCard
                icon={QrCode}
                title="Certificate ID Format"
                subtitle="Configure how certificate IDs are formatted and generated. IDs are automatically created when certificates are issued."
              >
                <div className="flex flex-col items-start gap-3 rounded-xl bg-slate-900 p-5 text-white sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="text-[11px] font-medium uppercase tracking-widest text-slate-400">
                      Live Syntax Preview
                    </p>
                    <p className="mt-1 truncate font-mono text-xl font-bold tracking-wide text-emerald-400">
                      {sampleId}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-2">
                    <span className="rounded-md bg-white/10 px-2 py-1 text-[10.5px] font-medium text-slate-300">
                      {formData.certificate_id_sequence_type.startsWith("UUID")
                        ? "UUID"
                        : "Sequential"}{" "}
                      (Auto-assigned)
                    </span>
                    <span className="rounded-md bg-white/10 px-2 py-1 text-[10.5px] font-medium text-slate-300">
                      Cryptographic Dynamic QR
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <FieldLabel>Prefix</FieldLabel>
                    <Input
                      value={formData.certificate_id_prefix}
                      onChange={(e) => {
                        const v = e.target.value.toUpperCase();
                        // Hand-editing stops the live course-name suggestion;
                        // clearing the field resumes it.
                        setIdPrefixAuto(v === "");
                        updateFormData("certificate_id_prefix", v);
                      }}
                      onBlur={() => {
                        // "Done typing" pass: fill the suggestion if the field
                        // is still auto-managed but currently empty.
                        if (
                          idPrefixAuto &&
                          !formData.certificate_id_prefix.trim() &&
                          formData.title.trim()
                        ) {
                          updateFormData("certificate_id_prefix", deriveIdPrefix(formData.title));
                        }
                      }}
                      placeholder={deriveIdPrefix(formData.title) || "e.g., FIRE-SAFE"}
                      className="h-11 border-slate-200 bg-slate-50/70 font-mono text-sm uppercase focus-visible:bg-white"
                    />
                    <p className="text-[11.5px] text-slate-500">
                      Auto-suggested from the course name — type to override.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <FieldLabel>Separator</FieldLabel>
                    <Select
                      value={formData.certificate_id_separator}
                      onValueChange={(v) => updateFormData("certificate_id_separator", v)}
                    >
                      <SelectTrigger className="h-11 border-slate-200 bg-slate-50/70 font-mono text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="-">Hyphen (-)</SelectItem>
                        <SelectItem value="slash">Slash (/)</SelectItem>
                        <SelectItem value="dot">Dot (.)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <FieldLabel>Year Schema</FieldLabel>
                    <Select
                      value={formData.certificate_id_year_schema}
                      onValueChange={(v) => updateFormData("certificate_id_year_schema", v)}
                    >
                      <SelectTrigger className="h-11 border-slate-200 bg-slate-50/70 font-mono text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="YY">YY (2025 → 25)</SelectItem>
                        <SelectItem value="YYYY">YYYY (2025)</SelectItem>
                        <SelectItem value="NONE">No Year Segment</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <FieldLabel>Sequence Type</FieldLabel>
                    <Select
                      value={formData.certificate_id_sequence_type}
                      onValueChange={(v) => updateFormData("certificate_id_sequence_type", v)}
                    >
                      <SelectTrigger className="h-11 border-slate-200 bg-slate-50/70 font-mono text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="3-Digit (001...)">3-Digit (001...)</SelectItem>
                        <SelectItem value="4-Digit (0001...)">4-Digit (0001...)</SelectItem>
                        <SelectItem value="UUID (Alphanumeric)">UUID (Alphanumeric)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-xl bg-slate-50 p-4">
                  <Info className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
                  <p className="text-[13px] leading-relaxed text-slate-600">
                    Example certificate ID:{" "}
                    <strong className="font-semibold text-slate-900">{sampleId}</strong> — this format will be used for all certificates issued for this course.
                  </p>
                </div>
              </SectionCard>
                    </>
                  )}
                </>
              )}

            </div>

            {/* Right rail — live credential preview */}
            {formData.certificate_enabled && (
            <div className="space-y-5 lg:sticky lg:top-24 lg:self-start">
              <div className="flex items-center justify-between gap-3">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">
                  Live Preview
                </p>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-bold text-emerald-700">
                  <ShieldCheck className="h-3 w-3" />
                  {formData.certificate_external
                    ? "EXTERNAL AUTHORITY"
                    : formData.certificate_issuance_mode === "automatic"
                      ? "AUTOMATIC"
                      : "MANUAL SIGN-OFF"}
                </span>
              </div>

              <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
                {!formData.certificate_external ? (
                  <>
                <div className="relative aspect-[4/3]">
                  <img
                    src={CERTIFICATE_TEMPLATES.find(t => t.name === formData.certificate_template)?.image || "/certificates/gold-foil-template.svg"}
                    alt="Certificate preview"
                    className="w-full h-full object-cover"
                  />
                  {formData.certificate_enabled &&
                    formData.certificate_issuance_mode === "automatic" && (
                      <span className="absolute right-3 top-3 rounded-full bg-emerald-600 px-2 py-1 text-[8.5px] font-bold uppercase tracking-wider text-white shadow-md">
                        Auto-Issued
                      </span>
                    )}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3">
                    <p className="text-white text-[10px] font-medium truncate">
                      {formData.certificate_title || formData.title}
                    </p>
                  </div>
                </div>

                <div className="space-y-2 border-t border-slate-100 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[11.5px] text-slate-500">Certificate ID</span>
                    <span className="rounded-md bg-slate-100 px-2 py-1 font-mono text-[11.5px] font-semibold text-slate-800">
                      {sampleId}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="shrink-0 text-[11.5px] text-slate-500">Template</span>
                    <span className="truncate text-[11.5px] font-medium text-slate-800">
                      {formData.certificate_template}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="shrink-0 text-[11.5px] text-slate-500">Validity</span>
                    <span className="text-right text-[11.5px] font-medium text-slate-800">
                      {formData.certificate_validity_framework === "Perpetual / Lifetime"
                        ? "No expiration"
                        : `${formatValidityDuration(formData.certificate_validity_duration, formData.certificate_validity_unit)} from issue`}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="shrink-0 text-[11.5px] text-slate-500">External authority</span>
                    <span className="truncate text-[11.5px] font-medium text-slate-800">
                      {!formData.certificate_external
                        ? "Internal (Gokly Registry)"
                        : EXTERNAL_CERT_AUTHORITIES.find(
                              (a) => a.value === formData.certificate_authority,
                            )?.label ||
                          formData.certificate_authority ||
                          "Custom authority"}
                    </span>
                  </div>
                </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center gap-3 p-6 text-center">
                    <ShieldCheck className="h-8 w-8 text-emerald-600" />
                    <p className="text-[13px] font-bold text-slate-800">
                      {EXTERNAL_CERT_AUTHORITIES.find((a) => a.value === formData.certificate_authority)
                        ?.label ||
                        formData.certificate_authority ||
                        "Custom authority"}
                    </p>
                    <p className="max-w-[88%] text-[12px] leading-relaxed text-slate-500">
                      Generation and validation are controlled by this regulator — Gokly only
                      stores the license ID used for central registry verification.
                    </p>
                    <div className="flex flex-wrap items-center justify-center gap-2">
                      <span className="rounded-md bg-slate-100 px-2 py-1 font-mono text-[11px] font-semibold text-slate-700">
                        {formData.certificate_license_id || "LICENSE-ID"}
                      </span>
                      {formData.certificate_portal_url && (
                        <a
                          href={formData.certificate_portal_url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-700 hover:bg-emerald-100"
                        >
                          <Link2 className="h-3 w-3" />
                          Verify on portal
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <details className="rounded-xl border border-slate-200 bg-white p-4 shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
                <summary className="flex cursor-pointer list-none items-center justify-between text-[13px] font-semibold text-slate-800">
                  <span className="inline-flex items-center gap-2">
                    <Lock className="h-3.5 w-3.5 text-emerald-700" />
                    Security &amp; Render Specifications
                  </span>
                  <ChevronDown className="h-4 w-4 text-slate-400" />
                </summary>
                <ul className="mt-3 space-y-2.5">
                  {!formData.certificate_external && (
                    <CheckRow ok>
                      Cryptographic Dynamic QR rotating every 24 hours — resolves to the live
                      registry record
                    </CheckRow>
                  )}
                  <CheckRow ok>
                    Issuance authority:{" "}
                    {formData.certificate_external
                      ? "External (validated via license ID + portal)"
                      : "Internal — Gokly Industrial Training Registry"}
                  </CheckRow>
                  {!formData.certificate_external && (
                    <>
                      <CheckRow ok>
                        Dual wet-ink facsimile signatures (Director of Training &amp; Assessor)
                      </CheckRow>
                      <CheckRow ok={formData.certificate_issuance_mode === "manual"}>
                        Manual instructor/admin sign-off before release
                      </CheckRow>
                      <CheckRow ok>
                        Guilloche background pattern + microtext border security print
                      </CheckRow>
                      <CheckRow ok>
                        Digital twin (PDF) + physical print master (300 DPI CMYK)
                      </CheckRow>
                    </>
                  )}
                </ul>
                {!formData.certificate_external ? (
                  <p className="mt-3 flex items-start gap-2 rounded-lg bg-slate-50 p-3 text-[12px] leading-relaxed text-slate-500">
                    <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
                    Template, validity framework and ID syntax are snapshotted at the moment of
                    issuance, so already-issued credentials never change retroactively.
                  </p>
                ) : (
                  <p className="mt-3 flex items-start gap-2 rounded-lg bg-slate-50 p-3 text-[12px] leading-relaxed text-slate-500">
                    <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
                    Validity, numbering and issuance rules follow the selected authority's own
                    framework — Gokly mirrors them for verification only.
                  </p>
                )}
              </details>
            </div>
            )}
          </div>
        );
      }

      case 6:
        return (
          <div className="space-y-6">
            <SectionCard
              icon={CheckCircle}
              title="Review & Create Course"
              subtitle="Review all course information before creating the course."
            >
              <div className="space-y-10">
                {/* Step 1: Basic Information */}
                <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 text-sm font-bold">1</div>
                      <h3 className="text-lg font-semibold text-slate-900">Basic Information</h3>
                    </div>
                    <Button type="button" variant="outline" size="sm" onClick={() => setCurrentStep(1)}>
                      <Pencil className="h-3.5 w-3.5 mr-1.5" />
                      Edit
                    </Button>
                  </div>
                  <div className="grid gap-4 text-sm ">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <span className="text-slate-500 block text-xs uppercase tracking-wide mb-1">Course Title</span>
                        <span className="font-medium text-slate-900">{formData.title}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-xs uppercase tracking-wide mb-1">Course Code</span>
                        <span className="font-mono font-medium text-slate-900">{formData.code}</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <span className="text-slate-500 block text-xs uppercase tracking-wide mb-1">Category</span>
                        <span className="font-medium text-slate-900">{formData.category}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-xs uppercase tracking-wide mb-1">Tier</span>
                        <span className="font-medium text-slate-900">{formData.tier}</span>
                      </div>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-xs uppercase tracking-wide mb-1">Short Description</span>
                      <p className="font-medium text-slate-900">{formData.short_description}</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <span className="text-slate-500 block text-xs uppercase tracking-wide mb-1">Duration</span>
                        <span className="font-medium text-slate-900">{totalModuleHours} HOURS</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-xs uppercase tracking-wide mb-1">Delivery Mode</span>
                        <span className="font-medium text-slate-900">{formData.delivery_mode}</span>
                      </div>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-xs uppercase tracking-wide mb-1">Prerequisites</span>
                      {formData.prerequisite_required ? (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-700 text-xs font-medium uppercase">
                              {formData.prerequisite_type === "internal" ? "Internal course" : "External certification"}
                            </span>
                          </div>
                          {formData.prerequisite_type === "internal" && formData.prerequisite_course_id ? (
                            <span className="font-medium text-slate-900">
                              Must complete first: {availableCourses.find(c => c.id === formData.prerequisite_course_id)?.title || `ID: ${formData.prerequisite_course_id}`}
                            </span>
                          ) : formData.prerequisite_type === "external" ? (
                            <p className="font-medium text-slate-900">Must hold: {formData.prerequisite_description}</p>
                          ) : null}
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">None — anyone can enroll</span>
                      )}
                    </div>
                    {formData.description && (
                      <div>
                        <span className="text-slate-500 block text-xs uppercase tracking-wide mb-1">Detailed Description</span>
                        <div className="bg-slate-50 rounded-lg p-3 text-sm text-slate-700 max-h-32 overflow-y-auto">
                          {formData.description}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Step 2: Modules & Assessments */}
                <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 text-sm font-bold">2</div>
                      <h3 className="text-lg font-semibold text-slate-900">Modules & Assessments ({formData.modules.length})</h3>
                    </div>
                    <Button type="button" variant="outline" size="sm" onClick={() => setCurrentStep(2)}>
                      <Pencil className="h-3.5 w-3.5 mr-1.5" />
                      Edit
                    </Button>
                  </div>
                  <div className="space-y-3 ">
                    {formData.modules.map((module, index) => (
                      <div key={index} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-xs font-bold text-slate-500">MOD-{String(index + 1).padStart(3, "0")}</span>
                              <h4 className="font-semibold text-slate-900">{module.name}</h4>
                              {module.is_required !== false && (
                                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10.5px] font-medium">
                                  Required
                                </span>
                              )}
                              {module.materials && module.materials.length > 0 && (
                                <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-[10.5px] font-medium">
                                  {module.materials.length} {module.materials.length === 1 ? 'Material' : 'Materials'}
                                </span>
                              )}
                            </div>
                            {module.description && (
                              <p className="text-sm text-slate-600 mb-2">{module.description}</p>
                            )}
                            {module.duration && (
                              <div className="text-xs text-slate-500 mb-2">
                                Duration: {module.duration} {module.delivery_type || "hours"}
                              </div>
                            )}
                          </div>
                        </div>
                        {module.has_assessment && (
                          <div className="mt-3 pt-3 border-t border-slate-200">
                            <div className="flex items-center gap-2 text-xs">
                              <FileText className="h-3.5 w-3.5 text-emerald-600" />
                              <span className="font-medium text-slate-700">
                                {moduleAssessmentLabel(module.assessment_type)}
                              </span>
                              <span className="text-slate-400">•</span>
                              <span className="text-slate-600">Max: {module.assessment_max_score} pts</span>
                              <span className="text-slate-400">•</span>
                              <span className="text-slate-600">Pass: {module.assessment_pass_mark}%</span>
                              <span className="text-slate-400">•</span>
                              <span className="text-slate-600">Attempts: {module.assessment_attempts_allowed}</span>
                              {module.assessment_required !== false && (
                                <>
                                  <span className="text-slate-400">•</span>
                                  <span className="text-emerald-600 font-medium">Required</span>
                                </>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Step 3: Final Assessment */}
                <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 text-sm font-bold">3</div>
                      <h3 className="text-lg font-semibold text-slate-900">Final Assessment</h3>
                    </div>
                    <Button type="button" variant="outline" size="sm" onClick={() => setCurrentStep(3)}>
                      <Pencil className="h-3.5 w-3.5 mr-1.5" />
                      Edit
                    </Button>
                  </div>
                  <div className="">
                    {formData.final_assessment ? (
                      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                        <div className="flex items-start gap-3">
                          <Award className="h-5 w-5 text-amber-600 mt-0.5" />
                          <div className="flex-1">
                            <h4 className="font-semibold text-slate-900 mb-2">
                              {formData.final_assessment.name || "Final Assessment"}
                            </h4>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              <div>
                                <span className="text-slate-500 block text-xs uppercase tracking-wide mb-1">Type</span>
                                <span className="font-medium text-slate-900">{moduleAssessmentLabel(formData.final_assessment.type)}</span>
                              </div>
                              <div>
                                <span className="text-slate-500 block text-xs uppercase tracking-wide mb-1">Max Score</span>
                                <span className="font-medium text-slate-900">{formData.final_assessment.max_score} pts</span>
                              </div>
                              <div>
                                <span className="text-slate-500 block text-xs uppercase tracking-wide mb-1">Pass Mark</span>
                                <span className="font-medium text-slate-900">{formData.final_assessment.pass_mark}%</span>
                              </div>
                              <div>
                                <span className="text-slate-500 block text-xs uppercase tracking-wide mb-1">Attempts</span>
                                <span className="font-medium text-slate-900">{formData.final_assessment.attempts_allowed}</span>
                              </div>
                            </div>
                            {formData.final_assessment.description && (
                              <div className="mt-3">
                                <span className="text-slate-500 block text-xs uppercase tracking-wide mb-1">Description</span>
                                <p className="text-sm text-slate-700">{formData.final_assessment.description}</p>
                              </div>
                            )}
                            {formData.final_assessment.required && (
                              <div className="mt-3">
                                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-medium">
                                  Required for completion
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-center">
                        <p className="text-sm text-slate-500">No final assessment configured</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Step 4: Completion Rules */}
                <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 text-sm font-bold">4</div>
                      <h3 className="text-lg font-semibold text-slate-900">Completion Rules</h3>
                    </div>
                    <Button type="button" variant="outline" size="sm" onClick={() => setCurrentStep(4)}>
                      <Pencil className="h-3.5 w-3.5 mr-1.5" />
                      Edit
                    </Button>
                  </div>
                  <div className="grid gap-4 text-sm ">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <span className="text-slate-500 block text-xs uppercase tracking-wide mb-1">Attendance Required</span>
                        <span className={`font-medium ${formData.attendance_required ? "text-emerald-600" : "text-slate-400"}`}>
                          {formData.attendance_required ? "Yes" : "No"}
                        </span>
                      </div>
                      {formData.attendance_required && (
                        <>
                          <div>
                            <span className="text-slate-500 block text-xs uppercase tracking-wide mb-1">Minimum Attendance</span>
                            <span className="font-medium text-slate-900">
                              {formData.strict_attendance ? "100% (Strict)" : `${formData.attendance_percentage}%`}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-500 block text-xs uppercase tracking-wide mb-1">Minimum Contact Hours</span>
                            <span className="font-medium text-slate-900">{formData.minimum_contact_hours} hours</span>
                          </div>
                        </>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <span className="text-slate-500 block text-xs uppercase tracking-wide mb-1">Assessment Required</span>
                        <span className={`font-medium ${formData.assessment_required ? "text-emerald-600" : "text-slate-400"}`}>
                          {formData.assessment_required ? "Yes" : "No"}
                        </span>
                      </div>
                      {formData.assessment_required && (
                        <>
                          <div>
                            <span className="text-slate-500 block text-xs uppercase tracking-wide mb-1">Theory Passing Score</span>
                            <span className="font-medium text-slate-900">{formData.theory_passing_score}%</span>
                          </div>
                          <div>
                            <span className="text-slate-500 block text-xs uppercase tracking-wide mb-1">Practical Required</span>
                            <span className={`font-medium ${formData.practical_required ? "text-emerald-600" : "text-slate-400"}`}>
                              {formData.practical_required ? "Yes" : "No"}
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                    <div>
                      <span className="text-slate-500 block text-xs uppercase tracking-wide mb-1">Module Completion Mode</span>
                      <span className="font-medium text-slate-900 capitalize">{formData.module_completion_mode}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-xs uppercase tracking-wide mb-1">Sequential Progression</span>
                      <span className={`font-medium ${formData.sequential_progression ? "text-emerald-600" : "text-slate-400"}`}>
                        {formData.sequential_progression ? "Yes" : "No"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Step 5: Certificate Configuration */}
                <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 text-sm font-bold">5</div>
                      <h3 className="text-lg font-semibold text-slate-900">Certificate Configuration</h3>
                    </div>
                    <Button type="button" variant="outline" size="sm" onClick={() => setCurrentStep(5)}>
                      <Pencil className="h-3.5 w-3.5 mr-1.5" />
                      Edit
                    </Button>
                  </div>
                  <div className="grid gap-4 text-sm ">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <span className="text-slate-500 block text-xs uppercase tracking-wide mb-1">Certificate Enabled</span>
                        <span className={`font-medium ${formData.certificate_enabled ? "text-emerald-600" : "text-slate-400"}`}>
                          {formData.certificate_enabled ? "Yes" : "No"}
                        </span>
                      </div>
                      {formData.certificate_enabled && (
                        <>
                          <div>
                            <span className="text-slate-500 block text-xs uppercase tracking-wide mb-1">Generation Mode</span>
                            <span className="font-medium text-slate-900">
                              {formData.certificate_external ? "External Authority" : "Internal Generation"}
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                    {formData.certificate_enabled && formData.certificate_external && (
                      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <span className="text-slate-500 block text-xs uppercase tracking-wide mb-1">External Authority</span>
                            <span className="font-medium text-slate-900">{formData.certificate_authority || "—"}</span>
                          </div>
                          <div>
                            <span className="text-slate-500 block text-xs uppercase tracking-wide mb-1">License ID</span>
                            <span className="font-mono font-medium text-slate-900">{formData.certificate_license_id || "—"}</span>
                          </div>
                        </div>
                        {formData.certificate_portal_url?.trim() && (
                          <div>
                            <span className="text-slate-500 block text-xs uppercase tracking-wide mb-1">Verification Portal</span>
                            <a href={formData.certificate_portal_url} target="_blank" rel="noreferrer" className="font-medium text-emerald-700 hover:underline">
                              {formData.certificate_portal_url}
                            </a>
                          </div>
                        )}
                        <p className="text-xs text-slate-600">
                          Generation & official validation are controlled by {formData.certificate_authority || "the external authority"}.
                          Records remain verifiable centrally via the license ID + portal.
                        </p>
                      </div>
                    )}
                    {formData.certificate_enabled && !formData.certificate_external && (
                      <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 space-y-3">
                        <div>
                          <span className="text-slate-500 block text-xs uppercase tracking-wide mb-1">Certificate Title</span>
                          <span className="font-medium text-slate-900">{formData.certificate_title || formData.title}</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <span className="text-slate-500 block text-xs uppercase tracking-wide mb-1">Issuance Mode</span>
                            <span className="font-medium text-slate-900 capitalize">{formData.certificate_issuance_mode}</span>
                          </div>
                          <div>
                            <span className="text-slate-500 block text-xs uppercase tracking-wide mb-1">Template</span>
                            <span className="font-medium text-slate-900">{formData.certificate_template}</span>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <span className="text-slate-500 block text-xs uppercase tracking-wide mb-1">Validity Duration</span>
                            <span className="font-medium text-slate-900">{formData.certificate_validity_duration} {formData.certificate_validity_unit}</span>
                          </div>
                          <div>
                            <span className="text-slate-500 block text-xs uppercase tracking-wide mb-1">ID Prefix</span>
                            <span className="font-mono font-medium text-slate-900">{formData.certificate_id_prefix}</span>
                          </div>
                          <div>
                            <span className="text-slate-500 block text-xs uppercase tracking-wide mb-1">ID Format</span>
                            <span className="font-mono font-medium text-slate-900 text-xs">
                              {formData.certificate_id_prefix}{formData.certificate_id_separator}{formData.certificate_id_year_schema}{formData.certificate_id_separator}{formData.certificate_id_sequence_type.replace(/\(.*\)/, '').toLowerCase()}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </SectionCard>
          </div>
        );

      default:
        return null;
    }
  };

  /* ---------------------------------- page ---------------------------------- */

  return (
    <AdminPageShell withSidebar>
      <div className="flex min-h-screen flex-col bg-slate-50/80 pb-32 lg:pb-24">
        {/* Step rail */}
        <div className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur py-3">
          <div className="flex py-3 items-center gap-2 overflow-x-auto sm:px-6">
            {STEPS.map((step, i) => {
              const state =
                step.id === currentStep ? "current" : step.id < currentStep ? "done" : "todo";
              return (
                <div key={step.id} className="flex shrink-0 items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(step.id)}
                    className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[12.5px] font-medium transition-colors ${
                      state === "current"
                        ? "bg-emerald-700 text-white"
                        : state === "done"
                          ? "bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
                          : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    <span
                      className={`flex h-5 w-5 items-center justify-center rounded-full text-[10.5px] font-semibold ${
                        state === "current"
                          ? "bg-white/20 text-white"
                          : state === "done"
                            ? "bg-emerald-600 text-white"
                            : "bg-white text-slate-500"
                      }`}
                    >
                      {state === "done" ? "✓" : step.id}
                    </span>
                    {step.label}
                  </button>
                  {i < STEPS.length - 1 && <span className="h-px w-5 bg-slate-200" />}
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex-1 px-4 pt-6 sm:px-6">
          {/* Page heading */}
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-2xl">
              <div className="flex flex-wrap items-center gap-3">
                <span className="rounded-md bg-slate-200/70 px-2.5 py-1 text-[10.5px] font-semibold tracking-wide text-slate-600">
                  STEP {currentStep} OF {STEPS.length} • {currentStep === 1 ? "BASIC INFO" : currentStep === 2 ? "MODULES & ASSESSMENTS" : currentStep === 3 ? "FINAL ASSESSMENT" : currentStep === 4 ? "COMPLETION RULES" : currentStep === 5 ? "CERTIFICATE" : "REVIEW"}
                </span>
                <span className="inline-flex items-center gap-1.5 text-[11.5px] text-slate-500">
                  <Clock className="h-3.5 w-3.5" />
                  Last saved: Just now
                </span>
              </div>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">
                {currentStep === 1 ? "Course Basic Information" : currentStep === 2 ? "Modules & Module Assessments" : currentStep === 3 ? "Final Overall Assessment" : currentStep === 4 ? "Completion Requirements & Eligibility Protocols" : currentStep === 5 ? "Certificate & Credential Configuration" : "Review & Create Course"}
              </h1>
              <p className="mt-2 text-[13.5px] leading-relaxed text-slate-500">
                {currentStep === 1
                  ? "Define the course identity, delivery mode, and prerequisites. New courses initialize as Draft."
                  : currentStep === 2
                  ? "Structure learning units and set up each module's assessment at the same time (type, score, pass mark, attempts)."
                  : currentStep === 3
                  ? "Module assessments are done. Is there a final overall assessment? If yes, configure it — if not, move on."
                  : currentStep === 4
                  ? "Configure mandatory attendance thresholds, session attendance rules, required module clearance, and minimum assessment passing cutoffs."
                  : currentStep === 5
                  ? "Decide whether a credential is issued at all, whether generation is internal or external, then configure validity and ID syntax for internal issuance."
                  : "Review all course information before creating the course."}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              {showAutofill && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={autofilling || loading}
                  onClick={() => void runAutofill()}
                  title="Fills every step with valid sample data (also via ?autofill=run, or __goklyFillCourse() in the console)"
                  className="gap-1.5 border-dashed text-[12px]"
                >
                  <Sparkles className={cn("h-3.5 w-3.5", autofilling && "animate-pulse")} />
                  {autofilling ? "Filling…" : "Fill demo data"}
                </Button>
              )}
              <div className="flex items-center gap-2.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2.5">
                <span className="h-2 w-2 rounded-full bg-amber-400" />
                <div className="leading-tight">
                  <p className="text-[10.5px] font-medium tracking-wide text-slate-400">
                    Catalog index
                  </p>
                  <p className="text-[12.5px] font-semibold text-slate-800">
                    Staging (DPR Regulated)
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Form + rail */}
          <form noValidate className="mt-6 grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
            <div className="min-w-0">{renderStep()}</div>

            {/* Right rail */}
            <aside className="hidden space-y-4 xl:block sticky top-24 self-start">
              <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                <div className="flex items-center justify-between border-b border-slate-100 px-4 py-2.5">
                  <span className="inline-flex items-center gap-2 text-[11px] font-medium tracking-wide text-slate-600">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    Live catalog preview
                  </span>
                  <span className="text-[11px] text-slate-400">Trainee view</span>
                </div>

                <div className="relative h-32 bg-gradient-to-br from-emerald-800 via-emerald-700 to-slate-800">
                  <span className="absolute left-3 top-3 rounded bg-emerald-900/80 px-2 py-1 text-[10px] font-semibold text-white">
                    {formData.tier || "TIER NOT SET"}
                  </span>
                  <span className="absolute right-3 top-3 text-[10px] font-medium text-white/90">
                    {DELIVERY_MODES.find((m) => m.value === formData.delivery_mode)?.label}
                  </span>
                  <span className="absolute bottom-3 left-3 inline-flex items-center gap-1 rounded bg-black/40 px-2 py-1 text-[10.5px] font-medium text-white">
                    <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                    4.9 (128 reviews)
                  </span>
                  <span className="absolute bottom-3 right-3 rounded bg-white/95 px-2 py-1 text-[10.5px] font-semibold text-emerald-800">
                    NGN 480,000
                  </span>
                </div>

                <div className="space-y-3 p-4">
                  <p className="font-mono text-[10.5px] tracking-wide text-slate-400">
                    {formData.code || "GOK-CODE-000"}
                  </p>
                  <p className="text-[14px] font-semibold leading-snug text-slate-900">
                    {formData.title || "Course name appears here"}
                  </p>
                  <p className="line-clamp-3 text-[12px] leading-relaxed text-slate-500">
                    {formData.short_description ||
                      "Your executive summary will appear in the public catalog listing."}
                  </p>

                  <div className="grid grid-cols-2 gap-y-2 border-t border-slate-100 pt-3 text-[11.5px] text-slate-600">
                    <span className="inline-flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-slate-400" />
                      
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5 text-slate-400" />
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Award className="h-3.5 w-3.5 text-slate-400" />
                      Accredited DPR
                    </span>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-2 text-[12px] font-semibold text-slate-800">
                    <Shield className="h-4 w-4 text-emerald-600" />
                    Specification health
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                      healthScore === 100
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-amber-50 text-amber-700"
                    }`}
                  >
                    {healthScore}% configured
                  </span>
                </div>
                <ul className="mt-3 space-y-2">
                  {checks.map((c) => (
                    <CheckRow key={c.text} ok={c.ok}>
                      {c.text}
                    </CheckRow>
                  ))}
                </ul>
              </div>

              <div className="flex gap-3 rounded-xl border border-slate-200 bg-white p-4">
                <Info className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                <div>
                  <p className="text-[12px] font-semibold text-slate-800">System governance notice</p>
                  <p className="mt-1 text-[11.5px] leading-relaxed text-slate-500">
                    Courses save in Draft status and stay out of batch scheduling until they are
                    reviewed and published at the final step.
                  </p>
                </div>
              </div>

              <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-slate-800 to-emerald-900 p-4">
                <p className="text-[10.5px] font-medium tracking-wide text-emerald-200">
                  Facility validation
                </p>
                <p className="mt-1 text-[13px] font-semibold text-white">
                   Well Control Yard #4
                </p>
              </div>
            </aside>

            {/* Action bar */}
            <div className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_16px_rgba(15,23,42,0.06)] backdrop-blur lg:left-auto lg:rounded-l-xl lg:border-l">
              <div className="mx-auto flex max-w-[1400px] flex-wrap items-center gap-x-2 gap-y-2 px-3 py-2 sm:gap-3 sm:px-6 sm:py-3">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => navigate("/training/course-management")}
                  className="h-9 gap-1.5 whitespace-nowrap px-2 text-[12px] text-slate-600 hover:text-rose-600 sm:gap-2 sm:px-3 sm:text-[13px]"
                >
                  <Trash className="h-4 w-4" />
                  Discard draft
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => navigate("/training/course-management")}
                  className="h-9 gap-1.5 whitespace-nowrap px-2 text-[12px] text-slate-600 sm:gap-2 sm:px-3 sm:text-[13px]"
                >
                  <Save className="h-4 w-4" />
                  Save draft & exit
                </Button>

                <span className="ml-auto hidden items-center gap-2 text-[12px] text-slate-500 xl:inline-flex">
                  {validateStep(currentStep) ? (
                    <>
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      Ready for the next step
                    </>
                  ) : (
                    <>
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                      Required fields outstanding
                    </>
                  )}
                </span>

                {currentStep > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleBack}
                    className="h-10 gap-1.5 whitespace-nowrap border-slate-200 px-3 text-[12px] sm:gap-2 sm:text-[13px]"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Back
                  </Button>
                )}

                {currentStep < STEPS.length ? (
                  <Button
                    type="button"
                    onClick={handleNext}
                    className="h-10 gap-1.5 whitespace-nowrap bg-emerald-700 px-3 text-[12px] font-semibold text-white hover:bg-emerald-800 sm:gap-2 sm:px-5 sm:text-[13px]"
                  >
                    <span className="sm:hidden">Continue</span>
                    <span className="hidden sm:inline">Proceed to step {currentStep + 1}: {STEPS[currentStep].label}</span>
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                ) : (
                  <div className="flex w-full flex-wrap justify-end gap-2 sm:w-auto">
                    <Button
                      type="button"
                      onClick={() => handleSubmit(false)}
                      disabled={loading}
                      variant="outline"
                      className="h-10 gap-1.5 border-slate-300 px-3 text-[12px] font-semibold text-slate-700 hover:bg-slate-50 sm:gap-2 sm:px-4 sm:text-[13px]"
                    >
                      {loading ? "Saving…" : "Save as Draft"}
                      <Save className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      onClick={() => handleSubmit(true)}
                      disabled={loading}
                      className="h-10 gap-1.5 bg-emerald-700 px-3 text-[12px] font-semibold text-white hover:bg-emerald-800 sm:gap-2 sm:px-5 sm:text-[13px]"
                    >
                      {loading ? "Creating & publishing…" : "Create & Publish"}
                      <CheckCircle className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </form>
        </div>
      </div>
    </AdminPageShell>
  );
}