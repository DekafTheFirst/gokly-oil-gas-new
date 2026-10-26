import { z } from "zod";

const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Select a session date.")
  .refine((value) => {
    const date = new Date(`${value}T00:00:00.000Z`);
    return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
  }, "Enter a valid session date.");

const timeSchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Enter a valid time.");

export function isGoogleMeetUrl(value: string) {
  if (!value.trim() || value.trim().length > 500) return false;
  try {
    const url = new URL(value.trim());
    return url.protocol === "https:"
      && url.hostname === "meet.google.com"
      && !url.port
      && !url.username
      && !url.password;
  } catch {
    return false;
  }
}

const googleMeetUrlSchema = z.string().trim().max(500, "Google Meet link must be 500 characters or fewer.")
  .refine((value) => !value || isGoogleMeetUrl(value), "Enter a valid Google Meet link.");

const sessionSchema = z
  .object({
    course_module_id: z.number().int().positive().nullable(),
    title: z.string().trim().min(2, "Session title must be at least 2 characters.").max(200),
    description: z.string().trim().max(2000).optional(),
    session_date: dateSchema,
    start_time: timeSchema,
    end_time: timeSchema,
    location: z.string().trim().max(250).optional(),
    online_url: googleMeetUrlSchema.optional(),
  })
  .superRefine((session, context) => {
    const [startHour, startMinute] = session.start_time.split(":").map(Number);
    const [endHour, endMinute] = session.end_time.split(":").map(Number);
    if (
      Number.isFinite(startHour) &&
      Number.isFinite(startMinute) &&
      Number.isFinite(endHour) &&
      Number.isFinite(endMinute) &&
      endHour * 60 + endMinute <= startHour * 60 + startMinute
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["end_time"],
        message: "End time must be after start time.",
      });
    }
  });

const allocationSchema = z.discriminatedUnion("allocation_type", [
  z.object({
    allocation_type: z.literal("CONTRACT"),
    engagement_item_id: z.string().uuid("Select a valid contract quota."),
    seats_assigned: z.number().int().min(0, "Assigned seats cannot be negative."),
  }),
  z.object({
    allocation_type: z.literal("OPEN_ENROLLMENT"),
    seats_assigned: z.number().int().min(0, "Assigned seats cannot be negative."),
  }),
]);

const baseSchema = z.object({
  course_id: z.number().int().positive("Select a published course."),
  delivery_mode: z.enum(["PHYSICAL", "ONLINE", "HYBRID"]),
  name: z.string().trim().min(3, "Training batch name must be at least 3 characters.").max(150),
  batch_code: z.string().trim().min(3, "Batch reference must be at least 3 characters.").max(80),
  location: z.string().trim().max(250).optional(),
  online_url: googleMeetUrlSchema.optional(),
  capacity: z.number().int().min(1, "Capacity must be at least 1.").max(1000),
  min_quorum: z.number().int().min(1, "Minimum quorum must be at least 1."),
  notes: z.string().trim().max(2000, "Notes must be 2000 characters or fewer."),
  sessions: z.array(sessionSchema),
  allocations: z.array(allocationSchema),
});

export const trainingBatchFormSchema = baseSchema
  .superRefine((batch, context) => {
    if (batch.min_quorum > batch.capacity) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["min_quorum"],
        message: "Minimum quorum cannot exceed maximum capacity.",
      });
    }
    if (batch.sessions.length === 0) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["sessions"],
        message: "Add at least one session before marking the training batch ready.",
      });
    }
    const needsLocation = batch.delivery_mode !== "ONLINE";
    const needsMeetLink = batch.delivery_mode !== "PHYSICAL";
    if (needsLocation && !batch.location) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["location"],
        message: "Select a training base.",
      });
    }
    if (needsMeetLink && !batch.online_url) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["online_url"],
        message: "Enter a Google Meet link.",
      });
    }
    batch.sessions.forEach((session, index) => {
      if (needsLocation && !session.location?.trim()) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["sessions", index, "location"],
          message: "Select a training base for this module.",
        });
      }
      if (needsMeetLink && !session.online_url) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["sessions", index, "online_url"],
          message: "Enter a Google Meet link for this module.",
        });
      }
    });
    const allocated = batch.allocations.reduce((sum, allocation) => sum + allocation.seats_assigned, 0);
    if (allocated > batch.capacity) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["allocations"],
        message: "Allocated seats cannot exceed training batch capacity.",
      });
    }
    const itemIds = batch.allocations.flatMap((allocation) =>
      allocation.allocation_type === "CONTRACT" ? [allocation.engagement_item_id] : [],
    );
    if (new Set(itemIds).size !== itemIds.length) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["allocations"],
        message: "A contract quota can only be assigned once.",
      });
    }
    if (batch.allocations.filter((allocation) => allocation.allocation_type === "OPEN_ENROLLMENT").length > 1) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["allocations"],
        message: "Open enrollment can only be added once.",
      });
    }
  });

export const trainingBatchDraftSchema = baseSchema
  .omit({ sessions: true, allocations: true })
  .extend({
    sessions: z.array(sessionSchema).optional(),
    allocations: z.array(allocationSchema).optional(),
  })
  .superRefine((batch, context) => {
    if (batch.delivery_mode !== "ONLINE" && !batch.location) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["location"],
        message: "Select a training base.",
      });
    }
    if (batch.min_quorum > batch.capacity) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["min_quorum"],
        message: "Minimum quorum cannot exceed maximum capacity.",
      });
    }
    const allocated = (batch.allocations ?? []).reduce((sum, allocation) => sum + allocation.seats_assigned, 0);
    if (allocated > batch.capacity) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["allocations"],
        message: "Allocated seats cannot exceed training batch capacity.",
      });
    }
    if ((batch.allocations ?? []).filter((allocation) => allocation.allocation_type === "OPEN_ENROLLMENT").length > 1) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["allocations"],
        message: "Open enrollment can only be added once.",
      });
    }
  });

export interface TrainingBatchFormValues {
  course_id: number;
  delivery_mode: "PHYSICAL" | "ONLINE" | "HYBRID";
  name: string;
  batch_code: string;
  location?: string;
  online_url?: string;
  capacity: number;
  min_quorum: number;
  notes: string;
  sessions: Array<{
    course_module_id: number | null;
    title: string;
    description?: string;
    session_date: string;
    start_time: string;
    end_time: string;
    location?: string;
    online_url?: string;
  }>;
  allocations: Array<
    | { allocation_type: "CONTRACT"; engagement_item_id: string; seats_assigned: number }
    | { allocation_type: "OPEN_ENROLLMENT"; seats_assigned: number }
  >;
}

export function getAllocationQuorumError(
  allocations: TrainingBatchFormValues["allocations"],
  minQuorum: number,
) {
  const assigned = allocations.reduce((sum, allocation) => {
    const seats = Number(allocation.seats_assigned);
    return sum + (Number.isFinite(seats) ? seats : 0);
  }, 0);
  return assigned < minQuorum
    ? `Assigned seats (${assigned}) are below the minimum quorum of ${minQuorum}.`
    : null;
}
