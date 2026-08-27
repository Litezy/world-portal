import { expect, type Page, test } from "@playwright/test";

const EMAIL = "admin@worldportal.travel";
const PASSWORD = "worldportal";

async function signIn(page: Page) {
  await page.goto("/admin/login");
  await page.getByLabel("Email").fill(EMAIL);
  await page.getByLabel("Password").fill(PASSWORD);
  await page.getByRole("button", { name: /sign in/i }).click();
  await page.waitForURL("**/admin");
}

test.describe("admin console", () => {
  test("guards every console route behind sign in", async ({ page }) => {
    await page.goto("/admin/enquiries");
    await expect(page).toHaveURL(/\/admin\/login\?next=%2Fadmin%2Fenquiries/);
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

  test("signs in and returns to the originally requested page", async ({ page }) => {
    await page.goto("/admin/customers");
    await page.getByLabel("Email").fill(EMAIL);
    await page.getByLabel("Password").fill(PASSWORD);
    await page.getByRole("button", { name: /sign in/i }).click();
    await expect(page).toHaveURL(/\/admin\/customers/);
    await expect(page.getByRole("heading", { name: /Your/ })).toBeVisible();
  });

  test("overview leads with the KPI row and the pipeline", async ({ page }) => {
    await signIn(page);
    await expect(page.getByText("Open enquiries")).toBeVisible();
    await expect(page.getByText("Active applications")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Visa pipeline" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Latest enquiries" })).toBeVisible();
  });

  test("filters enquiries through the URL so a view can be shared", async ({
    page,
  }) => {
    await signIn(page);
    await page.goto("/admin/enquiries?q=liu");
    await expect(page.getByRole("link", { name: "Liu Wei" })).toBeVisible();
    await expect(page.getByText(/of 1 enquiries/)).toBeVisible();
  });

  test("searching updates the URL and the result count", async ({ page }) => {
    await signIn(page);
    await page.goto("/admin/enquiries");
    await page.getByLabel("Search").fill("lisbon");
    await expect(page).toHaveURL(/q=lisbon/);
    await expect(page.getByRole("link", { name: "Ada Lovelace" })).toBeVisible();
  });

  test("opens an enquiry and reassigns it", async ({ page }) => {
    await signIn(page);
    await page.goto("/admin/enquiries?q=priya");
    await page.getByRole("link", { name: "Priya Nair" }).click();
    await expect(
      page.getByRole("heading", { level: 1, name: "Priya Nair" }),
    ).toBeVisible();

    // Pick whoever is not already selected, so the test is repeatable against
    // a warm server: Radix only fires onValueChange when the value changes.
    const assignee = page.getByLabel("Assigned consultant");
    const current = await assignee.textContent();
    const next = current?.includes("Daniel") ? "Mei Tanaka" : "Daniel Reyes";

    await assignee.click();
    await page.getByRole("option", { name: next }).click();
    await expect(page.getByText("Assignment updated")).toBeVisible();
    await expect(assignee).toContainText(next);
  });

  test("advances an application and records it on the timeline", async ({ page }) => {
    await signIn(page);
    await page.goto("/admin/applications?q=yusuf");
    await page.getByRole("link", { name: "Yusuf Adeyemi" }).click();
    await expect(
      page.getByRole("heading", { level: 1, name: "Yusuf Adeyemi" }),
    ).toBeVisible();

    const stage = page.getByLabel("Move to stage");
    const current = await stage.textContent();
    const next = current?.includes("Biometrics") ? "In review" : "Biometrics scheduled";
    const note = `Stage moved to ${next}.`;

    await stage.click();
    await page.getByRole("option", { name: next, exact: true }).click();
    await page.getByLabel("Note for the file").fill(note);
    await page.getByRole("button", { name: "Update application" }).click();

    await expect(page.getByText("Application updated")).toBeVisible();
    // The store keeps every earlier run's notes, so match the newest entry
    // rather than requiring the text to be unique on the page.
    await expect(page.getByText(note).last()).toBeVisible();
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
    await email.fill("admin@worldportal.travel");
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
