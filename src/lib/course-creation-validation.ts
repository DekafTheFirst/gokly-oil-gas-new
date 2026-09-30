import { z } from "zod";

/* Per-step validation schemas for the course-creation wizard. Kept out of the
   route file so tests can exercise the real rules without rendering the form
   (and so Fast Refresh keeps working on the component file). */

/* ------------------------- field-level validation ------------------------- */

/* Field errors keyed by form field ("title", "modules.2.name", …) so a failed
   Next/submit can show a toast AND paint the exact inputs red. */
export type FieldErrors = Record<string, string>;

/* Minimum length for the "Detailed Syllabus & Operational Scope" field. */
const SYLLABUS_MIN_CHARS = 50;
/* Background picture cap — matches the UI hint "PNG, JPG up to 5MB". */
const MAX_THUMBNAIL_BYTES = 5 * 1024 * 1024;

/* Step 1 — identification, delivery & prerequisites. */
const step1Schema = z
  .object({
    title: z.string().trim().min(4, "Course name must be at least 4 characters."),
    code: z.string().trim().min(3, "Course code must be at least 3 characters."),
    category: z.string().trim().min(3, "Select a discipline / category."),
    short_description: z.string().trim().min(6, "Executive summary must be at least 6 characters."),
    description: z
      .string()
      .trim()
      .min(SYLLABUS_MIN_CHARS, `Detailed syllabus must be at least ${SYLLABUS_MIN_CHARS} characters.`),
    tier: z.string().min(1, "Select a course tier."),
    delivery_mode: z.string().min(1, "Select a delivery mode."),
    duration_value: z.number().min(1, "Course duration must be greater than 0."),
    thumbnail_file: z.any().nullable(),
    thumbnail_url: z.string(),
    prerequisite_required: z.boolean(),
    prerequisite_type: z.enum(["internal", "external"]),
    prerequisite_course_id: z.number().nullable(),
    prerequisite_description: z.string(),
  })
  .superRefine((v, ctx) => {
    if (v.prerequisite_required) {
      if (v.prerequisite_type === "internal" && v.prerequisite_course_id === null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["prerequisite_course_id"],
          message: "Select the course that must be completed first.",
        });
      }
      if (v.prerequisite_type === "external" && !v.prerequisite_description.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["prerequisite_description"],
          message: "Select the certification learners must hold.",
        });
      }
    }

    /* Course background picture: required, image-only, up to 5 MB. */
    const file = v.thumbnail_file as File | null | undefined;
    const hasPicture = Boolean(file) || Boolean(String(v.thumbnail_url || "").trim());
    if (!hasPicture) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["thumbnail_file"],
        message: "Upload a course background picture.",
      });
    } else if (file) {
      if (!String(file.type || "").startsWith("image/")) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["thumbnail_file"],
          message: "Background picture must be an image file (PNG or JPG).",
        });
      } else if (file.size > MAX_THUMBNAIL_BYTES) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["thumbnail_file"],
          message: "Background picture must be 5MB or smaller.",
        });
      }
    }
  });

/* Steps 2 & 6 — every module needs a meaningful title, duration and
   description; assessments must be scored sensibly. */
const MODULE_TITLE_MIN_CHARS = 3;
const MODULE_DESCRIPTION_MIN_CHARS = 20;
const MODULE_DURATION_MAX_HOURS = 10;

const modulesSchema = z.object({
  modules: z
    .array(
      z.object({
        name: z.preprocess(
          (v) => (v == null ? "" : String(v)),
          z
            .string()
            .trim()
            .min(MODULE_TITLE_MIN_CHARS, `Module title must be at least ${MODULE_TITLE_MIN_CHARS} characters.`),
        ),
        description: z.preprocess(
          (v) => (v == null ? "" : String(v)),
          z
            .string()
            .trim()
            .min(
              MODULE_DESCRIPTION_MIN_CHARS,
              `Module description must be at least ${MODULE_DESCRIPTION_MIN_CHARS} characters.`,
            ),
        ),
        duration: z.preprocess(
          (v) => {
            const n = typeof v === "number" ? v : Number(v);
            return Number.isFinite(n) ? n : 0;
          },
          z
            .number()
            .min(1, `Module duration must be between 1 and ${MODULE_DURATION_MAX_HOURS} hours.`)
            .max(MODULE_DURATION_MAX_HOURS, `Module duration must be between 1 and ${MODULE_DURATION_MAX_HOURS} hours.`),
        ),
        has_assessment: z.preprocess((v) => Boolean(v), z.boolean()),
        assessment_max_score: z.number().optional(),
        assessment_pass_mark: z.number().optional(),
      }),
    )
    .min(1, "Add at least one module before continuing.")
    .superRefine((mods, ctx) => {
      mods.forEach((m, i) => {
        if (!m.has_assessment) return;
        if ((m.assessment_max_score ?? 0) <= 0) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: [i, "assessment_max_score"],
            message: "Max score must be greater than 0.",
          });
        }
        const pass = m.assessment_pass_mark;
        if (pass == null || pass < 1 || pass > 100) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: [i, "assessment_pass_mark"],
            message: "Pass mark must be between 1 and 100.",
          });
        }
      });
    }),
});

/* Step 3 — final assessment only validated when the gate is ON. */
const step3Schema = z
  .object({
    has_final_assessment: z.boolean(),
    final_assessment: z.any().nullable(),
  })
  .superRefine((v, ctx) => {
    if (!v.has_final_assessment) return;
    const f = v.final_assessment as { name?: string; max_score?: number } | null | undefined;
    if (!f) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["final_assessment"],
        message: "Add the final assessment details.",
      });
      return;
    }
    if (!String(f.name ?? "").trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["final_assessment", "name"],
        message: "Give the final assessment a name.",
      });
    }
    if (!(Number(f.max_score) > 0)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["final_assessment", "max_score"],
        message: "Maximum score must be greater than 0.",
      });
    }
  });

/* Step 4 — completion requirements. */
const step4Schema = z.object({
  minimum_contact_hours: z.number().min(1, "Set the minimum contact hours to at least 1."),
});

/* Step 5 — external credential verification details. */
const step5Schema = z
  .object({
    certificate_enabled: z.boolean(),
    certificate_external: z.boolean(),
    certificate_authority: z.string(),
    certificate_license_id: z.string(),
  })
  .superRefine((v, ctx) => {
    if (!v.certificate_enabled || !v.certificate_external) return;
    if (!v.certificate_authority.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["certificate_authority"],
        message: "Select the external authority.",
      });
    }
    if (!v.certificate_license_id.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["certificate_license_id"],
        message: "Enter the authority license ID.",
      });
    }
  });

/* Exported for tests — mirrors the step gates the wizard enforces. */
export const STEP_SCHEMAS: Record<number, z.ZodTypeAny> = {
  1: step1Schema,
  2: modulesSchema,
  3: step3Schema,
  4: step4Schema,
  5: step5Schema,
  6: modulesSchema,
};

/* Field-level errors for a step: safeParse the step schema over the form data
   and map each issue to { "field.path": message } (issues without a path are
   skipped - every rule we define carries a field path). */
export const collectStepErrors = (step: number, data: unknown): FieldErrors => {
  const schema = STEP_SCHEMAS[step];
  if (!schema) return {};
  const result = schema.safeParse(data);
  if (result.success) return {};
  const errors: FieldErrors = {};
  for (const issue of result.error.issues) {
    const key = issue.path.join(".");
    if (key && !errors[key]) errors[key] = issue.message;
  }
  return errors;
};

/* Errors belonging to a single module card ("modules.<index>.*"). Used when a
   module's Done button is clicked so only that module is validated. */
export const collectModuleErrors = (errors: FieldErrors, index: number): FieldErrors => {
  const prefix = `modules.${index}.`;
  const mine: FieldErrors = {};
  Object.entries(errors).forEach(([key, message]) => {
    if (key.startsWith(prefix)) mine[key] = message;
  });
  return mine;
};
