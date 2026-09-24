import { useRef, useState } from "react";
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
} from "lucide-react";
import { createCourse } from "@/lib/courses";
import type { CourseModule } from "@/lib/courses";
import { cn } from "@/lib/utils";

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
  { id: 2, label: "Modules" },
  { id: 3, label: "Completion Rules" },
  { id: 4, label: "Review" },
];

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
  prerequisite_description: string;
  individual_enrollment_enabled: boolean;
  certificate_enabled: boolean;
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
};

/* ---------------------------------- bits ---------------------------------- */

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
          <Icon className="h-4.5 w-4.5" />
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
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const syllabusRef = useRef<HTMLTextAreaElement | null>(null);

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
    prerequisite_description: "",
    individual_enrollment_enabled: true,
    certificate_enabled: true,
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
  });

  const updateFormData = (field: keyof FormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
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
        },
      ],
      expandedModules: [...prev.expandedModules, prev.modules.length],
    }));
  };

  const updateModule = (index: number, field: keyof CourseModule, value: any) => {
    setFormData((prev) => ({
      ...prev,
      modules: prev.modules.map((mod, i) => (i === index ? { ...mod, [field]: value } : mod)),
    }));
  };

  const removeModule = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      modules: prev.modules.filter((_, i) => i !== index),
      expandedModules: prev.expandedModules.filter(i => i !== index),
    }));
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

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return (
          formData.title.trim().length > 3 &&
          formData.code.trim().length > 2 &&
          formData.category.trim().length > 2 &&
          formData.short_description.trim().length > 5
        );
      case 2:
        return formData.modules.length > 0 && formData.modules.every(m => m.name.trim().length > 0);
      case 3:
        return (
          formData.tier &&
          formData.status &&
          formData.delivery_mode &&
          formData.duration_value > 0 &&
          formData.minimum_contact_hours > 0
        );
      case 4:
        return true;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, STEPS.length));
    } else {
      setError("Some required fields are still empty or invalid on this step.");
      setTimeout(() => setError(""), 3000);
    }
  };

  const handleBack = () => setCurrentStep((prev) => Math.max(prev - 1, 1));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep(4)) {
      setError("Add at least one named module before creating the course.");
      setTimeout(() => setError(""), 3000);
      return;
    }

    try {
      setLoading(true);
      const course = await createCourse(formData);

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

      setSuccess(true);
      setTimeout(() => navigate(`/training/course/${course.id}`), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "The course could not be created.");
      setTimeout(() => setError(""), 4000);
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
                          className={`mb-2.5 h-4.5 w-4.5 ${active ? "text-emerald-700" : "text-slate-500"}`}
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
                        value={formData.duration_value}
                        onKeyDown={(e) => {
                          if (["-", "e", "E", "+"].includes(e.key)) {
                            e.preventDefault();
                          }
                        }}
                        onChange={(e) =>
                          updateFormData("duration_value", Math.max(1, parseInt(e.target.value) || 0))
                        }
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
                          value={formData.min_class_size}
                          onKeyDown={(e) => {
                            if (["-", "e", "E", "+"].includes(e.key)) {
                              e.preventDefault();
                            }
                          }}
                          onChange={(e) =>
                            updateFormData("min_class_size", Math.max(1, parseInt(e.target.value) || 0))
                          }
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
                          value={formData.max_class_size}
                          onKeyDown={(e) => {
                            if (["-", "e", "E", "+"].includes(e.key)) {
                              e.preventDefault();
                            }
                          }}
                          onChange={(e) =>
                            updateFormData("max_class_size", Math.max(1, parseInt(e.target.value) || 0))
                          }
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
                <div className="space-y-2">
                  <FieldLabel htmlFor="prerequisite_description" required>
                    Enforcement Protocol & Entry Criteria
                  </FieldLabel>
                  <Textarea
                    id="prerequisite_description"
                    value={formData.prerequisite_description}
                    onChange={(e) => updateFormData("prerequisite_description", e.target.value)}
                    placeholder="Enter prerequisite requirements"
                    rows={3}
                    className="resize-none border-slate-200 bg-slate-50/70 text-sm leading-relaxed focus-visible:bg-white"
                    required
                  />
                  <p className="flex items-center gap-1.5 text-[11.5px] text-emerald-700">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Auto-verifies against Nigeria NOGICD / IWCF Central Database records upon enrollment.
                  </p>
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
                              value={module.duration || ""}
                              onKeyDown={(e) => {
                                if (["-", "e", "E", "+"].includes(e.key)) {
                                  e.preventDefault();
                                }
                              }}
                              onChange={(e) => {
                                const val = e.target.value === "" ? 0 : Math.min(10, Math.max(0, parseFloat(e.target.value) || 0));
                                updateModule(index, "duration", val);
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
            {/* Course Configuration */}
            <SectionCard
              icon={Shield}
              title="Course Configuration"
              subtitle="Set the difficulty tier and confirm the delivery parameters captured earlier."
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <FieldLabel htmlFor="tier">Course Tier</FieldLabel>
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
                  <FieldLabel htmlFor="status">Course Status</FieldLabel>
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

                <div className="space-y-2">
                  <FieldLabel htmlFor="delivery_mode">Delivery Mode</FieldLabel>
                  <Select value={formData.delivery_mode} onValueChange={(value) => updateFormData("delivery_mode", value)}>
                    <SelectTrigger id="delivery_mode" className="h-11 border-slate-200 bg-slate-50/70 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DELIVERY_MODES.map((mode) => (
                        <SelectItem key={mode.value} value={mode.value}>
                          {mode.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <FieldLabel htmlFor="duration_value">Duration</FieldLabel>
                  <div className="flex gap-2">
                    <Input
                      id="duration_value"
                      type="number"
                      value={formData.duration_value}
                      onKeyDown={(e) => {
                        if (["-", "e", "E", "+"].includes(e.key)) {
                          e.preventDefault();
                        }
                      }}
                      onChange={(e) => updateFormData("duration_value", Math.max(1, parseInt(e.target.value) || 0))}
                      min="1"
                      className="h-11 border-slate-200 bg-slate-50/70 text-sm"
                    />
                    <Select value={formData.duration_unit} onValueChange={(value) => updateFormData("duration_unit", value)}>
                      <SelectTrigger className="h-11 border-slate-200 bg-slate-50/70 text-sm w-32">
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
                </div>
              </div>
            </SectionCard>

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
                      onValueChange={(value) => updateFormData("attendance_percentage", value[0])}
                      min={50}
                      max={100}
                      step={5}
                      disabled={formData.strict_attendance}
                      className="w-full"
                    />
                    <div className="grid grid-cols-4 pt-1 text-[11px] font-medium text-slate-500">
                      <div className="text-left flex flex-col">
                        <span className="font-semibold text-slate-700">50%</span>
                        <span className="text-[10px]">Lenient</span>
                      </div>
                      <div className="text-center flex flex-col">
                        <span className="font-semibold text-slate-700">75%</span>
                        <span className="text-[10px]">Baseline</span>
                      </div>
                      <div className="text-center flex flex-col">
                        <span className="font-semibold text-emerald-700 font-bold">80%</span>
                        <span className="text-[10px] text-emerald-700">Standard</span>
                      </div>
                      <div className="text-right flex flex-col">
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
                        onCheckedChange={(checked) => updateFormData("strict_attendance", checked)}
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
                            value={formData.minimum_contact_hours}
                            onChange={(e) => updateFormData("minimum_contact_hours", Math.max(1, parseInt(e.target.value) || 0))}
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
                            value={formData.theory_passing_score}
                            onChange={(e) => updateFormData("theory_passing_score", Math.max(50, Math.min(100, parseInt(e.target.value) || 75)))}
                            min={50}
                            max={100}
                            className="text-lg font-bold px-4 py-2.5 rounded-lg"
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
                      <span>Requires certified on-site instructor physical sign-off at <strong>Port Harcourt Training Yard BOP Skid</strong> prior to digital credential cryptographic release.</span>
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

      case 4:
        return (
          <SectionCard
            icon={CheckCircle}
            title="Review & Create"
            subtitle="Review all course information before creating the course."
          >
            <div className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-900">Course Information</h3>
                <div className="grid gap-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Title:</span>
                    <span className="font-medium text-slate-900">{formData.title}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Code:</span>
                    <span className="font-medium text-slate-900">{formData.code}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Category:</span>
                    <span className="font-medium text-slate-900">{formData.category}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Tier:</span>
                    <span className="font-medium text-slate-900">{formData.tier}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Duration:</span>
                    <span className="font-medium text-slate-900">{formData.duration_value} {formData.duration_unit}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Delivery Mode:</span>
                    <span className="font-medium text-slate-900">{formData.delivery_mode}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-900">Modules ({formData.modules.length})</h3>
                <ul className="space-y-2">
                  {formData.modules.map((module, index) => (
                    <li key={index} className="flex items-center gap-2 text-sm text-slate-700">
                      <BookOpen className="h-3.5 w-3.5 text-emerald-600" />
                      <span className="font-medium">
                        {index + 1}. {module.name}
                      </span>
                      {module.is_required !== false && (
                        <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10.5px] font-medium text-emerald-700">
                          Mandatory
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-900">Completion Requirements</h3>
                <div className="grid gap-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Attendance Required:</span>
                    <span className="font-medium text-slate-900">{formData.attendance_required ? "Yes" : "No"}</span>
                  </div>
                  {formData.attendance_required && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Minimum Attendance:</span>
                        <span className="font-medium text-slate-900">{formData.strict_attendance ? "100%" : `${formData.attendance_percentage}%`}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Minimum Contact Hours:</span>
                        <span className="font-medium text-slate-900">{formData.minimum_contact_hours} hours</span>
                      </div>
                    </>
                  )}
                  <div className="flex justify-between">
                    <span className="text-slate-500">Assessment Required:</span>
                    <span className="font-medium text-slate-900">{formData.assessment_required ? "Yes" : "No"}</span>
                  </div>
                  {formData.assessment_required && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Theory Passing Score:</span>
                        <span className="font-medium text-slate-900">{formData.theory_passing_score}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Practical Required:</span>
                        <span className="font-medium text-slate-900">{formData.practical_required ? "Yes" : "No"}</span>
                      </div>
                    </>
                  )}
                  <div className="flex justify-between">
                    <span className="text-slate-500">Module Completion Mode:</span>
                    <span className="font-medium text-slate-900 capitalize">{formData.module_completion_mode}</span>
                  </div>
                </div>
              </div>
            </div>
          </SectionCard>
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
                  STEP {currentStep} OF {STEPS.length} • {currentStep === 1 ? "BASIC INFO" : currentStep === 2 ? "MODULES & UNITS" : currentStep === 3 ? "COMPLETION RULES" : "REVIEW"}
                </span>
                <span className="inline-flex items-center gap-1.5 text-[11.5px] text-slate-500">
                  <Clock className="h-3.5 w-3.5" />
                  Last saved: Just now
                </span>
              </div>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">
                {currentStep === 1 ? "Course Basic Information" : currentStep === 2 ? "Course Structure & Training Modules" : currentStep === 3 ? "Completion Requirements & Eligibility Protocols" : "Review & Create Course"}
              </h1>
              <p className="mt-2 text-[13.5px] leading-relaxed text-slate-500">
                {currentStep === 1
                  ? "Define the fundamental parameters, operational codes, class sizes, and prerequisite credentials for this course programme. New courses initialize as Draft."
                  : currentStep === 2
                  ? "Structure learning units, reorder modules, define delivery types (Theory / Practical / Both), and attach training materials with granular visibility controls."
                  : currentStep === 3
                  ? "Configure mandatory attendance thresholds, session attendance rules, required module clearance, and minimum assessment passing cutoffs."
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

          {error && (
            <div className="mt-5 flex items-start gap-3 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-[13px] text-rose-700">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <span className="font-medium">{error}</span>
            </div>
          )}

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
                      Port Harcourt
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
                  Port Harcourt Well Control Yard #4
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

                {currentStep < 4 ? (
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