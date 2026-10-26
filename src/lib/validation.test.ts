import { describe, expect, it } from "vitest";
import { contentModuleSchema, registrationSchema, type RegistrationMessages } from "@/lib/validation";

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

  it("normalizes Bangla numerals in Scout ID and phone inputs before validation", () => {
    const parsed = schema.safeParse({
      ...validRegistration,
      scoutId: "BD-১২৩৪৫৬",
      phone: "+৮৮০ ১৭১২৩৪৫৬৭৮",
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.scoutId).toBe("BD-123456");
      expect(parsed.data.phone).toBe("+880 1712345678");
    }
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

describe("contentModuleSchema", () => {
  it("loads baseline version snapshots containing nullable legacy fields", () => {
    const parsed = contentModuleSchema.safeParse({
      slug: "sample-module",
      audience: "ROVER",
      titleBn: "নমুনা",
      titleEn: "Sample",
      descriptionBn: "বিবরণ",
      descriptionEn: "Description",
      videoId: "https://youtu.be/aqz-KE-bpKQ",
      passMark: null,
      published: true,
      steps: [
        {
          id: "question-1",
          type: "MCQ",
          promptBn: "প্রশ্ন",
          promptEn: "Question",
          options: [{ id: "a", bn: "ক", en: "A" }, { id: "b", bn: "খ", en: "B" }],
          correctOptionId: "a",
          correctOptionIds: null,
          explanationBn: "",
          explanationEn: "",
          points: 1,
          minWords: 30,
        },
        {
          id: "question-2",
          type: "REFLECTION",
          promptBn: "লিখুন",
          promptEn: "Write",
          options: null,
          correctOptionId: null,
          correctOptionIds: null,
          explanationBn: "",
          explanationEn: "",
          points: 1,
          minWords: 30,
        },
      ],
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.videoId).toBe("aqz-KE-bpKQ");
      expect(parsed.data.steps[1].options).toBeNull();
      expect(parsed.data.mustWatch).toBe(true);
    }
  });

  it("requires all selected options for a multi-select answer key", () => {
    const result = contentModuleSchema.safeParse({
      slug: "multi-select",
      audience: "LEADER",
      titleBn: "শিরোনাম",
      titleEn: "Title",
      descriptionBn: "বিবরণ",
      descriptionEn: "Description",
      videoId: "aqz-KE-bpKQ",
      steps: [{
        type: "MULTI_SELECT",
        promptBn: "প্রশ্ন",
        promptEn: "Question",
        options: [{ id: "a", bn: "ক", en: "A" }, { id: "b", bn: "খ", en: "B" }],
        correctOptionIds: ["a", "missing"],
      }],
    });
    expect(result.success).toBe(false);
  });
});
