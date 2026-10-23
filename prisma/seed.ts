import "dotenv/config";
import { PrismaClient, type StepType } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const SAMPLE_MARKER =
  "SAMPLE — replace with official Bangladesh Scouts Safe from Harm content.";

type SeedStep = {
  id: string;
  type: StepType;
  promptBn: string;
  promptEn: string;
  options?: Array<{ id: string; bn: string; en: string }>;
  correctOptionId?: string;
  minWords?: number;
};

type SeedModule = {
  slug: string;
  order: number;
  titleBn: string;
  titleEn: string;
  descriptionBn: string;
  descriptionEn: string;
  videoId: string;
  steps: SeedStep[];
};

/**
 * SAMPLE course content only. These modules are placeholders and must be
 * replaced with approved Bangladesh Scouts Safe from Harm material. Nothing
 * in this file is official policy text.
 */
const sampleModules: SeedModule[] = [
  {
    slug: "understanding-harm",
    order: 0,
    titleBn: "নমুনা মডিউল ১: ক্ষতি চেনা",
    titleEn: "Sample module 1: Recognising harm",
    descriptionBn: `${SAMPLE_MARKER} এই মডিউলে সেফগার্ডিংয়ের মৌলিক ধারণা অনুশীলন করা হয়।`,
    descriptionEn: `${SAMPLE_MARKER} Practise the basic ideas behind safeguarding in this sample module.`,
    videoId: "aqz-KE-bpKQ",
    steps: [
      {
        id: "sample-sfh-m1-s1",
        type: "MCQ",
        promptBn:
          "নমুনা প্রশ্ন — কোনো অংশগ্রহণকারীর নিরাপত্তা নিয়ে উদ্বেগ থাকলে প্রথমে কোন আচরণটি সবচেয়ে উপযুক্ত?",
        promptEn:
          "Sample question — if you are worried about a participant's safety, which response is most appropriate first?",
        options: [
          {
            id: "a",
            bn: "উদ্বেগটি গুরুত্বের সাথে নিয়ে নিরাপদ ও উপযুক্ত সহায়তা চাওয়া",
            en: "Take the concern seriously and seek safe, appropriate help",
          },
          {
            id: "b",
            bn: "বিষয়টি উপেক্ষা করা কারণ এটি আমার দায়িত্ব নয়",
            en: "Ignore it because it is not my responsibility",
          },
          {
            id: "c",
            bn: "বিস্তারিত তথ্য সবার সাথে আলোচনা করা",
            en: "Discuss the details with everyone",
          },
        ],
        correctOptionId: "a",
      },
      {
        id: "sample-sfh-m1-s2",
        type: "REFLECTION",
        promptBn:
          "নমুনা প্রতিফলন — মূটে অন্য একজন অংশগ্রহণকারীকে নিরাপদ বোধ করতে সাহায্য করার একটি উপায় নিজের ভাষায় লিখুন।",
        promptEn:
          "Sample reflection — in your own words, describe one way you could help another participant feel safe at the Moot.",
        minWords: 30,
      },
    ],
  },
  {
    slug: "responding-safely",
    order: 1,
    titleBn: "নমুনা মডিউল ২: নিরাপদে সাড়া দেওয়া",
    titleEn: "Sample module 2: Responding safely",
    descriptionBn: `${SAMPLE_MARKER} নিরাপদ সীমা রেখে কীভাবে সাড়া দেওয়া যায় তা অনুশীলন করুন।`,
    descriptionEn: `${SAMPLE_MARKER} Practise how to respond while keeping safe boundaries.`,
    videoId: "aqz-KE-bpKQ",
    steps: [
      {
        id: "sample-sfh-m2-s1",
        type: "MCQ",
        promptBn:
          "নমুনা প্রশ্ন — কেউ তাৎক্ষণিক বিপদে আছে বলে মনে হলে কী করা উচিত?",
        promptEn:
          "Sample question — what should you do if someone may be in immediate danger?",
        options: [
          {
            id: "a",
            bn: "স্থানীয় জরুরি সেবা ও নিরাপত্তা ফোকাল পয়েন্টের সাথে যোগাযোগ করা",
            en: "Contact local emergency services and the safeguarding focal point",
          },
          {
            id: "b",
            bn: "পরে দেখার জন্য অপেক্ষা করা",
            en: "Wait and deal with it later",
          },
          {
            id: "c",
            bn: "নিজে একা পরিস্থিতি সমাধান করার চেষ্টা করা",
            en: "Try to resolve the situation alone",
          },
        ],
        correctOptionId: "a",
      },
      {
        id: "sample-sfh-m2-s2",
        type: "MCQ",
        promptBn:
          "নমুনা প্রশ্ন — রিপোর্ট করার সময় কোন তথ্যটি সবচেয়ে গুরুত্বপূর্ণ?",
        promptEn:
          "Sample question — which detail matters most when raising a concern?",
        options: [
          {
            id: "a",
            bn: "যতটা নিরাপদভাবে সম্ভব সঠিক ও প্রয়োজনীয় তথ্য",
            en: "Accurate, necessary details, shared as safely as possible",
          },
          {
            id: "b",
            bn: "অনুমানভিত্তিক গুজব",
            en: "Speculation and gossip",
          },
          {
            id: "c",
            bn: "অতিরিক্ত ব্যক্তিগত তথ্য যা প্রয়োজন নেই",
            en: "Extra personal details that are not needed",
          },
        ],
        correctOptionId: "a",
      },
      {
        id: "sample-sfh-m2-s3",
        type: "REFLECTION",
        promptBn:
          "নমুনা প্রতিফলন — আপনার নিজের নিরাপত্তা ও সীমা রক্ষা করে সহায়তা করার একটি উপায় লিখুন।",
        promptEn:
          "Sample reflection — describe one way to help while protecting your own safety and boundaries.",
        minWords: 30,
      },
    ],
  },
  {
    slug: "reporting-concerns",
    order: 2,
    titleBn: "নমুনা মডিউল ৩: উদ্বেগ জানানো",
    titleEn: "Sample module 3: Reporting concerns",
    descriptionBn: `${SAMPLE_MARKER} উদ্বেগ জানানোর ধাপগুলো অনুশীলন করুন।`,
    descriptionEn: `${SAMPLE_MARKER} Practise the steps for raising a concern.`,
    videoId: "aqz-KE-bpKQ",
    steps: [
      {
        id: "sample-sfh-m3-s1",
        type: "MCQ",
        promptBn:
          "নমুনা প্রশ্ন — সেফগার্ডিং উদ্বেগ জানানোর জন্য সবচেয়ে ভালো পথ কোনটি?",
        promptEn:
          "Sample question — what is the best route for raising a safeguarding concern?",
        options: [
          {
            id: "a",
            bn: "নির্ধারিত নিরাপত্তা ফোকাল পয়েন্টের কাছে গোপনীয়ভাবে জানানো",
            en: "Report confidentially to the designated safeguarding focal point",
          },
          {
            id: "b",
            bn: "সোশ্যাল মিডিয়ায় বিস্তারিত পোস্ট করা",
            en: "Post the details on social media",
          },
          {
            id: "c",
            bn: "কোনো কিছু না বলা",
            en: "Say nothing",
          },
        ],
        correctOptionId: "a",
      },
      {
        id: "sample-sfh-m3-s2",
        type: "REFLECTION",
        promptBn:
          "নমুনা প্রতিফলন — একটি উদ্বেগ জানানোর সময় কী কী তথ্য দেওয়া প্রয়োজন বলে আপনি মনে করেন?",
        promptEn:
          "Sample reflection — what information do you think is needed when raising a concern?",
        minWords: 30,
      },
    ],
  },
];

async function seedAdmin() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    console.warn(
      "ADMIN_EMAIL / ADMIN_PASSWORD are not set — skipping superadmin seed."
    );
    return;
  }
  if (password.length < 8) {
    console.warn("ADMIN_PASSWORD is shorter than 8 characters.");
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.adminUser.upsert({
    where: { email },
    create: {
      email,
      name: "Superadmin",
      passwordHash,
      role: "SUPERADMIN",
    },
    update: {
      passwordHash,
      role: "SUPERADMIN",
    },
  });
  console.log(`Seeded superadmin ${email}.`);
}

async function seedModules() {
  for (const seedModule of sampleModules) {
    const saved = await prisma.module.upsert({
      where: { slug: seedModule.slug },
      create: {
        slug: seedModule.slug,
        order: seedModule.order,
        titleBn: seedModule.titleBn,
        titleEn: seedModule.titleEn,
        descriptionBn: seedModule.descriptionBn,
        descriptionEn: seedModule.descriptionEn,
        videoId: seedModule.videoId,
        published: true,
      },
      update: {
        order: seedModule.order,
        titleBn: seedModule.titleBn,
        titleEn: seedModule.titleEn,
        descriptionBn: seedModule.descriptionBn,
        descriptionEn: seedModule.descriptionEn,
        videoId: seedModule.videoId,
        published: true,
      },
    });

    for (const [index, step] of seedModule.steps.entries()) {
      const data = {
        moduleId: saved.id,
        order: index,
        type: step.type,
        promptBn: step.promptBn,
        promptEn: step.promptEn,
        options: step.options ?? undefined,
        correctOptionId: step.correctOptionId ?? null,
        minWords: step.minWords ?? 30,
      };
      await prisma.step.upsert({
        where: { id: step.id },
        create: { id: step.id, ...data },
        update: data,
      });
    }
    console.log(
      `Seeded sample module ${seedModule.slug} (${seedModule.steps.length} steps).`
    );
  }
}

async function main() {
  await seedAdmin();
  await seedModules();
  await prisma.setting.upsert({
    where: { key: "mcqPassMark" },
    create: { key: "mcqPassMark", value: "70" },
    update: {},
  });
  console.log("Seed complete. Sample content still needs official replacement.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
