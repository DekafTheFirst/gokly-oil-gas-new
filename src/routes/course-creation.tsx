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
} from "lucide-react";
import { createCourse } from "@/lib/courses";
import type { CourseModule } from "@/lib/courses";

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
  { id: 2, label: "Description" },
  { id: 3, label: "Configuration" },
  { id: 4, label: "Modules" },
  { id: 5, label: "Review" },
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
  min_class_size: number;
  max_class_size: number;
  prerequisite_required: boolean;
  prerequisite_description: string;
  individual_enrollment_enabled: boolean;
  certificate_enabled: boolean;
  status: string;
  modules: CourseModule[];
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
        },
      ],
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
    }));
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
        return formData.description.trim().length > 10;
      case 3:
        return (
          formData.duration_value > 0 &&
          formData.min_class_size > 0 &&
          formData.max_class_size >= formData.min_class_size &&
          (!formData.prerequisite_required ||
            formData.prerequisite_description.trim().length > 5)
        );
      case 4:
        return (
          formData.modules.length > 0 && formData.modules.every((m) => m.name.trim().length > 0)
        );
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, 5));
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
    {
      ok: formData.max_class_size >= formData.min_class_size && formData.min_class_size > 0,
      text: `Class size within HSE facility capacity (${formData.min_class_size} – ${formData.max_class_size})`,
    },
    {
      ok: formData.prerequisite_required
        ? formData.prerequisite_description.trim().length > 5
        : true,
      text: formData.prerequisite_required ? "Prerequisite gating activated" : "No prerequisite gating required",
    },
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
                  placeholder="Advanced Offshore Well Control & Blowout Prevention (IWCF Level 4)"
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
                  placeholder="Comprehensive simulation-intensive well control qualification covering high-pressure wellbore dynamics, subsea BOP multiplexing, and Driller's Method under severe influx conditions."
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
                    placeholder={
                      "IWCF Level 4 Well Control Accreditation Standard\n\nThis programme covers kick detection, Driller's Method and Wait & Weight, volumetric stripping, and choke manifold pressure adjustments across simulated subsea blowout scenarios."
                    }
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
                        onChange={(e) =>
                          updateFormData("duration_value", parseInt(e.target.value) || 0)
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
                          onChange={(e) =>
                            updateFormData("min_class_size", parseInt(e.target.value) || 0)
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
                          onChange={(e) =>
                            updateFormData("max_class_size", parseInt(e.target.value) || 0)
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
                    placeholder="Requires valid IWCF Level 3 certification or minimum 2 years verified offshore drilling watch-keeping experience endorsed by an HSE supervisor."
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
          <SectionCard
            icon={BookOpen}
            title="Detailed Description"
            subtitle="Expand the syllabus, learning objectives, target audience, and expected outcomes."
          >
            <div className="space-y-2">
              <FieldLabel htmlFor="description_full" required>
                Full Description
              </FieldLabel>
              <Textarea
                id="description_full"
                value={formData.description}
                onChange={(e) => updateFormData("description", e.target.value)}
                placeholder="Detailed description of the course content, learning objectives, target audience, and expected outcomes…"
                rows={12}
                className="resize-y border-slate-200 bg-slate-50/70 text-sm leading-relaxed focus-visible:bg-white"
                required
              />
              <p className="text-[11.5px] text-slate-400">
                {formData.description.trim().length} characters written.
              </p>
            </div>
          </SectionCard>
        );

      case 3:
        return (
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
                <FieldLabel>Delivery Mode</FieldLabel>
                <Select
                  value={formData.delivery_mode}
                  onValueChange={(value) => updateFormData("delivery_mode", value)}
                >
                  <SelectTrigger className="h-11 border-slate-200 bg-slate-50/70 text-sm">
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
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <FieldLabel htmlFor="duration_value_3" required>
                  Duration
                </FieldLabel>
                <Input
                  id="duration_value_3"
                  type="number"
                  min="1"
                  value={formData.duration_value}
                  onChange={(e) => updateFormData("duration_value", parseInt(e.target.value) || 0)}
                  className="h-11 border-slate-200 bg-slate-50/70 text-sm focus-visible:bg-white"
                  required
                />
              </div>
              <div className="space-y-2">
                <FieldLabel htmlFor="min_class_size_3" required>
                  Minimum Class Size
                </FieldLabel>
                <Input
                  id="min_class_size_3"
                  type="number"
                  min="1"
                  value={formData.min_class_size}
                  onChange={(e) => updateFormData("min_class_size", parseInt(e.target.value) || 0)}
                  className="h-11 border-slate-200 bg-slate-50/70 text-sm focus-visible:bg-white"
                  required
                />
              </div>
              <div className="space-y-2">
                <FieldLabel htmlFor="max_class_size_3" required>
                  Maximum Class Size
                </FieldLabel>
                <Input
                  id="max_class_size_3"
                  type="number"
                  min="1"
                  value={formData.max_class_size}
                  onChange={(e) => updateFormData("max_class_size", parseInt(e.target.value) || 0)}
                  className="h-11 border-slate-200 bg-slate-50/70 text-sm focus-visible:bg-white"
                  required
                />
              </div>
            </div>

            <div className="flex items-start justify-between gap-4 rounded-lg border border-slate-200 bg-slate-50/70 p-4">
              <div>
                <p className="text-[13px] font-medium text-slate-800">Prerequisite gating</p>
                <p className="mt-0.5 text-[11.5px] text-slate-500">
                  Require prior completion of another course or qualification.
                </p>
              </div>
              <Toggle
                checked={formData.prerequisite_required}
                onChange={(v) => updateFormData("prerequisite_required", v)}
                label="Prerequisite gating"
              />
            </div>

            {formData.prerequisite_required && (
              <div className="space-y-2">
                <FieldLabel htmlFor="prerequisite_description_3" required>
                  Prerequisite Description
                </FieldLabel>
                <Textarea
                  id="prerequisite_description_3"
                  value={formData.prerequisite_description}
                  onChange={(e) => updateFormData("prerequisite_description", e.target.value)}
                  placeholder="Must have completed Basic Safety Training"
                  rows={3}
                  className="resize-none border-slate-200 bg-slate-50/70 text-sm focus-visible:bg-white"
                  required
                />
              </div>
            )}
          </SectionCard>
        );

      case 4:
        return (
          <SectionCard
            icon={BookOpen}
            title="Course Modules"
            subtitle="Break the programme into teaching modules. At least one module is required."
            aside={
              <span className="inline-flex items-center rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-600">
                {formData.modules.length} added
              </span>
            }
          >
            {formData.modules.length === 0 && (
              <p className="rounded-lg border border-dashed border-slate-200 bg-slate-50/60 px-4 py-6 text-center text-[12.5px] text-slate-500">
                No modules yet. Add the first teaching block to start building the curriculum.
              </p>
            )}

            {formData.modules.map((module, index) => (
              <div key={index} className="rounded-lg border border-slate-200 bg-slate-50/60 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <span className="inline-flex items-center gap-2 text-[13px] font-semibold text-slate-800">
                    <span className="flex h-6 w-6 items-center justify-center rounded-md bg-emerald-600 text-[11px] font-semibold text-white">
                      {index + 1}
                    </span>
                    Module {index + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeModule(index)}
                    className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-[11.5px] font-medium text-rose-600 hover:border-rose-200 hover:bg-rose-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Remove
                  </button>
                </div>

                <div className="space-y-3">
                  <div className="space-y-2">
                    <FieldLabel htmlFor={`module-name-${index}`} required>
                      Module Name
                    </FieldLabel>
                    <Input
                      id={`module-name-${index}`}
                      value={module.name}
                      onChange={(e) => updateModule(index, "name", e.target.value)}
                      placeholder="Kick Detection & Well Shut-in Procedures"
                      className="h-10 border-slate-200 bg-white text-sm"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <FieldLabel htmlFor={`module-desc-${index}`}>Description</FieldLabel>
                    <Textarea
                      id={`module-desc-${index}`}
                      value={module.description}
                      onChange={(e) => updateModule(index, "description", e.target.value)}
                      placeholder="Brief description of this module's content"
                      rows={2}
                      className="resize-none border-slate-200 bg-white text-sm"
                    />
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-2">
                      <FieldLabel htmlFor={`module-date-${index}`}>Scheduled Date</FieldLabel>
                      <Input
                        id={`module-date-${index}`}
                        type="date"
                        value={module.scheduled_date}
                        onChange={(e) => updateModule(index, "scheduled_date", e.target.value)}
                        className="h-10 border-slate-200 bg-white text-sm"
                      />
                    </div>
                    <div className="flex items-center gap-2 sm:pt-7">
                      <Checkbox
                        id={`module-assessment-${index}`}
                        checked={module.has_assessment}
                        onCheckedChange={(checked) => updateModule(index, "has_assessment", checked)}
                      />
                      <Label
                        htmlFor={`module-assessment-${index}`}
                        className="cursor-pointer text-[13px] font-medium text-slate-700"
                      >
                        Includes an assessment
                      </Label>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={addModule}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-slate-300 bg-white py-3 text-[13px] font-medium text-slate-600 hover:border-emerald-400 hover:text-emerald-700"
            >
              <Plus className="h-4 w-4" />
              Add module
            </button>
          </SectionCard>
        );

      case 5:
        return (
          <SectionCard
            icon={CheckCircle}
            title="Review & Create"
            subtitle="Confirm every detail before the course enters the staging catalog."
          >
            <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
              {[
                ["Course name", formData.title || "—"],
                ["Course code", formData.code || "—"],
                ["Discipline", formData.category || "—"],
                ["Tier", formData.tier || "Not set"],
                ["Duration", `${formData.duration_value} ${formData.duration_unit}`],
                ["Delivery mode", formData.delivery_mode],
                ["Cohort capacity", `${formData.min_class_size} – ${formData.max_class_size}`],
                ["Status", formData.status],
              ].map(([label, value]) => (
                <div key={label as string}>
                  <dt className="text-[11.5px] font-medium text-slate-500">{label}</dt>
                  <dd className="mt-0.5 text-[13.5px] font-semibold text-slate-900">{value}</dd>
                </div>
              ))}
            </dl>

            <div className="space-y-3 border-t border-slate-100 pt-4">
              <div>
                <p className="text-[11.5px] font-medium text-slate-500">Executive summary</p>
                <p className="mt-1 text-[13px] leading-relaxed text-slate-700">
                  {formData.short_description || "—"}
                </p>
              </div>
              <div>
                <p className="text-[11.5px] font-medium text-slate-500">Detailed syllabus</p>
                <p className="mt-1 whitespace-pre-wrap text-[12.5px] leading-relaxed text-slate-600">
                  {formData.description || "—"}
                </p>
              </div>
              {formData.prerequisite_required && (
                <div>
                  <p className="text-[11.5px] font-medium text-slate-500">Entry criteria</p>
                  <p className="mt-1 text-[13px] leading-relaxed text-slate-700">
                    {formData.prerequisite_description}
                  </p>
                </div>
              )}
            </div>

            <div className="border-t border-slate-100 pt-4">
              <p className="text-[11.5px] font-medium text-slate-500">
                Modules ({formData.modules.length})
              </p>
              <ul className="mt-2 space-y-1.5">
                {formData.modules.map((module, index) => (
                  <li key={index} className="flex items-center gap-2 text-[12.5px] text-slate-700">
                    <BookOpen className="h-3.5 w-3.5 text-emerald-600" />
                    <span className="font-medium">
                      {index + 1}. {module.name}
                    </span>
                    {module.has_assessment && (
                      <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10.5px] font-medium text-emerald-700">
                        Assessment
                      </span>
                    )}
                  </li>
                ))}
              </ul>
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
                    onClick={() => step.id < currentStep && setCurrentStep(step.id)}
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
                  STEP {currentStep} OF {STEPS.length} • FOUNDATIONAL COURSE METADATA
                </span>
                <span className="inline-flex items-center gap-1.5 text-[11.5px] text-slate-500">
                  <Clock className="h-3.5 w-3.5" />
                  Last saved: Just now
                </span>
              </div>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">
                Course Basic Information
              </h1>
              <p className="mt-2 text-[13.5px] leading-relaxed text-slate-500">
                Define the fundamental parameters, operational codes, class sizes, and prerequisite
                credentials for this course programme. New courses initialize as Draft.
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
            <aside className="hidden space-y-4 xl:block">
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

                {currentStep < 5 ? (
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