import { expect, test } from "@playwright/test";

const SECTIONS = [
  "why-us",
  "visas",
  "journey",
  "flights-hotels",
  "experiences",
  "contact",
  "faq",
];

test.describe("landing page", () => {
  test("renders every live section", async ({ page }) => {
    await page.goto("/");
    for (const id of SECTIONS) {
      await expect(page.locator(`#${id}`)).toBeAttached();
    }
  });

  test("each service section carries its own CTA", async ({ page }) => {
    await page.goto("/");
    for (const [id, label] of [
      ["visas", /check my visa options/i],
      ["journey", /free consultation/i],
      // Flights and experiences are not live yet, so their CTA is a waitlist.
      ["flights-hotels", /notify me when it's live/i],
      ["experiences", /notify me when it's live/i],
    ] as const) {
      await expect(
        page.locator(`#${id}`).getByRole("link", { name: label }),
      ).toBeAttached();
    }
  });

  test("the coming-soon services do not dead-end", async ({ page }) => {
    await page.goto("/");
    for (const id of ["flights-hotels", "experiences"]) {
      await expect(page.locator(`#${id}`).getByText(/launching soon/i)).toBeVisible();
      // A waitlist mailto rather than a link into a flow that does not exist.
      await expect(
        page.locator(`#${id}`).getByRole("link", { name: /notify me/i }),
      ).toHaveAttribute("href", /^mailto:/);
    }
  });

  test("parked sections are not rendered", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("#packages")).toHaveCount(0);
    await expect(page.locator("#testimonials")).toHaveCount(0);
  });

  test("hero copy survives the intro animation", async ({ page }) => {
    await page.goto("/");
    // The reveal starts from autoAlpha:0 — this is the regression guard that it
    // always finishes, whatever the ticker does.
    await expect(page.getByText(/one team handling every part/i)).toBeVisible();
    await expect(page.getByRole("link", { name: /plan my trip/i })).toBeVisible();
  });

  test("header nav jumps to the visas section", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "Visas", exact: true }).first().click();
    await expect(page).toHaveURL(/#visas$/);
    await expect(
      page.getByRole("heading", { name: /Visas, without the/i }),
    ).toBeInViewport();
  });

  test("faq opens one answer at a time", async ({ page }) => {
    await page.goto("/#faq");
    const first = page.getByRole("button", { name: /which visa do i actually need/i });
    const second = page.getByRole("button", { name: /how fast can you book/i });

    await expect(first).toHaveAttribute("aria-expanded", "true");
    await second.click();
    await expect(second).toHaveAttribute("aria-expanded", "true");
    await expect(first).toHaveAttribute("aria-expanded", "false");
  });

  test("the closing CTA routes into the application pages", async ({ page }) => {
    await page.goto("/#contact");

    const contact = page.locator("#contact");
    await expect(
      contact.getByRole("link", { name: /begin application/i }),
    ).toHaveAttribute("href", "/apply");
    await expect(
      contact.getByRole("link", { name: /track my application/i }),
    ).toHaveAttribute("href", "/track");

    await contact.getByRole("link", { name: /begin application/i }).click();
    await expect(page).toHaveURL(/\/apply$/);
    await expect(page.getByRole("heading", { name: "About you" })).toBeVisible();
  });

  test("unknown routes render the 404 page", async ({ page }) => {
    await page.goto("/this-route-does-not-exist");
    await expect(page.getByText(/different route/i)).toBeVisible();
  });
});
