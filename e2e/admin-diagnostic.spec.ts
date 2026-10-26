import { expect, test } from "@playwright/test";
import en from "../messages/en.json";

test("seeded SUPERADMIN first login, account access and admin session revocation", async ({ page, browser }) => {
  test.setTimeout(600_000);
  const email = process.env.AUDIT_ADMIN_EMAIL;
  const password = process.env.AUDIT_ADMIN_PASSWORD;
  const newPassword = process.env.AUDIT_ADMIN_NEW_PASSWORD;
  const childEmail = process.env.AUDIT_CHILD_EMAIL;
  const childLogin = process.env.AUDIT_CHILD_LOGIN;
  const childNewPassword = process.env.AUDIT_CHILD_NEW_PASSWORD;
  const expectedParticipants = Number(process.env.AUDIT_EXPECTED_PARTICIPANTS);
  if (!email || !password || !newPassword || !childEmail || !childLogin || !childNewPassword) {
    throw new Error("Provide isolated Preview admin audit values.");
  }

  await page.goto("/admin/login");
  await page.locator('[name="loginId"]').fill(email);
  await page.locator('[name="password"]').fill(password);
  await page.getByRole("button", { name: en.admin.login.submit }).click();
  await expect(page).toHaveURL(/\/en\/admin\/first-login-password$/);

  const forceForm = page.locator("form").filter({ has: page.locator('[name="newPassword"]') });
  await forceForm.locator('[name="currentPassword"]').fill(password);
  await forceForm.locator('[name="newPassword"]').fill(newPassword);
  await forceForm.locator('[name="confirmPassword"]').fill(newPassword);
  await forceForm.getByRole("button", { name: en.admin.account.changePassword }).click();
  await expect(page).toHaveURL(/\/en\/admin\/login\?password-updated=1$/);

  await page.locator('[name="loginId"]').fill(email);
  await page.locator('[name="password"]').fill(newPassword);
  await page.getByRole("button", { name: en.admin.login.submit }).click();
  await expect(page).toHaveURL(/\/en\/admin$/);
  await expect(page.getByRole("heading", { name: en.admin.dashboard.title })).toBeVisible();
  const participantStat = page
    .locator("div.rounded-2xl")
    .filter({ hasText: en.admin.dashboard.totalParticipants })
    .first();
  await expect(participantStat.locator("p").nth(1)).toHaveText(String(expectedParticipants));

  await page.goto("/admin/account");
  await expect(page.getByRole("heading", { name: en.admin.account.title })).toBeVisible();
  await expect(page.locator('input[name="name"]')).toBeVisible();
  await expect(page.locator('input[name="loginId"]')).toBeVisible();
  await expect(page.locator('input[name="email"]')).toBeVisible();
  await expect(page.getByText(en.admin.account.sessions)).toBeVisible();

  await page.goto("/admin/admins");
  const createForm = page.locator("form").filter({ has: page.locator('select[name="role"]') }).first();
  await createForm.locator('[name="name"]').fill("QA Reporting Admin");
  await createForm.locator('[name="loginId"]').fill(childLogin);
  await createForm.locator('[name="email"]').fill(childEmail);
  await createForm.locator('[name="role"]').selectOption("REPORTING_ADMIN");
  await createForm.locator('[name="currentPassword"]').fill(newPassword);
  await createForm.getByRole("button", { name: en.admin.admins.createButton }).click();
  const oneTimePassword = page.locator('[role="status"]:has(code)');
  await expect(oneTimePassword).toBeVisible();
  const temporaryPassword = await oneTimePassword.locator("code").innerText();
  expect(temporaryPassword.length).toBeGreaterThan(20);
  await page.reload();
  await expect(page.locator('[role="status"]:has(code)')).toHaveCount(0);

  const childContext = await browser.newContext();
  try {
    const childPage = await childContext.newPage();
    await childPage.goto("/admin/login");
    await childPage.locator('[name="loginId"]').fill(childLogin);
    await childPage.locator('[name="password"]').fill(temporaryPassword);
    await childPage.getByRole("button", { name: en.admin.login.submit }).click();
    await expect(childPage).toHaveURL(/\/en\/admin\/first-login-password$/);

    const childForceForm = childPage.locator("form").filter({ has: childPage.locator('[name="newPassword"]') });
    await childForceForm.locator('[name="currentPassword"]').fill(temporaryPassword);
    await childForceForm.locator('[name="newPassword"]').fill(childNewPassword);
    await childForceForm.locator('[name="confirmPassword"]').fill(childNewPassword);
    await childForceForm.getByRole("button", { name: en.admin.account.changePassword }).click();
    await expect(childPage).toHaveURL(/\/en\/admin\/login\?password-updated=1$/);

    await childPage.locator('[name="loginId"]').fill(childLogin);
    await childPage.locator('[name="password"]').fill(childNewPassword);
    await childPage.getByRole("button", { name: en.admin.login.submit }).click();
    await expect(childPage).toHaveURL(/\/en\/admin$/);
    await childPage.goto("/admin/participants");
    await expect(childPage).toHaveURL(/\/en\/admin\/access-denied$/);

    const exportResponse = await childContext.request.get("http://127.0.0.1:3001/api/admin/export");
    expect(exportResponse.status()).toBe(200);
    expect(exportResponse.headers()["content-type"]).toContain("text/csv");
    const exportBody = await exportResponse.text();
    expect(exportBody).not.toMatch(/reflectionCipher|reflection answer/i);

    const childCard = page.locator("article").filter({ hasText: childEmail });
    await expect(childCard).toBeVisible();
    const disableForm = childCard.locator("form").filter({ hasText: en.admin.admins.disable });
    await disableForm.locator('[name="currentPassword"]').fill(newPassword);
    page.once("dialog", (dialog) => dialog.accept());
    await disableForm.getByRole("button", { name: en.admin.admins.disable }).click();
    await expect(childCard.getByText(en.admin.admins.disabled)).toBeVisible();
    await childPage.goto("/admin");
    await expect(childPage).toHaveURL(/\/en\/admin\/login/);
  } finally {
    await childContext.close();
  }
});
