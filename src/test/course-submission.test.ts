/**
 * Contract tests for the course-wizard submission helpers.
 *
 * These builders are the seam between wizard state and the API: a wrong key or
 * an unnormalised value here is what previously made module/assessment saves
 * fail with a 500 *after* the course row had already been created.
 */
import { describe, expect, it } from "vitest";

import {
  absoluteAssetUrl,
  buildCoursePayload,
  toFinalAssessmentPayload,
  toModulePayloads,
} from "@/lib/course-submission";

describe("toModulePayloads", () => {
  it("never sends an empty scheduled_date (the bug that failed every module save)", () => {
    // `addModule()` seeds scheduled_date with "" — passing that through reached
    // Postgres as an invalid timestamp and rolled the whole insert back.
    const [payload] = toModulePayloads([
      { name: "Engine Ground School", description: "", scheduled_date: "", has_assessment: false },
    ]);
    expect(payload.scheduled_date).toBeNull();
    expect(payload.description).toBe("");
  });

  it("maps only the columns the modules endpoint accepts, with sequential order", () => {
    const payloads = toModulePayloads([
      { name: "  Helicopter Aerodynamics  ", description: "Lift in forward flight" },
      { name: "Hurricane Ops", scheduled_date: "2026-03-01", has_assessment: true, sort_order: 7 },
    ]);
    expect(payloads).toEqual([
      {
        name: "Helicopter Aerodynamics",
        description: "Lift in forward flight",
        code: "MOD-001",
        scheduled_date: null,
        has_assessment: false,
        sort_order: 0,
        duration: 0,
        delivery_type: "both",
        is_required: true,
        materials: [],
        assessment_type: null,
        assessment_max_score: null,
        assessment_pass_mark: null,
        assessment_attempts_allowed: null,
        assessment_required: null,
        assessment_description: null,
      },
      {
        name: "Hurricane Ops",
        description: "",
        code: "MOD-008",
        scheduled_date: "2026-03-01",
        has_assessment: true,
        sort_order: 7,
        duration: 0,
        delivery_type: "both",
        is_required: true,
        materials: [],
        assessment_type: "mcq",
        assessment_max_score: 100,
        assessment_pass_mark: 75,
        assessment_attempts_allowed: 3,
        assessment_required: true,
        assessment_description: null,
      },
    ]);
  });
});

describe("toFinalAssessmentPayload", () => {
  it("converts the collected pass percentage into absolute marks", () => {
    expect(
      toFinalAssessmentPayload({
        name: " Final Theory Exam ",
        description: "Closed book",
        type: "written",
        max_score: 100,
        pass_mark: 75,
        required: true,
      }),
    ).toEqual({
      title: "Final Theory Exam",
      description: "Closed book",
      type: "THEORY",
      max_score: 100,
      pass_mark: 75,
      is_required: true,
    });
  });

  it("rounds to the NUMERIC(7,2) column and defaults unknown types to FINAL", () => {
    const payload = toFinalAssessmentPayload({
      name: "Field Evaluation",
      type: "trainer",
      max_score: 150,
      pass_mark: 33,
    });
    expect(payload.type).toBe("OTHER");
    expect(payload.pass_mark).toBe(49.5);
    // `required` is optional in the wizard and defaults to mandatory.
    expect(payload.is_required).toBe(true);
    expect(toFinalAssessmentPayload({ name: "X", type: "mystery", max_score: 10, pass_mark: 50 }).type)
      .toBe("FINAL");
  });
});

describe("buildCoursePayload", () => {
  const wizardState = {
    title: "Sea Survival Refresher",
    code: "SR-2026",
    category: "Safety",
    description: "Recurrent sea survival training.",
    duration_value: 40,
    duration_unit: "HOURS",
    attendance_percentage: 90,
    theory_passing_score: 75,
    minimum_contact_hours: 32,
    modules: [{ name: "Abandon ship" }],
    expandedModules: [0],
    has_final_assessment: true,
    final_assessment: { name: "Sea test" },
    assessments: [],
    thumbnail_file: { name: "cover.jpg" },
    certificate_enabled: true,
    certificate_external: false,
    certificate_authority: "MISTDO",
    certificate_license_id: "MISTDO-123",
    certificate_portal_url: "https://verify.example/mistdo",
    prerequisite_required: false,
    prerequisite_type: "internal",
    prerequisite_course_id: 12,
  };

  it("strips wizard-only state that has no database column", () => {
    const payload = buildCoursePayload(wizardState, null);
    expect(payload.thumbnail_url).toBeNull();
    for (const key of [
      "attendance_percentage",
      "theory_passing_score",
      "minimum_contact_hours",
      "expandedModules",
      "assessments",
      "thumbnail_file",
    ]) {
      expect(payload).not.toHaveProperty(key);
    }
    expect(payload.modules).toBeDefined();
    // Backend-supported fields still ride through untouched.
    expect(payload.duration_value).toBe(40);
    expect(payload.code).toBe("SR-2026");
  });

  it("uses the uploaded URL and withholds external cert linkage when off", () => {
    const payload = buildCoursePayload(wizardState, "http://localhost:4000/assets/uploads/x.jpg");
    expect(payload.thumbnail_url).toBe("http://localhost:4000/assets/uploads/x.jpg");
    expect(payload.certificate_external).toBe(false);
    expect(payload.certificate_authority).toBeNull();
    expect(payload.certificate_license_id).toBeNull();
    // Prerequisites are nulled while the gate is off so stale ids never ship.
    expect(payload.prerequisite_type).toBeNull();
    expect(payload.prerequisite_course_id).toBeNull();
  });

  it("ships cert linkage and internal prerequisite ids when both gates are on", () => {
    const payload = buildCoursePayload(
      {
        ...wizardState,
        certificate_external: true,
        prerequisite_required: true,
      },
      null,
    );
    expect(payload.certificate_external).toBe(true);
    expect(payload.certificate_authority).toBe("MISTDO");
    expect(payload.prerequisite_course_id).toBe(12);
  });
});

describe("absoluteAssetUrl", () => {
  it("resolves uploads against the API origin and passes absolute URLs through", () => {
    expect(absoluteAssetUrl("https://cdn.example/a.jpg")).toBe("https://cdn.example/a.jpg");
    expect(absoluteAssetUrl("//cdn.example/a.jpg")).toBe("//cdn.example/a.jpg");
    expect(absoluteAssetUrl("/assets/uploads/a.jpg")).toMatch(/\/assets\/uploads\/a\.jpg$/);
  });
});
