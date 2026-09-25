import type { VisaVerdict } from "@/features/visa/requirement";
import { findNationality } from "@/lib/nationalities";

/**
 * The form bridge — how Vivid works the visa and passport wizards.
 *
 * `fillField` (page control) types into one DOM input at a time, which cannot
 * reach a date picker, a Radix select or the nationality combobox, and knows
 * nothing about steps. So each wizard registers a binding here while it is
 * mounted, and Vivid's form tools talk to react-hook-form through it: values go
 * in through `setValue` with validation, so the form reacts exactly as if the
 * applicant had typed — and what Vivid reads back is the form's own state.
 *
 * One form at a time; the binding unregisters on unmount, so a tool call on a
 * page without a form gets a plain "no form here" instead of a stale one.
 */

export type VividFieldKind =
  "text" | "phone" | "date" | "choice" | "nationality" | "longtext" | "document";

export type VividFieldSpec = {
  name: string;
  label: string;
  kind: VividFieldKind;
  required?: boolean;
  options?: readonly { value: string; label: string }[];
  /** Why Vivid may not fill this one (the reason is read to the model). */
  readOnly?: string;
  /** Passport and ID numbers: never read back in full. */
  sensitive?: boolean;
  hint?: string;
};

export type VividStepSpec = { title: string; fields: readonly string[] };

export type VividFormStage = "route-check" | "form" | "submitted";

export interface VividFormBinding {
  id: "visa" | "passport";
  title: string;
  fields: readonly VividFieldSpec[];
  stage(): VividFormStage;
  steps(): readonly VividStepSpec[];
  currentStep(): number;
  getValues(): Record<string, unknown>;
  getErrors(): Record<string, string>;
  setValue(name: string, value: string): void;
  /** Validates the named fields and waits for the result. */
  validate(names: string[]): Promise<boolean>;
  /** Validates exactly what the wizard's own Continue button validates. */
  validateStep(index: number): Promise<boolean>;
  showStep(index: number): void;
  /** Validates everything and submits, as the Submit button would. */
  submit(): Promise<{ reference: string } | { error: string }>;
  reference(): string | null;
  /** Visa only: choose the route (as the route check's Continue does). */
  confirmRoute?(verdict: VisaVerdict): void;
}

let active: VividFormBinding | null = null;

/** Called from the wizard's effect; returns the matching unregister. */
export function registerVividForm(binding: VividFormBinding): () => void {
  active = binding;
  return () => {
    if (active === binding) active = null;
  };
}

export function getActiveVividForm(): VividFormBinding | null {
  return active;
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/** Turns what Vivid heard into what the field accepts, or says why not. */
export function normaliseFieldValue(
  spec: VividFieldSpec,
  raw: string,
): { ok: true; value: string } | { ok: false; reason: string } {
  const value = raw.trim();
  if (spec.readOnly) return { ok: false, reason: spec.readOnly };
  if (spec.kind === "document") {
    return {
      ok: false,
      reason:
        "Documents are uploaded by the applicant from their own device — spotlight the upload and ask them to choose the file.",
    };
  }
  if (spec.kind === "date") {
    return ISO_DATE.test(value)
      ? { ok: true, value }
      : { ok: false, reason: "Dates must be YYYY-MM-DD, e.g. 1990-04-23." };
  }
  if (spec.kind === "choice" && spec.options) {
    const lower = value.toLowerCase();
    const match = spec.options.find(
      (o) => o.value.toLowerCase() === lower || o.label.toLowerCase() === lower,
    );
    return match
      ? { ok: true, value: match.value }
      : {
          ok: false,
          reason: `Must be one of: ${spec.options.map((o) => o.label).join(", ")}.`,
        };
  }
  if (spec.kind === "nationality") {
    const match = findNationality(value);
    return match
      ? { ok: true, value: match.name }
      : {
          ok: false,
          reason: `"${value}" is not a nationality in the list — ask them to say it again (e.g. "Nigerian").`,
        };
  }
  return { ok: true, value };
}

function mask(value: string): string {
  return value.length <= 3 ? "***" : `…${value.slice(-3)}`;
}

/** A field's value as Vivid may see it: documents as uploaded/not, IDs masked. */
function shownValue(spec: VividFieldSpec | undefined, value: unknown): unknown {
  if (spec?.kind === "document") {
    return typeof value === "string" && value ? "uploaded" : "not uploaded";
  }
  if (typeof value !== "string" || !value) return value ?? "";
  if (spec?.sensitive) return mask(value);
  const option = spec?.options?.find((o) => o.value === value);
  return option ? option.label : value;
}

function isBlank(value: unknown) {
  return value === undefined || value === null || value === "";
}

/** Everything Vivid needs to talk about the form in front of the applicant. */
export function describeForm(binding: VividFormBinding) {
  const stage = binding.stage();
  if (stage === "route-check") {
    return {
      form: binding.title,
      stage,
      note: "The applicant has not chosen their route yet. Use startVisaApplication with where they travel from and to.",
    };
  }
  if (stage === "submitted") {
    return { form: binding.title, stage, reference: binding.reference() };
  }

  const steps = binding.steps();
  const current = Math.min(binding.currentStep(), steps.length - 1);
  const values = binding.getValues();
  const errors = binding.getErrors();
  const specOf = (name: string) => binding.fields.find((f) => f.name === name);

  const missingRequired = steps.flatMap((step, i) =>
    step.fields
      .map((name) => specOf(name))
      .filter((spec): spec is VividFieldSpec =>
        Boolean(spec?.required && isBlank(values[spec.name])),
      )
      .map((spec) => ({ step: i + 1, field: spec.name, label: spec.label })),
  );

  return {
    form: binding.title,
    stage,
    step: { number: current + 1, of: steps.length, title: steps[current].title },
    steps: steps.map((s, i) => ({ number: i + 1, title: s.title })),
    fields: steps[current].fields.map((name) => {
      const spec = specOf(name);
      return {
        name,
        label: spec?.label ?? name,
        kind: spec?.kind ?? "text",
        required: Boolean(spec?.required),
        value: shownValue(spec, values[name]),
        ...(errors[name] ? { error: errors[name] } : {}),
        ...(spec?.options ? { options: spec.options.map((o) => o.label) } : {}),
        ...(spec?.readOnly ? { readOnly: spec.readOnly } : {}),
        ...(spec?.hint ? { hint: spec.hint } : {}),
      };
    }),
    missingRequired,
    errors,
  };
}

/** Summary for the spoken read-back before submitting — IDs masked. */
export function summariseForm(binding: VividFormBinding) {
  const values = binding.getValues();
  return binding.fields
    .filter((spec) => !isBlank(values[spec.name]) && spec.kind !== "document")
    .map((spec) => ({ label: spec.label, value: shownValue(spec, values[spec.name]) }));
}

export async function fillForm(
  binding: VividFormBinding,
  entries: { field?: string; value?: string }[],
) {
  const filled: string[] = [];
  const refused: { field: string; reason: string }[] = [];

  for (const entry of entries) {
    const name = entry.field ?? "";
    const spec = binding.fields.find((f) => f.name === name);
    if (!spec) {
      refused.push({
        field: name,
        reason: `Unknown field. Fields on this form: ${binding.fields.map((f) => f.name).join(", ")}.`,
      });
      continue;
    }
    const result = normaliseFieldValue(spec, String(entry.value ?? ""));
    if (!result.ok) {
      refused.push({ field: name, reason: result.reason });
      continue;
    }
    binding.setValue(name, result.value);
    filled.push(name);
  }

  if (filled.length) await binding.validate(filled);
  const errors = binding.getErrors();
  const rejected = filled.filter((name) => errors[name]);
  return {
    filled: filled.filter((name) => !errors[name]),
    ...(rejected.length
      ? { invalid: rejected.map((name) => ({ field: name, error: errors[name] })) }
      : {}),
    ...(refused.length ? { refused } : {}),
  };
}

/**
 * Moving forward validates every step on the way, exactly like pressing
 * Continue; moving back never does.
 */
export async function moveToStep(binding: VividFormBinding, target: number) {
  const steps = binding.steps();
  const to = Math.max(0, Math.min(target, steps.length - 1));
  let at = binding.currentStep();
  while (at < to) {
    if (!(await binding.validateStep(at))) {
      binding.showStep(at);
      return {
        moved: false,
        stoppedAt: { number: at + 1, title: steps[at].title },
        errors: binding.getErrors(),
        note: "This step has problems. Fix them (fillFormFields) or ask the applicant, then try again.",
      };
    }
    at += 1;
  }
  binding.showStep(to);
  return { moved: true, step: { number: to + 1, title: steps[to].title } };
}
