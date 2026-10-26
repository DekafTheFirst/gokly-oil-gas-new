import { describe, expect, it } from "vitest";

import {
  getAllocationQuorumError,
  trainingBatchDraftSchema,
  trainingBatchFormSchema,
} from "@/lib/training-batch-validation";

const validBatch = {
  course_id: 1,
  delivery_mode: "PHYSICAL" as const,
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
      location: "Port Harcourt Training Yard",
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

  it("requires a physical venue for each module", () => {
    const result = trainingBatchFormSchema.safeParse({
      ...validBatch,
      sessions: [{ ...validBatch.sessions[0], location: "" }],
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.map((issue) => issue.path)).toContainEqual(["sessions", 0, "location"]);
    }
  });

  it("requires Google Meet links for online and hybrid delivery", () => {
    const online = trainingBatchFormSchema.safeParse({
      ...validBatch,
      delivery_mode: "ONLINE",
      location: "",
      online_url: "https://meet.google.com/abc-defg-hij",
      sessions: [{
        ...validBatch.sessions[0],
        location: "",
        online_url: "https://meet.google.com/abc-defg-hij",
      }],
    });
    const hybridWithoutLinks = trainingBatchFormSchema.safeParse({
      ...validBatch,
      delivery_mode: "HYBRID",
      online_url: "",
      sessions: [{ ...validBatch.sessions[0], online_url: "" }],
    });

    expect(online.success).toBe(true);
    expect(hybridWithoutLinks.success).toBe(false);
    if (!hybridWithoutLinks.success) {
      expect(hybridWithoutLinks.error.issues.map((issue) => issue.path)).toContainEqual(["online_url"]);
      expect(hybridWithoutLinks.error.issues.map((issue) => issue.path)).toContainEqual(["sessions", 0, "online_url"]);
    }
  });

  it("rejects links outside Google Meet", () => {
    const result = trainingBatchFormSchema.safeParse({
      ...validBatch,
      delivery_mode: "ONLINE",
      location: "",
      online_url: "https://example.com/meeting",
      sessions: [{
        ...validBatch.sessions[0],
        location: "",
        online_url: "https://meet.google.com/abc-defg-hij",
      }],
    });

    expect(result.success).toBe(false);
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

  it("rejects duplicate open enrollment allocations for ready batches and drafts", () => {
    const duplicateAllocations = [
      { allocation_type: "OPEN_ENROLLMENT" as const, seats_assigned: 2 },
      { allocation_type: "OPEN_ENROLLMENT" as const, seats_assigned: 3 },
    ];

    expect(trainingBatchFormSchema.safeParse({
      ...validBatch,
      allocations: duplicateAllocations,
    }).success).toBe(false);
    expect(trainingBatchDraftSchema.safeParse({
      ...validBatch,
      allocations: duplicateAllocations,
    }).success).toBe(false);
  });

  it("reports when assigned seats are below minimum quorum", () => {
    expect(getAllocationQuorumError([
      { allocation_type: "OPEN_ENROLLMENT", seats_assigned: 4 },
      { allocation_type: "CONTRACT", engagement_item_id: "109156be-c4fb-41ea-b1b4-efe1671c5836", seats_assigned: 3 },
    ], 10)).toBe("Assigned seats (7) are below the minimum quorum of 10.");
  });

  it("does not report a quorum error when assigned seats meet the threshold", () => {
    expect(getAllocationQuorumError([
      { allocation_type: "OPEN_ENROLLMENT", seats_assigned: 10 },
    ], 10)).toBeNull();
  });
});
