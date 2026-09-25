import { expect, test } from "@playwright/test";

/**
 * E-Embassy has no login of its own: applicants sign in on WorldStreet. These
 * check the hand-off without ever leaving this origin — the redirect is read
 * from its Location header, not followed to the real WorldStreet site.
 *
 * Plain API-context requests, not browser navigations: against a Clerk
 * *development* instance a navigation first bounces through Clerk's
 * dev-browser handshake, which would hide the redirect under test.
 */

test.describe("WorldStreet sign-in hand-off", () => {
  for (const path of ["/apply", "/passport", "/applicant/applications"]) {
    test(`a signed-out visitor to ${path} is sent to WorldStreet and back`, async ({
      request,
      baseURL,
    }) => {
      const response = await request.get(path, { maxRedirects: 0 });

      expect(response.status()).toBe(307);
      const location = new URL(response.headers()["location"]);
      expect(location.pathname).toBe("/login");
      expect(location.searchParams.get("redirect_url")).toBe(
        new URL(path, baseURL).toString(),
      );
    });
  }

  for (const path of ["/", "/start", "/hire"]) {
    test(`${path} stays public`, async ({ request }) => {
      const response = await request.get(path, { maxRedirects: 0 });
      expect(response.status()).toBe(200);
    });
  }

  test("the admin console keeps its own login", async ({ request }) => {
    const response = await request.get("/admin", { maxRedirects: 0 });
    expect(response.headers()["location"]).toContain("/admin/login");
  });

  test("the applicant API refuses a signed-out caller", async ({ request }) => {
    const response = await request.get("/api/me/applications");
    expect(response.status()).toBe(401);
  });
});
