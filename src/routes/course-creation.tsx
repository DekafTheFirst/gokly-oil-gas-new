import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
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
} from "lucide-react";
import { createCourse, fetchCourses } from "@/lib/courses";
import type { CourseModule, CourseRecord } from "@/lib/courses";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const COURSE_CATEGORIES = [
  "HSF & Safety",
  "Technical & Engineering",
  "Emergency & First Aid",
  "Fire Safety",
  "Oil & Gas / Downstream Operations",
  "Other",
];

const TIERS = ["FOUNDATION", "INTERMEDIATE", "ADVANCED"];
const DURATION_UNITS = ["HOURS", "DAYS", "WEEKS"];

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

const DELIVERY_TYPES = [
  { value: "theory", label: "Theory" },
  { value: "practical", label: "Practical" },
  { value: "both", label: "Both" },
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
    label: "Online e-Learning",
    helper: "Self-paced modules with remote testing",
    icon: Monitor,
  },
  {
    value: "HYBRID",
    label: "Hybrid (Theory + Yard Sim)",
    helper: "Digital theory combined with practical rig simulation",
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
  min_class_size: number;
  max_class_size: number;
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
  // Final overall assessment (Step 3): only asked about once all module-level
  // assessments are done. `has_final_assessment` is the yes/no gate; when true
  // the single capstone assessment is configured via the existing Assessment shape.
  has_final_assessment: boolean;
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

function FinalAssessmentForm({ value, onChange, courseTitle }: {
  value: Assessment;
  onChange: (field: keyof Assessment, v: any) => void;
  courseTitle: string;
}) {
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
          className="h-11 border-slate-200 bg-slate-50/70 text-sm"
          required
        />
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
              value={formData.max_score === 0 ? "" : formData.max_score}
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
              className="h-11 border-slate-200 bg-slate-50/70 text-sm pr-12"
            />
            <span className="absolute right-3 text-[12px] text-slate-400 font-bold">PTS</span>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label className="text-sm font-medium text-slate-700">Pass Mark / Cutoff</Label>
          <div className="relative flex items-center">
            <Input
              type="number"
              value={formData.pass_mark === 0 ? "" : formData.pass_mark}
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

function ModAssessmentFields({ index, module, updateModule }: {
  index: number;
  module: CourseModule;
  updateModule: (index: number, field: keyof CourseModule, value: any) => void;
}) {
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
            value={(module.assessment_max_score ?? 100) === 0 ? "" : module.assessment_max_score ?? 100}
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
            className="h-10 bg-white pr-10 text-sm"
          />
          <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] font-bold text-slate-400">PTS</span>
        </div>
      </div>
      <div className="flex flex-col gap-1.5 md:col-span-2">
        <Label className="text-sm font-semibold text-slate-700">Pass Mark</Label>
        <div className="relative">
          <Input
            type="number"
            min={0}
            max={100}
            value={(module.assessment_pass_mark ?? 75) === 0 ? "" : module.assessment_pass_mark ?? 75}
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
            className="h-10 bg-white pr-8 text-sm"
          />
          <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] font-bold text-slate-400">%</span>
        </div>
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

function ExternalCertCard({ external, authority, licenseId, portalUrl, onToggleExternal, onAuthority, onLicense, onPortal }: {
  external: boolean;
  authority: string;
  licenseId: string;
  portalUrl: string;
  onToggleExternal: (v: boolean) => void;
  onAuthority: (v: string) => void;
  onLicense: (v: string) => void;
  onPortal: (v: string) => void;
}) {
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
                  <SelectTrigger id="certificate_authority" className="h-11 border-slate-200 bg-slate-50/70 text-sm">
                    <SelectValue placeholder="Select authority" />
                  </SelectTrigger>
                  <SelectContent>
                    {EXTERNAL_CERT_AUTHORITIES.map((a) => (
                      <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                  className="h-11 border-slate-200 bg-slate-50/70 font-mono text-sm focus-visible:bg-white"
                  required
                />
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
    min_class_size: 5,
    max_class_size: 30,
    prerequisite_required: false,
    prerequisite_type: "internal",
    prerequisite_course_id: null,
    prerequisite_description: "",
    individual_enrollment_enabled: true,
    certificate_enabled: true,
    // Certificate step (Step 5) design defaults — mirrors the reference
    // certificate canvas (title, Gold Foil template, auto issuance, 24-month
    // validity, NCDMB-GOG / hyphen / YY / 3-digit ID syntax).
    certificate_title: "Advanced Offshore Well Control & Blowout Prevention Qualification",
    certificate_template: "Gokly Industrial Gold Foil & Guilloche Standard",
    certificate_issuance_mode: "automatic",
    certificate_validity_framework: "Fixed Term Validity",
    certificate_validity_duration: 24,
    certificate_validity_unit: "Months (2 Years)",
    certificate_id_prefix: "NCDMB-GOG",
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
    has_final_assessment: false,
    final_assessment: null,
    // Assessments defaults (sync'd from module-level setup + final)
    assessments: [],
  });

  const updateFormData = (field: keyof FormData, value: any) => {
    setFormData((prev) => {
      const next = { ...prev, [field]: value };
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
    const known = EXTERNAL_CERT_AUTHORITIES.find((a) => a.value === authority);
    setFormData((prev) => ({
      ...prev,
      certificate_authority: authority,
      certificate_portal_url: prev.certificate_portal_url || known?.portal || "",
    }));
  };

  const addModule = () => {
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
      const finalList = prev.has_final_assessment && prev.final_assessment
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
      const finalList = prev.has_final_assessment && prev.final_assessment
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
          has_final_assessment: false,
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
        has_final_assessment: true,
        final_assessment: final,
        assessments: [...prev.assessments.filter((a) => a.module_association !== "whole"), final],
      };
    });
  };

  const updateFinalAssessment = (field: keyof Assessment, value: any) => {
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

  /* auto-generate a course code from the title + category */
  const generateCode = () => {
    const base =
      formData.title
        .replace(/[^a-zA-Z0-9 ]/g, "")
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((w) => w.slice(0, 4).toUpperCase())
        .join("-") || "GOK";
    const serial = String(Math.floor(100 + Math.random() * 900));
    updateFormData("code", `GOK-${base}-${serial}`);
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

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        const prerequisiteValid = !formData.prerequisite_required || (
          formData.prerequisite_type === "internal"
            ? formData.prerequisite_course_id !== null
            : formData.prerequisite_description.trim().length > 0
        );
        return (
          formData.title.trim().length > 3 &&
          formData.code.trim().length > 2 &&
          formData.category.trim().length > 2 &&
          formData.short_description.trim().length > 5 &&
          formData.tier &&
          formData.status &&
          formData.delivery_mode &&
          formData.duration_value > 0 &&
          prerequisiteValid
        );
      case 2:
        return formData.modules.length > 0
          && formData.modules.every((m) => m.name.trim().length > 0)
          && formData.modules
            .filter((m) => m.has_assessment)
            .every((m) => (m.assessment_max_score ?? 0) > 0 && (m.assessment_pass_mark ?? 0) >= 0);
      case 3:
        // Final assessment is gated: no final = valid; final on = must be named + scored.
        if (!formData.has_final_assessment) return true;
        return !!(
          formData.final_assessment
          && formData.final_assessment.name.trim().length > 0
          && formData.final_assessment.max_score > 0
        );
      case 4:
        return formData.minimum_contact_hours > 0;
      case 5:
        // Certificate step: issuance off = valid; issuance on + external mode
        // must name the authority + license ID for central verification.
        if (!formData.certificate_enabled) return true;
        if (!formData.certificate_external) return true;
        return (
          formData.certificate_authority.trim().length > 0 &&
          formData.certificate_license_id.trim().length > 0
        );
      case 6:
        return true;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, STEPS.length));
    } else {
      toast.error("Some required fields are still empty or invalid on this step.");
    }
  };

  const handleBack = () => setCurrentStep((prev) => Math.max(prev - 1, 1));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep(6)) {
      toast.error("Add at least one named module before creating the course.");
      return;
    }

    try {
      setLoading(true);

      // Upload thumbnail if file is selected
      let thumbnailUrl = formData.thumbnail_url;
      if (formData.thumbnail_file) {
        const formDataUpload = new FormData();
        formDataUpload.append('file', formData.thumbnail_file);
        
        try {
          const token = localStorage.getItem("token");
          const uploadResponse = await fetch(
            `${import.meta.env.VITE_API_URL || "http://localhost:4000"}/api/upload`,
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${token}`,
              },
              body: formDataUpload,
            }
          );
          
          if (!uploadResponse.ok) {
            throw new Error("Failed to upload image");
          }
          
          const uploadData = await uploadResponse.json();
          thumbnailUrl = `${import.meta.env.VITE_API_URL || "http://localhost:4000"}${uploadData.url}`;
        } catch (uploadError) {
          toast.error("Failed to upload course image", {
            description: uploadError instanceof Error ? uploadError.message : "Image upload failed",
          });
          return;
        }
      }

      // Certificate-related payload (Step 5): only the backend-supported
      // external generation flag + authority linkage (NMDPRA for MISTDO) is
      // sent. The richer design fields (title, template, validity, ID syntax)
      // stay frontend-only until backend columns land — strip them here so
      // unknown keys never reach the API.
      const {
        certificate_title: _certTitle,
        certificate_template: _certTemplate,
        certificate_issuance_mode: _certMode,
        certificate_validity_framework: _certFramework,
        certificate_validity_duration: _certDuration,
        certificate_validity_unit: _certUnit,
        certificate_id_prefix: _certPrefix,
        certificate_id_separator: _certSep,
        certificate_id_year_schema: _certYear,
        certificate_id_sequence_type: _certSeq,
        modules: _modules,
        expandedModules: _expandedModules,
        attendance_required: _attendanceRequired,
        attendance_percentage: _attendancePercentage,
        strict_attendance: _strictAttendance,
        minimum_contact_hours: _minimumContactHours,
        module_completion_mode: _moduleCompletionMode,
        assessment_required: _assessmentRequired,
        theory_passing_score: _theoryPassingScore,
        practical_required: _practicalRequired,
        sequential_progression: _sequentialProgression,
        has_final_assessment: _hasFinalAssessment,
        final_assessment: _finalAssessment,
        assessments: _assessments,
        thumbnail_file: _thumbnailFile,
        ...restForm
      } = formData;
      // External linkage only ships when issuance is ON and external mode is
      // active — otherwise the backend's "authority + license ID" guard would
      // reject a course with issuance disabled (e.g. MISTDO auto-detect while
      // the certificate toggle is off).
      const externalOn = formData.certificate_enabled && formData.certificate_external;
      const coursePayload: Record<string, any> = {
        ...restForm,
        thumbnail_url: thumbnailUrl || null,
        certificate_external: externalOn,
        certificate_authority: externalOn ? formData.certificate_authority : null,
        certificate_license_id: externalOn ? formData.certificate_license_id : null,
        certificate_portal_url: externalOn ? formData.certificate_portal_url || null : null,
        prerequisite_type: formData.prerequisite_required ? formData.prerequisite_type : null,
        prerequisite_course_id: formData.prerequisite_required && formData.prerequisite_type === "internal" ? formData.prerequisite_course_id : null,
      };
      const course = await createCourse(coursePayload);

      if (course.id && formData.modules.length > 0) {
        const token = localStorage.getItem("token");
        await fetch(
          `${import.meta.env.VITE_API_URL || "http://localhost:4000"}/api/courses/${course.id}/modules`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ modules: formData.modules }),
          },
        );
      }

      // Persist the final overall assessment (if the gate is ON) to the
      // training-management `assessments` table. Module-level assessments ride
      // on the module payload above; failures here must not fail course creation.
      if (course.id && formData.has_final_assessment && formData.final_assessment) {
        try {
          const token = localStorage.getItem("token");
          const f = formData.final_assessment;
          const typeMap: Record<string, string> = {
            written: "THEORY", mcq: "THEORY", practical: "PRACTICAL",
            oral: "OTHER", trainer: "OTHER", other: "OTHER", final: "FINAL",
          };
          await fetch(
            `${import.meta.env.VITE_API_URL || "http://localhost:4000"}/api/courses/${course.id}/assessments`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                title: f.name,
                description: f.description || "",
                type: typeMap[f.type] || "FINAL",
                max_score: f.max_score,
                pass_mark: (f.max_score * f.pass_mark) / 100,
                is_required: f.required,
              }),
            },
          );
        } catch {
          // Non-blocking: course + modules already saved.
        }
      }

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
              aside={
                <span className="inline-flex items-center rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-600">
                  Status: {formData.status === "DRAFT" ? "Draft" : formData.status}
                </span>
              }
            >
              <div className="space-y-2">
                <FieldLabel htmlFor="title" required hint="Accredited qualification title">
                  Course Name
                </FieldLabel>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => updateFormData("title", e.target.value)}
                  placeholder="Enter course name"
                  className="h-11 border-slate-200 bg-slate-50/70 text-sm focus-visible:bg-white"
                  required
                />
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
                      onChange={(e) => updateFormData("code", e.target.value.toUpperCase())}
                      placeholder="GOK-WELL-402-EXP"
                      className="h-11 border-slate-200 bg-slate-50/70 pr-[72px] font-mono text-sm tracking-wide focus-visible:bg-white"
                      required
                    />
                    <button
                      type="button"
                      onClick={generateCode}
                      className="absolute right-1.5 top-1.5 inline-flex h-8 items-center gap-1 rounded-md border border-slate-200 bg-white px-2 text-[11px] font-medium text-slate-600 hover:border-emerald-200 hover:text-emerald-700"
                    >
                      <RefreshCw className="h-3 w-3" />
                      Gen
                    </button>
                  </div>
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
                      className="h-11 border-slate-200 bg-slate-50/70 text-sm data-[state=open]:bg-white"
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
                </div>
              </div>

              <div className="space-y-2">
                <FieldLabel
                  htmlFor="short_description"
                  required
                  hint={`${formData.short_description.length} / 250 characters`}
                >
                  Executive Short Summary
                </FieldLabel>
                <Textarea
                  id="short_description"
                  value={formData.short_description}
                  onChange={(e) => updateFormData("short_description", e.target.value)}
                  placeholder="Enter short description"
                  rows={3}
                  maxLength={250}
                  className="resize-none border-slate-200 bg-slate-50/70 text-sm leading-relaxed focus-visible:bg-white"
                  required
                />
                <p className="text-[11.5px] text-slate-400">
                  Shown directly in public training index search results and trainee enrollment portals.
                </p>
              </div>

              <div className="space-y-2">
                <FieldLabel htmlFor="thumbnail" hint="Recommended size: 1200x630px (2:1 ratio)">
                  Course Background Picture
                </FieldLabel>
                <div className="relative">
                  <input
                    id="thumbnail"
                    type="file"
                    accept="image/*"
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
                      formData.thumbnail_url || formData.thumbnail_file
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
                          PNG, JPG up to 5MB
                        </p>
                      </div>
                    )}
                  </div>
                </div>
                {formData.thumbnail_file && (
                  <p className="text-[11px] text-emerald-600 flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    {formData.thumbnail_file.name} ({(formData.thumbnail_file.size / 1024 / 1024).toFixed(2)} MB)
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <FieldLabel htmlFor="description">Detailed Syllabus & Operational Scope</FieldLabel>
                <div className="overflow-hidden rounded-lg border border-slate-200">
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
              </div>
            </SectionCard>

            <SectionCard
              icon={Layers}
              title="Delivery Parameters & Cohort Capacity"
              subtitle="Define training methodology, simulator requirements, and safety-critical seating limits."
            >
              <div className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <FieldLabel htmlFor="tier" required>Course Tier</FieldLabel>
                    <Select value={formData.tier} onValueChange={(value) => updateFormData("tier", value)}>
                      <SelectTrigger id="tier" className="h-11 border-slate-200 bg-slate-50/70 text-sm">
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
                  </div>

                  <div className="space-y-2">
                    <FieldLabel htmlFor="status" required>Course Status</FieldLabel>
                    <Select value={formData.status} onValueChange={(value) => updateFormData("status", value)}>
                      <SelectTrigger id="status" className="h-11 border-slate-200 bg-slate-50/70 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="DRAFT">Draft</SelectItem>
                        <SelectItem value="PUBLISHED">Published</SelectItem>
                        <SelectItem value="ARCHIVED">Archived</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
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

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <FieldLabel htmlFor="duration_value" required>
                    Course Duration
                  </FieldLabel>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="relative">
                      <Input
                        id="duration_value"
                        type="number"
                        min="1"
                        value={formData.duration_value === 0 ? "" : formData.duration_value}
                        onKeyDown={(e) => {
                          if (["-", "e", "E", "+"].includes(e.key)) {
                            e.preventDefault();
                          }
                        }}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (value === "") {
                            updateFormData("duration_value", 0);
                          } else {
                            const numValue = parseInt(value);
                            if (!isNaN(numValue)) {
                              updateFormData("duration_value", numValue);
                            }
                          }
                        }}
                        onBlur={(e) => {
                          const value = parseInt(e.target.value);
                          if (isNaN(value) || value === 0) {
                            updateFormData("duration_value", 40);
                          } else {
                            updateFormData("duration_value", Math.max(1, value));
                          }
                        }}
                        className="h-11 border-slate-200 bg-slate-50/70 pr-10 text-sm focus-visible:bg-white"
                        required
                      />
                      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-slate-400">
                        Qty
                      </span>
                    </div>
                    <Select
                      value={formData.duration_unit}
                      onValueChange={(value) => updateFormData("duration_unit", value)}
                    >
                      <SelectTrigger className="h-11 border-slate-200 bg-slate-50/70 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {DURATION_UNITS.map((unit) => (
                          <SelectItem key={unit} value={unit}>
                            {unit}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <p className="text-[11.5px] leading-snug text-slate-400">
                    Mandates 8 contact hours/day under IWCF curriculum regulations.
                  </p>
                </div>

                <div className="space-y-2">
                  <FieldLabel required>Simulator Cohort Capacity</FieldLabel>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="relative">
                        <Input
                          id="min_class_size"
                          type="number"
                          min="1"
                          value={formData.min_class_size === 0 ? "" : formData.min_class_size}
                          onKeyDown={(e) => {
                            if (["-", "e", "E", "+"].includes(e.key)) {
                              e.preventDefault();
                            }
                          }}
                          onChange={(e) => {
                            const value = e.target.value;
                            if (value === "") {
                              updateFormData("min_class_size", 0);
                            } else {
                              const numValue = parseInt(value);
                              if (!isNaN(numValue)) {
                                updateFormData("min_class_size", numValue);
                              }
                            }
                          }}
                          onBlur={(e) => {
                            const value = parseInt(e.target.value);
                            if (isNaN(value) || value === 0) {
                              updateFormData("min_class_size", 5);
                            } else {
                              updateFormData("min_class_size", Math.max(1, value));
                            }
                          }}
                          className="h-11 border-slate-200 bg-slate-50/70 pr-10 text-sm focus-visible:bg-white"
                          required
                        />
                        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-slate-400">
                          Min
                        </span>
                      </div>
                      <p className="mt-2 text-[11.5px] text-slate-400">Break-even target</p>
                    </div>
                    <div>
                      <div className="relative">
                        <Input
                          id="max_class_size"
                          type="number"
                          min="1"
                          value={formData.max_class_size === 0 ? "" : formData.max_class_size}
                          onKeyDown={(e) => {
                            if (["-", "e", "E", "+"].includes(e.key)) {
                              e.preventDefault();
                            }
                          }}
                          onChange={(e) => {
                            const value = e.target.value;
                            if (value === "") {
                              updateFormData("max_class_size", 0);
                            } else {
                              const numValue = parseInt(value);
                              if (!isNaN(numValue)) {
                                updateFormData("max_class_size", numValue);
                              }
                            }
                          }}
                          onBlur={(e) => {
                            const value = parseInt(e.target.value);
                            if (isNaN(value) || value === 0) {
                              updateFormData("max_class_size", 30);
                            } else {
                              updateFormData("max_class_size", Math.max(1, value));
                            }
                          }}
                          className="h-11 border-slate-200 bg-slate-50/70 pr-10 text-sm focus-visible:bg-white"
                          required
                        />
                        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-slate-400">
                          Max
                        </span>
                      </div>
                      <p className="mt-2 text-[11.5px] text-slate-400">Console seat cap</p>
                    </div>
                  </div>
                </div>
              </div>
              </div>
            </SectionCard>

            <SectionCard
              icon={ShieldCheck}
              title="Prerequisites & Entry Clearance"
              subtitle="Automated safety compliance verification prior to terminal badge activation."
              aside={
                <div className="flex items-center gap-2.5">
                  <span className="text-[11.5px] font-medium leading-tight text-slate-600">
                    Gating
                    <br />
                    {formData.prerequisite_required ? "Active" : "Off"}
                  </span>
                  <Toggle
                    checked={formData.prerequisite_required}
                    onChange={(v) => updateFormData("prerequisite_required", v)}
                    label="Prerequisite gating"
                  />
                </div>
              }
            >
              {formData.prerequisite_required ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <FieldLabel htmlFor="prerequisite_type" required>
                      Prerequisite Type
                    </FieldLabel>
                    <Select
                      value={formData.prerequisite_type}
                      onValueChange={(value: "internal" | "external") => updateFormData("prerequisite_type", value)}
                    >
                      <SelectTrigger
                        id="prerequisite_type"
                        className="h-11 border-slate-200 bg-slate-50/70 text-sm data-[state=open]:bg-white"
                      >
                        <SelectValue placeholder="Select prerequisite type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="internal">Internal Course</SelectItem>
                        <SelectItem value="external">External Certification</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {formData.prerequisite_type === "internal" ? (
                    <div className="space-y-2">
                      <FieldLabel htmlFor="prerequisite_course_id" required>
                        Select Prerequisite Course
                      </FieldLabel>
                      <Select
                        value={formData.prerequisite_course_id?.toString() || ""}
                        onValueChange={(value) => updateFormData("prerequisite_course_id", value ? parseInt(value) : null)}
                      >
                        <SelectTrigger
                          id="prerequisite_course_id"
                          className="h-11 border-slate-200 bg-slate-50/70 text-sm data-[state=open]:bg-white"
                        >
                          <SelectValue placeholder="Select a course" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableCourses.length > 0 ? (
                            availableCourses.map((course) => (
                              <SelectItem key={course.id} value={course.id.toString()}>
                                {course.code ? `${course.code} - ` : ""}{course.title}
                              </SelectItem>
                            ))
                          ) : (
                            <SelectItem value="" disabled>
                              No courses available
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                      <p className="flex items-center gap-1.5 text-[11.5px] text-emerald-700">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Learners must complete the selected course before enrolling.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <FieldLabel htmlFor="prerequisite_description" required>
                        External Certification Requirements
                      </FieldLabel>
                      <Textarea
                        id="prerequisite_description"
                        value={formData.prerequisite_description}
                        onChange={(e) => updateFormData("prerequisite_description", e.target.value)}
                        placeholder="e.g. Valid IWCF Level 4 certification or equivalent offshore experience"
                        rows={3}
                        className="resize-none border-slate-200 bg-slate-50/70 text-sm leading-relaxed focus-visible:bg-white"
                        required
                      />
                      <p className="flex items-center gap-1.5 text-[11.5px] text-emerald-700">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Auto-verifies against Nigeria NOGICD / IWCF Central Database records upon enrollment.
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <p className="rounded-lg border border-dashed border-slate-200 bg-slate-50/60 px-4 py-5 text-center text-[12.5px] text-slate-500">
                  Entry is open to all trainees. Turn on gating to require prior certification or
                  verified offshore experience.
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
                <div className="flex flex-col pl-6 pr-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Duration</span>
                  <span className="text-2xl font-bold text-slate-900">{formData.duration_value} {formData.duration_unit.toLowerCase()}</span>
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
              {formData.modules.map((module, index) => {
                const isExpanded = formData.expandedModules.includes(index);
                return (
                  <Card key={index} className="bg-white rounded-xl shadow-md overflow-hidden">
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
                              className="h-10 text-sm"
                              required
                            />
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
                            <Label className="text-sm font-semibold text-slate-700">Duration (Hours)</Label>
                            <Input
                              type="number"
                              min={0}
                              max={10}
                              value={module.duration === 0 ? "" : module.duration || ""}
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
                              className="h-10 text-sm"
                            />
                          </div>

                          {/* Delivery Type */}
                          <div className="md:col-span-5 flex flex-col gap-1.5">
                            <Label className="text-sm font-semibold text-slate-700">Delivery Format</Label>
                            <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-lg h-10 items-center">
                              {DELIVERY_TYPES.map((type) => {
                                const isSelected = module.delivery_type === type.value;
                                return (
                                  <button
                                    key={type.value}
                                    type="button"
                                    onClick={() => updateModule(index, "delivery_type", type.value)}
                                    className={cn(
                                      "h-full w-full flex items-center justify-center rounded px-1.5 text-[12px] font-semibold select-none",
                                      isSelected
                                        ? "bg-emerald-600 text-white shadow-sm cursor-default"
                                        : "bg-transparent text-slate-600 hover:bg-slate-200 hover:text-slate-900 cursor-pointer"
                                    )}
                                  >
                                    <span className="pointer-events-none">{type.label}</span>
                                  </button>
                                );
                              })}
                            </div>
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
                            <Label className="text-sm font-semibold text-slate-700">Module Description</Label>
                            <Textarea
                              value={module.description}
                              onChange={(e) => updateModule(index, "description", e.target.value)}
                              placeholder="Module syllabus and learning objectives..."
                              rows={3}
                              className="text-sm resize-none"
                            />
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
                              <ModAssessmentFields index={index} module={module} updateModule={updateModule} />
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
                          onClick={() => toggleModuleExpand(index)}
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
                      !formData.has_final_assessment ? "bg-slate-900 text-white" : "text-slate-500 hover:text-slate-900",
                    )}
                  >
                    No
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleFinalAssessment(true)}
                    className={cn(
                      "rounded-md px-4 py-2 transition-colors",
                      formData.has_final_assessment ? "bg-emerald-600 text-white" : "text-slate-500 hover:text-slate-900",
                    )}
                  >
                    Yes
                  </button>
                </div>
              </div>
              {!formData.has_final_assessment || !formData.final_assessment ? (
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
                          {formData.assessments.reduce((total, assessment) => total + assessment.max_score, 0)}
                        </span>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mt-1 block">Total Points</span>
                      </div>
                    </div>
                  </div>

                  {/* Breakdown Legend */}
                  <div className="flex flex-col gap-2.5 pt-2">
                    {formData.assessments.map((assessment, index) => {
                      const totalScore = formData.assessments.reduce((total, a) => total + a.max_score, 0);
                      const percentage = totalScore > 0 ? Math.round((assessment.max_score / totalScore) * 100) : 0;
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
                        updateFormData("attendance_percentage", snapValue);
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
                            value={formData.minimum_contact_hours === 0 ? "" : formData.minimum_contact_hours}
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
                            className="text-lg font-bold px-3 py-1.5 rounded-lg"
                          />
                          <span className="absolute right-3 top-2.5 text-[12px] font-semibold text-slate-400">HRS</span>
                        </div>
                        <Clock className="h-6 w-6 text-emerald-600" />
                      </div>
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
                            value={formData.theory_passing_score === 0 ? "" : formData.theory_passing_score}
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
                  <div className="space-y-2 sm:col-span-3">
                    <FieldLabel>Duration</FieldLabel>
                    <Input
                      type="number"
                      min={1}
                      value={formData.certificate_validity_duration === 0 ? "" : formData.certificate_validity_duration}
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
                          updateFormData("certificate_validity_duration", 24);
                        } else {
                          updateFormData("certificate_validity_duration", Math.max(1, value));
                        }
                      }}
                      disabled={formData.certificate_validity_framework === "Perpetual / Lifetime"}
                      className="h-11 border-slate-200 bg-slate-50/70 text-sm"
                    />
                  </div>
                  <div className="space-y-2 sm:col-span-4">
                    <FieldLabel>Unit</FieldLabel>
                    <Select
                      value={formData.certificate_validity_unit}
                      onValueChange={(v) => updateFormData("certificate_validity_unit", v)}
                    >
                      <SelectTrigger className="h-11 border-slate-200 bg-slate-50/70 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Days">Days</SelectItem>
                        <SelectItem value="Months">Months</SelectItem>
                        <SelectItem value="Months (2 Years)">Months (2 Years)</SelectItem>
                        <SelectItem value="Years">Years</SelectItem>
                      </SelectContent>
                    </Select>
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
                      onChange={(e) => updateFormData("certificate_id_prefix", e.target.value)}
                      placeholder="e.g., NCDMB-GOG"
                      className="h-11 border-slate-200 bg-slate-50/70 font-mono text-sm uppercase focus-visible:bg-white"
                    />
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
                        : `${formData.certificate_validity_duration} ${formData.certificate_validity_unit.split(" ")[0].toLowerCase()}${formData.certificate_validity_duration === 1 ? "" : "s"} from issue`}
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
                  <div className="grid gap-4 text-sm pl-11">
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
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <span className="text-slate-500 block text-xs uppercase tracking-wide mb-1">Duration</span>
                        <span className="font-medium text-slate-900">{formData.duration_value} {formData.duration_unit}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-xs uppercase tracking-wide mb-1">Delivery Mode</span>
                        <span className="font-medium text-slate-900">{formData.delivery_mode}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-xs uppercase tracking-wide mb-1">Status</span>
                        <span className="font-medium text-slate-900">{formData.status}</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <span className="text-slate-500 block text-xs uppercase tracking-wide mb-1">Min Class Size</span>
                        <span className="font-medium text-slate-900">{formData.min_class_size}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-xs uppercase tracking-wide mb-1">Max Class Size</span>
                        <span className="font-medium text-slate-900">{formData.max_class_size}</span>
                      </div>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-xs uppercase tracking-wide mb-1">Prerequisites</span>
                      {formData.prerequisite_required ? (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-700 text-xs font-medium uppercase">
                              {formData.prerequisite_type}
                            </span>
                          </div>
                          {formData.prerequisite_type === "internal" && formData.prerequisite_course_id ? (
                            <span className="font-medium text-slate-900">
                              Required Course: {availableCourses.find(c => c.id === formData.prerequisite_course_id)?.title || `ID: ${formData.prerequisite_course_id}`}
                            </span>
                          ) : formData.prerequisite_type === "external" ? (
                            <p className="font-medium text-slate-900">{formData.prerequisite_description}</p>
                          ) : null}
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">No prerequisites required</span>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <span className="text-slate-500 block text-xs uppercase tracking-wide mb-1">Individual Enrollment</span>
                        <span className={`font-medium ${formData.individual_enrollment_enabled ? "text-emerald-600" : "text-slate-400"}`}>
                          {formData.individual_enrollment_enabled ? "Enabled" : "Disabled"}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-xs uppercase tracking-wide mb-1">Course Status</span>
                        <span className={`font-medium ${formData.status === "PUBLISHED" ? "text-emerald-600" : formData.status === "DRAFT" ? "text-amber-600" : "text-slate-600"}`}>
                          {formData.status}
                        </span>
                      </div>
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
                  <div className="space-y-3 pl-11">
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
                  <div className="pl-11">
                    {formData.has_final_assessment && formData.final_assessment ? (
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
                  <div className="grid gap-4 text-sm pl-11">
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
                    {formData.individual_enrollment_enabled && (
                      <div className="rounded-lg bg-emerald-50 p-3">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-emerald-600" />
                          <span className="text-sm font-medium text-emerald-800">
                            Individual enrollment is enabled for this course
                          </span>
                        </div>
                      </div>
                    )}
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
                  <div className="grid gap-4 text-sm pl-11">
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
      <div className="flex min-h-screen flex-col bg-slate-50/80 pb-[100px]">
        {/* Step rail */}
        <div className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur py-3">
          <div className="flex items-center gap-2 overflow-x-auto sm:px-6">
            {STEPS.map((step, i) => {
              const state =
                step.id === currentStep ? "current" : step.id < currentStep ? "done" : "todo";
              return (
                <div key={step.id} className="flex shrink-0 items-center gap-2">
                  <button
                    type="button"
                    onClick={() => (true || step.id < currentStep) && setCurrentStep(step.id)}
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
                  ? "Define the fundamental parameters, operational codes, class sizes, and prerequisite credentials for this course programme. New courses initialize as Draft."
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

          {/* Form + rail */}
          <form onSubmit={handleSubmit} className="mt-6 grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
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
                      <Clock className="h-3.5 w-3.5 text-slate-400" />
                      {formData.duration_value} {formData.duration_unit.toLowerCase()}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-slate-400" />
                      
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5 text-slate-400" />
                      Max {formData.max_class_size} trainees
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
            <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-slate-200 bg-white/95 backdrop-blur xl:left-auto">
              <div className="mx-auto flex max-w-[1400px] items-center gap-3 px-4 py-3 sm:px-6">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => navigate("/training/course-management")}
                  className="h-9 gap-2 text-[13px] text-slate-600 hover:text-rose-600"
                >
                  <Trash className="h-4 w-4" />
                  Discard draft
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => navigate("/training/course-management")}
                  className="h-9 gap-2 text-[13px] text-slate-600"
                >
                  <Save className="h-4 w-4" />
                  Save draft & exit
                </Button>

                <span className="ml-auto hidden items-center gap-2 text-[12px] text-slate-500 sm:inline-flex">
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
                    className="h-10 gap-2 border-slate-200 text-[13px]"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Back
                  </Button>
                )}

                {currentStep < STEPS.length ? (
                  <Button
                    type="button"
                    onClick={handleNext}
                    className="h-10 gap-2 bg-emerald-700 px-5 text-[13px] font-semibold text-white hover:bg-emerald-800"
                  >
                    Proceed to step {currentStep + 1}: {STEPS[currentStep].label}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    disabled={loading}
                    className="h-10 gap-2 bg-emerald-700 px-5 text-[13px] font-semibold text-white hover:bg-emerald-800"
                  >
                    {loading ? "Creating course…" : "Create course"}
                    <CheckCircle className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </form>
        </div>
      </div>
    </AdminPageShell>
  );
}