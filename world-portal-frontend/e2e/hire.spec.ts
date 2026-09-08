import { expect, type Page, test } from "@playwright/test";

/** "$1,280" -> 1280. Cards and drawer both render via formatCurrency. */
function toNumber(money: string) {
  return Number(money.replace(/[^0-9.]/g, ""));
}

const cards = (page: Page) => page.getByRole("article");
const basketButton = (page: Page) => page.getByRole("button", { name: /trip basket/i });
const count = (page: Page) => page.getByText(/professionals? available/);

/** The header nav collapses into a sheet below lg. */
async function openNav(page: Page) {
  const menu = page.getByRole("button", { name: /open menu/i });
  if (await menu.isVisible()) await menu.click();
}

test.describe("hire a pro", () => {
  test("is reachable from the nav and lists professionals", async ({ page }) => {
    await page.goto("/");
    await openNav(page);
    await page.getByRole("link", { name: "Hire a pro" }).first().click();

    await expect(page).toHaveURL(/\/hire\/?$/);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    expect(await cards(page).count()).toBeGreaterThan(5);
  });

  test("filtering by profession narrows the list", async ({ page }) => {
    await page.goto("/hire");
    const all = await cards(page).count();

    await page.getByRole("button", { name: "Photographer", exact: true }).click();
    await expect(count(page)).not.toContainText(`${all} `);

    const filtered = await cards(page).count();
    expect(filtered).toBeGreaterThan(0);
    expect(filtered).toBeLessThan(all);
    await expect(count(page)).toContainText(String(filtered));
  });

  test("searching matches on cities, not just names", async ({ page }) => {
    await page.goto("/hire");
    const all = await cards(page).count();

    await page.getByLabel("Search professionals").fill("Tokyo");
    // The input is debounced — wait for the list to settle before reading it.
    await expect(count(page)).not.toContainText(`${all} `);

    for (const card of await cards(page).all()) {
      await expect(card).toContainText("Tokyo");
    }
  });

  test("clicking a professional opens a modal with their full details", async ({
    page,
  }) => {
    await page.goto("/hire");
    const name = await cards(page).first().getByRole("heading").textContent();

    await cards(page)
      .first()
      .getByRole("button", { name: /view .* profile/i })
      .click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText(name!.trim());
    // The detail the card has no room for.
    await expect(dialog).toContainText(/languages/i);
    await expect(dialog).toContainText(/experience/i);
    await expect(dialog).toContainText(/packages/i);
    await expect(dialog).toContainText(/included/i);
    await expect(dialog).toContainText(/cancellation/i);

    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
  });

  test("cards in a row line up regardless of how long the tagline is", async ({
    page,
  }) => {
    await page.goto("/hire");
    // A <button> centres its own contents, so a stretched card used to float a
    // short profile down the middle while its neighbours sat at the top.
    const tops = await page
      .getByRole("article")
      .locator("h3")
      .evaluateAll((els) =>
        els.slice(0, 3).map((e) => Math.round(e.getBoundingClientRect().top)),
      );

    expect(new Set(tops).size).toBe(1);
  });

  test("the basket totals what you selected and survives a reload", async ({
    page,
  }) => {
    await page.goto("/hire");

    await cards(page).nth(0).getByRole("button", { name: "Add" }).click();
    await expect(
      cards(page).nth(0).getByRole("button", { name: "In basket" }),
    ).toBeVisible();
    await expect(basketButton(page)).toHaveAccessibleName(/1 item\b/);

    await cards(page).nth(1).getByRole("button", { name: "Add" }).click();
    await expect(basketButton(page)).toHaveAccessibleName(/2 items/);

    await basketButton(page).click();
    const drawer = page.getByRole("dialog");
    await expect(drawer).toBeVisible();

    // Every money figure in the panel: one per line, then the total last.
    const money = (await drawer.getByText(/^\$[\d,]+$/).allTextContents()).map(
      toNumber,
    );
    const total = money.at(-1)!;
    const lines = money.slice(0, -1);

    expect(lines).toHaveLength(2);
    expect(total).toBe(lines[0] + lines[1]);

    // Persisted, not component state.
    await page.reload();
    await expect(basketButton(page)).toHaveAccessibleName(/2 items/);
    await basketButton(page).click();
    // The drawer is code-split, so wait for its chunk before reading it.
    await expect(page.getByRole("dialog")).toBeVisible();

    const after = (
      await page
        .getByRole("dialog")
        .getByText(/^\$[\d,]+$/)
        .allTextContents()
    ).map(toNumber);
    expect(after.at(-1)).toBe(total);
  });

  test("adding the same professional twice does not duplicate the line", async ({
    page,
  }) => {
    await page.goto("/hire");
    const add = cards(page).first().getByRole("button", { name: "Add" });

    await add.click();
    await expect(basketButton(page)).toHaveAccessibleName(/1 item\b/);
    // The button has become "In basket" — pressing it again removes the line.
    await cards(page).first().getByRole("button", { name: "In basket" }).click();
    await expect(basketButton(page)).toHaveAccessibleName(/^trip basket$/i);
  });

  test("removing the last item empties the basket", async ({ page }) => {
    await page.goto("/hire");
    await cards(page).first().getByRole("button", { name: "Add" }).click();

    await basketButton(page).click();
    await page.getByRole("button", { name: /^remove /i }).click();

    await expect(page.getByText(/nothing in the basket yet/i)).toBeVisible();
  });
});
