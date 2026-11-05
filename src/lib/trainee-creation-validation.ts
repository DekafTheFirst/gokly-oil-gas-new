import { isValid, parseISO, startOfDay, subYears } from "date-fns";
import { z } from "zod";

export const OTHER_JOB_TITLE = "Other";
export const TRAINEE_JOB_TITLES = [
  "Engineer",
  "Technician",
  "Drilling Engineer",
  "Well Intervention Specialist",
  "Mechanical Engineer",
  "Electrical Engineer",
  "Instrumentation and Control Engineer",
  "Process Engineer",
  "HSE Officer",
  "Operations Supervisor",
  "Maintenance Technician",
  "Project Manager",
  OTHER_JOB_TITLE,
] as const;

export const traineeCreationSchema = z
  .object({
    first_name: z.string().trim().min(1, "Enter the trainee's first name."),
    middle_name: z.string(),
    last_name: z.string().trim().min(1, "Enter the trainee's last name."),
    email: z.string().trim().email("Enter a valid email address."),
    password: z.string().min(8, "Password must be at least 8 characters."),
    phone: z
      .string()
      .trim()
      .min(1, "Enter a mobile or WhatsApp number.")
      .refine((value) => value.replace(/\D/g, "").length >= 7, "Enter a valid phone number."),
    address: z.string(),
    city: z.string(),
    country: z.string(),
    state: z.string(),
    gender: z.enum(["", "Male", "Female", "Other"]),
    date_of_birth: z.string(),
    nationality: z.string(),
    nin: z.string().trim().refine((value) => !value || /^\d{11}$/.test(value), "NIN must contain exactly 11 digits."),
    nogic_candidate_number: z.string(),
    ogisp_passport_id: z.string(),
    emergency_contact: z.string(),
    occupation: z.enum(["", ...TRAINEE_JOB_TITLES]),
    other_occupation: z.string(),
    corporate_staff_id: z.string(),
    organization_id: z.string(),
  })
  .superRefine((values, ctx) => {
    if (values.occupation === OTHER_JOB_TITLE && !values.other_occupation.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["other_occupation"],
        message: "Enter the trainee's job title.",
      });
    }

    if (!values.date_of_birth) return;

    const dateOfBirth = parseISO(values.date_of_birth);
    if (!isValid(dateOfBirth)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["date_of_birth"],
        message: "Enter a valid date of birth.",
      });
      return;
    }

    if (dateOfBirth > startOfDay(subYears(new Date(), 16))) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["date_of_birth"],
        message: "Trainees must be at least 16 years old.",
      });
    }
  });

export type TraineeCreationFormValues = z.infer<typeof traineeCreationSchema>;
