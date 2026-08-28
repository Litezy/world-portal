import { expect, type Page, test } from "@playwright/test";

/**
 * The trip planner is the front door for anyone who does not know whether they
 * need a passport, a visa or both — so what matters is that each combination of
 * answers routes to the right service, in the right order.
 */
async function pick(page: Page, field: string, country: string) {
  await page.getByLabel(field).click();
  // Radix keeps the previous popover mounted through its exit animation, so
  // scope to the one that is actually open rather than the whole page.
  const open = page.locator('[role="dialog"][data-state="open"]');
  await open.getByPlaceholder("Search countries").fill(country);
  await open
    .getByRole("option", { name: new RegExp(country, "i") })
    .first()
    .click();
}

async function chooseRoute(page: Page, from: string, to: string) {
  await pick(page, "Travelling from", from);
  await pick(page, "Travelling to", to);
  await page.getByRole("button", { name: /continue/i }).click();
}

test.describe("trip planner", () => {
  test("will not continue without both countries", async ({ page }) => {
    await page.goto("/start");
    await expect(page.getByRole("button", { name: /continue/i })).toBeDisabled();
  });

  test("a closed country picker leaves nothing behind in the DOM", async ({ page }) => {
    await page.goto("/start");
    await pick(page, "Travelling from", "Nigeria");

    // Guards against the popover's exit animation stranding a second hidden
    // search box in the tab order.
    await expect(page.getByPlaceholder("Search countries")).toHaveCount(0);
    await expect(page.getByLabel("Travelling from")).toContainText("Nigeria");
  });

  test("no passport routes to the passport page first", async ({ page }) => {
    await page.goto("/start");
    await chooseRoute(page, "Nigeria", "Canada");

    await page.getByRole("radio", { name: /do not have one/i }).click();
    await page.getByRole("radio", { name: /i need one/i }).click();
    await page.getByRole("button", { name: /see my plan/i }).click();

    const first = page.locator("ol > li").first();
    await expect(first.getByText(/get your passport/i)).toBeVisible();
    await expect(first.getByText(/do this first/i)).toBeVisible();
    await expect(
      first.getByRole("link", { name: /start passport application/i }),
    ).toHaveAttribute("href", "/passport");
  });

  test("having a passport but no visa routes straight to the visa page", async ({
    page,
  }) => {
    await page.goto("/start");
    await chooseRoute(page, "Nigeria", "Canada");

    await page.getByRole("radio", { name: /and it is valid/i }).click();
    await page.getByRole("radio", { name: /i need one/i }).click();
    await page.getByRole("button", { name: /see my plan/i }).click();

    await expect(page.getByText(/passport — you are set/i)).toBeVisible();
    // Shown twice by design: on the step itself and as the closing CTA.
    await expect(
      page.getByRole("link", { name: /start visa application/i }),
    ).toHaveCount(2);
    await expect(
      page.getByRole("link", { name: /start visa application/i }).first(),
    ).toHaveAttribute("href", "/apply");
  });

  test("an expiring passport still blocks the visa", async ({ page }) => {
    await page.goto("/start");
    await chooseRoute(page, "Nigeria", "Canada");

    await page.getByRole("radio", { name: /expires soon/i }).click();
    await page.getByRole("radio", { name: /i need one/i }).click();
    await page.getByRole("button", { name: /see my plan/i }).click();

    await expect(page.getByText(/renew your passport first/i)).toBeVisible();
  });

  test("the plan names the destination", async ({ page }) => {
    await page.goto("/start");
    await chooseRoute(page, "Nigeria", "Canada");
    await page.getByRole("radio", { name: /and it is valid/i }).click();
    await page.getByRole("radio", { name: /not sure/i }).click();
    await page.getByRole("button", { name: /see my plan/i }).click();

    await expect(page.getByText(/Nigeria to Canada/i)).toBeVisible();
  });
});

test.describe("passport application", () => {
  test("validates before it submits", async ({ page }) => {
    await page.goto("/passport");
    await page.getByRole("button", { name: /send my details/i }).click();
    await expect(page.getByText(/enter your full name/i)).toBeVisible();
  });

  test("submits and returns a reference", async ({ page }) => {
    await page.goto("/passport");
    await page.getByRole("radio", { name: /renewal/i }).click();
    await page.getByLabel(/full name/i).fill("Ada Lovelace");
    await page.getByLabel(/email address/i).fill("ada@example.com");
    await page.getByLabel(/phone/i).fill("+2348012345678");
    await page.getByLabel(/nationality/i).fill("Nigerian");
    await page.getByRole("button", { name: /send my details/i }).click();

    await expect(page.getByText(/we have your details/i)).toBeVisible();
    await expect(page.getByText(/^WPP-/)).toBeVisible();
  });
});

test.describe("service pages", () => {
  for (const slug of ["flights", "hotels", "experiences"]) {
    test(`/services/${slug} explains what is coming`, async ({ page }) => {
      await page.goto(`/services/${slug}`);
      await expect(page.getByText(/not open yet/i)).toBeVisible();
      await expect(
        page.getByRole("heading", { name: /how it will work/i }),
      ).toBeVisible();
      await expect(page.getByRole("link", { name: /start my trip/i })).toHaveAttribute(
        "href",
        "/start",
      );
    });
  }

  test("an unknown service 404s", async ({ page }) => {
    const response = await page.goto("/services/spaceflight");
    expect(response?.status()).toBe(404);
  });
});
