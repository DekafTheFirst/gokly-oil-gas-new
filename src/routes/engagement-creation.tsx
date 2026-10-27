import { useState, useEffect, useId } from "react";
import { useNavigate } from "react-router-dom";
import { useFieldArray, useForm, type FieldErrors } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ChevronRight, Info, Sparkles, CloudUpload, Scan, FileText, Badge as BadgeIcon, School, PlusCircle, Lightbulb, Building, CreditCard, CheckCircle, RefreshCw, Calendar as CalendarIcon, Delete } from "lucide-react";
import { createEngagement, type EngagementRecord, type EngagementItem } from "@/lib/engagements";
import {
  engagementCreationSchema,
  type EngagementCreationFormValues,
} from "@/lib/engagement-creation-validation";
import { fetchOrganizations, type OrganizationRecord } from "@/lib/organizations";
import { fetchCourses, type CourseRecord } from "@/lib/courses";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { FormattedNumberInput } from "@/components/ui/formatted-number-input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { AdminPageShell } from "@/components/educert/AdminPageShell";
import { format, parseISO } from "date-fns";

interface DatePickerFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  minDate?: Date;
}

function DatePickerField({ label, value, onChange, minDate }: DatePickerFieldProps) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const selectedDate = value ? parseISO(value) : undefined;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-xs font-semibold uppercase tracking-wide">
        {label}
      </label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id={id}
            type="button"
            variant="outline"
            aria-label={label}
            aria-haspopup="dialog"
            className="w-full justify-start text-left font-normal"
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {selectedDate ? format(selectedDate, "PPP") : <span className="text-muted-foreground">Select a date</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-auto p-0">
          <Calendar
            mode="single"
            selected={selectedDate}
            disabled={minDate ? { before: minDate } : undefined}
            onSelect={(date) => {
              if (date && (!minDate || date >= minDate)) {
                onChange(format(date, "yyyy-MM-dd"));
                setOpen(false);
              }
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
    </div>
  );
}

export default function EngagementCreation() {
  const navigate = useNavigate();
  const [organizations, setOrganizations] = useState<OrganizationRecord[]>([]);
  const [courses, setCourses] = useState<CourseRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [confirmationOpen, setConfirmationOpen] = useState(false);
  const [referenceId, setReferenceId] = useState("");

  const {
    control,
    register,
    setValue,
    handleSubmit: validateAndSubmit,
    formState: { errors },
    watch,
  } = useForm<EngagementCreationFormValues>({
    resolver: zodResolver(engagementCreationSchema),
    defaultValues: {
      name: "",
      organization_id: "",
      primary_contact: "",
      description: "",
      agreement_execution_date: "",
      expected_delivery_start: "",
      expected_completion: "",
      payment_terms: "Net 30 Days",
      currency: "NGN",
      invoice_triggers: "Milestone Based",
      payment_due_window: "14 days post-invoice receipt",
      statutory_notes: "",
      items: [
        {
          course_id: undefined,
          course_name: "",
          agreed_quantity: 0,
          unit_price: 0,
          discount: "0",
          curriculum_notes: "",
        },
      ],
    },
  });
  const { fields: trainingItemFields, append, remove } = useFieldArray({
    control,
    name: "items",
  });
  const formData = watch();
  const trainingItems = formData.items;

  useEffect(() => {
    loadOrganizations();
    loadCourses();
    generateReferenceId();
  }, []);

  const loadOrganizations = async () => {
    try {
      const response = await fetchOrganizations();
      setOrganizations(response);
    } catch (error) {
      console.error("Failed to load organizations:", error);
    }
  };

  const loadCourses = async () => {
    try {
      const response = await fetchCourses();
      setCourses(response);
    } catch (error) {
      console.error("Failed to load courses:", error);
    }
  };

  const generateReferenceId = () => {
    const year = new Date().getFullYear();
    const random = Math.floor(100 + Math.random() * 900);
    setReferenceId(`ENG-${year}-SNEP-${random}`);
  };

  const handleAddTrainingItem = () => {
    append({
      course_id: undefined,
      course_name: "",
      agreed_quantity: 0,
      unit_price: 0,
      discount: "0",
      curriculum_notes: "",
    });
  };

  const handleRemoveTrainingItem = (index: number) => {
    if (trainingItems.length > 1) remove(index);
  };

  const calculateItemTotal = (item: EngagementCreationFormValues["items"][number]) => {
    return item.agreed_quantity * item.unit_price;
  };

  const calculateGrandTotal = () => {
    return trainingItems.reduce((sum, item) => sum + calculateItemTotal(item), 0);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const handleInvalidSubmit = (formErrors: FieldErrors<EngagementCreationFormValues>) => {
    const messages: string[] = [];
    const collectMessages = (value: unknown) => {
      if (!value || typeof value !== "object") return;
      if ("message" in value && typeof value.message === "string") {
        messages.push(value.message);
        return;
      }
      Object.values(value).forEach(collectMessages);
    };
    Object.values(formErrors).forEach(collectMessages);
    toast.error("Fix the highlighted fields before saving the engagement.", {
      description: `${messages.length} issue${messages.length === 1 ? "" : "s"}: ${messages
        .slice(0, 3)
        .join(" • ")}${messages.length > 3 ? " • …" : ""}`,
    });
  };

  const submitEngagement = async (values: EngagementCreationFormValues, saveAsDraft: boolean) => {
    if (loading) return;
    try {
      setLoading(true);

      const engagementPayload: Partial<EngagementRecord> = {
        ...values,
        reference_id: referenceId,
        status: saveAsDraft ? "DRAFT" : "CONFIRMED",
        total_amount: values.items.reduce((sum, item) => sum + calculateItemTotal(item), 0),
        items: values.items.map((item) => ({
          course_id: item.course_id,
          course_name: item.course_name,
          agreed_quantity: item.agreed_quantity,
          unit_price: item.unit_price,
          discount: item.discount,
          curriculum_notes: item.curriculum_notes,
        })) as EngagementItem[],
      };

      const createdEngagement = await createEngagement(engagementPayload);
      toast.success(saveAsDraft ? "Engagement saved as draft" : "Engagement created successfully");
      navigate(`/training/engagement-management/${createdEngagement.id}`);
    } catch (error) {
      console.error("Failed to create engagement:", error);
      toast.error("Failed to create engagement");
    } finally {
      setLoading(false);
    }
  };

  const totalTrainees = trainingItems.reduce((sum, item) => sum + item.agreed_quantity, 0);

  return (
    <AdminPageShell withSidebar>
      <div className="max-w-8xl mx-auto w-full px-12 py-8 pb-32 space-y-10">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="space-y-2">
            <nav className="flex items-center gap-2 text-muted-foreground text-xs uppercase tracking-wider">
              <span className="hover:text-primary cursor-pointer transition-colors">Admin</span>
              <ChevronRight className="h-4 w-4" />
              <span className="hover:text-primary cursor-pointer transition-colors">Engagements</span>
              <ChevronRight className="h-4 w-4" />
              <span className="text-primary font-bold">New Engagement</span>
            </nav>
            <h1 className="text-4xl font-bold tracking-tight">Create Training Engagement</h1>
            <p className="text-sm text-muted-foreground max-w-3xl leading-relaxed">
              Establish a commercial training agreement, define course quotas, and plan delivery fulfillment for corporate partners.
            </p>
          </div>
          <div className="flex items-center gap-3 self-start md:self-auto">
            <Button variant="outline" onClick={() => navigate("/training/engagement-management")}>
              Cancel
            </Button>
            <Button
              variant="secondary"
              onClick={validateAndSubmit((values) => submitEngagement(values, true), handleInvalidSubmit)}
              disabled={loading}
            >
              Save Draft
            </Button>
            <Button
              onClick={validateAndSubmit(() => setConfirmationOpen(true), handleInvalidSubmit)}
              disabled={loading}
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              Save & Confirm
            </Button>
          </div>
        </div>
        {/* Alert Banner */}
        <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700">
              <Info className="h-4 w-4" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-semibold uppercase tracking-wide text-emerald-900">
                Fulfillment Flexibility Guaranteed
              </span>
              <span className="text-xs text-emerald-800">
                Confirming this commercial engagement commits seats and pricing without forcing immediate batch scheduling.
              </span>
            </div>
          </div>
          <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 px-3 py-1 text-xs font-bold uppercase tracking-wider">
            Commercial First
          </Badge>
        </div>
        {/* AI Contract Ingestion Section */}
        {/* <div className="bg-background rounded-xl p-8 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                <Sparkles className="text-lg" />
              </div>
              <div>
                <h2 className="text-xl font-bold">AI Contract Ingestion & Auto-Fill</h2>
                <p className="text-xs text-muted-foreground">
                  Upload signed Service Level Agreement (SLA), Master Service Agreement (MSA), or Client Purchase Order (PO) to automatically scan and pre-populate engagement fields.
                </p>
              </div>
            </div>
            <Badge className="bg-primary/10 text-primary px-3 py-1 text-xs font-semibold flex items-center gap-1">
              <Sparkles className="h-3 w-3" />
              AI Assisted
            </Badge>
          </div>
          <div className="flex flex-col items-center justify-center p-6 bg-muted/50 hover:bg-muted rounded-xl transition-all cursor-pointer text-center">
            <div className="w-12 h-12 rounded-full bg-background flex items-center justify-center text-primary shadow-sm mb-3">
              <CloudUpload className="h-6 w-6" />
            </div>
            <span className="text-sm font-semibold">Drop executed agreement or corporate PO here, or Browse files</span>
            <span className="text-xs text-muted-foreground mt-1">
              Supports PDF, DOCX, Scanned contracts, SAP/Ariba POs up to 35MB
            </span>
            <div className="flex items-center gap-3 mt-4">
              <Button variant="default" size="sm">
                <Scan className="mr-2 h-4 w-4" />
                Upload & Extract with AI
              </Button>
              <Button variant="ghost" size="sm" className="text-primary">
                or Paste Contract Text
              </Button>
            </div>
          </div>
        </div> */}
        {/* Section A: Engagement Information */}
        <div className="bg-background rounded-xl border border-border p-8 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-primary">
                <FileText className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Section A — Engagement Information</h2>
                <p className="text-xs text-muted-foreground">
                  Master account identifiers, sponsor attribution, and valid active dates.
                </p>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 pt-2">
            <div className="md:col-span-8 flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-wide">
                Engagement Name <span className="text-destructive">*</span>
              </label>
              <Input
                placeholder="e.g. 2025 Deepwater Well Control Cohort"
                value={formData.name}
                aria-invalid={Boolean(errors.name)}
                {...register("name")}
              />
              {errors.name && <p className="text-sm text-destructive" role="alert">{errors.name.message}</p>}
            </div>
            <div className="md:col-span-4 flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-wide flex items-center justify-between">
                <span>Reference ID</span>
                <span className="text-[10px] text-primary lowercase tracking-normal font-normal">auto-generated</span>
              </label>
              <div className="relative flex items-center">
                <Input
                  value={referenceId}
                  onChange={(e) => setReferenceId(e.target.value)}
                  className="font-mono"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-0"
                  onClick={generateReferenceId}
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="md:col-span-6 flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-wide">
                Sponsor / Organization <span className="text-destructive">*</span>
              </label>
              <Select
                value={formData.organization_id}
                onValueChange={(value) => {
                  const selectedOrganization = organizations.find((org) => org.id === value);
                  setValue("organization_id", value, { shouldDirty: true, shouldValidate: true });
                  setValue("primary_contact", selectedOrganization?.primary_contact || "", { shouldDirty: true });
                }}
              >
                <SelectTrigger aria-invalid={Boolean(errors.organization_id)}>
                  <SelectValue placeholder="Select organization" />
                </SelectTrigger>
                <SelectContent>
                  {organizations.filter(org => org.id).map((org) => (
                    <SelectItem key={org.id} value={org.id}>
                      {org.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.organization_id && <p className="text-sm text-destructive" role="alert">{errors.organization_id.message}</p>}
            </div>
            <div className="md:col-span-6 flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-wide">Primary Technical Liaison</label>
              <div className="relative">
                <BadgeIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  className="pl-10"
                  value={formData.primary_contact}
                  disabled
                  placeholder={formData.organization_id ? "No representative assigned" : "Select an organization first"}
                />
              </div>
            </div>
            <div className="md:col-span-12 flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-wide">
                Context, Training Scope & Strategic Objectives
              </label>
              <Textarea
                rows={3}
                placeholder="Provide background context on batch prerequisites, operational site assignments, and training standards..."
                value={formData.description}
                {...register("description")}
              />
            </div>
            <div className="md:col-span-4">
              <DatePickerField
                label="Agreement Execution Date"
                value={formData.agreement_execution_date}
                onChange={(value) => setValue("agreement_execution_date", value, { shouldDirty: true })}
              />
            </div>
            <div className="md:col-span-4">
              <DatePickerField
                label="Expected Delivery Start"
                value={formData.expected_delivery_start}
                onChange={(value) => {
                  setValue("expected_delivery_start", value, { shouldDirty: true, shouldValidate: true });
                }}
              />
            </div>
            <div className="md:col-span-4">
              <div className="space-y-1.5">
                <DatePickerField
                  label="Expected Completion"
                  value={formData.expected_completion}
                  minDate={formData.expected_delivery_start ? parseISO(formData.expected_delivery_start) : undefined}
                  onChange={(value) => setValue("expected_completion", value, { shouldDirty: true, shouldValidate: true })}
                />
                {errors.expected_completion && (
                  <p className="text-sm text-destructive" role="alert">
                    {errors.expected_completion.message}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
        {/* Section B: Training Items */}
        <div className="bg-background rounded-xl border border-border p-8 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-primary">
                <School className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Section B — Training Items & Quotas</h2>
                <p className="text-xs text-muted-foreground">
                  Define accredited courses, delegate volume commitments, and negotiated unit rates.
                </p>
              </div>
            </div>
            <Button type="button" variant="secondary" onClick={handleAddTrainingItem}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Training Item
            </Button>
          </div>
          <div className="space-y-4">
            {trainingItems.map((item, index) => (
              <div key={trainingItemFields[index].id} className="bg-muted/60 rounded-xl border border-border p-5 space-y-4 shadow-sm">
                <div className="flex items-center justify-between pb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
                      {index + 1}
                    </span>
                    <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                      Course Item
                    </span>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveTrainingItem(index)}
                    disabled={trainingItems.length === 1}
                  >
                    <Delete className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                  </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                  <div className="md:col-span-4 flex flex-col gap-1">
                    <label className="text-[11px] font-semibold text-muted-foreground uppercase">
                      Accredited Course / Service
                    </label>
                    <Select
                      value={item.course_id?.toString() || ""}
                      onValueChange={(value) => {
                        const selectedCourse = courses.find((c) => c.id === Number(value));
                        if (selectedCourse) {
                          setValue(`items.${index}.course_id`, selectedCourse.id, {
                            shouldDirty: true,
                            shouldValidate: true,
                          });
                          setValue(`items.${index}.course_name`, selectedCourse.title, { shouldDirty: true });
                          setValue(`items.${index}.unit_price`, Number(selectedCourse.price) || 0, {
                            shouldDirty: true,
                            shouldValidate: true,
                          });
                        }
                      }}
                    >
                      <SelectTrigger aria-invalid={Boolean(errors.items?.[index]?.course_id)}>
                        <SelectValue placeholder="Select a course" />
                      </SelectTrigger>
                      <SelectContent>
                        {courses.map((course) => (
                          <SelectItem key={course.id} value={course.id.toString()}>
                            {course.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.items?.[index]?.course_id && (
                      <p className="text-sm text-destructive" role="alert">
                        {errors.items[index]?.course_id?.message}
                      </p>
                    )}
                  </div>

                   <div className="md:col-span-4 flex flex-col gap-1">
                    <label className="text-[11px] font-semibold text-muted-foreground uppercase">
                      Unit Price (₦)
                    </label>
                    <FormattedNumberInput
                      min={0}
                      disabled={true}
                      value={item.unit_price}
                      onValueChange={() => {}}
                    />
                  </div>

                  <div className="md:col-span-4 flex flex-col gap-1">
                    <label className="text-[11px] font-semibold text-muted-foreground uppercase">
                      Agreed Quantity
                    </label>
                    <FormattedNumberInput
                      min={0}
                      allowDecimal={false}
                      value={item.agreed_quantity}
                      aria-invalid={Boolean(errors.items?.[index]?.agreed_quantity)}
                      onValueChange={(value) =>
                        setValue(`items.${index}.agreed_quantity`, Number(value), {
                          shouldDirty: true,
                          shouldValidate: true,
                        })
                      }
                    />
                    {errors.items?.[index]?.agreed_quantity && (
                      <p className="text-sm text-destructive" role="alert">
                        {errors.items[index]?.agreed_quantity?.message}
                      </p>
                    )}
                  </div>
                 
                  {/* <div className="md:col-span-2 flex flex-col gap-1">
                    <label className="text-[11px] font-semibold text-muted-foreground uppercase">
                      Discount / Adjust (₦)
                    </label>
                    <FormattedNumberInput
                      value={item.discount ?? ""}
                      onValueChange={(value) => handleTrainingItemChange(index, "discount", String(value))}
                    />
                  </div> */}
                  <div className="md:col-span-4 flex flex-col gap-1">
                    <label className="text-[11px] font-semibold text-muted-foreground uppercase">
                      Calculated Total
                    </label>
                    <div className="h-[40px] flex items-center px-3 bg-muted rounded-lg font-bold text-primary text-sm">
                      {formatCurrency(calculateItemTotal(item))}
                    </div>
                  </div>
                  <div className="md:col-span-12 flex flex-col gap-1">
                    <label className="text-[11px] font-semibold text-muted-foreground uppercase">
                      Curriculum Notes & Execution Prerequisite
                    </label>
                    <Input
                      placeholder="Provide note..."
                      value={item.curriculum_notes}
                      {...register(`items.${index}.curriculum_notes`)}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
          {/* Total Engagement Value Bar */}
          <div className="bg-primary/5 rounded-xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-sm">
                <CreditCard className="h-5 w-5" />
              </div>
              <div>
                <div className="text-[11px] text-primary uppercase font-bold tracking-wider">Commercial Aggregate</div>
                <div className="text-xs text-muted-foreground">
                  Total for {trainingItems.length} scheduled items ({totalTrainees} total delegates contracted)
                </div>
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-xs text-muted-foreground font-semibold uppercase">Total Engagement Value:</span>
              <span className="text-3xl font-bold text-primary tracking-tight">{formatCurrency(calculateGrandTotal())}</span>
              <span className="text-[11px] text-muted-foreground">NGN</span>
            </div>
          </div>
        </div>
        {/* Section C: Delivery Planning */}
        <div className="bg-background rounded-xl border border-border p-8 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-primary">
                <CalendarIcon className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Section C — Delivery Planning & Quota Allocation</h2>
                <p className="text-xs text-muted-foreground">
                  Track quota status across planning, roster enrollment, and future capacity.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-secondary"></span>
              <span className="text-xs font-bold text-secondary">Uncoupled Workflow</span>
            </div>
          </div>
          <div className="bg-muted p-4 rounded-xl flex items-start gap-3">
            <Lightbulb className="text-primary h-5 w-5 mt-0.5" />
            <div className="space-y-1">
              <p className="text-xs font-bold uppercase tracking-wider">Independent Commercial Execution</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Engagement can be confirmed before Gokly knows exactly which batches will deliver it. You can allocate these items to training batches anytime after confirmation.
              </p>
            </div>
          </div>
        </div>
        {/* Section D: Commercial Terms */}
        <div className="bg-background rounded-xl border border-border p-8 shadow-sm space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-primary">
              <Building className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Section D — Commercial & Billing Terms</h2>
              <p className="text-xs text-muted-foreground">
                Payment milestones, currency denominations, statutory deductions, and escrow triggers.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 pt-2">
            <div className="md:col-span-3 flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-wide">Payment Terms</label>
              <Select
                value={formData.payment_terms}
                onValueChange={(value) => setValue("payment_terms", value, { shouldDirty: true, shouldValidate: true })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Net 30 Days">Net 30 Days</SelectItem>
                  <SelectItem value="Net 60 Days">Net 60 Days</SelectItem>
                  <SelectItem value="Milestone Drawdown">Milestone Drawdown (30/40/30)</SelectItem>
                  <SelectItem value="Advance Escrow Deposit">100% Advance Escrow Deposit</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-3 flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-wide">Billing Currency</label>
              <Select disabled={true} value={formData.currency} onValueChange={(value) => setValue("currency", value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NGN">NGN - Nigerian Naira (₦)</SelectItem>
                  <SelectItem value="USD">USD - US Dollar ($)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-3 flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-wide">Invoice Triggers</label>
              <Select
                value={formData.invoice_triggers}
                onValueChange={(value) => setValue("invoice_triggers", value, { shouldDirty: true, shouldValidate: true })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Milestone Based">Yes - Milestone Based</SelectItem>
                  <SelectItem value="Upfront">Yes - 100% Upfront Retainer</SelectItem>
                  <SelectItem value="Batch Completion">Invoiced on Batch Completion</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-3 flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-wide">Payment Due Window</label>
              <Input
                value={formData.payment_due_window}
                {...register("payment_due_window")}
              />
            </div>
            <div className="md:col-span-12 flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-wide">
                Statutory Deductions & Accounting Remarks
              </label>
              <Textarea
                rows={3}
                placeholder="Provide notes regarding 5% WHT deductions, 1% NCDMB fund remittance, or SAP Ariba purchase order line matching..."
                value={formData.statutory_notes}
                {...register("statutory_notes")}
              />
            </div>
          </div>
        </div>
        {/* Bottom Sticky Action Bar */}
        <div className="fixed bottom-0 left-0 right-0 bg-background/90 backdrop-blur-md px-8 py-4 z-40 shadow-lg flex items-center justify-between md:pl-72">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-primary-container"></span>
              <span className="text-xs font-semibold uppercase tracking-wider">Commercial Status:</span>
              <span className="text-xs font-medium text-muted-foreground">
                Pending Confirmation & Delivery Planning
              </span>
            </div>
            <div className="hidden lg:flex items-center gap-2 pl-4 border-l border-border text-xs text-muted-foreground">
              <span>
                Total Committed: <strong className="text-foreground font-semibold">{formatCurrency(calculateGrandTotal())}</strong>
              </span>
              <span>•</span>
              <span>
                Allocations: <strong className="text-primary font-semibold">{totalTrainees} Seats Planned</strong>
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={() => navigate("/training/engagement-management")}>
              Cancel
            </Button>
            <Button
              variant="secondary"
              onClick={validateAndSubmit((values) => submitEngagement(values, true), handleInvalidSubmit)}
              disabled={loading}
            >
              Save Draft
            </Button>
            <Button
              onClick={validateAndSubmit(() => setConfirmationOpen(true), handleInvalidSubmit)}
              disabled={loading}
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              Save & Confirm
            </Button>
          </div>
        </div>
      </div>
      <AlertDialog open={confirmationOpen} onOpenChange={setConfirmationOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm this engagement?</AlertDialogTitle>
            <AlertDialogDescription>
              This will create “{formData.name || "Untitled engagement"}” with a committed value of{" "}
              {formatCurrency(calculateGrandTotal())} and mark it as confirmed. Review the details before continuing.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Review details</AlertDialogCancel>
            <AlertDialogAction
              disabled={loading}
              onClick={(event) => {
                event.preventDefault();
                setConfirmationOpen(false);
                void validateAndSubmit((values) => submitEngagement(values, false), handleInvalidSubmit)();
              }}
            >
              Confirm & Create
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminPageShell>
  );
}
