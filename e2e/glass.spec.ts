import { expect, test } from "@playwright/test";

/**
 * Regression guard for a bug that shipped silently for several rounds.
 *
 * Hand-writing `-webkit-backdrop-filter` next to the standard property makes
 * Lightning CSS emit *only* the legacy alias, which Chrome ignores — so every
 * glass surface quietly stopped blurring and just looked translucent. Nothing
 * about the page looked broken, which is exactly why it survived so long.
 */
const SURFACES = [
  { name: "why-us cards", selector: "#why-us .glass-frost-dark" },
  { name: "closing CTA card", selector: "#start-here .glass-frost-dark" },
];

test.describe("glass", () => {
  test("every glass surface actually blurs its backdrop", async ({ page }) => {
    await page.goto("/");

    for (const { name, selector } of SURFACES) {
      const el = page.locator(selector).first();
      await expect(el, `${name} should exist`).toBeAttached();

      const backdrop = await el.evaluate(
        (node) => getComputedStyle(node).backdropFilter,
      );
      expect(backdrop, `${name} must blur, got "${backdrop}"`).not.toBe("none");
      expect(backdrop).toMatch(/blur\(\d/);
    }
  });

  test("the shared .glass surface blurs too", async ({ page }) => {
    await page.goto("/apply");
    const backdrop = await page
      .locator(".glass")
      .first()
      .evaluate((node) => getComputedStyle(node).backdropFilter);
    expect(backdrop).toMatch(/blur\(\d/);
  });

  test("the journey panel is layered, not one banding gradient", async ({ page }) => {
    await page.goto("/");
    const panel = page.locator("#journey .grain").first();
    await expect(panel).toBeAttached();

    // A photographic base sits under the wash so the panel has texture.
    await expect(panel.locator("img").first()).toBeAttached();

    // The grain layer is what dithers the gradient; without it the wash bands.
    const grain = await panel.evaluate(
      (el) => getComputedStyle(el, "::after").backgroundImage,
    );
    expect(grain).toContain("svg");
  });

  test("the brand colour comes from the logo", async ({ page }) => {
    await page.goto("/");
    const primary = await page.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue("--primary").trim(),
    );
    // #0050c1 — the deep blue swoosh.
    expect(primary.toLowerCase()).toBe("#0050c1");
  });
});
