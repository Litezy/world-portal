import { describe, expect, it } from "vitest";

import {
  adminPaletteCookie,
  adminPaletteScript,
  DEFAULT_ADMIN_PALETTE,
  parseAdminPalette,
} from "@/config/admin-palette";

describe("admin palette", () => {
  it("keeps E-Embassy blue unless WorldStreet gold was chosen", () => {
    expect(DEFAULT_ADMIN_PALETTE).toBe("embassy");
    expect(parseAdminPalette("worldstreet")).toBe("worldstreet");
    expect(parseAdminPalette("embassy")).toBe("embassy");
    expect(parseAdminPalette(undefined)).toBe("embassy");
    expect(parseAdminPalette("")).toBe("embassy");
  });

  it("never lets a tampered cookie reach the page script", () => {
    const tampered = parseAdminPalette('"};alert(1);//');
    expect(tampered).toBe("embassy");
    expect(adminPaletteScript(tampered)).toBe(
      'document.documentElement.dataset.palette="embassy";',
    );
  });

  it("remembers the choice for a year, site-wide, same-site", () => {
    const cookie = adminPaletteCookie("worldstreet");
    expect(cookie).toContain("e-embassy-admin-palette=worldstreet");
    expect(cookie).toContain("Path=/");
    expect(cookie).toContain("Max-Age=31536000");
    expect(cookie).toContain("SameSite=Lax");
  });
});
