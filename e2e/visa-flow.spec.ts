import { expect, type Page, test } from "@playwright/test";

/**
 * The live API is a Cloudflare Quick Tunnel whose host changes on every
 * restart, so these stub it at the network layer using the exact response
 * shapes the integration guide documents — including the awkward ones (string
 * array validation messages on a 400, decimals as strings).
 */
/**
 * /apply now opens on the route check — which visa this origin/destination pair
 * needs — because everything after it depends on the answer.
 */
async function pickCountry(page: Page, field: string, country: string) {
  await page.getByLabel(field).click();
  const open = page.locator('[role="dialog"][data-state="open"]');
  await open.getByPlaceholder("Search countries").fill(country);
  // Click the filtered result rather than matching its label: the displayed
  // name can differ from what you type ("Turkey" -> "Türkiye").
  await open.getByRole("option").first().click();
}

/** Walks the route check and lands on step 1 of the chosen branch. */
async function enterApplication(page: Page, to = "Turkey") {
  await page.goto("/apply");
  await pickCountry(page, "Passport / travelling from", "Nigeria");
  await pickCountry(page, "Travelling to", to);
  await page.getByRole("button", { name: /check what i need/i }).click();
  await page.getByRole("button", { name: /continue my|start my embassy/i }).click();
  await expect(page.getByRole("heading", { name: "About you" })).toBeVisible();
}

const API = "**/*trycloudflare.com/api";

const APPLICATION = {
  id: "8f1c6e40-0000-4000-8000-000000000000",
  applicationNo: "VISA-2026-8941",
  firstName: "Ada",
  lastName: "Lovelace",
  email: "ada@example.com",
  targetCountry: "Canada",
  visaCategory: "TOURIST",
  status: "UNDER_REVIEW",
  paymentStatus: "PARTIALLY_PAID",
  totalAmount: "500.00",
  amountPaid: "250.00",
  balanceDue: "250.00",
  allowInstallment: true,
  verificationNotes: null,
  rejectionReason: null,
  childrenBirthCertUrls: [],
  landedPropertyDocUrls: [],
  previousVisasScanUrls: [],
  supportingDocUrls: [],
  createdAt: "2026-08-01T10:00:00.000Z",
  updatedAt: "2026-08-20T10:00:00.000Z",
};

async function stubUpload(page: Page) {
  await page.route(`${API}/upload`, (route) =>
    route.fulfill({
      status: 201,
      contentType: "application/json",
      body: JSON.stringify({
        url: "https://cdn.example.com/documents/passport.pdf",
        key: "documents/passport.pdf",
        originalName: "passport.pdf",
        mimeType: "application/pdf",
        size: 1024,
      }),
    }),
  );
}

async function fillThroughDocuments(page: Page) {
  await page.getByLabel(/first name/i).fill("Ada");
  await page.getByLabel(/last name/i).fill("Lovelace");
  await page.getByLabel(/email address/i).fill("ada@example.com");
  await page.getByLabel(/nationality/i).fill("British");
  await page.getByRole("button", { name: /^continue$/i }).click();

  await expect(page.getByRole("heading", { name: "Passport" })).toBeVisible();
  await page.getByRole("button", { name: /^continue$/i }).click();

  await expect(page.getByRole("heading", { name: "Your trip" })).toBeVisible();
  // Destination is already filled in from the route check.
  await expect(page.getByLabel(/destination country/i)).not.toHaveValue("");
  await page.getByRole("button", { name: /^continue$/i }).click();

  await expect(page.getByRole("heading", { name: "Documents" })).toBeVisible();

  // Two required uploads, each posted to /upload the moment it is chosen.
  for (const label of [/passport data page/i, /passport photograph/i]) {
    await page.getByLabel(label).setInputFiles({
      name: "passport.pdf",
      mimeType: "application/pdf",
      buffer: Buffer.from("%PDF-1.4 test"),
    });
  }
  await expect(page.getByText("passport.pdf").first()).toBeVisible();
}

test.describe("visa application", () => {
  test("blocks the step until its own fields are valid", async ({ page }) => {
    await enterApplication(page);
    await page.getByRole("button", { name: /^continue$/i }).click();

    await expect(page.getByText(/enter your first name/i)).toBeVisible();
    await expect(page.getByRole("heading", { name: "About you" })).toBeVisible();
  });

  test("submits and shows the application reference", async ({ page }) => {
    await stubUpload(page);
    await page.route(`${API}/visa-documentation`, (route) =>
      route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify(APPLICATION),
      }),
    );

    await enterApplication(page);
    await fillThroughDocuments(page);
    await page.getByRole("button", { name: /submit application/i }).click();

    await expect(page.getByText(/application submitted/i)).toBeVisible();
    await expect(page.getByText("VISA-2026-8941")).toBeVisible();
  });

  test("maps the API's flat validation array back onto the fields", async ({
    page,
  }) => {
    await stubUpload(page);
    await page.route(`${API}/visa-documentation`, (route) =>
      route.fulfill({
        status: 400,
        contentType: "application/json",
        // The documented quirk: `message` is a string[], there is no `errors`
        // object, and the status is 400 rather than 422.
        body: JSON.stringify({
          statusCode: 400,
          message: ["email must be an email"],
          error: "Bad Request",
        }),
      }),
    );

    await enterApplication(page);
    await fillThroughDocuments(page);
    await page.getByRole("button", { name: /submit application/i }).click();

    // It must jump back to the step that owns the field and flag it inline,
    // not dump a comma-joined sentence into a toast.
    await expect(page.getByRole("heading", { name: "About you" })).toBeVisible();
    await expect(page.getByText(/email must be an email/i)).toBeVisible();
  });

  test("rejects an oversized upload before it leaves the browser", async ({ page }) => {
    await enterApplication(page);
    await fillThroughDocuments(page).catch(() => {});
    await page.getByRole("heading", { name: "Documents" }).waitFor();

    await page.getByLabel(/proof of funds/i).setInputFiles({
      name: "huge.pdf",
      mimeType: "application/pdf",
      buffer: Buffer.alloc(11 * 1024 * 1024),
    });
    await expect(page.getByText(/the limit is 10MB/i)).toBeVisible();
  });
});

test.describe("application tracking", () => {
  test("renders the status timeline and parses string decimals", async ({ page }) => {
    await page.route(`${API}/visa-documentation/**`, (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(APPLICATION),
      }),
    );

    await page.goto("/track?ref=VISA-2026-8941");

    // The reference shows in the input and again on the result card.
    await expect(page.getByText("VISA-2026-8941").last()).toBeVisible();
    await expect(page.getByText("Under review").first()).toBeVisible();
    await expect(page.getByText("Part paid")).toBeVisible();
    // "500.00" / "250.00" arrive as strings and must survive formatting.
    await expect(page.getByText(/500 · 250 paid/)).toBeVisible();
  });

  test("explains an unknown reference instead of showing a raw error", async ({
    page,
  }) => {
    await page.route(`${API}/visa-documentation/**`, (route) =>
      route.fulfill({
        status: 404,
        contentType: "application/json",
        body: JSON.stringify({
          statusCode: 404,
          message: "Visa application record with identifier 'NOPE' not found.",
          error: "Not Found",
        }),
      }),
    );

    await page.goto("/track?ref=NOPE");
    await expect(page.getByText(/could not find that reference/i)).toBeVisible();
  });

  test("surfaces an unreachable API as a plain-English message", async ({ page }) => {
    await page.route(`${API}/visa-documentation/**`, (route) => route.abort("failed"));

    await page.goto("/track?ref=VISA-2026-8941");
    await expect(
      page.getByText(/could not reach the world portal service/i),
    ).toBeVisible();
  });
});

test.describe("visa route check", () => {
  test("an embassy route drops the document step entirely", async ({ page }) => {
    await page.goto("/apply");
    await pickCountry(page, "Passport / travelling from", "Nigeria");
    await pickCountry(page, "Travelling to", "France");
    await page.getByRole("button", { name: /check what i need/i }).click();

    await expect(page.getByText(/T\.Visa \(Traditional Visa\)/i)).toBeVisible();
    await expect(page.getByText(/finishes in person/i)).toBeVisible();

    await page.getByRole("button", { name: /start my embassy application/i }).click();
    // Three steps, not four — there is nothing to upload for an embassy filing.
    await expect(page.locator("ol li button")).toHaveCount(3);
  });

  test("an online route keeps all four steps", async ({ page }) => {
    await page.goto("/apply");
    await pickCountry(page, "Passport / travelling from", "Nigeria");
    await pickCountry(page, "Travelling to", "Turkey");
    await page.getByRole("button", { name: /check what i need/i }).click();

    await expect(page.getByText(/eVisa/i).first()).toBeVisible();
    await page.getByRole("button", { name: /continue my/i }).click();
    await expect(page.locator("ol li button")).toHaveCount(4);
  });

  test("a visa-free pair says so instead of selling an application", async ({
    page,
  }) => {
    await page.goto("/apply");
    await pickCountry(page, "Passport / travelling from", "France");
    await pickCountry(page, "Travelling to", "Germany");
    await page.getByRole("button", { name: /check what i need/i }).click();

    await expect(page.getByText(/no visa needed/i)).toBeVisible();
    await expect(
      page.getByRole("link", { name: /plan the rest of the trip/i }),
    ).toBeVisible();
  });
});
