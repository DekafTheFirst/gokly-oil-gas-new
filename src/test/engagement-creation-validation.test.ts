import { describe, expect, it } from "vitest";
import { engagementCreationSchema } from "@/lib/engagement-creation-validation";

const validEngagement = {
  name: "Deepwater Well Control Cohort",
  organization_id: "org-1",
  primary_contact: "Training Liaison",
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
      course_id: 1,
      course_name: "Well Control",
      agreed_quantity: 10,
      unit_price: 150000,
      discount: "0",
      curriculum_notes: "",
    },
  ],
};

const errorsFor = (values: unknown) => {
  const result = engagementCreationSchema.safeParse(values);
  if (result.success) return {};
  return Object.fromEntries(
    result.error.issues.map((issue) => [issue.path.join("."), issue.message]),
  );
};

describe("engagement creation validation", () => {
  it("accepts a complete engagement", () => {
    expect(engagementCreationSchema.safeParse(validEngagement).success).toBe(true);
  });

  it("requires an engagement name, sponsor, course, and positive quantity", () => {
    const errors = errorsFor({
      ...validEngagement,
      name: "  ",
      organization_id: "",
      items: [{ ...validEngagement.items[0], course_id: undefined, agreed_quantity: 0 }],
    });

    expect(errors.name).toMatch(/at least 3 characters/);
    expect(errors.organization_id).toMatch(/Select a sponsor/);
    expect(errors["items.0.course_id"]).toMatch(/Select a course/);
    expect(errors["items.0.agreed_quantity"]).toMatch(/at least 1/);
  });

  it("requires at least one training item", () => {
    expect(errorsFor({ ...validEngagement, items: [] }).items).toMatch(/at least one training item/);
  });

  it("rejects completion dates before the delivery start date", () => {
    expect(
      errorsFor({
        ...validEngagement,
        expected_delivery_start: "2026-10-20",
        expected_completion: "2026-10-19",
      }).expected_completion,
    ).toMatch(/cannot be before/);
  });

  it("allows a zero unit price and equal delivery dates", () => {
    expect(
      engagementCreationSchema.safeParse({
        ...validEngagement,
        expected_delivery_start: "2026-10-20",
        expected_completion: "2026-10-20",
        items: [{ ...validEngagement.items[0], unit_price: 0 }],
      }).success,
    ).toBe(true);
  });
});
