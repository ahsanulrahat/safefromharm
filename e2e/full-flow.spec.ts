import { expect, test } from "@playwright/test";
import bn from "../messages/bn.json";
import en from "../messages/en.json";
let prisma: typeof import("../src/lib/prisma").prisma;
const createdScoutIds = new Set<string>();

test.beforeAll(async () => {
  ({ prisma } = await import("../src/lib/prisma"));
});

const scenarios = [
  { audience: "ROVER", locale: "bn", theme: "light" },
  { audience: "LEADER", locale: "bn", theme: "light" },
  { audience: "ROVER", locale: "en", theme: "dark" },
  { audience: "LEADER", locale: "en", theme: "dark" },
] as const;

for (const scenario of scenarios) {
  test(`${scenario.audience} registration through certificate and verification (${scenario.locale}/${scenario.theme})`, async ({ page }) => {
    test.setTimeout(600_000);
    const stamp = `${Date.now()}${Math.floor(Math.random() * 10000)}`;
    const scoutId = `QA26-${scenario.audience}-${stamp}`;
    createdScoutIds.add(scoutId);
    const phone = `+8801${stamp.slice(-9).padStart(9, "0")}`;
    const prefix = scenario.locale === "en" ? "/en" : "";
    const messages = scenario.locale === "en" ? en : bn;

    await page.addInitScript((preference) => localStorage.setItem("scout_theme", preference), scenario.theme);
    const configuredHost = process.env.PLAYWRIGHT_BASE_URL
      ? new URL(process.env.PLAYWRIGHT_BASE_URL).hostname
      : "127.0.0.1";
    if (["localhost", "127.0.0.1", "::1"].includes(configuredHost)) {
      // Use a reserved documentation-only address for local rate-limit test isolation.
      await page.setExtraHTTPHeaders({ "x-forwarded-for": `198.51.100.${Math.floor(Math.random() * 200) + 1}` });
    }

    try {
      await page.goto(`${prefix}/register`);
      const form = page.locator("form").filter({ has: page.locator('input[name="scoutId"]') });
      await form.locator('[name="fullNameBn"]').fill("পরীক্ষামূলক অংশগ্রহণকারী");
      await form.locator('[name="nameEn"]').fill("QA Test Participant");
      await form.locator('[name="scoutId"]').fill(scoutId);
      await form.locator('[name="unit"]').fill("QA Test Unit");
      await form.locator('[name="district"]').fill("Dhaka");
      await form.locator('[name="memberType"]').selectOption(scenario.audience);
      await form.locator('[name="phone"]').fill(phone);
      await form.locator('[name="consent"]').check();
      await form.getByRole("button", { name: messages.register.submit }).click();
      // The first request may wake an autosuspended isolated database branch.
      await expect(page).toHaveURL(new RegExp(`${prefix}/registered$`), {
        timeout: 30_000,
      });

      // Confirm duplicate IDs are rejected in the selected UI language.
      await page.goto(`${prefix}/register`);
      const duplicateForm = page.locator("form").filter({ has: page.locator('input[name="scoutId"]') });
      await duplicateForm.locator('[name="fullNameBn"]').fill("পরীক্ষামূলক পুনরাবৃত্তি");
      await duplicateForm.locator('[name="nameEn"]').fill("Duplicate QA Test");
      await duplicateForm.locator('[name="scoutId"]').fill(scoutId);
      await duplicateForm.locator('[name="unit"]').fill("QA Test Unit");
      await duplicateForm.locator('[name="district"]').fill("Dhaka");
      await duplicateForm.locator('[name="memberType"]').selectOption(scenario.audience);
      await duplicateForm.locator('[name="phone"]').fill(`+8802${stamp.slice(-9).padStart(9, "0")}`);
      await duplicateForm.locator('[name="consent"]').check();
      await duplicateForm.getByRole("button", { name: messages.register.submit }).click();
      await expect(duplicateForm.getByRole("alert")).toContainText(messages.validation.duplicateScout);

      const modules = await prisma.module.findMany({
        where: { audience: scenario.audience, published: true },
        orderBy: { order: "asc" },
        include: { steps: { orderBy: { order: "asc" } } },
      });
      expect(modules.length).toBeGreaterThan(0);

      for (const courseModule of modules) {
        await page.goto(`${prefix}/course/${courseModule.slug}`);
        const watchedButton = page.getByRole("button", { name: messages.module.markWatched });
        if (await watchedButton.isVisible().catch(() => false)) {
          await watchedButton.click();
          await expect(page.getByText(messages.module.watchedNote)).toBeVisible({ timeout: 20_000 });
        }
        for (const step of courseModule.steps) {
          const stepForm = page.locator(`form:has(input[name="stepId"][value="${step.id}"])`);
          if (step.type === "MCQ") {
            await stepForm.locator(`input[name="optionId"][value="${step.correctOptionId}"]`).check();
            await stepForm.getByRole("button", { name: messages.module.submit }).click();
          } else {
            const answer = Array.from({ length: Math.max(30, step.minWords) }, (_, index) => `reflection${index + 1}`).join(" ");
            await stepForm.locator('textarea[name="answer"]').fill(answer);
            await stepForm.getByRole("button", { name: messages.module.submitReflection }).click();
          }
          // The isolated Neon Preview branch can pause on a cold compute; do
          // not start cleanup while its server action is still writing.
          await expect(stepForm.getByRole("status")).toBeVisible({ timeout: 60_000 });
        }
      }

      await page.goto(`${prefix}/certificate`);
      await expect(page.getByRole("heading", { name: messages.certificate.title })).toBeVisible();
      const download = page.waitForEvent("download");
      await page.getByRole("link", { name: messages.certificate.download }).click();
      expect((await download).suggestedFilename()).toMatch(/\.pdf$/);
      await page.getByRole("link", { name: messages.certificate.verifyLabel }).click();
      await expect(page.getByRole("heading", { name: messages.verify.valid })).toBeVisible();
      await expect(page.locator("html")).toHaveClass(scenario.theme === "dark" ? /dark/ : /^(?!.*\bdark\b)/);
    } finally {
      // Only rows with this run's unique Scout ID are removed; relations cascade.
      await prisma.participant.deleteMany({ where: { scoutId } });
    }
  });
}

test.afterAll(async () => {
  if (createdScoutIds.size) {
    await prisma.participant.deleteMany({
      where: { scoutId: { in: [...createdScoutIds] } },
    });
  }
  await prisma.$disconnect();
});
