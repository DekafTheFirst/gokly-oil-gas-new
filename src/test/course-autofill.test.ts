import { describe, it, expect } from "vitest";
import {
  buildSampleCourse,
  createDemoThumbnailFile,
  demoThumbnailFallbackUrl,
  DEMO_THUMBNAIL_FALLBACK_PATH,
} from "@/lib/course-autofill";
import { STEP_SCHEMAS } from "@/lib/course-creation-validation";
import {
  buildCoursePayload,
  toFinalAssessmentPayload,
  toModulePayloads,
} from "@/lib/course-submission";

/* Deterministic stamp so codes are reproducible within a test run. */
const STAMP = 1_700_000_000_000;
const sample = buildSampleCourse(1, STAMP);

/* The autofill is only useful if the values it writes sail through the real
   per-step gates - otherwise "Fill demo data" hands the user a wall of red. */
describe("course autofill sample data", () => {
  it("passes every wizard step schema (1-6) with zero field errors", () => {
    for (const step of [1, 2, 3, 4, 5, 6]) {
      const result = STEP_SCHEMAS[step].safeParse(sample);
      const issues = result.success
        ? []
        : result.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`);
      expect(issues, `step ${step} should validate cleanly`).toEqual([]);
    }
  });

  it("uses an existing option value for every select field", () => {
    expect(["FOUNDATION", "INTERMEDIATE", "ADVANCED"]).toContain(sample.tier);
    expect(["PHYSICAL", "VIRTUAL", "HYBRID"]).toContain(sample.delivery_mode);
    expect(["HOURS", "DAYS", "WEEKS"]).toContain(sample.duration_unit);
    expect(["DRAFT", "PUBLISHED", "ARCHIVED"]).toContain(sample.status);
    expect(sample.category).toBe("HSF & Safety");
  });

  it("mixes modules with and without assessments, all unscheduled", () => {
    expect(sample.modules).toHaveLength(3);
    expect(sample.modules.some((m) => !m.has_assessment)).toBe(true);
    expect(sample.modules.some((m) => m.has_assessment)).toBe(true);
    expect(sample.modules.every((m) => m.scheduled_date === "")).toBe(true);
    sample.modules.forEach((m, i) => expect(m.sort_order).toBe(i));
  });

  it("gives each call a distinct code and rotating title", () => {
    const codes = [1, 2, 3, 4, 5, 6].map((n) => buildSampleCourse(n, STAMP).code);
    expect(new Set(codes).size).toBe(6);
    const titles = [1, 2, 3, 4, 5].map((n) => buildSampleCourse(n, STAMP).title);
    expect(new Set(titles).size).toBe(5);
  });

  it("keeps the final assessment keyed the way the route's handlers expect", () => {
    /* toggleFinalAssessment/updateModule filter assessments on "whole" and on
       `mod-<index>`; a different marker would leave the final assessment in the
       list after it is switched off, so this is a contract, not a label. */
    expect(sample.final_assessment.module_association).toBe("whole");
    expect(sample.modules.filter((m) => m.has_assessment).map((m) => m.sort_order)).toEqual([0, 2]);
  });
});

/* The sample must also survive the real submit-time conversions. */
describe("course autofill -> submission payloads", () => {
  it("normalises the blank scheduled dates to null and keeps booleans/ordering", () => {
    const payloads = toModulePayloads(sample.modules);
    expect(payloads).toHaveLength(3);
    payloads.forEach((p, i) => {
      /* null (not "") is what stops Postgres rejecting an empty timestamp. */
      expect(p.scheduled_date).toBeNull();
      expect(p.sort_order).toBe(i);
      expect(p.has_assessment).toBe(sample.modules[i].has_assessment);
    });
    expect(payloads[0].name).toBe("Hazard Identification & Permit to Work");
    expect(payloads[1].has_assessment).toBe(false);
  });

  it("maps the final assessment onto the assessments contract", () => {
    const payload = toFinalAssessmentPayload(sample.final_assessment);
    expect(payload.title).toBe("Final Competency Assessment");
    expect(payload.type).toBe("THEORY"); // mcq/written -> THEORY
    expect(payload.max_score).toBe(100);
    expect(payload.pass_mark).toBe(75); // 75% of 100 -> absolute marks
    expect(payload.is_required).toBe(true);
  });

  it("keeps the course payload free of wizard-only state", () => {
    /* What the route actually submits: the sample merged over the few form
       fields the sample intentionally does not carry. */
    const fullForm = {
      ...sample,
      individual_enrollment_enabled: true,
      certificate_portal_url: "",
      thumbnail_file: null,
    };

    const uploaded = "http://localhost:4000/uploads/demo-course.png";
    const payload = buildCoursePayload(fullForm, uploaded) as Record<string, unknown>;

    /* Wizard scratch state never reaches the API. */
    expect(payload).not.toHaveProperty("expandedModules");
    expect(payload).not.toHaveProperty("assessments");
    expect(payload).not.toHaveProperty("thumbnail_file");
    expect(payload.modules).toBeDefined();

    /* Only the freshly uploaded picture is forwarded - never the local preview. */
    expect(payload.thumbnail_url).toBe(uploaded);
    /* External issuance is off, so its linkage is nulled rather than sent empty. */
    expect(payload.certificate_external).toBe(false);
    expect(payload.certificate_authority).toBeNull();
    expect(payload.certificate_license_id).toBeNull();
    expect(payload.prerequisite_type).toBeNull();
    expect(payload.prerequisite_required).toBe(false);
    expect(demoThumbnailFallbackUrl().endsWith(DEMO_THUMBNAIL_FALLBACK_PATH)).toBe(true);
  });

  it("falls back to the bundled placeholder when no canvas exists (jsdom)", async () => {
    /* No 2d context under jsdom -> null file -> caller keeps thumbnail_url, which
       the step-1 schema still accepts. */
    await expect(createDemoThumbnailFile("Demo course")).resolves.toBeNull();
  });
});
