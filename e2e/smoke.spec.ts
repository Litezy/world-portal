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
      ["flights-hotels", /get a quote today/i],
      ["experiences", /browse experiences/i],
      ["journey", /free consultation/i],
    ] as const) {
      await expect(
        page.locator(`#${id}`).getByRole("link", { name: label }),
      ).toBeAttached();
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

  test("booking form validates before it submits", async ({ page }) => {
    await page.goto("/#contact");
    await page.getByRole("button", { name: /send my request/i }).click();
    await expect(page.getByText(/enter your full name/i)).toBeVisible();
  });

  test("booking form submits with the chosen service", async ({ page }) => {
    await page.goto("/#contact");
    await page.getByRole("radio", { name: /flights & hotels/i }).click();
    await page.getByLabel(/full name/i).fill("Ada Lovelace");
    await page.getByLabel(/email address/i).fill("ada@example.com");
    await page.getByLabel(/destination/i).fill("Lisbon");
    await page.getByRole("button", { name: /send my request/i }).click();
    await expect(page.getByText(/request received/i)).toBeVisible();
  });

  test("unknown routes render the 404 page", async ({ page }) => {
    await page.goto("/this-route-does-not-exist");
    await expect(page.getByText(/different route/i)).toBeVisible();
  });
});
