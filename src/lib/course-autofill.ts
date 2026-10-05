/**
 * One-click demo data for the course-creation wizard.
 *
 * The wizard has six steps and ~40 fields, which makes it slow to drive
 * repeatedly while testing the submission flow. `buildSampleCourse()` returns a
 * complete, *valid* set of field values (unit-tested against the real per-step
 * zod schemas) and `createDemoThumbnailFile()` fabricates a real PNG so the
 * autofilled form also exercises the upload phase exactly like a human run.
 *
 * Everything here is pure/deterministic apart from the canvas helper, so the
 * sample data can be asserted on without rendering the form.
 */

import type { CourseModule } from "./courses";

/* Console/dev hook so the fill can be triggered from DevTools too. */
declare global {
  interface Window {
    __goklyFillCourse?: () => Promise<void>;
  }
}

/* Used when the browser can't rasterise a canvas (SSR, jsdom, hardened CI):
   the picture check accepts a URL, and this file ships with the app. It is
   resolved to an absolute URL because `buildCoursePayload` forwards whatever is
   in `thumbnail_url` to the backend, and a relative path would 404 everywhere
   except the page it was written on. */
export const DEMO_THUMBNAIL_FALLBACK_PATH = "/placeholder.svg";

export function demoThumbnailFallbackUrl(): string {
  const origin = typeof window !== "undefined" ? window.location?.origin : "";
  return origin ? `${origin}${DEMO_THUMBNAIL_FALLBACK_PATH}` : DEMO_THUMBNAIL_FALLBACK_PATH;
}

const TITLE_PREFIX = "Demo";
const TITLE_SUBJECTS = [
  "Offshore Helicopter Underwater Escape (HUET)",
  "Confined Space Entry & Rescue",
  "Advanced Process Safety Management",
  "Rigging, Lifting & Crane Operations",
  "Emergency Response & Incident Command",
];

/* >= MODULE_DESCRIPTION_MIN_CHARS (20) everywhere, <= 10h per module, and the
   mix deliberately includes a module with no assessment plus an unscheduled
   session (scheduled_date "") to keep exercising the payload normalisation. */
function sampleModules(): CourseModule[] {
  return [
    {
      name: "Hazard Identification & Permit to Work",
      description:
        "Recognising hazards, isolating energy sources and completing a permit-to-work before entry.",
      scheduled_date: "",
      sort_order: 0,
      duration: 4,
      has_assessment: true,
      delivery_type: "both",
      assessment_type: "mcq",
      assessment_max_score: 100,
      assessment_pass_mark: 75,
      assessment_attempts_allowed: 3,
      assessment_required: true,
      assessment_description: "Auto-graded check of hazard recognition and isolation rules.",
      materials: [],
    },
    {
      name: "Practical Entry & Retrieval Drill",
      description:
        "Hands-on rig-up, tripod and winch retrieval drill run under supervision in the training yard.",
      scheduled_date: "",
      sort_order: 1,
      duration: 6,
      has_assessment: false,
      delivery_type: "practical",
      assessment_type: "practical",
      assessment_max_score: 100,
      assessment_pass_mark: 75,
      assessment_attempts_allowed: 1,
      assessment_required: false,
      assessment_description: "",
      materials: [],
    },
    {
      name: "Case Study Review & Competency Sign-off",
      description:
        "Structured debrief of a real incident, followed by trainer sign-off against the competency grid.",
      scheduled_date: "",
      sort_order: 2,
      duration: 8,
      has_assessment: true,
      delivery_type: "theory",
      assessment_type: "trainer",
      assessment_max_score: 50,
      assessment_pass_mark: 70,
      assessment_attempts_allowed: 2,
      assessment_required: true,
      assessment_description: "Trainer evaluates the learner against the competency grid.",
      materials: [],
    },
  ];
}

export type SampleCourse = {
  title: string;
  code: string;
  category: string;
  short_description: string;
  description: string;
  tier: string;
  duration_value: number;
  duration_unit: string;
  delivery_mode: string;
  status: string;
  min_class_size: number;
  max_class_size: number;
  minimum_contact_hours: number;
  /* Step 1 / step 5 gates have no zod defaults, so a sample is only valid if it
     states them explicitly (the wizard's own defaults live in the route). */
  prerequisite_required: boolean;
  prerequisite_type: "internal" | "external";
  prerequisite_course_id: number | null;
  prerequisite_description: string;
  certificate_enabled: boolean;
  certificate_external: boolean;
  certificate_authority: string;
  certificate_license_id: string;
  certificate_id_prefix: string;
  thumbnail_url: string;
  price: number;
  currency: string;
  modules: CourseModule[];
  expandedModules: number[];
  has_final_assessment: boolean;
  final_assessment: {
    id: string;
    name: string;
    type: string;
    module_association: string;
    description: string;
    max_score: number;
    pass_mark: number;
    attempts_allowed: number;
    required: boolean;
  };
};

/**
 * Build a full, schema-valid course. `attempt` (1-based) varies the title and
 * makes the code unique, so the button can be clicked - and the course created -
 * many times in a row without colliding.
 */
export function buildSampleCourse(attempt = 1, stamp = Date.now()): SampleCourse {
  const subject = TITLE_SUBJECTS[(attempt - 1) % TITLE_SUBJECTS.length];
  const tag = `${stamp.toString(36).slice(-4)}${attempt}`.toUpperCase();

  return {
    title: `${TITLE_PREFIX} ${subject}`,
    code: `DEMO-${tag}`,
    category: "HSF & Safety",
    short_description: "Auto-filled demo course used for testing the creation flow.",
    description:
      "Auto-filled end to end to exercise module, assessment and certificate persistence. " +
      "Replace any field before creating a real catalogue entry.",
    tier: "INTERMEDIATE",
    duration_value: 40,
    duration_unit: "HOURS",
    delivery_mode: "PHYSICAL",
    status: "DRAFT",
    min_class_size: 5,
    max_class_size: 30,
    minimum_contact_hours: 36,
    prerequisite_required: false,
    prerequisite_type: "internal",
    prerequisite_course_id: null,
    prerequisite_description: "",
    certificate_enabled: true,
    certificate_external: false,
    certificate_authority: "",
    certificate_license_id: "",
    certificate_id_prefix: "DEMO",
    thumbnail_url: demoThumbnailFallbackUrl(),
    price: 150000,
    currency: "NGN",
    modules: sampleModules(),
    expandedModules: [0],
    has_final_assessment: true,
    final_assessment: {
      id: `final-${tag}`,
      name: "Final Competency Assessment",
      type: "mcq",
      /* The route's handlers rewrite the final assessment with module_association
         "whole", so the sample uses the same marker (see toggleFinalAssessment). */
      module_association: "whole",
      description: "Capstone exam covering every module in this demo course.",
      max_score: 100,
      pass_mark: 75,
      attempts_allowed: 2,
      required: true,
    },
  };
}

/**
 * Fabricate a 1280x720 PNG so an autofilled run uploads a genuine image (phase 1
 * of handleSubmit) instead of skipping the picture. Returns null when a
 * canvas/File cannot be produced - the caller then keeps `thumbnail_url`.
 */
export async function createDemoThumbnailFile(
  label = "Gokly demo course",
): Promise<File | null> {
  try {
    if (typeof document === "undefined" || typeof File !== "function") return null;
    const canvas = document.createElement("canvas");
    canvas.width = 1280;
    canvas.height = 720;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    const gradient = ctx.createLinearGradient(0, 0, 1280, 720);
    gradient.addColorStop(0, "#0f172a");
    gradient.addColorStop(1, "#1d4ed8");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "rgba(255,255,255,0.14)";
    for (let x = -720; x < 1280; x += 90) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x + 240, 0);
      ctx.lineTo(x + 240 - 720, 720);
      ctx.lineTo(x - 720, 720);
      ctx.closePath();
      ctx.fill();
    }

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 72px system-ui, sans-serif";
    ctx.fillText("DEMO COURSE", 90, 360);
    ctx.font = "36px system-ui, sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.85)";
    ctx.fillText(label.slice(0, 48), 92, 420);

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob((result) => resolve(result), "image/png");
    });
    if (!blob) return null;
    return new File([blob], "demo-course.png", { type: "image/png", lastModified: Date.now() });
  } catch {
    return null;
  }
}


