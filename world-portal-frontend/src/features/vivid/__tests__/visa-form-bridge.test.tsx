import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Vivid driving the REAL visa application — react-hook-form, zod, the route
 * check and the steps — through the form bridge, exactly as a voice session
 * would. Only Clerk and the network are stand-ins.
 */

vi.mock("@clerk/nextjs", () => ({
  useUser: () => ({
    isLoaded: true,
    isSignedIn: true,
    user: {
      firstName: "Ada",
      lastName: "Lovelace",
      fullName: "Ada Lovelace",
      imageUrl: null,
      primaryEmailAddress: { emailAddress: "ada@example.com" },
    },
  }),
  useClerk: () => ({ signOut: vi.fn() }),
  useAuth: () => ({ getToken: async () => "session-jwt" }),
}));

const post = vi.hoisted(() => vi.fn());
vi.mock("@/lib/api-client", async (original) => ({
  ...(await original<Record<string, unknown>>()),
  api: { post },
}));

const { ApplicationForm } = await import("@/features/visa/components/application-form");
const { getActiveVividForm } = await import("@/features/vivid/form-bridge");
const { embassyFunctions } = await import("@/features/vivid/functions");

const run = (name: string, args: Record<string, unknown> = {}) =>
  Promise.resolve(
    embassyFunctions.find((f) => f.name === name)!.handler(args),
  ) as Promise<Record<string, unknown>>;

function renderForm() {
  render(
    <QueryClientProvider client={new QueryClient()}>
      <ApplicationForm />
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  post.mockReset();
  (window as unknown as { Clerk: unknown }).Clerk = { user: { id: "user_123" } };
});
afterEach(() => {
  delete (window as unknown as { Clerk?: unknown }).Clerk;
});

describe("Vivid on the visa application", () => {
  it("runs the route check, fills each step, and submits only after a yes", async () => {
    post.mockResolvedValue({ applicationNo: "VISA-2026-7777" });
    renderForm();
    await waitFor(() => expect(getActiveVividForm()?.stage()).toBe("route-check"));

    // A T.Visa route: filed here, finished in person — so no upload step.
    const started = await run("startVisaApplication", {
      from: "Nigeria",
      to: "France",
    });
    expect(started).toMatchObject({ success: true, completedOnline: false });
    expect(started.steps).toHaveLength(3);
    await screen.findByRole("heading", { name: "About you" });

    // The email is the WorldStreet account's, filled in and not changeable.
    const state = await run("getFormState");
    expect(JSON.stringify(state)).toContain("ada@example.com");

    // Continue is refused until the step's required fields are there.
    await expect(run("goToFormStep", { direction: "next" })).resolves.toMatchObject({
      moved: false,
    });

    const filled = await run("fillFormFields", {
      entries: [
        { field: "firstName", value: "Ada" },
        { field: "lastName", value: "Lovelace" },
        { field: "nationality", value: "Nigeria" },
        { field: "gender", value: "female" },
        { field: "dateOfBirth", value: "1990-04-23" },
        { field: "email", value: "someone@else.com" },
      ],
    });
    expect(filled.filled).toEqual([
      "firstName",
      "lastName",
      "nationality",
      "gender",
      "dateOfBirth",
    ]);
    expect(filled.refused).toEqual([expect.objectContaining({ field: "email" })]);

    await expect(run("goToFormStep", { step: 3 })).resolves.toMatchObject({
      moved: true,
      step: { number: 3, title: "Your trip" },
    });
    await screen.findByRole("heading", { name: "Your trip" });

    // First call: nothing is sent, Vivid gets the read-back.
    const readBack = await run("submitApplication", { confirmed: false });
    expect(readBack.needsConfirmation).toBe(true);
    expect(post).not.toHaveBeenCalled();
    expect(readBack.summary).toEqual(
      expect.arrayContaining([
        { label: "Nationality", value: "Nigerian" },
        { label: "Destination", value: "France" },
      ]),
    );

    // Second call, after the spoken yes: filed as the WorldStreet applicant.
    const submitted = await run("submitApplication", { confirmed: true });
    expect(submitted).toMatchObject({ success: true, reference: "VISA-2026-7777" });

    const [url, payload, config] = post.mock.calls[0] as [
      string,
      Record<string, unknown>,
      { headers?: Record<string, string> },
    ];
    expect(url).toBe("/visa-documentation");
    expect(config.headers?.Authorization).toBe("Bearer session-jwt");
    expect(payload).toMatchObject({
      firstName: "Ada",
      lastName: "Lovelace",
      email: "ada@example.com",
      nationality: "Nigerian",
      gender: "FEMALE",
      targetCountry: "France",
    });
    await expect(run("getFormState")).resolves.toMatchObject({
      stage: "submitted",
      reference: "VISA-2026-7777",
    });
  });

  it("does not start an application for a visa-free trip", async () => {
    renderForm();
    await waitFor(() => expect(getActiveVividForm()?.id).toBe("visa"));

    const result = await run("startVisaApplication", { from: "France", to: "Germany" });
    expect(result).toMatchObject({ visaFree: true });
    expect(getActiveVividForm()?.stage()).toBe("route-check");
  });

  it("keeps an online route's uploads for the applicant", async () => {
    renderForm();
    await waitFor(() => expect(getActiveVividForm()?.id).toBe("visa"));

    await run("startVisaApplication", { from: "Nigeria", to: "Turkey" });
    const result = await run("fillFormFields", {
      entries: [{ field: "passportDataPageUrl", value: "https://evil.example/x.pdf" }],
    });
    expect(result.refused).toEqual([
      expect.objectContaining({
        field: "passportDataPageUrl",
        reason: expect.stringMatching(/upload/i),
      }),
    ]);
  });
});

describe("Vivid on the passport application", () => {
  it("fills the first step and holds Continue until a renewal has the old number", async () => {
    const { PassportForm } =
      await import("@/features/passport/components/passport-form");
    render(
      <QueryClientProvider client={new QueryClient()}>
        <PassportForm />
      </QueryClientProvider>,
    );
    await waitFor(() => expect(getActiveVividForm()?.id).toBe("passport"));

    const filled = await run("fillFormFields", {
      entries: [
        { field: "applicationType", value: "Renewal" },
        { field: "validity", value: "10 Years Validity" },
      ],
    });
    expect(filled.filled).toEqual(["applicationType", "validity"]);

    await expect(run("goToFormStep", { direction: "next" })).resolves.toMatchObject({
      moved: false,
      errors: { existingPassportNumber: expect.any(String) },
    });

    await run("fillFormFields", {
      entries: [{ field: "existingPassportNumber", value: "A01234567" }],
    });
    await expect(run("goToFormStep", { direction: "next" })).resolves.toMatchObject({
      moved: true,
      step: { number: 2, title: "Personal Details" },
    });

    // The ID is usable by the form but never read back in full.
    const state = await run("getFormState");
    expect(JSON.stringify(state)).not.toContain("A01234567");
  });
});
