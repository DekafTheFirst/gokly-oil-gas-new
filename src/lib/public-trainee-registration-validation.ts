import { isValid, parseISO, startOfDay, subYears } from "date-fns";
import { z } from "zod";

export const publicTraineeRegistrationSchema = z
  .object({
    email: z.string().trim().email("Enter a valid email address."),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters.")
      .regex(/[a-z]/i, "Add at least one letter.")
      .regex(/\d/, "Add at least one number.")
      .regex(/[^A-Za-z0-9]/, "Add at least one special character."),
    confirm_password: z.string().min(1, "Confirm your password."),
    first_name: z.string().trim().min(2, "First name must be at least 2 characters."),
    last_name: z.string().trim().min(2, "Last name must be at least 2 characters."),
    middle_name: z.string(),
    gender: z.enum(["", "Male", "Female", "Prefer not to say"]).refine(Boolean, "Select a gender option."),
    date_of_birth: z.string().min(1, "Enter your date of birth."),
    nationality: z.string().min(1, "Select your nationality."),
    phone: z.string().trim().refine(
      (value) => /^[\d\s-]+$/.test(value) && value.replace(/\D/g, "").length === 10,
      "Enter the 10-digit number after +234.",
    ),
    alternate_phone: z.string().trim(),
    address: z.string().trim().min(5, "Enter your residential address."),
    city: z.string().trim().min(2, "Enter your city."),
    country: z.string().min(1, "Select your country."),
    state: z.string().min(1, "Select your state or province."),
    nin_or_passport: z
      .string()
      .trim()
      .min(1, "Enter your NIN or passport number.")
      .refine((value) => /^\d{11}$/.test(value) || /^[A-Za-z0-9][A-Za-z0-9/-]{3,29}$/.test(value), "Enter an 11-digit NIN or a valid passport number."),
    nogic_candidate_number: z.string(),
    ogisp_passport_id: z.string(),
    emergency_contact_name: z.string().trim().min(2, "Enter your emergency contact's name."),
    emergency_contact_phone: z.string().trim().refine(
      (value) => value.replace(/\D/g, "").length >= 7,
      "Enter a valid emergency contact phone number.",
    ),
    terms_accepted: z.boolean().refine(Boolean, "You must accept the terms to register."),
    statutory_verification_consent: z.boolean().refine(
      Boolean,
      "Consent is required to verify the statutory details you provide.",
    ),
  })
  .superRefine((values, ctx) => {
    if (values.password !== values.confirm_password) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["confirm_password"],
        message: "Passwords do not match.",
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

export type PublicTraineeRegistrationValues = z.infer<typeof publicTraineeRegistrationSchema>;
