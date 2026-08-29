import { expect, test } from "@playwright/test";

const SECTIONS = [
  "why-us",
  "passports",
  "visas",
  "journey",
  "flights-hotels",
  "experiences",
  "start-here",
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
      ["passports", /start a passport application/i],
      ["visas", /start a visa application/i],
      ["journey", /start my trip/i],
      // Not live yet — these lead to a page that explains what is coming.
      ["flights-hotels", /see how it will work/i],
      ["experiences", /see how it will work/i],
    ] as const) {
      await expect(
        page.locator(`#${id}`).getByRole("link", { name: label }),
      ).toBeAttached();
    }
  });

  test("the coming-soon services lead to a real page", async ({ page }) => {
    await page.goto("/");
    for (const [id, href] of [
      ["flights-hotels", "/services/flights"],
      ["experiences", "/services/experiences"],
    ] as const) {
      await expect(page.locator(`#${id}`).getByText(/not open yet/i)).toBeVisible();
      await expect(
        page.locator(`#${id}`).getByRole("link", { name: /see how it will work/i }),
      ).toHaveAttribute("href", href);
    }
  });

  test("every internal link on the page resolves", async ({ page, request }) => {
    await page.goto("/");
    const hrefs = await page
      .locator('a[href^="/"]')
      .evaluateAll((links) =>
        [...new Set(links.map((l) => l.getAttribute("href")!))].filter(Boolean),
      );

    expect(hrefs.length).toBeGreaterThan(3);
    for (const href of hrefs) {
      const response = await request.get(href);
      expect(response.status(), `${href} should not 404`).toBeLessThan(400);
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
    await expect(page.getByText(/we sort out the passport/i)).toBeVisible();
    await expect(
      page.getByRole("link", { name: /start my trip/i }).first(),
    ).toBeVisible();
  });

  test("header nav jumps to the visas section", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "Visas", exact: true }).first().click();
    await expect(page).toHaveURL(/#visas$/);
    await expect(
      page.getByRole("heading", { name: /The visa part/i }),
    ).toBeInViewport();
  });

  test("faq opens one answer at a time", async ({ page }) => {
    await page.goto("/#faq");
    const first = page.getByRole("button", {
      name: /difference between a passport and a visa/i,
    });
    const second = page.getByRole("button", { name: /which visa do i actually need/i });

    await expect(first).toHaveAttribute("aria-expanded", "true");
    await second.click();
    await expect(second).toHaveAttribute("aria-expanded", "true");
    await expect(first).toHaveAttribute("aria-expanded", "false");
  });

  test("the closing CTA covers every service", async ({ page }) => {
    await page.goto("/#start-here");
    const cta = page.locator("#start-here");

    for (const [name, href] of [
      [/passport application/i, "/passport"],
      [/visa application/i, "/apply"],
      [/flight booking/i, "/services/flights"],
      [/hotel booking/i, "/services/hotels"],
      [/tours & experiences/i, "/services/experiences"],
      [/track an application/i, "/track"],
    ] as const) {
      await expect(cta.getByRole("link", { name })).toHaveAttribute("href", href);
    }

    await cta.getByRole("link", { name: /^start my trip$/i }).click();
    await expect(page).toHaveURL(/\/start$/);
    await expect(
      page.getByRole("heading", { name: /where are you travelling/i }),
    ).toBeVisible();
  });

  test("unknown routes render the 404 page", async ({ page }) => {
    await page.goto("/this-route-does-not-exist");
    await expect(page.getByText(/different route/i)).toBeVisible();
  });
});
