import { isValidElement, type ReactNode } from "react";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

import { beforeEach, describe, expect, it, vi } from "vitest";

import { createAgencySessionToken } from "@/server/agency/session";
import { createSessionToken } from "@/server/auth/session";

/**
 * The console layouts and pages read the session on the server and hand the
 * signed-in user to components, client ones included, whose props are
 * serialized into the page. The admin session carries the World Portal access
 * token, so nothing they render may be handed it.
 */

const jar = vi.hoisted(() => new Map<string, string>());
vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) => (jar.has(name) ? { value: jar.get(name) } : undefined),
  }),
}));

/** The development default; vitest does not load `.env.local`. */
const SESSION_SECRET = "world-portal-dev-session-secret";
const API_TOKEN = "backend-access-token-must-stay-on-the-server";

const { default: AdminConsoleLayout } =
  await import("@/app/(admin)/admin/(console)/layout");
const { default: AdminSettingsPage } =
  await import("@/app/(admin)/admin/(console)/settings/page");
const { default: AgencyConsoleLayout } =
  await import("@/app/(agency)/agency/(console)/layout");
const { default: AgencySettingsPage } =
  await import("@/app/(agency)/agency/(console)/settings/page");

/** Every prop handed to every element in a rendered tree, children aside. */
function propsIn(node: ReactNode): Record<string, unknown>[] {
  if (Array.isArray(node)) return node.flatMap((child: ReactNode) => propsIn(child));
  if (!isValidElement(node)) return [];
  const { children, ...props } = node.props as { children?: ReactNode };
  return [props, ...propsIn(children)];
}

function serialized(tree: ReactNode) {
  // React's own bookkeeping (`_owner`, `_store`) is not props; skip it.
  return JSON.stringify(propsIn(tree), (key, value: unknown) =>
    key.startsWith("_") ? undefined : value,
  );
}

function usersIn(tree: ReactNode) {
  return propsIn(tree)
    .map((props) => props.user)
    .filter((user) => user !== undefined);
}

beforeEach(() => {
  jar.clear();
});

describe("admin console", () => {
  beforeEach(() => {
    jar.set(
      "wp_admin_session",
      createSessionToken(
        {
          id: "usr_1",
          name: "Ada Desk",
          email: "ada@example.com",
          role: "MANAGER",
          token: API_TOKEN,
        },
        SESSION_SECRET,
      ).token,
    );
  });

  it("hands the sidebar and top bar the user without the access token", async () => {
    const tree = await AdminConsoleLayout({
      children: null,
    } as Parameters<typeof AdminConsoleLayout>[0]);

    expect(usersIn(tree)).toHaveLength(2);
    for (const user of usersIn(tree)) {
      expect(user).toEqual({
        id: "usr_1",
        name: "Ada Desk",
        email: "ada@example.com",
        role: "MANAGER",
      });
    }
    expect(serialized(tree)).not.toContain(API_TOKEN);
  });

  it("renders the settings page without handing anything the access token", async () => {
    const tree = await AdminSettingsPage();

    expect(usersIn(tree).length).toBeGreaterThan(0);
    expect(serialized(tree)).not.toContain(API_TOKEN);
  });
});

describe("agency console", () => {
  beforeEach(() => {
    // The agency cookie carries no token today. Sign one in anyway: if one is
    // ever added, it must still stop at the layout.
    jar.set(
      "wp_agency_session",
      createAgencySessionToken(
        {
          id: "agu_1",
          name: "Kemi Owner",
          email: "kemi@example.com",
          role: "owner",
          agencyId: "agc_1",
          agencyName: "Shield Security",
          token: API_TOKEN,
        } as Parameters<typeof createAgencySessionToken>[0],
        SESSION_SECRET,
      ).token,
    );
  });

  it("hands the sidebar and top bar only the person and the agency", async () => {
    const tree = await AgencyConsoleLayout({
      children: null,
    } as Parameters<typeof AgencyConsoleLayout>[0]);

    expect(usersIn(tree)).toHaveLength(2);
    expect(serialized(tree)).not.toContain(API_TOKEN);
  });

  it("hands the settings view only the person and the agency", async () => {
    const tree = await AgencySettingsPage();

    expect(usersIn(tree)).toHaveLength(1);
    expect(serialized(tree)).not.toContain(API_TOKEN);
  });
});

describe("every page, layout and route handler", () => {
  const appDir = path.join(process.cwd(), "src", "app");
  const files = readdirSync(appDir, { recursive: true, encoding: "utf8" })
    .filter((file) => /(^|[\\/])(page|layout|route)\.tsx?$/.test(file))
    .map((file) => ({ file, source: readFileSync(path.join(appDir, file), "utf8") }));

  it("finds the files to check", () => {
    expect(files.length).toBeGreaterThan(10);
  });

  // `{ exp, ...user } = session` keeps every other field, the token included,
  // and so does any later field nobody remembers to strip.
  it.each(files.map(({ file, source }) => [file, source]))(
    "%s does not hand on a copy of the whole session",
    (_file, source) => {
      expect(source).not.toMatch(/\.\.\.\s*\w+\s*\}\s*=\s*session\b/);
      expect(source).not.toMatch(/\.\.\.\s*session\b/);
    },
  );

  it("builds the signed-in user with the allowlist helpers", () => {
    const sourceOf = (file: string) =>
      files.find((entry) => entry.file.split(/[\\/]/).join("/") === file)?.source;

    expect(sourceOf("(admin)/admin/(console)/layout.tsx")).toContain("toClientUser(");
    expect(sourceOf("(admin)/admin/(console)/settings/page.tsx")).toContain(
      "toClientUser(",
    );
    expect(sourceOf("(agency)/agency/(console)/layout.tsx")).toContain(
      "toClientAgencyUser(",
    );
    expect(sourceOf("(agency)/agency/(console)/settings/page.tsx")).toContain(
      "toClientAgencyUser(",
    );
  });
});
