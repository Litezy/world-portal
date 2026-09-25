import { afterEach, describe, expect, it, vi } from "vitest";

import { registerVividForm, type VividFormBinding } from "@/features/vivid/form-bridge";
import { embassyFunctions } from "@/features/vivid/functions";

const run = (name: string, args: Record<string, unknown> = {}) => {
  const fn = embassyFunctions.find((f) => f.name === name);
  if (!fn) throw new Error(`no tool ${name}`);
  return Promise.resolve(fn.handler(args)) as Promise<Record<string, unknown>>;
};

describe("the tool list", () => {
  it("has unique names, a description and an object schema for every tool", () => {
    const names = embassyFunctions.map((f) => f.name);
    expect(new Set(names).size).toBe(names.length);
    for (const fn of embassyFunctions) {
      expect(fn.description.length).toBeGreaterThan(40);
      expect(fn.parameters.type).toBe("object");
      for (const key of fn.parameters.required ?? []) {
        expect(fn.parameters.properties).toHaveProperty(key);
      }
    }
  });

  it("routes only the account reads to the server", () => {
    expect(
      embassyFunctions
        .filter((f) => f.executionContext === "server")
        .map((f) => f.name),
    ).toEqual(["getMyApplications", "getApplicationStatus"]);
  });
});

describe("checkVisaRequirement", () => {
  it("names the route for a spoken pair of countries", async () => {
    const result = await run("checkVisaRequirement", { from: "Nigeria", to: "Turkey" });
    expect(result).toMatchObject({ from: "Nigeria", completedOnline: true });
    expect(String(result.route)).toMatch(/eVisa/i);
  });

  it("says when no visa is needed", async () => {
    const result = await run("checkVisaRequirement", { from: "France", to: "Germany" });
    expect(String(result.route)).toMatch(/no visa/i);
  });

  it("asks again rather than guessing an unknown country", async () => {
    const result = await run("checkVisaRequirement", { from: "Narnia", to: "Turkey" });
    expect(result.error).toMatch(/Narnia/);
  });
});

describe("navigateToPage", () => {
  afterEach(() => vi.restoreAllMocks());

  it("navigates by destination id through the router event", async () => {
    const seen: string[] = [];
    const listener = (e: Event) =>
      seen.push((e as CustomEvent<{ path: string }>).detail.path);
    window.addEventListener("vivid:navigate", listener);

    await expect(
      run("navigateToPage", { destination: "apply_visa" }),
    ).resolves.toMatchObject({
      success: true,
    });
    window.removeEventListener("vivid:navigate", listener);
    expect(seen).toEqual(["/apply"]);
  });

  it("refuses a made-up destination and lists the real ones", async () => {
    const result = await run("navigateToPage", { destination: "/admin" });
    expect(result.error).toBeDefined();
    expect(result.destinations).toContain("my_applications");
  });
});

describe("submitApplication", () => {
  function binding(): VividFormBinding {
    return {
      id: "passport",
      title: "Passport application",
      fields: [{ name: "surname", label: "Surname", kind: "text", required: true }],
      stage: () => "form",
      steps: () => [{ title: "Personal", fields: ["surname"] }],
      currentStep: () => 0,
      getValues: () => ({ surname: "Lovelace" }),
      getErrors: () => ({}),
      setValue: () => {},
      validate: async () => true,
      validateStep: async () => true,
      showStep: () => {},
      submit: vi.fn(async () => ({ reference: "PASSPORT-2026-4242" })),
      reference: () => null,
    };
  }

  it("never submits without confirmed=true — it returns the read-back instead", async () => {
    const form = binding();
    const off = registerVividForm(form);

    const result = await run("submitApplication", { confirmed: false });
    off();

    expect(form.submit).not.toHaveBeenCalled();
    expect(result).toMatchObject({
      needsConfirmation: true,
      summary: [{ label: "Surname", value: "Lovelace" }],
    });
  });

  it("submits after confirmation and returns the reference", async () => {
    const form = binding();
    const off = registerVividForm(form);

    const result = await run("submitApplication", { confirmed: true });
    off();

    expect(form.submit).toHaveBeenCalledOnce();
    expect(result).toMatchObject({ success: true, reference: "PASSPORT-2026-4242" });
  });

  it("says there is no form when none is on screen", async () => {
    const result = await run("submitApplication", { confirmed: true });
    expect(result.error).toMatch(/no application form/i);
  });
});
