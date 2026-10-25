import { describe, expect, it } from "vitest";

import {
  trainingBatchDraftSchema,
  trainingBatchFormSchema,
} from "@/lib/training-batch-validation";

const validBatch = {
  course_id: 1,
  name: "Offshore Safety Batch",
  batch_code: "BTCH-2026-001",
  location: "Port Harcourt Training Yard",
  capacity: 20,
  min_quorum: 8,
  notes: "",
  sessions: [
    {
      course_module_id: 10,
      title: "Emergency response",
      description: "",
      session_date: "2026-10-12",
      start_time: "08:30",
      end_time: "12:30",
    },
  ],
  allocations: [
    { allocation_type: "OPEN_ENROLLMENT" as const, seats_assigned: 10 },
  ],
};

describe("training batch validation", () => {
  it("accepts a complete ready batch", () => {
    expect(trainingBatchFormSchema.safeParse(validBatch).success).toBe(true);
  });

  it("does not require a per-session location", () => {
    const result = trainingBatchFormSchema.safeParse({
      ...validBatch,
      sessions: [validBatch.sessions[0]],
    });

    expect(result.success).toBe(true);
  });

  it("rejects end times that do not follow the start time", () => {
    const result = trainingBatchFormSchema.safeParse({
      ...validBatch,
      sessions: [{ ...validBatch.sessions[0], end_time: "08:30" }],
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues).toContainEqual(expect.objectContaining({
        path: ["sessions", 0, "end_time"],
        message: "End time must be after start time.",
      }));
    }
  });

  it("rejects quorum that exceeds capacity", () => {
    const result = trainingBatchFormSchema.safeParse({
      ...validBatch,
      min_quorum: 21,
      allocations: [{ allocation_type: "OPEN_ENROLLMENT", seats_assigned: 10 }],
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.map((issue) => issue.path)).toContainEqual(["min_quorum"]);
    }
  });

  it("rejects total allocations above batch capacity", () => {
    const result = trainingBatchFormSchema.safeParse({
      ...validBatch,
      allocations: [{ allocation_type: "OPEN_ENROLLMENT", seats_assigned: 21 }],
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.map((issue) => issue.path)).toContainEqual(["allocations"]);
    }
  });

  it("allows drafts without sessions while validating base fields", () => {
    const result = trainingBatchDraftSchema.safeParse({
      ...validBatch,
      sessions: [],
      allocations: [],
    });

    expect(result.success).toBe(true);
  });
});
