import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { useFieldArray, useForm, useWatch, type FieldPath } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";
import {
  BadgeCheck,
  Bookmark,
  ChevronRight,
  CircleCheck,
  Calendar as CalendarIcon,
  ClipboardList,
  FileText,
  Gavel,
  Handshake,
  Minus,
  Plus,
  Rocket,
  RefreshCw,
  Save,
  Tag,
  Trash2,
  Users,
  X,
  Eye,
} from "lucide-react";
import { AdminPageShell } from "@/components/educert/AdminPageShell";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { format, isValid, parseISO } from "date-fns";
import {
  createTrainingBatch,
  fetchTrainingBatchOptions,
  type TrainingBatchAllocationOption,
  type TrainingBatchCourseOption,
  type TrainingBatchPayload,
  type TrainingBatchSession,
} from "@/lib/training-batches";
import { ApiError } from "@/lib/api";
import {
  trainingBatchDraftSchema,
  trainingBatchFormSchema,
  type TrainingBatchFormValues,
} from "@/lib/training-batch-validation";
import yardImage from "@/assets/drilling-engineers.jpg";

const LOCATIONS = [
  { id: "ph-yard", label: "Port Harcourt Terminal / Yard (Trans-Amadi Industrial Complex)" },
  { id: "warri-base", label: "Warri Shorebase & Marine Operations Annex" },
  { id: "onne-freezone", label: "Onne Oil and Gas Free Zone (OGFTZ Platform)" },
  { id: "lagos-hub", label: "Lagos Island Marine Training Center" },
];

const DEFAULT_LOCATION = LOCATIONS[0].label;

function normalizeDate(value?: string | null) {
  if (!value) return "";
  return value.slice(0, 10);
}

function moduleToSession(module: TrainingBatchCourseOption["modules"][number]) {
  return {
    course_module_id: module.id,
    title: module.name,
    description: module.description ?? "",
    session_date: normalizeDate(module.scheduled_date),
    start_time: "08:30",
    end_time: "12:30",
  };
}

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

function FieldError({ children }: { children?: string }) {
  return children ? <p role="alert" className="text-xs font-medium text-red-700">{children}</p> : null;
}

function DatePickerField({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const parsedDate = value ? parseISO(value) : undefined;
  const selectedDate = parsedDate && isValid(parsedDate) ? parsedDate : undefined;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          aria-label={label}
          aria-haspopup="dialog"
          className="h-auto w-full justify-start rounded-lg border-0 bg-white px-3 py-2 text-left text-xs font-normal text-[#121c2a] shadow-none hover:bg-white focus-visible:ring-2 focus-visible:ring-[#1b7a43]"
        >
          <CalendarIcon className="mr-2 h-4 w-4 text-[#3f4940]" />
          {selectedDate ? format(selectedDate, "PPP") : <span className="text-[#3f4940]">Select a date</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto p-0">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={(date) => {
            if (!date) return;
            onChange(format(date, "yyyy-MM-dd"));
            setOpen(false);
          }}
          initialFocus
        />
        {value && (
          <div className="border-t p-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="w-full"
              onClick={() => {
                onChange("");
                setOpen(false);
              }}
            >
              Clear date
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

const TIME_OPTIONS = Array.from({ length: 96 }, (_, index) => {
  const hour = Math.floor(index / 4);
  const minute = (index % 4) * 15;
  const value = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
  const date = new Date(2000, 0, 1, hour, minute);
  return { value, label: format(date, "p") };
});

function TimeSelect({
  id,
  value,
  onChange,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const timeOptions = value && !TIME_OPTIONS.some((option) => option.value === value)
    ? [{ value, label: value }, ...TIME_OPTIONS]
    : TIME_OPTIONS;

  return (
    <Select value={value || undefined} onValueChange={onChange}>
      <SelectTrigger
        id={id}
        aria-label={id}
        className="h-auto min-w-0 rounded-lg border-0 bg-white px-2 py-2 text-xs text-[#121c2a] shadow-none focus:ring-2 focus:ring-[#1b7a43]"
      >
        <SelectValue placeholder="Select time" />
      </SelectTrigger>
      <SelectContent className="max-h-60">
        {timeOptions.map((option) => (
          <SelectItem key={option.value} value={option.value} className="text-xs">
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
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
  const [courses, setCourses] = useState<TrainingBatchCourseOption[]>([]);
  const [allocationOptions, setAllocationOptions] = useState<TrainingBatchAllocationOption[]>([]);
  const [optionsLoading, setOptionsLoading] = useState(true);
  const [optionsError, setOptionsError] = useState("");
  const [locationId, setLocationId] = useState(LOCATIONS[0].id);
  const [selectedQuotaIds, setSelectedQuotaIds] = useState<string[]>([]);
  const [quotaDialogOpen, setQuotaDialogOpen] = useState(false);
  const [contextVisible, setContextVisible] = useState(true);

  const {
    register,
    control,
    watch,
    setValue,
    setError,
    clearErrors,
    getValues,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<TrainingBatchFormValues>({
    resolver: zodResolver(trainingBatchFormSchema),
    mode: "onBlur",
    reValidateMode: "onChange",
    defaultValues: {
      course_id: 0,
      name: "",
      batch_code: "",
      location: DEFAULT_LOCATION,
      capacity: 25,
      min_quorum: 10,
      notes: "",
      sessions: [],
      allocations: [],
    },
  });
  const sessions = useFieldArray({ control, name: "sessions" });
  const allocations = useFieldArray({ control, name: "allocations" });

  const courseId = watch("course_id");
  const capacity = watch("capacity");
  const watchedAllocations = useWatch({ control, name: "allocations" });
  const selectedCourse = courses.find((course) => course.id === Number(courseId));
  const selectedLocation = LOCATIONS.find((location) => location.id === locationId) ?? LOCATIONS[0];

  const allocationRows = useMemo(
    () => watchedAllocations.map((allocation, index) => ({
      ...allocation,
      seats_assigned: Number.isFinite(allocation.seats_assigned) ? allocation.seats_assigned : 0,
      index,
      id: allocations.fields[index]?.id ?? `allocation-${index}`,
      option: allocation.allocation_type === "CONTRACT"
        ? allocationOptions.find((item) => item.engagement_item_id === allocation.engagement_item_id)
        : undefined,
    })),
    [watchedAllocations, allocationOptions, allocations.fields],
  );
  const assignedSeats = useMemo(
    () => watchedAllocations.reduce((total, allocation) => total + (Number(allocation.seats_assigned) || 0), 0),
    [watchedAllocations],
  );
  const unallocatedSeats = Number(capacity || 0) - assignedSeats;
  const totalCommitment = allocationOptions.reduce((total, option) => total + option.agreed_quantity, 0);
  const committedPercent = capacity ? Math.min(100, Math.round((assignedSeats / Number(capacity)) * 100)) : 0;
  const activeEngagement = allocationRows.find((allocation) => allocation.option)?.option;

  useEffect(() => {
    if (
      errors.allocations?.message === "Allocated seats cannot exceed training batch capacity." &&
      assignedSeats <= Number(capacity)
    ) {
      clearErrors("allocations");
    }
  }, [assignedSeats, capacity, clearErrors, errors.allocations?.message]);

  useEffect(() => {
    let mounted = true;
    const loadOptions = async () => {
      setOptionsLoading(true);
      setOptionsError("");
      try {
        const response = await fetchTrainingBatchOptions();
        if (!mounted) return;
        setCourses(response.courses);
        if (response.courses.length === 0) {
          setOptionsError("No published courses are available for scheduling.");
          return;
        }
      } catch (error) {
        if (!mounted) return;
        const message = error instanceof Error ? error.message : "Unable to load training batch options.";
        setOptionsError(message);
        toast.error(message);
      } finally {
        if (mounted) setOptionsLoading(false);
      }
    };
    void loadOptions();
    return () => {
      mounted = false;
    };
  }, []);

  const changeCourse = async (nextCourseId: number) => {
    const course = courses.find((item) => item.id === nextCourseId);
    if (!course) return;
    setValue("course_id", course.id, { shouldValidate: true });
    setValue("name", `Q1 ${course.title.split(" (")[0]} Training Batch A`, { shouldValidate: true });
    setValue("batch_code", `BTCH-${new Date().getFullYear()}-${course.code || course.id}-001`);
    setValue("location", LOCATIONS.find((item) => item.id === locationId)?.label ?? DEFAULT_LOCATION);
    sessions.replace(course.modules.map(moduleToSession));
    clearErrors();
    try {
      const response = await fetchTrainingBatchOptions(course.id);
      setAllocationOptions(response.allocation_options);
      setSelectedQuotaIds([]);
      allocations.replace([]);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to load contract quotas for this course.";
      toast.error(message);
    }
  };

  const updateLocation = (nextLocationId: string) => {
    setLocationId(nextLocationId);
    const nextLocation = LOCATIONS.find((item) => item.id === nextLocationId)?.label ?? DEFAULT_LOCATION;
    setValue("location", nextLocation, { shouldValidate: true });
  };

  const regenerateCode = () => {
    const year = new Date().getFullYear();
    const code = selectedCourse?.code || String(selectedCourse?.id ?? "BATCH");
    setValue("batch_code", `BTCH-${year}-${code}-${Math.floor(100 + Math.random() * 900)}`, { shouldValidate: true });
  };

  const attachServerErrors = (error: ApiError) => {
    error.errors.forEach((issue) => {
      if (issue.field && issue.message) {
        setError(issue.field as FieldPath<TrainingBatchFormValues>, { type: "server", message: issue.message });
      }
    });
  };

  const submitBatch = async (payload: TrainingBatchPayload) => {
    try {
      const response = await createTrainingBatch(payload);
      toast.success(`Training batch ${response.batch.batch_code} created.`);
      navigate("/training/batches");
    } catch (error) {
      if (error instanceof ApiError) {
        attachServerErrors(error);
        toast.error(error.message);
        return;
      }
      toast.error(error instanceof Error ? error.message : "Unable to create training batch.");
    }
  };

  const handleReady = handleSubmit(async (values) => {
    await submitBatch({
      ...values,
      status: "UPCOMING",
      sessions: values.sessions.map((session) => ({ ...session, location: values.location })),
    });
  });

  const saveDraft = async () => {
    clearErrors();
    const current = getValues();
    const parsed = trainingBatchDraftSchema.safeParse(current);
    if (!parsed.success) {
      parsed.error.issues.forEach((issue) => {
        const path = issue.path.join(".");
        if (path) setError(path as FieldPath<TrainingBatchFormValues>, { type: "manual", message: issue.message });
      });
      toast.error("Review the highlighted fields before saving this draft.");
      return;
    }
    await submitBatch({
      ...current,
      status: "DRAFT",
      sessions: current.sessions.map((session) => ({ ...session, location: current.location })),
      allocations: current.allocations,
    });
  };

  const addSession = () => {
    sessions.append({
      course_module_id: null,
      title: "",
      description: "",
      session_date: "",
      start_time: "08:30",
      end_time: "12:30",
    });
  };

  const addContractAllocations = () => {
    const currentAllocations = getValues("allocations");
    const existingItemIds = new Set(currentAllocations
      .filter((allocation) => allocation.allocation_type === "CONTRACT")
      .map((allocation) => allocation.engagement_item_id));
    const optionsToAdd = allocationOptions.filter(
      (option) => selectedQuotaIds.includes(option.engagement_item_id)
        && option.available_seats > 0
        && !existingItemIds.has(option.engagement_item_id),
    );
    if (optionsToAdd.length === 0) {
      toast.error("Select at least one available contract quota.");
      return false;
    }

    optionsToAdd.forEach((option) => {
      const quotaSeats = Math.min(option.agreed_quantity, option.available_seats);
      allocations.append({
        allocation_type: "CONTRACT",
        engagement_item_id: option.engagement_item_id,
        seats_assigned: quotaSeats,
      });
    });
    clearErrors("allocations");
    return true;
  };

  const addOpenEnrollment = () => {
    if (watchedAllocations.some((item) => item.allocation_type === "OPEN_ENROLLMENT")) {
      toast.error("Open enrollment can only be added once.");
      return;
    }
    allocations.append({ allocation_type: "OPEN_ENROLLMENT", seats_assigned: 0 });
    clearErrors("allocations");
  };

  const adjustAllocationSeats = (index: number, change: number) => {
    const currentSeats = Number(getValues(`allocations.${index}.seats_assigned`)) || 0;
    const allocation = getValues("allocations")[index];
    const option = allocation?.allocation_type === "CONTRACT"
      ? allocationOptions.find((item) => item.engagement_item_id === allocation.engagement_item_id)
      : undefined;
    const nextSeats = Math.max(0, currentSeats + change);
    const limitedSeats = option ? Math.min(nextSeats, option.available_seats) : nextSeats;
    setValue(`allocations.${index}.seats_assigned`, limitedSeats, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    });
  };

  const setAllocationSeatInput = (index: number, value: number) => {
    const allocation = getValues("allocations")[index];
    const option = allocation?.allocation_type === "CONTRACT"
      ? allocationOptions.find((item) => item.engagement_item_id === allocation.engagement_item_id)
      : undefined;
    const seats = Number.isFinite(value) ? Math.max(0, value) : 0;
    setValue(`allocations.${index}.seats_assigned`, option ? Math.min(seats, option.available_seats) : seats, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    });
  };

  const getSessionError = (index: number, field: "title" | "session_date" | "start_time" | "end_time") =>
    errors.sessions?.[index]?.[field]?.message;

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
            <ActionButton type="button" onClick={() => void saveDraft()} disabled={isSubmitting || optionsLoading || Boolean(optionsError)} className="bg-[#dee9fc] text-[#006030] hover:bg-[#d9e3f6]">
              <Bookmark className="h-[18px] w-[18px]" />Save Draft
            </ActionButton>
            <ActionButton type="button" onClick={() => void handleReady()} disabled={isSubmitting || optionsLoading || Boolean(optionsError)} className="bg-[#1b7a43] text-white shadow-sm hover:bg-[#006030] hover:shadow">
              <BadgeCheck className="h-[18px] w-[18px]" />Save &amp; Ready
            </ActionButton>
          </div>
        </div>

        <div className="mx-auto flex w-full max-w-[1280px] flex-col gap-12 p-6">
          {optionsError && (
            <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              {optionsError}
            </div>
          )}
          {contextVisible && activeEngagement && (
            <section className="relative flex flex-col justify-between gap-4 overflow-hidden rounded-xl bg-[#eff4ff] p-6 shadow-sm sm:flex-row sm:items-center">
              <span className="absolute bottom-0 left-0 top-0 w-1.5 bg-[#1b7a43]" />
              <div className="flex items-center gap-6 pl-1">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-[#1b7a43]/10 text-[#006030]">
                  <FileText className="h-6 w-6" />
                </span>
                <div className="flex min-w-0 flex-col gap-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#006030]">Engagement Context Attached</span>
                  <p className="text-sm font-semibold text-[#121c2a]">
                    {activeEngagement.organization_name || activeEngagement.engagement_name} —{" "}
                    <span className="rounded bg-[#dee9fc] px-1.5 py-0.5 font-mono text-xs font-medium text-[#3f4940]">{activeEngagement.reference_id}</span>
                    {" "}({activeEngagement.course_name})
                  </p>
                  <p className="text-xs text-[#3f4940]">Contract seat availability is checked again when the batch is saved.</p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2 self-end sm:self-center">
                <ActionButton type="button" onClick={() => toast.info("Engagement details are not connected in this UI.")} className="bg-[#e6eeff] px-3 py-2 text-xs text-[#121c2a] hover:bg-[#dee9fc]">
                  <Eye className="h-4 w-4" />View SOW
                </ActionButton>
                <button type="button" aria-label="Dismiss engagement context" onClick={() => setContextVisible(false)} className="p-2 text-[#3f4940] transition-colors hover:text-red-700">
                  <X className="h-[18px] w-[18px]" />
                </button>
              </div>
            </section>
          )}

          <form
            onSubmit={(event: FormEvent<HTMLFormElement>) => {
              event.preventDefault();
              void handleReady();
            }}
            className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12"
          >
            <div className="flex flex-col gap-12 lg:col-span-8">
              <section className="flex flex-col gap-6 rounded-xl bg-white p-6 shadow-sm">
                <SectionHeading number="01" title="Course & Training Batch Foundation" description="Standardized petroleum syllabus and identifier taxonomy." badge="Accredited Rig Syllabus" />
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div className="flex flex-col gap-2 md:col-span-2">
                    <FieldLabel htmlFor="batch-course">
                      <span>Select Course Module <span className="text-[#ba1a1a]">*</span></span>
                      <span className="text-[11px] font-normal text-[#3f4940]">IWCF / OPITO Verified</span>
                    </FieldLabel>
                    <Select
                      value={courseId ? String(courseId) : undefined}
                      disabled={optionsLoading || courses.length === 0}
                      onValueChange={(value) => void changeCourse(Number(value))}
                    >
                      <SelectTrigger id="batch-course" className="h-auto rounded-lg border-0 bg-[#eff4ff] px-3 py-3 text-sm text-[#121c2a] shadow-none focus:ring-2 focus:ring-[#1b7a43]">
                        <SelectValue placeholder={optionsLoading ? "Loading courses…" : "Select Course Module"} />
                      </SelectTrigger>
                      <SelectContent>
                        {courses.map((course) => (
                          <SelectItem key={course.id} value={String(course.id)}>{course.title}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FieldError>{errors.course_id?.message}</FieldError>
                  </div>

                  <div className="flex flex-col gap-2 md:col-span-2">
                    <FieldLabel htmlFor="batch-name">Training Batch Designation Name <span className="text-[#ba1a1a]">*</span></FieldLabel>
                    <Input id="batch-name" placeholder="Enter Batch Name" {...register("name")} className="h-auto rounded-lg border-0 bg-[#eff4ff] px-3 py-3 text-sm text-[#121c2a] shadow-none placeholder:text-[#3f4940] focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-[#1b7a43]" />
                    <FieldError>{errors.name?.message}</FieldError>
                    <span className="text-[11px] text-[#3f4940]">Public designation visible to corporate sponsors and candidate certificates.</span>
                  </div>

                  <div className="flex flex-col gap-2">
                    <FieldLabel htmlFor="batch-code"><span>Batch Reference ID</span><span className="font-mono text-[10px] text-[#006030]">AUTO-SYSTEM</span></FieldLabel>
                    <div className="flex items-center gap-2 rounded-lg bg-[#eff4ff] px-3 py-3 focus-within:ring-2 focus-within:ring-[#1b7a43]">
                      <Tag className="h-[18px] w-[18px] text-[#006030]" />
                      <input id="batch-code" type="text" placeholder="Enter Batch Reference ID" {...register("batch_code")} className="w-full bg-transparent font-mono text-xs font-semibold text-[#121c2a] outline-none placeholder:font-sans placeholder:font-normal placeholder:text-[#3f4940]" />
                      <button type="button" onClick={regenerateCode} aria-label="Refresh batch reference ID" title="Generate a new batch reference ID" className="text-[#3f4940] hover:text-[#006030]">
                        <RefreshCw className="h-4 w-4" aria-hidden="true" />
                      </button>
                    </div>
                    <FieldError>{errors.batch_code?.message}</FieldError>
                  </div>
                </div>
              </section>

              <section className="flex flex-col gap-6 rounded-xl bg-white p-6 shadow-sm">
                <SectionHeading number="02" title="Module Scheduling & Venue Logistics" description="Configure dates, times, and venue locations for each module in this training batch." />
                <div className="flex items-center gap-3 rounded-xl border border-[#becabd]/30 bg-[#eff4ff] p-3">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[#1b7a43] text-white shadow-sm"><ClipboardList className="h-5 w-5" /></span>
                  <div className="flex min-w-0 flex-col gap-1">
                    <span className="text-xs font-bold text-[#121c2a]">{selectedCourse?.delivery_mode || "Course delivery mode"}</span>
                    <span className="text-[11px] text-[#3f4940]">Modality defined at course specification level and locked for standardized certification compliance.</span>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <FieldLabel htmlFor="batch-location"><span>Batch Primary Base / Shore Terminal <span className="text-[#ba1a1a]">*</span></span><span className="text-[11px] font-normal text-[#3f4940]">Applies default logistics to all modules</span></FieldLabel>
                  <Select value={locationId} onValueChange={updateLocation}>
                    <SelectTrigger id="batch-location" className="h-auto rounded-lg border-0 bg-[#eff4ff] px-3 py-3 text-sm text-[#121c2a] shadow-none focus:ring-2 focus:ring-[#1b7a43]">
                      <SelectValue placeholder="Select a training base" />
                    </SelectTrigger>
                    <SelectContent>
                      {LOCATIONS.map((location) => (
                        <SelectItem key={location.id} value={location.id}>{location.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FieldError>{errors.location?.message}</FieldError>
                </div>
                <div className="flex flex-col gap-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#3f4940]">Course Modules Timeline &amp; Cell Assignment ({sessions.fields.length} Modules)</span>
                    <span className="font-mono text-[11px] font-semibold text-[#006030]">{selectedCourse?.modules.reduce((hours, module) => hours + (Number(module.duration) || 0), 0) || 0} Total Contact Hours</span>
                  </div>
                  {sessions.fields.map((field, index) => {
                    const module = selectedCourse?.modules.find((item) => item.id === field.course_module_id);
                    return (
                      <article key={field.id} className="flex flex-col gap-3 rounded-xl border border-[#becabd]/20 bg-[#eff4ff] p-3 shadow-sm">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex min-w-0 items-center gap-3">
                            <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[#006030]/10 text-xs font-bold text-[#006030]">{index + 1}</span>
                            <div className="min-w-0">
                              {module ? (
                                <>
                                  <span className="block text-sm font-bold text-[#121c2a]">{module.name}</span>
                                  <span className="mt-0.5 block text-[11px] text-[#3f4940]">{module.description || "Course module"}</span>
                                  <input type="hidden" {...register(`sessions.${index}.title`)} />
                                  <input type="hidden" {...register(`sessions.${index}.description`)} />
                                </>
                              ) : (
                                <Input aria-label={`Session ${index + 1} title`} {...register(`sessions.${index}.title`)} placeholder="Session title" className="h-8 bg-white text-sm" />
                              )}
                              <input type="hidden" value={field.course_module_id ?? ""} {...register(`sessions.${index}.course_module_id`, { setValueAs: (value) => value === "" ? null : Number(value) })} />
                              <FieldError>{getSessionError(index, "title")}</FieldError>
                            </div>
                          </div>
                          <span className="shrink-0 rounded bg-[#dee9fc] px-2 py-1 font-mono text-[10px] font-semibold uppercase text-[#3f4940]">Module</span>
                        </div>
                        <div className="grid grid-cols-1 gap-3 pt-1 sm:grid-cols-2">
                          <div className="flex flex-col gap-1.5">
                            <label htmlFor={`session-date-${index}`} className="text-[11px] font-semibold text-[#121c2a]">Session Date</label>
                            <DatePickerField
                              id={`session-date-${index}`}
                              label={`Session ${index + 1} date`}
                              value={watch(`sessions.${index}.session_date`)}
                              onChange={(value) => setValue(`sessions.${index}.session_date`, value, {
                                shouldDirty: true,
                                shouldTouch: true,
                                shouldValidate: true,
                              })}
                            />
                            <FieldError>{getSessionError(index, "session_date")}</FieldError>
                          </div>
                          <div className="flex flex-col gap-1.5">
                            <div className="grid grid-cols-2 gap-2">
                              <div className="flex min-w-0 flex-col gap-1">
                                <span className="text-[11px] font-semibold text-[#121c2a]">Start time</span>
                                <TimeSelect
                                  id={`Session ${index + 1} start time`}
                                  value={watch(`sessions.${index}.start_time`)}
                                  onChange={(value) => setValue(`sessions.${index}.start_time`, value, {
                                    shouldDirty: true,
                                    shouldTouch: true,
                                    shouldValidate: true,
                                  })}
                                />
                              </div>
                              <div className="flex min-w-0 flex-col gap-1">
                                <span className="text-[11px] font-semibold text-[#121c2a]">End time</span>
                                <TimeSelect
                                  id={`Session ${index + 1} end time`}
                                  value={watch(`sessions.${index}.end_time`)}
                                  onChange={(value) => setValue(`sessions.${index}.end_time`, value, {
                                    shouldDirty: true,
                                    shouldTouch: true,
                                    shouldValidate: true,
                                  })}
                                />
                              </div>
                            </div>
                            <FieldError>{getSessionError(index, "start_time") || getSessionError(index, "end_time")}</FieldError>
                          </div>
                        </div>
                        <button type="button" onClick={() => sessions.remove(index)} className="self-end text-[11px] font-semibold text-[#3f4940] hover:text-red-700">Remove session</button>
                      </article>
                    );
                  })}
                  <FieldError>{errors.sessions?.message}</FieldError>
                  {/* <button type="button" onClick={addSession} className="inline-flex items-center gap-2 self-start rounded-lg px-2 py-1 text-xs font-semibold text-[#006030] hover:bg-[#eff4ff]">
                    <Plus className="h-4 w-4" />Add Module Session
                  </button> */}
                </div>
              </section>

              <section className="flex flex-col gap-6 rounded-xl bg-white p-6 shadow-sm">
                <SectionHeading number="04" title="Capacity" description="Configure automated gating thresholds to govern simulator seat allocations." />
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="flex flex-col gap-2 rounded-xl bg-[#eff4ff] p-3">
                    <FieldLabel htmlFor="capacity"><span>Maximum Capacity <span className="text-[#ba1a1a]">*</span></span><span className="font-bold text-[#006030]">{capacity} Seats Total</span></FieldLabel>
                    <div className="flex items-center gap-3">
                      <Input id="capacity" type="number" min={1} max={1000} {...register("capacity", { valueAsNumber: true })} className="h-auto w-28 rounded-lg border-0 bg-white px-3 py-2 text-center text-xl font-bold text-[#121c2a] shadow-none focus-visible:ring-2 focus-visible:ring-[#1b7a43]" />
                      <span className="text-xs leading-tight text-[#3f4940]">Hard registration limit. Portal will prevent over-subscription once {capacity} candidate slots are confirmed.</span>
                    </div>
                    <FieldError>{errors.capacity?.message}</FieldError>
                  </div>
                  <div className="flex flex-col gap-2 rounded-xl bg-[#eff4ff] p-3">
                    <FieldLabel htmlFor="quorum"><span>Minimum Quorum Threshold</span><span className="font-bold text-[#6c4d00]">{watch("min_quorum")} Trainees Req.</span></FieldLabel>
                    <div className="flex items-center gap-3">
                      <Input id="quorum" type="number" min={1} max={Number(capacity) || 1} {...register("min_quorum", { valueAsNumber: true })} className="h-auto w-28 rounded-lg border-0 bg-white px-3 py-2 text-center text-xl font-bold text-[#121c2a] shadow-none focus-visible:ring-2 focus-visible:ring-[#1b7a43]" />
                      <span className="text-xs leading-tight text-[#3f4940]">Threshold for operational mobilization. Batch triggers auto-alert to Lead Assessor 48 hrs prior if unfulfilled.</span>
                    </div>
                    <FieldError>{errors.min_quorum?.message}</FieldError>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="flex flex-col gap-2">
                    <FieldLabel htmlFor="batch-notes">Operational Notes</FieldLabel>
                    <textarea id="batch-notes" {...register("notes")} maxLength={2000} placeholder="Add HSE, yard, or mobilization notes..." className="min-h-24 w-full rounded-lg border-0 bg-[#eff4ff] px-3 py-3 text-sm text-[#121c2a] outline-none focus:bg-white focus:ring-2 focus:ring-[#1b7a43]" />
                    <FieldError>{errors.notes?.message}</FieldError>
                  </div>
                </div>
              </section>

              <section className="flex flex-col gap-5 rounded-xl bg-white p-6 shadow-sm">
                <div className="flex flex-col gap-4 border-b border-[#becabd]/20 pb-4">
                  <div className="flex items-center gap-4">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[#006030]/10 text-base font-bold text-[#006030]">05</span>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-base font-semibold leading-tight text-[#121c2a]">Multi-Organization Seat Allocation</h2>
                        <span className="rounded bg-[#1b7a43]/10 px-2 py-1 text-[11px] font-bold text-[#006030]">Quotas &amp; SOWs</span>
                      </div>
                      <p className="mt-1 text-xs text-[#3f4940]">Associate this training batch's seats with contract quotas or open enrollment streams.</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <ActionButton
                      type="button"
                      onClick={() => {
                        setSelectedQuotaIds([]);
                        setQuotaDialogOpen(true);
                      }}
                      className="h-10 w-full bg-[#1b7a43] text-xs text-white shadow-sm hover:bg-[#006030] sm:w-auto"
                    >
                      <Plus className="h-[18px] w-[18px]" />Add Corporate Allocation
                    </ActionButton>
                    <button type="button" onClick={addOpenEnrollment} className="h-10 w-full rounded-lg bg-[#eff4ff] px-3 py-2 text-xs font-semibold text-[#006030] hover:bg-[#dee9fc] sm:w-auto">Add Public Seats</button>
                  </div>
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
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-[#afeec2] px-3 py-1 text-[11px] font-bold text-[#336e4b]"><span className="h-1.5 w-1.5 rounded-full bg-[#006030]" />{committedPercent}% Fully Committed</span>
                      <span className="rounded-full bg-[#dee9fc] px-3 py-1 text-[11px] font-semibold text-[#3f4940]">{Math.max(0, unallocatedSeats)} Unallocated</span>
                    </div>
                  </div>
                  {assignedSeats > Number(capacity) && (
                    <p role="alert" aria-live="assertive" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-800">
                      Allocated seats exceed this batch&apos;s maximum capacity of {capacity}. Fix this before saving.
                    </p>
                  )}
                  <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-white shadow-sm">
                    {allocationRows.map((allocation, index) => (
                      <div
                        key={allocation.id}
                        title={`${allocation.option?.organization_name || "Open Public Enrollment"}: ${allocation.seats_assigned} seats`}
                        className={`h-full transition-all ${allocation.allocation_type === "OPEN_ENROLLMENT" ? "bg-[#fcbc22]" : index === 0 ? "bg-[#1b7a43]" : "bg-[#2f6947]"}`}
                        style={{ width: `${capacity ? (Number(allocation.seats_assigned) / Number(capacity)) * 100 : 0}%` }}
                      />
                    ))}
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#becabd]/20 pt-2 text-[11px] text-[#3f4940]">
                    <div className="flex flex-wrap gap-x-4 gap-y-1.5">
                      {allocationRows.map((allocation, index) => (
                        <span key={allocation.id} className="inline-flex items-center gap-1.5 font-medium text-[#121c2a]">
                          <span className={`h-2 w-2 rounded-full ${allocation.allocation_type === "OPEN_ENROLLMENT" ? "bg-[#fcbc22]" : index === 0 ? "bg-[#1b7a43]" : "bg-[#2f6947]"}`} />
                          {allocation.option?.organization_name || "Open Public Enrollment"} ({allocation.seats_assigned} seats · {capacity ? Math.round((Number(allocation.seats_assigned) / Number(capacity)) * 100) : 0}% batch)
                        </span>
                      ))}
                      {allocationRows.length === 0 && <span>No seat allocations added.</span>}
                    </div>
                    <span className="inline-flex items-center gap-1.5 font-bold text-[#006030]"><CircleCheck className="h-3.5 w-3.5" />Ready for Roster Mapping</span>
                  </div>
                </div>

                {errors.allocations?.message &&
                  errors.allocations.message !== "Allocated seats cannot exceed training batch capacity." && (
                    <FieldError>{errors.allocations.message}</FieldError>
                  )}
                <div className="overflow-hidden rounded-xl border border-[#becabd]/30 bg-white shadow-sm">
                  <div className="hidden grid-cols-12 gap-3 border-b border-[#becabd]/20 bg-[#dee9fc]/60 px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-[#3f4940] md:grid">
                    <div className="col-span-4">Organization &amp; Contract SOW</div>
                    <div className="col-span-2">Agreed Trainees / Contract Quota</div>
                    <div className="col-span-3">Batch Fulfillment</div>
                    <div className="col-span-2 text-center">Assigned This Batch</div>
                    <div className="col-span-1 text-right">Action</div>
                  </div>
                  {allocationRows.map((allocation, index) => {
                    const option = allocation.option;
                    const quota = allocation.allocation_type === "OPEN_ENROLLMENT" ? null : option;
                    const seatsRegistration = register(`allocations.${index}.seats_assigned`, { valueAsNumber: true });
                    const fulfillment = quota?.agreed_quantity
                      ? Math.min(100, Math.round((allocation.seats_assigned / quota.agreed_quantity) * 100))
                      : 0;
                    return (
                      <div key={allocation.id} className="grid grid-cols-1 items-center gap-3 border-b border-[#becabd]/20 px-4 py-4 transition-colors last:border-0 hover:bg-[#eff4ff] md:grid-cols-12">
                        <div className="flex min-w-0 items-center gap-3 md:col-span-4">
                          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[#8a6400]/20 text-xs font-bold text-[#6c4d00] shadow-sm">
                            {quota?.organization_name?.slice(0, 2).toUpperCase() || "OP"}
                          </span>
                          <div className="flex min-w-0 flex-col">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="text-xs font-bold text-[#121c2a]">{quota?.organization_name || "Open Public Enrollment"}</span>
                              {quota && <span className="rounded bg-[#e6eeff] px-1.5 py-0.5 font-mono text-[10px] font-semibold text-[#3f4940]">{quota.reference_id}</span>}
                            </div>
                            <span className="truncate text-[11px] text-[#3f4940]">{quota?.course_name || "Self-funded public enrollment"}</span>
                          </div>
                        </div>
                        <div className="flex flex-col gap-1 md:col-span-2">
                          <span className="flex items-center gap-1.5 font-mono text-xs font-bold text-[#121c2a]"><FileText className="h-3.5 w-3.5 text-[#006030]" />{quota ? `${quota.agreed_quantity} Agreed Trainees` : "Public Seats"}</span>
                          <span className="text-[10px] leading-tight text-[#3f4940]">{quota?.engagement_name || "Open Enrollment"}</span>
                        </div>
                        <div className="flex flex-col gap-1.5 md:col-span-3">
                          <div className="flex items-center justify-between gap-2 text-[11px]">
                            <span className="text-[#3f4940] md:hidden">Batch fulfillment</span>
                            <span className="text-[#3f4940]">
                              {quota ? `${allocation.seats_assigned} of ${quota.agreed_quantity} agreed trainees assigned` : "Not applicable"}
                            </span>
                            {quota && <span className="shrink-0 font-mono text-[10px] font-semibold text-[#121c2a]">{fulfillment}%</span>}
                          </div>
                          {quota && (
                            <div
                              role="progressbar"
                              aria-label={`${quota.organization_name || quota.engagement_name} batch fulfillment`}
                              aria-valuemin={0}
                              aria-valuemax={quota.agreed_quantity}
                              aria-valuenow={allocation.seats_assigned}
                              className="h-1.5 w-full overflow-hidden rounded-full bg-[#dee9fc]"
                            >
                              <div className="h-full bg-[#006030] transition-all" style={{ width: `${fulfillment}%` }} />
                            </div>
                          )}
                        </div>
                        <div className="flex items-center justify-between md:col-span-2 md:justify-center">
                          <span className="text-xs font-medium text-[#3f4940] md:hidden">Assigned this batch</span>
                          <div className="flex items-center overflow-hidden rounded-lg border border-[#becabd]/30 bg-white shadow-sm">
                            <button type="button" title="Decrease seats" aria-label={`Decrease seats for ${quota?.organization_name || "Open Public Enrollment"}`} onClick={() => adjustAllocationSeats(index, -1)} className="flex h-7 w-7 items-center justify-center text-xs font-bold text-[#3f4940] transition-colors hover:bg-[#dee9fc] hover:text-[#121c2a]"><Minus className="h-3 w-3" /></button>
                            <input
                              aria-label={`Seats assigned to ${quota?.organization_name || "Open Public Enrollment"}`}
                              type="number"
                              min={0}
                              max={quota?.available_seats}
                              {...seatsRegistration}
                              onChange={(event) => {
                                if (!Number.isFinite(event.currentTarget.valueAsNumber)) {
                                  event.currentTarget.value = "0";
                                }
                                void seatsRegistration.onChange(event);
                                setAllocationSeatInput(index, event.currentTarget.valueAsNumber);
                              }}
                              className="h-7 w-10 bg-transparent text-center text-xs font-bold text-[#006030] outline-none"
                            />
                            <button type="button" title="Increase seats" aria-label={`Increase seats for ${quota?.organization_name || "Open Public Enrollment"}`} onClick={() => adjustAllocationSeats(index, 1)} className="flex h-7 w-7 items-center justify-center text-xs font-bold text-[#3f4940] transition-colors hover:bg-[#dee9fc] hover:text-[#121c2a]"><Plus className="h-3 w-3" /></button>
                          </div>
                        </div>
                        <div className="flex items-center justify-between md:col-span-1 md:justify-end">
                          <span className="text-xs font-medium text-[#3f4940] md:hidden">Action</span>
                          <button type="button" aria-label={`Remove ${quota?.organization_name || "Open Public Enrollment"}`} onClick={() => allocations.remove(index)} className="p-2 text-[#3f4940] transition-colors hover:text-red-700">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                  {allocationRows.length === 0 && <div className="px-4 py-8 text-center text-sm text-[#3f4940]">Add a contract quota or public enrollment seats.</div>}
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
                  <div className="flex items-center justify-between gap-2 text-xs"><span className="text-[#3f4940]">Facility Rating</span><span className="flex items-center gap-1.5 font-semibold text-[#121c2a]"><BadgeCheck className="h-4 w-4 text-[#6c4d00]" />IWCF Class A Certified</span></div>
                  <div className="flex items-center justify-between gap-2 text-xs"><span className="text-[#3f4940]">Simulator Type</span><span className="text-right font-semibold text-[#121c2a]">DrillSIM 5000 Cyber Chair</span></div>
                  <div className="flex items-center justify-between gap-2 text-xs"><span className="text-[#3f4940]">Assessor Ratio</span><span className="text-right font-semibold text-[#121c2a]">1 : 8 (Safety Mandate Compliant)</span></div>
                </div>
              </section>
              <section className="flex flex-col gap-2 rounded-xl bg-[#dee9fc]/60 p-6">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#006030]"><Gavel className="h-4 w-4" />NUPRC &amp; IWCF Audit Standard</div>
                <p className="text-xs leading-relaxed text-[#3f4940]">All candidates must have verifiable NOGIC JQS candidate registration numbers submitted at least 48 hours prior to start date for certification filing.</p>
              </section>
            </aside>

            <div className="flex flex-col justify-between gap-4 rounded-xl bg-white p-6 shadow-md sm:flex-row sm:items-center lg:col-span-12">
              <div className="flex flex-col">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[#3f4940]">Lifecycle State</span>
                <div className="flex flex-wrap items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-[#8a6400]" /><span className="text-sm font-bold text-[#121c2a]">Draft Training Batch</span><span className="text-xs text-[#3f4940]">(Not yet visible in Candidate Self-Service)</span></div>
              </div>
              <div className="flex w-full flex-wrap justify-end gap-2 sm:w-auto">
                <ActionButton type="button" onClick={() => navigate("/training/batches")} className="bg-[#eff4ff] text-[#121c2a] hover:bg-[#e6eeff]"><X className="h-[18px] w-[18px]" />Cancel</ActionButton>
                <ActionButton type="button" disabled={isSubmitting || optionsLoading || Boolean(optionsError)} onClick={() => void saveDraft()} className="bg-[#dee9fc] text-[#006030] hover:bg-[#d9e3f6]"><Save className="h-[18px] w-[18px]" />Save Draft</ActionButton>
                <ActionButton type="button" disabled={isSubmitting || optionsLoading || Boolean(optionsError)} onClick={() => void handleReady()} className="bg-[#1b7a43] px-6 text-white shadow-md hover:bg-[#006030] hover:shadow-lg"><Rocket className="h-[18px] w-[18px]" />Save &amp; Ready</ActionButton>
              </div>
            </div>
          </form>
          <Dialog
            open={quotaDialogOpen}
            onOpenChange={(open) => {
              setQuotaDialogOpen(open);
              if (!open) setSelectedQuotaIds([]);
            }}
          >
            <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Choose contract quotas</DialogTitle>
                <DialogDescription>Select one or more available quotas to add to this training batch.</DialogDescription>
              </DialogHeader>
              <div className="flex flex-col gap-2">
                {allocationOptions.map((option) => {
                  const alreadyAdded = watchedAllocations.some(
                    (allocation) => allocation.allocation_type === "CONTRACT"
                      && allocation.engagement_item_id === option.engagement_item_id,
                  );
                  const disabled = alreadyAdded || option.available_seats <= 0;
                  const selected = selectedQuotaIds.includes(option.engagement_item_id);
                  return (
                    <button
                      key={option.engagement_item_id}
                      type="button"
                      onClick={() => setSelectedQuotaIds((current) => (
                        selected
                          ? current.filter((id) => id !== option.engagement_item_id)
                          : [...current, option.engagement_item_id]
                      ))}
                      disabled={disabled}
                      aria-pressed={selected}
                      className={`flex w-full items-center justify-between gap-3 rounded-lg border p-3 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                        selected
                          ? "border-[#1b7a43] bg-[#1b7a43]/10 ring-1 ring-[#1b7a43]"
                          : "border-[#becabd]/50 bg-white hover:border-[#1b7a43]/60 hover:bg-[#eff4ff]"
                      }`}
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold text-[#121c2a]">
                          {option.organization_name || option.engagement_name}
                        </span>
                        <span className="mt-1 block text-xs text-[#3f4940]">
                          {option.reference_id} · {option.course_name}
                        </span>
                      </span>
                      <span className="shrink-0 text-xs font-semibold text-[#006030]">
                        {alreadyAdded
                          ? "Already added"
                          : `${option.available_seats} available · ${option.agreed_quantity} agreed`}
                      </span>
                    </button>
                  );
                })}
                {allocationOptions.length === 0 && (
                  <p className="rounded-lg bg-[#eff4ff] p-4 text-sm text-[#3f4940]">
                    No active contract quotas are available for this course. You can still add public enrollment seats.
                  </p>
                )}
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setQuotaDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  type="button"
                  disabled={selectedQuotaIds.length === 0}
                  onClick={() => {
                    if (addContractAllocations()) setQuotaDialogOpen(false);
                  }}
                  className="bg-[#1b7a43] text-white hover:bg-[#006030]"
                >
                  Add selected quotas ({selectedQuotaIds.length})
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </AdminPageShell>
  );
}
