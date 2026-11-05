import { describe, expect, it } from "vitest";
import { addDays, format, subYears } from "date-fns";
import { traineeCreationSchema, type TraineeCreationFormValues } from "@/lib/trainee-creation-validation";

const validTrainee: TraineeCreationFormValues = {
  first_name: "Tari",
  middle_name: "",
  last_name: "Briggs",
  email: "tari@example.com",
  password: "password123",
  phone: "+234 803 234 5678",
  address: "",
  city: "",
  country: "Nigeria",
  state: "",
  gender: "",
  date_of_birth: "",
  nationality: "",
  nin: "",
  nogic_candidate_number: "",
  ogisp_passport_id: "",
  emergency_contact: "",
  occupation: "",
  other_occupation: "",
  corporate_staff_id: "",
  organization_id: "__self_funded__",
};

describe("trainee creation validation", () => {
  it("accepts a valid trainee registration", () => {
    expect(traineeCreationSchema.safeParse(validTrainee).success).toBe(true);
  });

  it("requires valid names, email, phone, and password", () => {
    const result = traineeCreationSchema.safeParse({
      ...validTrainee,
      first_name: " ",
      email: "not-an-email",
      phone: "123",
      password: "short",
    });

    expect(result.success).toBe(false);
    if (result.success) return;
    const errors = Object.fromEntries(result.error.issues.map((issue) => [issue.path.join("."), issue.message]));
    expect(errors.first_name).toMatch(/first name/);
    expect(errors.email).toMatch(/valid email/);
    expect(errors.phone).toMatch(/valid phone/);
    expect(errors.password).toMatch(/8 characters/);
  });

  it("requires an 11-digit NIN when provided", () => {
    expect(traineeCreationSchema.safeParse({ ...validTrainee, nin: "1234567890" }).success).toBe(false);
  });

  it("rejects dates of birth for trainees under 16", () => {
    const recentDate = format(addDays(subYears(new Date(), 16), 1), "yyyy-MM-dd");
    const result = traineeCreationSchema.safeParse({ ...validTrainee, date_of_birth: recentDate });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((issue) => issue.path[0] === "date_of_birth")).toBe(true);
    }
  });

  it("allows a trainee who has turned 16", () => {
    const eligibleDate = format(subYears(new Date(), 16), "yyyy-MM-dd");
    expect(traineeCreationSchema.safeParse({ ...validTrainee, date_of_birth: eligibleDate }).success).toBe(true);
  });

  it("requires a custom job title when Other is selected", () => {
    expect(traineeCreationSchema.safeParse({
      ...validTrainee,
      occupation: "Other",
    }).success).toBe(false);
    expect(traineeCreationSchema.safeParse({
      ...validTrainee,
      occupation: "Other",
      other_occupation: "Senior Well Intervention Specialist",
    }).success).toBe(true);
  });
});
