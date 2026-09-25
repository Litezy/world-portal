import { describe, expect, it, vi } from "vitest";

import {
  describeForm,
  fillForm,
  getActiveVividForm,
  moveToStep,
  normaliseFieldValue,
  registerVividForm,
  summariseForm,
  type VividFieldSpec,
  type VividFormBinding,
} from "@/features/vivid/form-bridge";

const fields: VividFieldSpec[] = [
  { name: "firstName", label: "First name", kind: "text", required: true },
  {
    name: "email",
    label: "Email",
    kind: "text",
    required: true,
    readOnly: "From the WorldStreet account.",
  },
  { name: "dateOfBirth", label: "Date of birth", kind: "date" },
  {
    name: "gender",
    label: "Gender",
    kind: "choice",
    options: [
      { value: "MALE", label: "Male" },
      { value: "FEMALE", label: "Female" },
    ],
  },
  { name: "nationality", label: "Nationality", kind: "nationality", required: true },
  { name: "passportNumber", label: "Passport number", kind: "text", sensitive: true },
  { name: "passportPhoto", label: "Passport photo", kind: "document", required: true },
];

/** A stand-in wizard: two steps, values in a map, errors on demand. */
function fakeForm(initial: Record<string, string> = {}) {
  const values: Record<string, unknown> = { email: "ada@example.com", ...initial };
  const errors: Record<string, string> = {};
  let step = 0;
  const binding: VividFormBinding = {
    id: "visa",
    title: "Visa application",
    fields,
    stage: () => "form",
    steps: () => [
      {
        title: "About you",
        fields: ["firstName", "email", "dateOfBirth", "gender", "nationality"],
      },
      { title: "Passport", fields: ["passportNumber", "passportPhoto"] },
    ],
    currentStep: () => step,
    getValues: () => values,
    getErrors: () => errors,
    setValue: (name, value) => {
      values[name] = value;
    },
    validate: vi.fn(async (names: string[]) => {
      for (const n of names) {
        if (n === "firstName" && String(values[n]).length < 2)
          errors[n] = "Enter your first name";
        else delete errors[n];
      }
      return names.every((n) => !errors[n]);
    }),
    validateStep: vi.fn(async (i: number) => {
      if (i === 0 && !values.firstName) {
        errors.firstName = "Enter your first name";
        return false;
      }
      return true;
    }),
    showStep: (i) => {
      step = i;
    },
    submit: vi.fn(async () => ({ reference: "VISA-2026-0001" })),
    reference: () => null,
  };
  return { binding, values, errors };
}

describe("normaliseFieldValue", () => {
  const spec = (name: string) => fields.find((f) => f.name === name)!;

  it("accepts ISO dates and refuses anything else", () => {
    expect(normaliseFieldValue(spec("dateOfBirth"), "1990-04-23")).toEqual({
      ok: true,
      value: "1990-04-23",
    });
    expect(normaliseFieldValue(spec("dateOfBirth"), "23/04/1990").ok).toBe(false);
  });

  it("maps a spoken choice onto the option value, by label or value", () => {
    expect(normaliseFieldValue(spec("gender"), "female")).toEqual({
      ok: true,
      value: "FEMALE",
    });
    expect(normaliseFieldValue(spec("gender"), "MALE")).toEqual({
      ok: true,
      value: "MALE",
    });
    expect(normaliseFieldValue(spec("gender"), "other").ok).toBe(false);
  });

  it("resolves a nationality from a country or demonym", () => {
    expect(normaliseFieldValue(spec("nationality"), "Nigeria")).toEqual({
      ok: true,
      value: "Nigerian",
    });
    expect(normaliseFieldValue(spec("nationality"), "Atlantean").ok).toBe(false);
  });

  it("never fills read-only fields or documents", () => {
    expect(normaliseFieldValue(spec("email"), "x@y.z")).toEqual({
      ok: false,
      reason: "From the WorldStreet account.",
    });
    expect(normaliseFieldValue(spec("passportPhoto"), "photo.jpg").ok).toBe(false);
  });
});

describe("describeForm / summariseForm", () => {
  it("masks passport numbers, shows documents as uploaded or not, and lists what is missing", () => {
    const { binding } = fakeForm({ passportNumber: "A12345678", gender: "FEMALE" });
    binding.showStep(1);

    const state = describeForm(binding);
    if (!("fields" in state)) throw new Error("expected a form in progress");

    expect(state.step).toEqual({ number: 2, of: 2, title: "Passport" });
    expect(state.fields).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: "passportNumber", value: "…678" }),
        expect.objectContaining({ name: "passportPhoto", value: "not uploaded" }),
      ]),
    );
    expect((state.missingRequired ?? []).map((m) => m.field)).toEqual([
      "firstName",
      "nationality",
      "passportPhoto",
    ]);
    expect(JSON.stringify(state)).not.toContain("A12345678");

    expect(summariseForm(binding)).toEqual(
      expect.arrayContaining([
        { label: "Gender", value: "Female" },
        { label: "Passport number", value: "…678" },
      ]),
    );
  });
});

describe("fillForm", () => {
  it("fills what it can, reports refusals and the form's own validation", async () => {
    const { binding, values } = fakeForm();

    const result = await fillForm(binding, [
      { field: "firstName", value: "A" },
      { field: "gender", value: "male" },
      { field: "email", value: "other@example.com" },
      { field: "shoeSize", value: "42" },
    ]);

    expect(values.gender).toBe("MALE");
    expect(values.email).toBe("ada@example.com");
    expect(binding.validate).toHaveBeenCalledWith(["firstName", "gender"]);
    expect(result.filled).toEqual(["gender"]);
    expect(result.invalid).toEqual([
      { field: "firstName", error: "Enter your first name" },
    ]);
    expect(result.refused?.map((r) => r.field)).toEqual(["email", "shoeSize"]);
  });
});

describe("moveToStep", () => {
  it("stops on a step that does not validate, like Continue would", async () => {
    const { binding } = fakeForm();
    const result = await moveToStep(binding, 1);
    expect(result).toMatchObject({ moved: false, stoppedAt: { number: 1 } });
    expect(binding.currentStep()).toBe(0);
  });

  it("moves forward once the step is valid, and back freely", async () => {
    const { binding } = fakeForm({ firstName: "Ada" });
    await expect(moveToStep(binding, 1)).resolves.toMatchObject({ moved: true });
    expect(binding.currentStep()).toBe(1);
    await moveToStep(binding, 0);
    expect(binding.currentStep()).toBe(0);
  });
});

describe("registerVividForm", () => {
  it("unregisters only its own binding", () => {
    const a = fakeForm().binding;
    const b = fakeForm().binding;
    const offA = registerVividForm(a);
    const offB = registerVividForm(b);
    offA();
    expect(getActiveVividForm()).toBe(b);
    offB();
    expect(getActiveVividForm()).toBeNull();
  });
});
