import { expect, test } from "@playwright/test";

/**
 * These behaviours cannot be checked by eye in a backgrounded tab —
 * requestIdleCallback never fires there and GSAP is deliberately deferred — so
 * they are asserted here, where the page is genuinely visible.
 */
test.describe("motion", () => {
  test("the WebGL layers mount once the browser is idle", async ({ page }) => {
    await page.goto("/");
    // Hero: the photograph shader and the EXPLORE wordmark are separate layers.
    await expect(page.locator("section").first().locator("canvas")).toHaveCount(2, {
      timeout: 15000,
    });
  });

  test("the EXPLORE wordmark keeps a real text node underneath", async ({ page }) => {
    await page.goto("/");
    // The shader is decoration; the word must exist as text regardless.
    await expect(page.getByText("EXPLORE", { exact: true }).first()).toBeAttached();
  });

  test("journey steps play forwards and rewind on the way back up", async ({
    page,
  }) => {
    await page.goto("/");

    const opacity = () =>
      page
        .locator("#journey [data-step-part]")
        .first()
        .evaluate((el) => Number(getComputedStyle(el).opacity));

    const top = await page.locator("#journey").evaluate((el) => {
      return el.getBoundingClientRect().top + window.scrollY;
    });

    // Above the section: the first step has not arrived yet.
    await page.evaluate(
      (y) => window.scrollTo({ top: y - 900, behavior: "instant" }),
      top,
    );
    await page.waitForTimeout(1200);
    const before = await opacity();

    // Scrolled into it: the step is in place.
    await page.evaluate(
      (y) => window.scrollTo({ top: y + 700, behavior: "instant" }),
      top,
    );
    await page.waitForTimeout(1400);
    const during = await opacity();

    // Back out again: it must rewind rather than stay stuck on screen.
    await page.evaluate(
      (y) => window.scrollTo({ top: y - 900, behavior: "instant" }),
      top,
    );
    await page.waitForTimeout(1400);
    const after = await opacity();

    expect(during, "step should be visible once scrolled into").toBeGreaterThan(0.8);
    expect(before, "step should start hidden").toBeLessThan(0.5);
    expect(after, "scrolling back up must reverse it").toBeLessThan(0.5);
  });

  test("the journey renders its WebGL route trail", async ({ page }) => {
    await page.goto("/#journey");
    await expect(page.locator("#journey canvas")).toHaveCount(1, { timeout: 15000 });
  });
});
