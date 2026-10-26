import { z } from "zod";
import { normalizeYouTubeVideoId } from "@/lib/content";
import { normalizeDigits } from "@/lib/ids";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const phonePattern = /^\+?[\d\s()-]{6,20}$/;
const nameEnPattern = /^[A-Za-z][A-Za-z .'-]{1,79}$/;

export type RegistrationMessages = {
  fullNameBn: string;
  nameEn: string;
  nameEnLatin: string;
  scoutId: string;
  unit: string;
  district: string;
  memberType: string;
  phone: string;
  email: string;
  contact: string;
  consent: string;
  guardian: string;
};

export function registrationSchema(m: RegistrationMessages) {
  return z
    .object({
      fullNameBn: z.string().trim().min(2, m.fullNameBn).max(120),
      nameEn: z
        .string()
        .trim()
        .min(2, m.nameEn)
        .max(80)
        .regex(nameEnPattern, m.nameEnLatin),
      scoutId: z
        .string()
        .transform((value) => normalizeDigits(value).trim().toUpperCase())
        .pipe(z.string().regex(/^[A-Z0-9-]{4,30}$/, m.scoutId)),
      unit: z.string().trim().min(2, m.unit).max(120),
      district: z.string().trim().min(2, m.district).max(120),
      memberType: z.enum(["ROVER", "LEADER"], {
        error: m.memberType,
      }),
      phone: z.string().transform((value) => normalizeDigits(value).trim()).pipe(z.string().regex(phonePattern, m.phone)).optional(),
      email: z.string().trim().regex(emailPattern, m.email).optional(),
      isMinor: z.boolean().default(false),
      guardianConsent: z.boolean().default(false),
      consent: z.boolean(),
    })
    .superRefine((data, ctx) => {
      if (!data.phone && !data.email) {
        ctx.addIssue({ code: "custom", path: ["phone"], message: m.contact });
      }
      if (!data.consent) {
        ctx.addIssue({ code: "custom", path: ["consent"], message: m.consent });
      }
      if (data.isMinor && !data.guardianConsent) {
        ctx.addIssue({
          code: "custom",
          path: ["guardianConsent"],
          message: m.guardian,
        });
      }
    });
}

export type ResumeMessages = {
  needIdentifier: string;
  notFound: string;
};

export function resumeWithCodeSchema(m: ResumeMessages) {
  return z.object({
    code: z.string().trim().min(4, m.needIdentifier).max(40),
  });
}

export function resumeWithIdSchema(m: ResumeMessages) {
  return z.object({
    scoutId: z.string().transform((value) => normalizeDigits(value).trim()).pipe(z.string().min(1, m.needIdentifier).max(30)),
    contact: z.string().transform((value) => normalizeDigits(value).trim()).pipe(z.string().min(3, m.needIdentifier).max(120)),
  });
}

// ---- Admin content JSON -----------------------------------------------------

export const contentOptionSchema = z.object({
  id: z.string().trim().min(1).max(40),
  bn: z.string().trim().max(500),
  en: z.string().trim().max(500),
});

export const contentStepSchema = z
  .object({
    id: z.string().trim().min(1).max(60).optional(),
    type: z.enum(["MCQ", "MULTI_SELECT", "SCENARIO", "REFLECTION", "PARAGRAPH"]),
    promptBn: z.string().trim().max(2000),
    promptEn: z.string().trim().max(2000),
    options: z.array(contentOptionSchema).max(8).nullish(),
    correctOptionId: z.string().trim().max(40).nullish(),
    correctOptionIds: z.array(z.string().trim().min(1).max(40)).max(8).nullish(),
    minWords: z.coerce.number().int().min(1).max(1000).default(30),
    explanationBn: z.string().max(4000).default(""),
    explanationEn: z.string().max(4000).default(""),
    points: z.coerce.number().int().min(1).max(100).default(1),
  })
  .superRefine((step, ctx) => {
    if (step.type === "MCQ" || step.type === "SCENARIO" || step.type === "MULTI_SELECT") {
      if (!step.options || step.options.length < 2) {
        ctx.addIssue({
          code: "custom",
          path: ["options"],
          message: "MCQ steps need at least two options.",
        });
        return;
      }
      const ids = new Set(step.options.map((o) => o.id));
      const multiple = step.type === "MULTI_SELECT";
      const answers = multiple
        ? step.correctOptionIds ?? []
        : step.correctOptionId ? [step.correctOptionId] : [];
      if (answers.length === 0 || answers.some((answer) => !ids.has(answer))) {
        ctx.addIssue({
          code: "custom",
          path: [multiple ? "correctOptionIds" : "correctOptionId"],
          message: "Correct answer ids must match the option ids.",
        });
      }
      if (multiple && new Set(answers).size !== answers.length) {
        ctx.addIssue({ code: "custom", path: ["correctOptionIds"], message: "Correct answer ids must be unique." });
      }
      if (ids.size !== step.options.length) {
        ctx.addIssue({
          code: "custom",
          path: ["options"],
          message: "Option ids must be unique within a step.",
        });
      }
    }
  });

export const contentModuleSchema = z.object({
  slug: z
    .string()
    .trim()
    .min(2)
    .max(80)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers and hyphens."),
  audience: z.enum(["ROVER", "LEADER"]),
  titleBn: z.string().trim().max(200),
  titleEn: z.string().trim().max(200),
  descriptionBn: z.string().trim().max(4000),
  descriptionEn: z.string().trim().max(4000),
  writtenBn: z.string().max(20_000).default(""),
  writtenEn: z.string().max(20_000).default(""),
  videoId: z.string().trim().min(1).max(2048).transform((value, ctx) => {
    const videoId = normalizeYouTubeVideoId(value);
    if (!videoId) {
      ctx.addIssue({ code: "custom", message: "Use a valid YouTube video URL or video ID." });
      return z.NEVER;
    }
    return videoId;
  }),
  mustWatch: z.boolean().default(true),
  attemptsAllowed: z.coerce.number().int().min(1).max(20).default(1),
  paragraphApprovalRequired: z.boolean().default(false),
  passMark: z.coerce.number().int().min(0).max(100).nullable().optional(),
  published: z.boolean().default(false),
  steps: z.array(contentStepSchema).min(1).max(50),
});

export type ContentModuleInput = z.infer<typeof contentModuleSchema>;
