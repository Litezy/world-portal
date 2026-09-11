import { expect, type Page, test } from "@playwright/test";

const section = (page: Page) => page.locator("[data-agency-section]");

/**
 * Land on the section with its reveal played out.
 *
 * `Reveal` hides its content with `autoAlpha: 0` until ScrollTrigger fires, so
 * everything this far down the page is attached but `visibility: hidden` until
 * it has been scrolled to. Scrolled from the locator rather than through
 * `/#agency`, so the spec does not depend on the section's anchor id — the nav
 * test below is what pins that.
 */
async function openSection(page: Page) {
  await page.goto("/");
  await expect(section(page)).toBeAttached();
  await section(page).evaluate((el) => el.scrollIntoView({ block: "center" }));
}

test.describe("agency pitch on the landing page", () => {
  test("renders with both doors for an agency owner", async ({ page }) => {
    await openSection(page);

    // Structural locators throughout: this copy is a first draft and will be
    // reworded. The two hrefs are the contract — they are the only way into
    // the agency side of the product from the public site.
    const signup = section(page).locator('a[href="/agency/signup"]');
    const login = section(page).locator('a[href="/agency/login"]');

    await expect(signup.first()).toBeVisible();
    await expect(login.first()).toBeVisible();
  });

  test("shows the services an agency can list", async ({ page }) => {
    await openSection(page);
    // Rendered from `categoryCatalog`, so this is a guard that the grid is
    // still driven by the catalog rather than by a list typed into the
    // component. Counted loosely: categories get added.
    const tiles = section(page).locator("ul li");
    expect(await tiles.count()).toBeGreaterThanOrEqual(6);
  });

  test("the nav link points at the section, root-relative", async ({ page }) => {
    await page.goto("/");
    const link = page.getByRole("link", { name: "Agency", exact: true }).first();
    await expect(link).toBeAttached();
    // "/#agency", never a bare "#agency": a bare hash on a page under (app)
    // only rewrites the URL, because the section lives on the landing page.
    await expect(link).toHaveAttribute("href", "/#agency");
  });

  test("the anchor lands on the section", async ({ page }) => {
    await page.goto("/#agency");
    await expect(section(page)).toBeInViewport();
  });
});

test.describe("the agency guard", () => {
  test("sends an unauthenticated visitor to the agency login", async ({ page }) => {
    await page.goto("/agency");
    await expect(page).toHaveURL(/\/agency\/login\?next=%2Fagency$/);
  });

  test("carries the path it turned away in the next param", async ({ page }) => {
    await page.goto("/agency/assignments");
    await expect(page).toHaveURL(/\/agency\/login\?next=%2Fagency%2Fassignments$/);
  });

  for (const path of ["/agency/login", "/agency/signup"]) {
    test(`${path} is public`, async ({ page }) => {
      // Public by necessity: an agency that has not listed yet has no session,
      // so guarding these would make listing impossible.
      const response = await page.goto(path);
      expect(response?.status(), `${path} should not error`).toBeLessThan(400);
      await expect(page).toHaveURL(new RegExp(`${path}$`));
      await expect(page.locator("form")).toBeAttached();
      await expect(page.locator('input[type="password"]').first()).toBeAttached();
    });
  }

  // No sign-in anywhere in this file. The agency auth is mock and owned
  // elsewhere; what the middleware does when there is *no* session is the
  // whole of what this spec is for.
});

test.describe("the admin console is undisturbed", () => {
  // The middleware now matches two prefixes. This is the regression guard that
  // adding the agency branch did not change what /admin does — the two guards
  // are independent on purpose, and neither cookie opens the other's console.
  test("still turns an unauthenticated visitor away from /admin", async ({ page }) => {
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/admin\/login\?next=%2Fadmin$/);
  });

  test("still reaches its own login rather than the agency one", async ({ page }) => {
    await page.goto("/admin/applications");
    await expect(page).toHaveURL(/\/admin\/login\?next=%2Fadmin%2Fapplications$/);
    await expect(page).not.toHaveURL(/\/agency/);
  });
});
