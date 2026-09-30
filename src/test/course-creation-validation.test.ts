import { describe, it, expect } from "vitest";
import { STEP_SCHEMAS, collectStepErrors, collectModuleErrors } from "@/lib/course-creation-validation";

/* Mirrors collectStepErrors() in the component: zod issues -> { field: message } */
const errorsFor = (step: number, data: unknown): Record<string, string> => {
  const schema = STEP_SCHEMAS[step];
  expect(schema, `missing schema for step ${step}`).toBeTruthy();
  const result = schema!.safeParse(data);
  if (result.success) return {};
  const errors: Record<string, string> = {};
  for (const issue of result.error.issues) {
    const key = issue.path.join(".");
    if (key && !errors[key]) errors[key] = issue.message;
  }
  return errors;
};

/* A realistic "fresh form" payload (matches the component's initial state for
   the fields each schema validates). */
const emptyStep1 = {
  title: "",
  code: "",
  category: "",
  short_description: "",
  description: "",
  tier: "",
  delivery_mode: "PHYSICAL",
  duration_value: 0,
  thumbnail_file: null,
  thumbnail_url: "",
  prerequisite_required: false,
  prerequisite_type: "internal" as const,
  prerequisite_course_id: null,
  prerequisite_description: "",
};

const validStep1 = {
  ...emptyStep1,
  title: "Fire Safety Training",
  code: "GOK-FIRE-SAF-123",
  category: "Fire Safety",
  short_description: "Advanced firefighting techniques for offshore crews.",
  description:
    "Covers hazard identification, emergency shutdown procedures, portable extinguisher drills and practical assessment across six modules.",
  tier: "FOUNDATION",
  duration_value: 40,
  thumbnail_url: "https://cdn.example.com/fire-safety.jpg",
};

const namedModule = {
  name: "Fire Extinguisher Drill",
  description: "Selecting the right extinguisher, safe approach angles and discharge technique.",
  duration: 4,
  has_assessment: false,
  assessment_max_score: 100,
  assessment_pass_mark: 75,
};

describe("course creation step validation (zod schemas)", () => {
  it("step 1: flags every empty/short field with a message", () => {
    const errors = errorsFor(1, emptyStep1);
    expect(errors.title).toMatch(/at least 4 characters/);
    expect(errors.code).toMatch(/at least 3 characters/);
    expect(errors.category).toBeTruthy();
    expect(errors.short_description).toMatch(/at least 6 characters/);
    expect(errors.tier).toBeTruthy();
    expect(errors.duration_value).toBeTruthy();
    expect(errors.description).toMatch(/at least 50 characters/);
    expect(errors.thumbnail_file).toMatch(/background picture/i);
    // Always-set fields and gated prerequisites pass when off.
    expect(errors.delivery_mode).toBeUndefined();
    expect(errors.prerequisite_course_id).toBeUndefined();
    expect(errors.prerequisite_description).toBeUndefined();
  });

  it("step 1: passes with valid values", () => {
    expect(errorsFor(1, validStep1)).toEqual({});
  });

  it("step 1: requires the chosen prerequisite", () => {
    const internal = errorsFor(1, {
      ...validStep1,
      prerequisite_required: true,
      prerequisite_type: "internal",
      prerequisite_course_id: null,
    });
    expect(internal.prerequisite_course_id).toBeTruthy();

    const external = errorsFor(1, {
      ...validStep1,
      prerequisite_required: true,
      prerequisite_type: "external",
      prerequisite_description: "   ",
    });
    expect(external.prerequisite_description).toBeTruthy();

    const satisfied = errorsFor(1, {
      ...validStep1,
      prerequisite_required: true,
      prerequisite_type: "internal",
      prerequisite_course_id: 12,
    });
    expect(satisfied).toEqual({});
  });

  it("steps 2 & 6: require at least one named module", () => {
    expect(errorsFor(2, { modules: [] }).modules).toMatch(/at least one module/);
    expect(errorsFor(6, { modules: [] }).modules).toMatch(/at least one module/);

    const unnamed = errorsFor(2, { modules: [{ ...namedModule, name: "  " }] });
    expect(unnamed["modules.0.name"]).toBeTruthy();

    expect(errorsFor(2, { modules: [namedModule] })).toEqual({});
  });

  it("steps 2 & 6: validate assessment scores when the module has an assessment", () => {
    const bad = errorsFor(2, {
      modules: [{ ...namedModule, has_assessment: true, assessment_max_score: 0 }],
    });
    expect(bad["modules.0.assessment_max_score"]).toMatch(/greater than 0/);

    const good = errorsFor(2, {
      modules: [{ ...namedModule, has_assessment: true, assessment_max_score: 100, assessment_pass_mark: 75 }],
    });
    expect(good).toEqual({});
  });

  it("steps 2 & 6: validate module title, duration and description", () => {
    const shortTitle = errorsFor(2, { modules: [{ ...namedModule, name: "AB" }] });
    expect(shortTitle["modules.0.name"]).toMatch(/at least 3 characters/);

    const blankTitle = errorsFor(2, { modules: [{ ...namedModule, name: "   " }] });
    expect(blankTitle["modules.0.name"]).toBeTruthy();

    const noDuration = errorsFor(2, { modules: [{ ...namedModule, duration: 0 }] });
    expect(noDuration["modules.0.duration"]).toMatch(/between 1 and 10 hours/);

    const tooLong = errorsFor(2, { modules: [{ ...namedModule, duration: 11 }] });
    expect(tooLong["modules.0.duration"]).toMatch(/between 1 and 10 hours/);

    const shortDescription = errorsFor(2, { modules: [{ ...namedModule, description: "Too short." }] });
    expect(shortDescription["modules.0.description"]).toMatch(/at least 20 characters/);

    // The same rules gate the final submit (step 6).
    expect(errorsFor(6, { modules: [{ ...namedModule, duration: 0 }] })["modules.0.duration"]).toBeTruthy();

    expect(errorsFor(2, { modules: [namedModule] })).toEqual({});
    expect(errorsFor(6, { modules: [namedModule] })).toEqual({});
  });

  it("steps 2 & 6: pass mark must be between 1 and 100 when assessed", () => {
    const zero = errorsFor(2, {
      modules: [{ ...namedModule, has_assessment: true, assessment_pass_mark: 0 }],
    });
    expect(zero["modules.0.assessment_pass_mark"]).toMatch(/between 1 and 100/);

    const over = errorsFor(2, {
      modules: [{ ...namedModule, has_assessment: true, assessment_pass_mark: 150 }],
    });
    expect(over["modules.0.assessment_pass_mark"]).toMatch(/between 1 and 100/);

    // Not enforced when the module has no assessment.
    expect(errorsFor(2, { modules: [{ ...namedModule, has_assessment: false, assessment_pass_mark: 0 }] })).toEqual(
      {},
    );
  });

  it("collectModuleErrors isolates one module (Done-button check)", () => {
    const all = collectStepErrors(2, {
      modules: [{ ...namedModule, duration: 0 }, { ...namedModule }],
    });

    // Only the broken module's issues are reported for it…
    const first = collectModuleErrors(all, 0);
    expect(first["modules.0.duration"]).toMatch(/between 1 and 10 hours/);
    expect(Object.keys(first).some((k) => k.startsWith("modules.1."))).toBe(false);

    // …and the valid second module passes its Done check.
    expect(collectModuleErrors(all, 1)).toEqual({});
  });

  it("step 3: only validates the final assessment when the gate is ON", () => {
    expect(errorsFor(3, { has_final_assessment: false, final_assessment: null })).toEqual({});

    expect(errorsFor(3, { has_final_assessment: true, final_assessment: null }).final_assessment).toBeTruthy();

    const incomplete = errorsFor(3, {
      has_final_assessment: true,
      final_assessment: { name: "", max_score: 0 },
    });
    expect(incomplete["final_assessment.name"]).toBeTruthy();
    expect(incomplete["final_assessment.max_score"]).toBeTruthy();

    expect(
      errorsFor(3, {
        has_final_assessment: true,
        final_assessment: { name: "Capstone", max_score: 100 },
      }),
    ).toEqual({});
  });

  it("step 4: requires minimum contact hours", () => {
    expect(errorsFor(4, { minimum_contact_hours: 0 }).minimum_contact_hours).toBeTruthy();
    expect(errorsFor(4, { minimum_contact_hours: 36 })).toEqual({});
  });

  it("step 5: only requires authority + license for external issuance", () => {
    expect(
      errorsFor(5, { certificate_enabled: true, certificate_external: false, certificate_authority: "", certificate_license_id: "" }),
    ).toEqual({});

    const externalEmpty = errorsFor(5, {
      certificate_enabled: true,
      certificate_external: true,
      certificate_authority: "",
      certificate_license_id: "",
    });
    expect(externalEmpty.certificate_authority).toBeTruthy();
    expect(externalEmpty.certificate_license_id).toBeTruthy();

    expect(
      errorsFor(5, {
        certificate_enabled: true,
        certificate_external: true,
        certificate_authority: "NMDPRA",
        certificate_license_id: "NMDPRA/MISTDO/2024/001",
      }),
    ).toEqual({});
  });

  it("step 1: requires a detailed syllabus of at least 50 characters", () => {
    const short = errorsFor(1, { ...validStep1, description: "Too short." });
    expect(short.description).toMatch(/at least 50 characters/);

    const whitespaceOnly = errorsFor(1, { ...validStep1, description: "     " });
    expect(whitespaceOnly.description).toBeTruthy();

    const ok = errorsFor(1, {
      ...validStep1,
      description: "Six modules covering hazard identification, shutdown drills and assessment.",
    });
    expect(ok).toEqual({});
  });

  it("step 1: requires an image background picture of at most 5MB", () => {
    // Nothing uploaded at all.
    const missing = errorsFor(1, { ...validStep1, thumbnail_file: null, thumbnail_url: "" });
    expect(missing.thumbnail_file).toMatch(/background picture/i);

    // Non-image file (the input accepts image/* but validation is the backstop).
    const pdf = new File(["%PDF-1.4"], "syllabus.pdf", { type: "application/pdf" });
    expect(errorsFor(1, { ...validStep1, thumbnail_file: pdf }).thumbnail_file).toMatch(/image/i);

    // Oversized image (>5MB).
    const huge = new File([new Uint8Array(6 * 1024 * 1024)], "huge.png", { type: "image/png" });
    expect(errorsFor(1, { ...validStep1, thumbnail_file: huge }).thumbnail_file).toMatch(/5MB/);

    // Valid small image.
    const small = new File([new Uint8Array(2048)], "cover.png", { type: "image/png" });
    expect(errorsFor(1, { ...validStep1, thumbnail_file: small })).toEqual({});

    // An already-uploaded URL (no pending file) also satisfies the rule.
    expect(errorsFor(1, { ...validStep1, thumbnail_file: null })).toEqual({});
  });
});
