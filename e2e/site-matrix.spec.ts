import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const routes = [
  "/", "/register", "/registered", "/resume", "/course",
  "/course/rover-personal-safety", "/course/leader-duty-of-care",
  "/certificate", "/verify", "/verify/INVALID-CERTIFICATE",
  "/admin/login", "/admin", "/admin/participants", "/admin/certificates",
  "/admin/content", "/admin/responses", "/admin/audit", "/organizer",
  "/organizer/login", "/control-center",
];

for (const locale of ["bn", "en"] as const) {
  const prefix = locale === "bn" ? "" : "/en";
  for (const theme of ["light", "dark"] as const) {
    for (const route of routes) {
      test(`${locale}/${theme} ${route} loads accessibly with persistent controls`, async ({ page }) => {
        const runtimeErrors: string[] = [];
        page.on("pageerror", (error) => runtimeErrors.push(error.message));
        page.on("console", (message) => {
          if (message.type() === "error") runtimeErrors.push(message.text());
          if (/hydration|did not match|server html/i.test(message.text())) runtimeErrors.push(message.text());
        });

        await page.addInitScript((selectedTheme) => {
          localStorage.setItem("scout_theme", selectedTheme);
        }, theme);
        await page.setViewportSize({ width: 360, height: 780 });
        await page.goto(`${prefix}${route}`, { waitUntil: "domcontentloaded" });
        await expect(page.locator("html")).toHaveAttribute("lang", locale);
        await expect(page.locator("html")).toHaveClass(theme === "dark" ? /dark/ : /^(?!.*\bdark\b)/);
        await expect(page.locator("[data-locale-controls]").first()).toBeVisible();
        await expect(page.getByRole("button", { name: "বাংলা" })).toBeVisible();
        await expect(page.getByRole("button", { name: "English" })).toBeVisible();
        await expect(page.locator("body")).not.toContainText(/MISSING_MESSAGE|MISSING_TRANSLATION/i);
        await page.reload({ waitUntil: "domcontentloaded" });
        await expect(page.locator("[data-locale-controls]").first()).toBeVisible();
        await expect(page.locator("html")).toHaveAttribute("lang", locale);
        await expect(page.locator("html")).toHaveClass(theme === "dark" ? /dark/ : /^(?!.*\bdark\b)/);
        await page.addStyleTag({ content: "*,*::before,*::after{animation:none!important;transition:none!important}" });
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
        expect(overflow, `horizontal overflow on ${route}`).toBe(false);
        expect(runtimeErrors, runtimeErrors.join("\n")).toEqual([]);

        const axe = await new AxeBuilder({ page }).analyze();
        expect(axe.violations.filter((issue) => ["serious", "critical"].includes(issue.impact ?? ""))).toEqual([]);
      });
    }
  }
}

test("language switching preserves current route and query; theme persists", async ({ page }) => {
  await page.goto("/register?source=locale-test");
  await page.getByRole("button", { name: "English" }).click();
  await expect(page).toHaveURL(/\/en\/register\?source=locale-test/);
  await page.getByRole("button", { name: "বাংলা" }).click();
  await expect(page).toHaveURL(/\/register\?source=locale-test/);
  await page.locator(".theme-control summary").click();
  await page.locator(".theme-control button").nth(1).click();
  await expect(page.locator("html")).toHaveClass(/dark/);
  await page.reload();
  await expect(page.locator("html")).toHaveClass(/dark/);
});

for (const locale of ["bn", "en"] as const) {
  test(`unauthorized admin dashboard redirects to localized login (${locale})`, async ({ page }) => {
    await page.goto(`${locale === "bn" ? "" : "/en"}/admin/participants`);
    await expect(page).toHaveURL(/\/admin\/login/);
    await expect(page.getByRole("button", { name: "English" })).toBeVisible();
  });
}
