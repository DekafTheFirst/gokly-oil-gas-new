import { z } from "zod";

const engagementItemSchema = z.object({
  course_id: z.number().int().positive().optional(),
  course_name: z.string(),
  agreed_quantity: z.number().int().min(1, "Enter an agreed quantity of at least 1."),
  unit_price: z.number().finite().min(0, "Unit price must be zero or more."),
  discount: z.string(),
  curriculum_notes: z.string(),
});

export const engagementCreationSchema = z
  .object({
    name: z.string().trim().min(3, "Engagement name must be at least 3 characters."),
    organization_id: z.string().trim().min(1, "Select a sponsor / organization."),
    primary_contact: z.string(),
    description: z.string(),
    agreement_execution_date: z.string(),
    expected_delivery_start: z.string(),
    expected_completion: z.string(),
    payment_terms: z.string().min(1, "Select payment terms."),
    currency: z.string().min(1, "Select a billing currency."),
    invoice_triggers: z.string().min(1, "Select invoice triggers."),
    payment_due_window: z.string(),
    statutory_notes: z.string(),
    items: z.array(engagementItemSchema).min(1, "Add at least one training item."),
  })
  .superRefine((engagement, ctx) => {
    engagement.items.forEach((item, index) => {
      if (item.course_id === undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["items", index, "course_id"],
          message: "Select a course for this training item.",
        });
      }
    });

    if (
      engagement.expected_delivery_start &&
      engagement.expected_completion &&
      engagement.expected_completion < engagement.expected_delivery_start
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["expected_completion"],
        message: "Expected completion cannot be before the delivery start date.",
      });
    }
  });

export type EngagementCreationFormValues = z.infer<typeof engagementCreationSchema>;
