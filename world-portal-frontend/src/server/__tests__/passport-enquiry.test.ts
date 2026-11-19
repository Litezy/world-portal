import { beforeEach, describe, expect, it, vi } from "vitest";

import { BackendError } from "@/server/api/backend";

// Stand-in for filing as the signed-in applicant; BackendError stays real.
const applicantBackend = vi.hoisted(() => vi.fn());
vi.mock("@/server/applicant/backend", () => ({ applicantBackend }));

const { POST } = await import("@/app/api/passport-enquiry/route");

/** A complete, valid first-passport application (invented test data). */
const application = {
  applicationType: "new",
  surname: "Okafor",
  firstName: "Ada",
  sex: "FEMALE",
  ninNumber: "12345678901",
  dateOfBirth: "1990-01-01",
  placeOfBirth: "Lagos",
  stateOfOrigin: "Lagos",
  homeTown: "Ikeja",
  nationality: "Nigerian",
  permanentAddress: "1 Test Street, Ikeja",
  occupation: "Engineer",
  contactPhone: "+234 800 000 0000",
  email: "ada@example.com",
  maritalStatus: "SINGLE",
  nextOfKinName: "Chidi Okafor",
  nextOfKinRelationship: "Brother",
  nextOfKinPhone: "+234 800 000 0001",
  nextOfKinAddress: "2 Test Street, Ikeja",
  passportPhotoUrl: "https://files.example/photo.jpg",
  ninDocumentUrl: "https://files.example/nin.pdf",
};

const submit = (body: unknown = application) =>
  POST(
    new Request("http://localhost:3000/api/passport-enquiry", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
  );

describe("POST /api/passport-enquiry", () => {
  beforeEach(() => {
    applicantBackend.mockReset();
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  it("files the application with the service as the applicant", async () => {
    applicantBackend.mockResolvedValue({ id: "pa_1", applicationNo: "WPP-2026-0042" });

    const response = await submit();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      data: { reference: "WPP-2026-0042" },
    });
    const [path, init] = applicantBackend.mock.calls[0] as [string, RequestInit];
    expect(path).toBe("/passport-application");
    expect(init.method).toBe("POST");
  });

  it("falls back to the record's own id, never an invented reference", async () => {
    applicantBackend.mockResolvedValue({ id: "pa_1", applicationNo: "" });

    const response = await submit();

    await expect(response.json()).resolves.toEqual({ data: { reference: "pa_1" } });
  });

  it("reports a service failure instead of pretending the application was filed", async () => {
    applicantBackend.mockRejectedValue(new BackendError("Internal server error", 500));

    const response = await submit();
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body.data).toBeUndefined();
    // A 500 or a lost reply can come after the service filed it: the
    // applicant is told to check for the confirmation email, not that
    // nothing was submitted, so a retry doesn't file them twice.
    expect(body.message).not.toMatch(/nothing was submitted/i);
    expect(body.message).toMatch(/check your email/i);
  });

  it("reports an unreachable service the same way", async () => {
    applicantBackend.mockRejectedValue(new TypeError("fetch failed"));

    const response = await submit();
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body.data).toBeUndefined();
  });

  it("passes a definite refusal from the service straight to the form", async () => {
    applicantBackend.mockRejectedValue(
      new BackendError("Sign in with your WorldStreet account to continue.", 401),
    );

    const response = await submit();

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toMatchObject({
      message: "Sign in with your WorldStreet account to continue.",
    });
  });

  it("rejects an incomplete application without calling the service", async () => {
    const response = await submit({ ...application, ninNumber: "123" });

    expect(response.status).toBe(422);
    expect(applicantBackend).not.toHaveBeenCalled();
  });
});
