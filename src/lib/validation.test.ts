import { describe, expect, it } from "vitest";
import { registrationSchema, type RegistrationMessages } from "@/lib/validation";

const messages: RegistrationMessages = {
  fullNameBn: "Bangla name required",
  nameEn: "English name required",
  nameEnLatin: "English name must use Latin characters",
  scoutId: "Scout ID invalid",
  unit: "Unit required",
  district: "District required",
  memberType: "Member type required",
  phone: "Phone invalid",
  email: "Email invalid",
  contact: "Phone or email required",
  consent: "Privacy consent required",
  guardian: "Guardian consent required",
};

const validRegistration = {
  fullNameBn: "রাহাত",
  nameEn: "Rahat Ahmed",
  scoutId: "BD-123456",
  unit: "Dhaka Troop",
  district: "Dhaka",
  memberType: "ROVER",
  phone: "+8801712345678",
  isMinor: false,
  guardianConsent: false,
  consent: true,
};

describe("registrationSchema", () => {
  const schema = registrationSchema(messages);

  it("accepts an adult registration with a valid contact and privacy consent", () => {
    expect(schema.safeParse(validRegistration).success).toBe(true);
  });

  it("requires guardian consent for a participant under 18", () => {
    const result = schema.safeParse({ ...validRegistration, isMinor: true });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues).toContainEqual(
        expect.objectContaining({ path: ["guardianConsent"], message: messages.guardian })
      );
    }
  });

  it("accepts a minor when guardian consent is recorded", () => {
    expect(
      schema.safeParse({
        ...validRegistration,
        isMinor: true,
        guardianConsent: true,
      }).success
    ).toBe(true);
  });

  it("requires at least one contact method and privacy consent", () => {
    const result = schema.safeParse({
      ...validRegistration,
      phone: undefined,
      email: undefined,
      consent: false,
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.map((issue) => issue.path[0])).toEqual(
        expect.arrayContaining(["phone", "consent"])
      );
    }
  });
});
