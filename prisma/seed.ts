import "dotenv/config";
import { PrismaClient, type StepType } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const REQUIRED_MARKER =
  "SAMPLE - replace with official Bangladesh Scouts Safe from Harm content.";

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
  audience: "ROVER" | "LEADER";
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
const roverModules: SeedModule[] = [
  {
    slug: "rover-personal-safety",
    audience: "ROVER",
    order: 0,
    titleBn: "রোভার: ব্যক্তিগত নিরাপত্তা",
    titleEn: "ROVER - personal safety",
    descriptionBn: `${REQUIRED_MARKER} ব্যক্তিগত নিরাপত্তা নিয়ে অনুশীলন।`,
    descriptionEn: `${REQUIRED_MARKER} Practise personal safety (sample).`,
    videoId: "aqz-KE-bpKQ",
    steps: [
      {
        id: "rover-m1-s1",
        type: "MCQ",
        promptBn: "নমুনা প্রশ্ন - নিরাপত্তা নিয়ে উদ্বেগ হলে প্রথমে কী করা উচিত?",
        promptEn:
          "Sample question - if worried about safety, which is most appropriate first?",
        options: [
          { id: "a", bn: "উদ্বেগ গুরুত্বসহ নিয়ে উপযুক্ত সহায়তা চাওয়া", en: "Take it seriously and seek appropriate help" },
          { id: "b", bn: "উপেক্ষা করা", en: "Ignore it" },
          { id: "c", bn: "সবার সাথে শেয়ার করে উপহাস করা", en: "Share widely for gossip" },
        ],
        correctOptionId: "a",
      },
      {
        id: "rover-m1-s2",
        type: "MCQ",
        promptBn: "নমুনা প্রশ্ন - সীমা নির্ধারণ কেন গুরুত্বপূর্ণ?",
        promptEn: "Sample question - why are boundaries important?",
        options: [
          { id: "a", bn: "পারস্পরিক সম্মান ও নিরাপত্তা নিশ্চিত করতে", en: "To ensure mutual respect and safety" },
          { id: "b", bn: "বন্ধুত্ব কমাতে", en: "To reduce friendship" },
          { id: "c", bn: "কোনো প্রয়োজন নেই", en: "Not needed" },
        ],
        correctOptionId: "a",
      },
      {
        id: "rover-m1-s3",
        type: "MCQ",
        promptBn: "নমুনা প্রশ্ন - সম্মতি কিভাবে বুঝতে হয়?",
        promptEn: "Sample question - how to understand consent?",
        options: [
          { id: "a", bn: "স্পষ্ট, অবাধ ও প্রত্যাহারযোগ্য হতে হবে", en: "It must be clear, freely given and can be withdrawn" },
          { id: "b", bn: "নীরবতাই সম্মতি", en: "Silence means consent" },
          { id: "c", bn: "চাপ দিয়ে নিতে পারি", en: "Pressure is acceptable" },
        ],
        correctOptionId: "a",
      },
      {
        id: "rover-m1-s4",
        type: "MCQ",
        promptBn: "নমুনা প্রশ্ন - অনলাইন নিরাপত্তায় কী করা উচিত?",
        promptEn: "Sample question - what to do for online safety?",
        options: [
          { id: "a", bn: "ব্যক্তিগত তথ্য সতর্কভাবে শেয়ার করা", en: "Share personal details carefully" },
          { id: "b", bn: "পাসওয়ার্ড সবার সাথে শেয়ার করা", en: "Share passwords with everyone" },
          { id: "c", bn: "অজানা লিঙ্কে ক্লিক করা", en: "Click unknown links" },
        ],
        correctOptionId: "a",
      },
      {
        id: "rover-m1-s5",
        type: "REFLECTION",
        promptBn: "নমুনা প্রতিফলন - আপনি কিভাবে নিজের সীমা সংরক্ষণ করবেন? (কমপক্ষে ৩০ শব্দ)",
        promptEn: "Sample reflection - how will you protect your boundaries? (min 30 words)",
        minWords: 30,
      },
    ],
  },
  {
    slug: "rover-bullying",
    audience: "ROVER",
    order: 1,
    titleBn: "রোভার: বুলিং ও অনলাইন নিরাপত্তা",
    titleEn: "ROVER - bullying and online safety",
    descriptionBn: `${REQUIRED_MARKER} বুলিং প্রতিরোধ ও রিপোর্টিং।`,
    descriptionEn: `${REQUIRED_MARKER} Bullying prevention and reporting (sample).`,
    videoId: "aqz-KE-bpKQ",
    steps: [
      {
        id: "rover-m2-s1",
        type: "MCQ",
        promptBn: "নমুনা প্রশ্ন - বুলিং লক্ষ্য করলে প্রথম পদক্ষেপ?",
        promptEn: "Sample question - first step if witnessing bullying?",
        options: [
          { id: "a", bn: "নিরাপদভাবে হস্তক্ষেপ ও সহায়তা চাওয়া", en: "Intervene safely and seek help" },
          { id: "b", bn: "দেখে উপভোগ করা", en: "Watch and enjoy" },
          { id: "c", bn: "ভিকটিমকে দোষ দেওয়া", en: "Blame the victim" },
        ],
        correctOptionId: "a",
      },
      {
        id: "rover-m2-s2",
        type: "MCQ",
        promptBn: "নমুনা প্রশ্ন - সাইবার বুলিং কি বুলিং?",
        promptEn: "Sample question - is cyberbullying bullying?",
        options: [
          { id: "a", bn: "হ্যাঁ, এটি গুরুতর বুলিং", en: "Yes, it is serious bullying" },
          { id: "b", bn: "না, এটি মজা", en: "No, it's just fun" },
          { id: "c", bn: "শুধু কম্পিউটারে হয় তাই সমস্যা নয়", en: "No problem" },
        ],
        correctOptionId: "a",
      },
      {
        id: "rover-m2-s3",
        type: "MCQ",
        promptBn: "নমুনা প্রশ্ন - বুলিং রিপোর্ট কখন করা উচিত?",
        promptEn: "Sample question - when to report bullying?",
        options: [
          { id: "a", bn: "যত তাড়াতাড়ি সম্ভব", en: "As soon as possible" },
          { id: "b", bn: "ছুটি শেষে", en: "After holiday" },
          { id: "c", bn: "কখনো না", en: "Never" },
        ],
        correctOptionId: "a",
      },
      {
        id: "rover-m2-s4",
        type: "MCQ",
        promptBn: "নমুনা প্রশ্ন - সহায়তা চাওয়া দুর্বলতা না?",
        promptEn: "Sample question - is asking for help weakness?",
        options: [
          { id: "a", bn: "না, এটি সাহসিকতা", en: "No, it is courage" },
          { id: "b", bn: "হ্যাঁ, দুর্বলতা", en: "Yes, weakness" },
          { id: "c", bn: "কখনো করা উচিত নয়", en: "Never do it" },
        ],
        correctOptionId: "a",
      },
      {
        id: "rover-m2-s5",
        type: "REFLECTION",
        promptBn: "নমুনা প্রতিফলন - আপনি কিভাবে অন্যকে সহায়তা করবেন? (কমপক্ষে ৩০ শব্দ)",
        promptEn: "Sample reflection - how would you help others? (min 30 words)",
        minWords: 30,
      },
    ],
  },
  {
    slug: "rover-speak-up",
    audience: "ROVER",
    order: 2,
    titleBn: "রোভার: কথা বলা ও রিপোর্টিং",
    titleEn: "ROVER - how to speak up and report",
    descriptionBn: `${REQUIRED_MARKER} উদ্বেগ জানানো ও ছোট সদস্যদের রক্ষণাবেক্ষণ।`,
    descriptionEn: `${REQUIRED_MARKER} Speaking up and looking out for younger members (sample).`,
    videoId: "aqz-KE-bpKQ",
    steps: [
      {
        id: "rover-m3-s1",
        type: "MCQ",
        promptBn: "নমুনা প্রশ্ন - উদ্বেগ জানাতে কার কাছে যাওয়া উচিত?",
        promptEn: "Sample question - who to report concerns to?",
        options: [
          { id: "a", bn: "নির্ধারিত সেফগার্ডিং ফোকাল পয়েন্ট", en: "Designated safeguarding focal point" },
          { id: "b", bn: "যেকোনো সোশ্যাল মিডিয়া গ্রুপ", en: "Any social media group" },
          { id: "c", bn: "অপরিচিত কেউ", en: "Stranger" },
        ],
        correctOptionId: "a",
      },
      {
        id: "rover-m3-s2",
        type: "MCQ",
        promptBn: "নমুনা প্রশ্ন - ছোট সদস্যদের দেখভালে কী করা উচিত?",
        promptEn: "Sample question - looking out for younger members?",
        options: [
          { id: "a", bn: "নিরাপদ পরিবেশ নিশ্চিত করা ও প্রয়োজনে রিপোর্ট করা", en: "Ensure safe environment and report if needed" },
          { id: "b", bn: "তাদের একা ছেড়ে রাখা", en: "Leave them alone unsupervised" },
          { id: "c", bn: "নিয়ম লঙ্ঘন গোপন রাখা", en: "Hide rule violations" },
        ],
        correctOptionId: "a",
      },
      {
        id: "rover-m3-s3",
        type: "MCQ",
        promptBn: "নমুনা প্রশ্ন - জরুরি অবস্থায় কী করতে হবে?",
        promptEn: "Sample question - in emergency?",
        options: [
          { id: "a", bn: "জরুরি সেবা ও উপযুক্ত কর্তৃপক্ষকে জানানো", en: "Contact emergency services and appropriate authorities" },
          { id: "b", bn: "নিজে সমাধান করার চেষ্টা", en: "Handle alone" },
          { id: "c", bn: "অপেক্ষা করা", en: "Wait" },
        ],
        correctOptionId: "a",
      },
      {
        id: "rover-m3-s4",
        type: "MCQ",
        promptBn: "নমুনা প্রশ্ন - রিপোর্টিং কি বিশ্বাসঘাতকতা?",
        promptEn: "Sample question - is reporting betrayal?",
        options: [
          { id: "a", bn: "না, এটি নিরাপত্তা রক্ষার দায়িত্ব", en: "No, it's responsibility to protect" },
          { id: "b", bn: "হ্যাঁ, বিশ্বাসঘাতকতা", en: "Yes, betrayal" },
          { id: "c", bn: "কখনো উচিত নয়", en: "Never" },
        ],
        correctOptionId: "a",
      },
      {
        id: "rover-m3-s5",
        type: "REFLECTION",
        promptBn: "নমুনা প্রতিফলন - আপনি কিভাবে নিরাপদ পরিবেশ তৈরি করবেন? (কমপক্ষে ৩০ শব্দ)",
        promptEn: "Sample reflection - how will you create a safe environment? (min 30 words)",
        minWords: 30,
      },
    ],
  },
];

const leaderModules: SeedModule[] = [
  {
    slug: "leader-duty-of-care",
    audience: "LEADER",
    order: 0,
    titleBn: "লিডার: ডিউটি অব কেয়ার",
    titleEn: "LEADER - duty of care",
    descriptionBn: `${REQUIRED_MARKER} ডিউটি অব কেয়ার ও নিরাপদ অনুশীলন।`,
    descriptionEn: `${REQUIRED_MARKER} Duty of care and safe practice (sample).`,
    videoId: "aqz-KE-bpKQ",
    steps: [
      {
        id: "leader-m1-s1",
        type: "MCQ",
        promptBn: "নমুনা প্রশ্ন - ডিউটি অব কেয়ার বলতে কী বোঝায়?",
        promptEn: "Sample question - what is duty of care?",
        options: [
          { id: "a", bn: "যুবকদের নিরাপত্তা ও কল্যাণ রক্ষার দায়িত্ব", en: "Responsibility to protect youth safety and welfare" },
          { id: "b", bn: "শুধু উপস্থিত থাকা", en: "Just being present" },
          { id: "c", bn: "কোনো দায়িত্ব নেই", en: "No responsibility" },
        ],
        correctOptionId: "a",
      },
      {
        id: "leader-m1-s2",
        type: "MCQ",
        promptBn: "নমুনা প্রশ্ন - নিরাপদ প্রাপ্তবয়স্ক-যুবক অনুশীলন?",
        promptEn: "Sample question - safe adult-youth practice?",
        options: [
          { id: "a", bn: "নিয়ম মেনে চলা, স্বচ্ছতা ও পর্যবেক্ষণ নিশ্চিত করা", en: "Follow rules, transparency and supervision" },
          { id: "b", bn: "গোপনে একান্ত সাক্ষাৎ রাখা", en: "Private unsupervised meetings" },
          { id: "c", bn: "ব্যক্তিগত বার্তা গোপন রাখা", en: "Hide private messages" },
        ],
        correctOptionId: "a",
      },
      {
        id: "leader-m1-s3",
        type: "MCQ",
        promptBn: "নমুনা প্রশ্ন - একক একে একে যোগাযোগ এড়িয়ে চলা কেন?",
        promptEn: "Sample question - avoid unsupervised one-to-one contact?",
        options: [
          { id: "a", bn: "সুরক্ষা ও বিশ্বাস রক্ষার জন্য", en: "To protect safety and trust" },
          { id: "b", bn: "বন্ধুত্ব কমানোর জন্য", en: "To reduce friendship" },
          { id: "c", bn: "নিয়ম নয়", en: "Not a rule" },
        ],
        correctOptionId: "a",
      },
      {
        id: "leader-m1-s4",
        type: "MCQ",
        promptBn: "নমুনা প্রশ্ন - স্বচ্ছতা কেন জরুরি?",
        promptEn: "Sample question - why transparency?",
        options: [
          { id: "a", bn: "সন্দেহ দূর ও নিরাপত্তা নিশ্চিত করে", en: "Removes doubt and ensures safety" },
          { id: "b", bn: "গোপনীয়তা রক্ষা করে", en: "Protects secrecy" },
          { id: "c", bn: "কিছুই না", en: "Nothing" },
        ],
        correctOptionId: "a",
      },
      {
        id: "leader-m1-s5",
        type: "REFLECTION",
        promptBn: "নমুনা প্রতিফলন - আপনি কিভাবে নিরাপদ পরিবেশ নিশ্চিত করবেন? (কমপক্ষে ৩০ শব্দ)",
        promptEn: "Sample reflection - how will you ensure safe environment? (min 30 words)",
        minWords: 30,
      },
    ],
  },
  {
    slug: "leader-disclosure",
    audience: "LEADER",
    order: 1,
    titleBn: "লিডার: প্রকাশ ও সহায়তা",
    titleEn: "LEADER - handling a disclosure",
    descriptionBn: `${REQUIRED_MARKER} প্রকাশ পেলে কীভাবে সাড়া দিতে হয়।`,
    descriptionEn: `${REQUIRED_MARKER} Responding to disclosures (sample).`,
    videoId: "aqz-KE-bpKQ",
    steps: [
      {
        id: "leader-m2-s1",
        type: "MCQ",
        promptBn: "নমুনা প্রশ্ন - কেউ প্রকাশ করলে প্রথমে কী করা উচিত?",
        promptEn: "Sample question - when someone discloses, first thing?",
        options: [
          { id: "a", bn: "শান্তভাবে শুনুন, বিশ্বাস করুন ও সহায়তা জানান", en: "Listen calmly, believe and offer support" },
          { id: "b", bn: "বিস্তারিত জিজ্ঞাসা করে চাপ দিন", en: "Press for details" },
          { id: "c", bn: "উপেক্ষা করুন", en: "Ignore" },
        ],
        correctOptionId: "a",
      },
      {
        id: "leader-m2-s2",
        type: "MCQ",
        promptBn: "নমুনা প্রশ্ন - 'আমি গোপন রাখব' বলা কি ঠিক?",
        promptEn: "Sample question - promise confidentiality?",
        options: [
          { id: "a", bn: "না, সেফগার্ডিংয়ের ক্ষেত্রে গোপন রাখা সম্ভব নাও হতে পারে", en: "No, cannot guarantee if safeguarding requires action" },
          { id: "b", bn: "হ্যাঁ, সব সময় গোপন রাখব", en: "Yes, always keep secret" },
          { id: "c", bn: "কখনো সমস্যা নয়", en: "No problem" },
        ],
        correctOptionId: "a",
      },
      {
        id: "leader-m2-s3",
        type: "MCQ",
        promptBn: "নমুনা প্রশ্ন - প্রকাশের পর কী রেকর্ড করতে হবে?",
        promptEn: "Sample question - what to record after disclosure?",
        options: [
          { id: "a", bn: "যথাসম্ভব নিরপেক্ষভাবে মূল তথ্য লিখুন", en: "Record key facts objectively" },
          { id: "b", bn: "নিজের মতামত যোগ করুন", en: "Add opinions" },
          { id: "c", bn: "কিছু না লিখুন", en: "Write nothing" },
        ],
        correctOptionId: "a",
      },
      {
        id: "leader-m2-s4",
        type: "MCQ",
        promptBn: "নমুনা প্রশ্ন - রিপোর্টিং দেরি করলে কি হতে পারে?",
        promptEn: "Sample question - delaying report?",
        options: [
          { id: "a", bn: "বিপদ বেড়ে যেতে পারে", en: "Risk may increase" },
          { id: "b", bn: "কোনো ক্ষতি নেই", en: "No harm" },
          { id: "c", bn: "ভালো হয়", en: "Better" },
        ],
        correctOptionId: "a",
      },
      {
        id: "leader-m2-s5",
        type: "REFLECTION",
        promptBn: "নমুনা প্রতিফলন - প্রকাশের সময় আপনি কিভাবে প্রতিক্রিয়া দেখাবেন? (কমপক্ষে ৩০ শব্দ)",
        promptEn: "Sample reflection - how will you respond to disclosure? (min 30 words)",
        minWords: 30,
      },
    ],
  },
  {
    slug: "leader-incident-reporting",
    audience: "LEADER",
    order: 2,
    titleBn: "লিডার: ঘটনা রিপোর্টিং ও এসকেলেশন",
    titleEn: "LEADER - incident reporting and escalation",
    descriptionBn: `${REQUIRED_MARKER} ঘটনা রিপোর্টিং ও অনলাইন নিরাপদ যোগাযোগ।`,
    descriptionEn: `${REQUIRED_MARKER} Incident reporting and safe online communication (sample).`,
    videoId: "aqz-KE-bpKQ",
    steps: [
      {
        id: "leader-m3-s1",
        type: "MCQ",
        promptBn: "নমুনা প্রশ্ন - ঘটনা রিপোর্ট কার কাছে করতে হবে?",
        promptEn: "Sample question - who to report incidents to?",
        options: [
          { id: "a", bn: "নির্ধারিত সেফগার্ডিং ফোকাল পয়েন্ট", en: "Designated safeguarding focal point" },
          { id: "b", bn: "অজানা গ্রুপ", en: "Unknown group" },
          { id: "c", bn: "সবার কাছে শেয়ার", en: "Share with everyone" },
        ],
        correctOptionId: "a",
      },
      {
        id: "leader-m3-s2",
        type: "MCQ",
        promptBn: "নমুনা প্রশ্ন - অনলাইন যোগাযোগে কী অনুসরণ করতে হবে?",
        promptEn: "Sample question - safe online communication with youth?",
        options: [
          { id: "a", bn: "স্বচ্ছ, প্রফেশনাল ও নীতি মেনে চলা", en: "Be transparent, professional and follow policy" },
          { id: "b", bn: "গোপনে ব্যক্তিগত বার্তা", en: "Secret private messages" },
          { id: "c", bn: "সর্বদা একান্তে", en: "Always one-to-one secretly" },
        ],
        correctOptionId: "a",
      },
      {
        id: "leader-m3-s3",
        type: "MCQ",
        promptBn: "নমুনা প্রশ্ন - এসকেলেশন কখন করতে হবে?",
        promptEn: "Sample question - when to escalate?",
        options: [
          { id: "a", bn: "গুরুতর বা অবিলম্বে পদক্ষেপ প্রয়োজন হলে", en: "If serious or immediate action needed" },
          { id: "b", bn: "কখনো না", en: "Never" },
          { id: "c", bn: "মাস শেষে", en: "End of month" },
        ],
        correctOptionId: "a",
      },
      {
        id: "leader-m3-s4",
        type: "MCQ",
        promptBn: "নমুনা প্রশ্ন - দলগতভাবে কাজের ক্ষেত্রে সুরক্ষা কীভাবে নিশ্চিত করবেন?",
        promptEn: "Sample question - ensure safety in group settings?",
        options: [
          { id: "a", bn: "উন্মুক্ত, পর্যবেক্ষিত ও নীতিমালা মেনে চলা", en: "Open, supervised and follow guidelines" },
          { id: "b", bn: "দল ছাড়াই আলাদা করা", en: "Separate alone" },
          { id: "c", bn: "নিয়ম উপেক্ষা", en: "Ignore rules" },
        ],
        correctOptionId: "a",
      },
      {
        id: "leader-m3-s5",
        type: "REFLECTION",
        promptBn: "নমুনা প্রতিফলন - আপনি কিভাবে রিপোর্টিং প্রক্রিয়া অনুসরণ করবেন? (কমপক্ষে ৩০ শব্দ)",
        promptEn: "Sample reflection - how will you follow reporting process? (min 30 words)",
        minWords: 30,
      },
    ],
  },
];

const sampleModules = [...roverModules, ...leaderModules];

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

  const existing = await prisma.adminUser.findUnique({ where: { email }, select: { id: true } });
  if (existing) {
    console.info("Configured SUPERADMIN already exists; seed left its account and credentials untouched.");
    return;
  }
  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.adminUser.create({
    data: {
      loginId: email,
      email,
      name: "Superadmin",
      passwordHash,
      role: "SUPERADMIN",
      mustChangePassword: true,
    },
  });
  console.info("Created the configured SUPERADMIN account.");
}

async function seedModules() {
  for (const seedModule of sampleModules) {
    const saved = await prisma.module.upsert({
      where: { slug: seedModule.slug },
      create: {
        slug: seedModule.slug,
        audience: seedModule.audience,
        order: seedModule.order,
        titleBn: seedModule.titleBn,
        titleEn: seedModule.titleEn,
        descriptionBn: seedModule.descriptionBn,
        descriptionEn: seedModule.descriptionEn,
        videoId: seedModule.videoId,
        published: true,
      },
      update: {
        audience: seedModule.audience,
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
  if (process.env.SKIP_ADMIN_SEED !== "true") {
    await seedAdmin();
  }
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
