import { expect, type Locator, type Page, test } from "@playwright/test";

/**
 * Taps a control in the hero's flight search the way a finger does. Inside
 * the pinned hero, locator.click()'s own scroll-into-view sometimes smooth-
 * scrolls a phone page ~380px although the control is already on screen,
 * which carries the scene on and the search away (2026-11-09: 0 of 20 real
 * or scripted taps scrolled, about 4 in 10 locator clicks did).
 */
async function tap(target: Locator) {
  // A picker fading out still sits over the form, and would take the tap.
  await expect(
    target.page().locator("[data-radix-popper-content-wrapper]"),
  ).toHaveCount(0);
  await expect(target).toBeVisible();
  const box = await target.boundingBox();
  if (!box) throw new Error("no box to tap");
  await target.page().mouse.click(box.x + box.width / 2, box.y + box.height / 2);
}

/** Phones: the flight search is the sheet the hero ends on. */
const isPhone = (page: Page) => (page.viewportSize()?.width ?? 0) < 640;

/**
 * The hero's flight search, ready to use. On a phone it waits for the paper
 * plane to land (2026-11-09), so this taps "Book a flight", which flies there.
 */
async function openSearch(page: Page) {
  // Hydrated first: the hero's scene writes the copy's style once React runs.
  // A tap before that is a plain form post or link (2026-11-09: one search
  // tap under a full-suite load showed no "pick where" nudge).
  await expect(page.locator("[data-hero-copy]")).toHaveAttribute("style", /opacity/);
  if (isPhone(page)) {
    await tap(page.getByRole("link", { name: /^book a flight$/i }));
    await expect(page.locator("[data-sheet-title]")).toBeFocused();
  }
  const search = page.getByRole("search", { name: /book a flight/i });
  await expect(search).toBeVisible();
  return search;
}

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
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    // Phones give the lead line's room to the search.
    if ((page.viewportSize()?.width ?? 0) >= 640) {
      await expect(page.getByText(/we sort out the passport/i)).toBeVisible();
    }
    // The hero's action is a flight search now (the CTO, 2026-11-09). A
    // phone tells the paper plane first and ends on the search.
    if (isPhone(page)) {
      await expect(page.getByRole("link", { name: /^book a flight$/i })).toBeVisible();
      await expect(page.getByRole("search", { name: /book a flight/i })).toHaveCount(0);
    }
    const search = await openSearch(page);
    await expect(search.getByRole("button", { name: /search flights/i })).toBeVisible();
  });

  test("on a phone the booking sheet rises once the plane has landed", async ({
    page,
  }) => {
    test.skip(!isPhone(page), "phones only");
    await page.goto("/");
    const sheet = page.locator("[data-hero-sheet]");
    await expect(sheet).toBeHidden();

    // Scrolled to the end of the pinned hero by hand, not by the button.
    const end = await page.locator("[data-hero]").evaluate((section) => {
      const panel = section.firstElementChild as HTMLElement;
      const pad = parseFloat(getComputedStyle(section).paddingTop) || 0;
      const range =
        (section as HTMLElement).offsetHeight - panel.offsetHeight - 2 * pad;
      return section.getBoundingClientRect().top + window.scrollY + range;
    });
    await page.evaluate((y) => window.scrollTo({ top: y, behavior: "instant" }), end);
    await expect(sheet).toBeVisible();
    await expect(sheet.getByRole("search", { name: /book a flight/i })).toBeInViewport({
      ratio: 1,
    });

    // And back to the top: the title again, the sheet gone.
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
    await expect(sheet).toBeHidden();
    await expect(page.getByRole("heading", { level: 1 })).toBeInViewport();
  });

  test("the hero search hands the trip to the planner", async ({ page }) => {
    await page.goto("/");
    const search = await openSearch(page);

    // Nothing picked yet: it says what is missing and opens that picker.
    await tap(search.getByRole("button", { name: /search flights/i }));
    await expect(search.getByText(/pick where you are flying to/i)).toBeVisible();
    const open = page.locator('[role="dialog"][data-state="open"]');
    await open.getByPlaceholder(/city, airport or country/i).fill("dubai");
    await open.getByRole("option", { name: /dubai/i }).first().click();

    // The calendar follows; out on the 10th of next month, back on the 17th.
    const calendar = page.locator('[role="dialog"][data-state="open"]');
    await calendar.getByRole("button", { name: /next month/i }).click();
    const days = calendar
      .locator(".rdp-month")
      .first()
      .locator(".rdp-day:not(.rdp-outside) button");
    await days.nth(9).click();
    await days.nth(16).click();

    await tap(search.getByRole("button", { name: /search flights/i }));
    await expect(page).toHaveURL(
      /\/start\?from=LOS&to=DXB&trip=return&depart=\d{4}-\d{2}-10&return=\d{4}-\d{2}-17/,
    );
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      /lagos to dubai/i,
    );
    await expect(page.locator("[data-flight-banner]")).toContainText(
      "Lagos (LOS) to Dubai (DXB)",
    );
    // The route is answered, so it opens on the passport question.
    await expect(
      page.getByRole("heading", { name: /do you have a passport/i }),
    ).toBeVisible();
  });

  test("a one-way search needs no return date", async ({ page }) => {
    await page.goto("/");
    const search = await openSearch(page);
    await tap(search.getByRole("radio", { name: /one way/i }));
    await tap(search.getByRole("button", { name: /^to/i }));
    const open = page.locator('[role="dialog"][data-state="open"]');
    await open.getByPlaceholder(/city, airport or country/i).fill("lhr");
    await open
      .getByRole("option", { name: /london/i })
      .first()
      .click();
    const calendar = page.locator('[role="dialog"][data-state="open"]');
    await calendar.getByRole("button", { name: /next month/i }).click();
    await calendar
      .locator(".rdp-month")
      .first()
      .locator(".rdp-day:not(.rdp-outside) button")
      .nth(4)
      .click();
    await tap(search.getByRole("button", { name: /search flights/i }));
    await expect(page).toHaveURL(/to=LHR&trip=one-way&depart=/);
    await expect(page).not.toHaveURL(/return=/);
  });

  test("the hero forecast card renders with the copy", async ({ page }) => {
    // From lg the flight search takes the card's place, and on phones the
    // booking sheet does; a tablet with reduced motion shows it with the copy.
    await page.setViewportSize({ width: 820, height: 1180 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    // Found by structure rather than by copy: the card holds placeholder data
    // that will be reworded, but it is revealed from autoAlpha:0 like the copy
    // column and the tween must always finish.
    const card = page.locator("[data-hero-forecast]");
    await expect(card).toBeVisible();
    // The destination and its temperature are the two things the card exists to
    // show. Matched loosely so a copy edit does not fail the suite.
    await expect(card).toContainText(/mal[eé]/i);
    await expect(card).toContainText(/\d+\s*°/);
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
