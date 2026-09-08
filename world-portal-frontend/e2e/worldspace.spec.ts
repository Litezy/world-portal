import { expect, type Page, test } from "@playwright/test";

/**
 * Where WorldSpace lives. Mirrors `NEXT_PUBLIC_WORLDSPACE_URL`, whose default
 * is set in `src/config/env.ts` — the spec cannot import the app's config, so
 * it reads the same variable the server did.
 */
const WORLDSPACE_ORIGIN = new URL(
  process.env.NEXT_PUBLIC_WORLDSPACE_URL ?? "https://worldspace.example",
).origin;

const section = (page: Page) => page.locator("[data-worldspace-section]");
const cards = (page: Page) => page.locator("[data-worldspace-post]");

/**
 * Land on the section with its reveal played out.
 *
 * `Reveal` hides its children with `autoAlpha: 0` until ScrollTrigger fires, so
 * everything this far down the page is attached but `visibility: hidden` until
 * it has been scrolled to. Scrolled from the locator rather than through
 * `/#worldspace`, so the spec does not depend on the section's anchor id.
 */
async function openSection(page: Page) {
  await page.goto("/");
  await expect(section(page)).toBeAttached();
  await section(page).evaluate((el) => el.scrollIntoView({ block: "center" }));
}

/**
 * The anchor for each card, whichever way the markup is shaped: the card may be
 * the `<a>` itself or wrap one. Read in a single pass so the assertions below
 * cover *every* card — one wrong permalink is the whole failure mode here.
 */
async function cardLinks(page: Page) {
  return cards(page).evaluateAll((els) =>
    els.map((el) => {
      const a = el.closest("a") ?? el.querySelector("a");
      const img = el.querySelector("img");
      return {
        href: a?.getAttribute("href") ?? null,
        target: a?.getAttribute("target") ?? null,
        rel: a?.getAttribute("rel") ?? null,
        alt: img?.getAttribute("alt") ?? null,
      };
    }),
  );
}

test.describe("worldspace experiences", () => {
  test("renders on the landing page with a wall of posts", async ({ page }) => {
    await openSection(page);
    // Structural locators throughout: the copy on this section is placeholder
    // and will be rewritten; the data attributes are the contract.
    expect(await cards(page).count()).toBeGreaterThanOrEqual(3);
    await expect(cards(page).first()).toBeVisible();
  });

  test("every card is an outbound link to WorldSpace", async ({ page }) => {
    await openSection(page);
    const links = await cardLinks(page);
    expect(links.length).toBeGreaterThanOrEqual(3);

    for (const [i, link] of links.entries()) {
      expect(link.href, `card ${i} is not a link`).toBeTruthy();
      // Checked on every card, not just the first: a permalink that quietly
      // points back at E-Embassy is a 404 on our own site instead of the post.
      expect(link.href!.startsWith(WORLDSPACE_ORIGIN), `card ${i}: ${link.href}`).toBe(
        true,
      );
      expect(link.target, `card ${i}: ${link.href}`).toBe("_blank");
      // Without noopener the new tab can reach back through window.opener.
      expect(link.rel ?? "", `card ${i}: ${link.href}`).toContain("noopener");
    }
  });

  test("every card names its photograph for a screen reader", async ({ page }) => {
    await openSection(page);
    const links = await cardLinks(page);
    expect(links.length).toBeGreaterThanOrEqual(3);

    for (const [i, link] of links.entries()) {
      expect(link.alt, `card ${i} has no image`).not.toBeNull();
      expect(link.alt!.trim(), `card ${i} has an empty alt`).not.toBe("");
    }
  });

  test("says so while the posts are placeholders", async ({ page }) => {
    await openSection(page);
    const source = await section(page).getAttribute("data-worldspace-source");
    expect(source).toMatch(/^(placeholder|live)$/);

    // Located both ways so this keeps passing the day the feed goes live and
    // the notice comes out.
    const notice = section(page)
      .locator("[data-worldspace-notice]")
      .or(section(page).getByText(/placeholder|sample|not a live feed/i))
      .first();

    if (source === "placeholder") {
      // The page must never present sample posts as a real feed.
      await expect(notice).toBeVisible();
    } else {
      await expect(notice).toHaveCount(0);
    }
  });

  test("the closing CTA opens WorldSpace in a new tab", async ({ page }) => {
    await openSection(page);
    const permalinks = new Set((await cardLinks(page)).map((l) => l.href));

    // Whatever else is in the section, one WorldSpace link is not a post
    // permalink — that is the "see more on WorldSpace" CTA. Found by
    // elimination rather than by its label, which is still being worded.
    const hrefs = await section(page)
      .locator(`a[href^="${WORLDSPACE_ORIGIN}"]`)
      .evaluateAll((as) => as.map((a) => a.getAttribute("href")!));
    const ctaHref = hrefs.find((href) => !permalinks.has(href));

    expect(ctaHref, "no WorldSpace CTA outside the post permalinks").toBeTruthy();
    // It goes somewhere on WorldSpace, not just to the origin's front door.
    expect(ctaHref!.length).toBeGreaterThan(WORLDSPACE_ORIGIN.length + 1);

    const cta = section(page).locator(`a[href="${ctaHref}"]`).first();
    await expect(cta).toHaveAttribute("target", "_blank");
    await expect(cta).toHaveAttribute("rel", /noopener/);
  });

  // Deliberately no click-through anywhere in this file: WorldSpace is another
  // origin and may not exist yet. The attributes are the whole assertion.
});
