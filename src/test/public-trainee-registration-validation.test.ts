import { addDays, format, subYears } from "date-fns";
import { describe, expect, it } from "vitest";
import { publicTraineeRegistrationSchema, type PublicTraineeRegistrationValues } from "@/lib/public-trainee-registration-validation";

const validRegistration: PublicTraineeRegistrationValues = {
  email: "delegate@example.com",
  password: "Password123!",
  confirm_password: "Password123!",
  first_name: "Amina",
  last_name: "Okoro",
  middle_name: "",
  gender: "Female",
  date_of_birth: format(subYears(new Date(), 25), "yyyy-MM-dd"),
  nationality: "Nigerian",
  phone: "8031234567",
  alternate_phone: "",
  address: "12 Example Street",
  city: "Port Harcourt",
  country: "NG",
  state: "RI",
  nin_or_passport: "12345678901",
  nogic_candidate_number: "",
  ogisp_passport_id: "",
  emergency_contact_name: "Mary Okoro",
  emergency_contact_phone: "+234 802 123 4567",
  terms_accepted: true,
  statutory_verification_consent: true,
};

describe("public trainee registration validation", () => {
  it("accepts a complete registration", () => {
    expect(publicTraineeRegistrationSchema.safeParse(validRegistration).success).toBe(true);
  });

  it("rejects mismatched passwords and missing consents", () => {
    expect(publicTraineeRegistrationSchema.safeParse({
      ...validRegistration,
      confirm_password: "different",
      terms_accepted: false,
      statutory_verification_consent: false,
    }).success).toBe(false);
  });

  it("accepts passport identifiers and rejects underage trainees", () => {
    const tooYoung = format(addDays(subYears(new Date(), 16), 1), "yyyy-MM-dd");
    const result = publicTraineeRegistrationSchema.safeParse({
      ...validRegistration,
      nin_or_passport: "AB123456",
      date_of_birth: tooYoung,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((issue) => issue.path[0] === "date_of_birth")).toBe(true);
    }
  });
});
