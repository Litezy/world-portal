import { expect, type Page, test } from "@playwright/test";

/**
 * These drive the console against a live World Portal API. Point
 * `WORLD_PORTAL_API_URL` at one and seed it (`prisma/seed.ts` creates the
 * default manager) before running.
 */
const EMAIL = process.env.E2E_ADMIN_EMAIL ?? "manager@loveworld.com";
const PASSWORD = process.env.ADMIN_PASSWORD ?? "worldportal";

async function signIn(page: Page) {
  await page.goto("/admin/login");
  await page.getByLabel("Email").fill(EMAIL);
  await page.getByLabel("Password").fill(PASSWORD);
  await page.getByRole("button", { name: /sign in/i }).click();
  await page.waitForURL("**/admin");
}

test.describe("admin console", () => {
  test("guards every console route behind sign in", async ({ page }) => {
    await page.goto("/admin/applications");
    await expect(page).toHaveURL(/\/admin\/login\?next=%2Fadmin%2Fapplications/);
    await expect(page.getByRole("heading", { name: /welcome/i })).toBeVisible();
  });

  test("rejects the wrong password without signing in", async ({ page }) => {
    await page.goto("/admin/login");
    await page.getByLabel("Email").fill(EMAIL);
    await page.getByLabel("Password").fill("not-the-password");
    await page.getByRole("button", { name: /sign in/i }).click();
    await expect(page.getByText(/do not match/i)).toBeVisible();
    await expect(page).toHaveURL(/\/admin\/login/);
  });

  test("refuses an address the service has no account for", async ({ page }) => {
    await page.goto("/admin/login");
    await page.getByLabel("Email").fill("nobody@worldportal.travel");
    await page.getByLabel("Password").fill(PASSWORD);
    await page.getByRole("button", { name: /sign in/i }).click();
    await expect(page.getByText(/no world portal account/i)).toBeVisible();
  });

  test("signs in and returns to the originally requested page", async ({ page }) => {
    await page.goto("/admin/customers");
    await page.getByLabel("Email").fill(EMAIL);
    await page.getByLabel("Password").fill(PASSWORD);
    await page.getByRole("button", { name: /sign in/i }).click();
    await expect(page).toHaveURL(/\/admin\/customers/);
  });

  test("overview leads with the KPI row and the pipeline", async ({ page }) => {
    await signIn(page);
    await expect(page.getByText("Visa applications").first()).toBeVisible();
    await expect(page.getByText("Passport applications").first()).toBeVisible();
    await expect(page.getByRole("heading", { name: "Visa pipeline" })).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Latest visa applications" }),
    ).toBeVisible();
  });

  test("lists applications from the service", async ({ page }) => {
    await signIn(page);
    await page.goto("/admin/applications");
    await expect(page.getByRole("cell", { name: /VISA-/ }).first()).toBeVisible();
  });

  test("searching filters through the URL so a view can be shared", async ({
    page,
  }) => {
    await signIn(page);
    await page.goto("/admin/applications");
    await page.getByLabel("Search").fill("ada");
    await expect(page).toHaveURL(/q=ada/);
    await expect(page.getByRole("link", { name: /ada/i }).first()).toBeVisible();
  });

  test("opens an application and advances its stage", async ({ page }) => {
    await signIn(page);
    await page.goto("/admin/applications?q=ada");
    await page.getByRole("link", { name: /ada/i }).first().click();
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

    const stage = page.getByLabel("Move to stage");
    const current = await stage.textContent();
    const next = current?.includes("Under review") ? "Evaluated" : "Under review";
    const note = `Stage moved to ${next}.`;

    await stage.click();
    await page.getByRole("option", { name: next, exact: true }).click();
    await page.getByLabel("Verification notes").fill(note);
    await page.getByRole("button", { name: "Update application" }).click();

    await expect(page.getByText("Application updated")).toBeVisible();
  });

  test("shows passport applications on their own screen", async ({ page }) => {
    await signIn(page);
    await page.goto("/admin/passports");
    await expect(page.getByRole("heading", { level: 1 })).toContainText(/passport/i);
  });

  test("survives a stale dark theme left in localStorage", async ({ page }) => {
    // localhost:3000 is shared with every other local project, so a `theme`
    // another app wrote used to put the console into a theme it was never
    // designed against — white-on-white fields and an invisible heading.
    await page.goto("/admin/login");
    await page.evaluate(() => localStorage.setItem("theme", "dark"));
    await page.reload();

    await expect(page.getByRole("heading", { name: /welcome/i })).toBeVisible();
    await expect(page.locator("html")).not.toHaveClass(/\bdark\b/);

    const email = page.getByLabel("Email");
    await email.fill(EMAIL);
    // The field's fill and its text must not both be light.
    const readable = await email.evaluate((el) => {
      const style = getComputedStyle(el);
      const parse = (value: string) =>
        (value.match(/[\d.]+/g) ?? []).slice(0, 3).map(Number);
      const light = (rgb: number[]) =>
        rgb.length === 3 && (rgb[0]! + rgb[1]! + rgb[2]!) / 3 > 140;
      return !(light(parse(style.color)) && light(parse(style.backgroundColor)));
    });
    expect(readable).toBe(true);
  });

  test("signs out and locks the console again", async ({ page }) => {
    await signIn(page);
    await page.goto("/admin/settings");
    await page.getByRole("button", { name: "Sign out" }).click();
    await page.waitForURL("**/admin/login");

    await page.goto("/admin");
    await expect(page).toHaveURL(/\/admin\/login/);
  });
});
