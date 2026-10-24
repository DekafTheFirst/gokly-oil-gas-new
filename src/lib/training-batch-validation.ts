import { z } from "zod";

const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Select a session date.")
  .refine((value) => {
    const date = new Date(`${value}T00:00:00.000Z`);
    return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
  }, "Enter a valid session date.");

const timeSchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Enter a valid time.");

const sessionSchema = z
  .object({
    course_module_id: z.number().int().positive().nullable(),
    title: z.string().trim().min(2, "Session title must be at least 2 characters.").max(200),
    description: z.string().trim().max(2000).optional(),
    session_date: dateSchema,
    start_time: timeSchema,
    end_time: timeSchema,
    location: z.string().trim().min(2, "Enter a venue for this session.").max(250),
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
  name: z.string().trim().min(3, "Training batch name must be at least 3 characters.").max(150),
  batch_code: z.string().trim().min(3, "Batch reference must be at least 3 characters.").max(80),
  location: z.string().trim().min(2, "Select a training base.").max(250),
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
  });

export const trainingBatchDraftSchema = baseSchema
  .omit({ sessions: true, allocations: true })
  .extend({
    sessions: z.array(sessionSchema).optional(),
    allocations: z.array(allocationSchema).optional(),
  })
  .superRefine((batch, context) => {
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
  });

export interface TrainingBatchFormValues {
  course_id: number;
  name: string;
  batch_code: string;
  location: string;
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
    location: string;
  }>;
  allocations: Array<
    | { allocation_type: "CONTRACT"; engagement_item_id: string; seats_assigned: number }
    | { allocation_type: "OPEN_ENROLLMENT"; seats_assigned: number }
  >;
}
