/**
 * Everything Vivid can do on E-Embassy.
 *
 * Client tools run in the browser (navigation, the page, the application
 * forms). Server tools are stubs here — their real bodies live in
 * `src/server/vivid/functions.server.ts` and run through /api/vivid/function,
 * behind the WorldStreet session. This file is bundled for the browser, so it
 * must never import server code; the server also reads it for the tool list,
 * so nothing here may touch the DOM at import time.
 *
 * Tool results are plain objects Vivid can speak from — `{ success, … }` or
 * `{ error }` — and handlers never throw.
 */

import { resolveVisaRoute } from "@/features/visa/requirement";
import {
  findDestination,
  VIVID_DESTINATION_IDS,
  VIVID_DESTINATIONS,
} from "@/features/vivid/destinations";
import {
  describeForm,
  fillForm,
  getActiveVividForm,
  moveToStep,
  summariseForm,
  type VividFormBinding,
} from "@/features/vivid/form-bridge";
import { getPageInfo } from "@/features/vivid/page-context";
import {
  DEFAULT_HOLD_MS,
  GUARD_ATTR,
  listTargets,
  missReport,
  performScroll,
  scrollToTarget,
  setNativeInput,
  setSpotlight,
  waitForTarget,
} from "@/features/vivid/page-control";
import type { JSONSchema, VoiceFunctionConfig } from "@/features/vivid/types";
import { countries, type Country, searchTerms } from "@/lib/countries";

// ── Parameter helpers ───────────────────────────────────────────────────────

type Param = Record<string, unknown>;
const text = (description: string): Param => ({ type: "string", description });
const choice = (description: string, values: readonly string[]): Param => ({
  type: "string",
  description,
  enum: [...values],
});
const number = (description: string): Param => ({ type: "number", description });
const flag = (description: string): Param => ({ type: "boolean", description });
function params(
  properties: Record<string, Param>,
  required: string[] = [],
): JSONSchema {
  return { type: "object", properties, ...(required.length ? { required } : {}) };
}

type Args = Record<string, unknown>;
const noBrowser = { error: "This only works in the browser." };
const inBrowser = () => typeof window !== "undefined";

function tool(config: VoiceFunctionConfig<Args>): VoiceFunctionConfig {
  return config as VoiceFunctionConfig;
}

// ── Shared helpers ──────────────────────────────────────────────────────────

/** Spoken country → Country: exact name, code or alias first, then a unique partial. */
function resolveCountry(spoken: unknown): Country | { ambiguous: string[] } | null {
  const q = String(spoken ?? "")
    .trim()
    .toLowerCase();
  if (!q) return null;
  const exact = countries.find((c) => searchTerms(c).includes(q));
  if (exact) return exact;
  const partial = countries.filter((c) => searchTerms(c).some((t) => t.includes(q)));
  if (partial.length === 1) return partial[0];
  return partial.length > 1
    ? { ambiguous: partial.slice(0, 5).map((c) => c.name) }
    : null;
}

function countryError(
  role: string,
  spoken: unknown,
  match: ReturnType<typeof resolveCountry>,
) {
  if (match && "ambiguous" in match) {
    return {
      error: `"${String(spoken)}" matches several countries for ${role}.`,
      candidates: match.ambiguous,
    };
  }
  return {
    error: `Could not find a country called "${String(spoken)}" for ${role}. Ask them to say it again.`,
  };
}

function navigate(path: string) {
  window.dispatchEvent(new CustomEvent("vivid:navigate", { detail: { path } }));
}

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/** Resolves true once `check` holds, false after the timeout. */
async function until(check: () => boolean, timeoutMs = 3000) {
  const deadline = Date.now() + timeoutMs;
  while (!check()) {
    if (Date.now() >= deadline) return false;
    await sleep(50);
  }
  return true;
}

/** After navigating, the wizard needs a moment to mount and register. */
async function waitForForm(id: VividFormBinding["id"], timeoutMs = 6000) {
  const deadline = Date.now() + timeoutMs;
  for (;;) {
    const form = getActiveVividForm();
    if (form?.id === id) return form;
    if (Date.now() >= deadline) return null;
    await sleep(100);
  }
}

const noForm = {
  error: "There is no application form on this screen.",
  hint: "Take them to apply_visa or apply_passport with navigateToPage first.",
};

function isSignedIn(): boolean {
  const clerk = (window as unknown as { Clerk?: { user?: unknown } }).Clerk;
  return Boolean(clerk?.user);
}

// ── Client tools ────────────────────────────────────────────────────────────

const navigateToPage = tool({
  name: "navigateToPage",
  description:
    "Take the applicant to a page. Pass a destination id from the list — never a made-up path. " +
    VIVID_DESTINATIONS.map((d) => `${d.id} = ${d.label}`).join("; ") +
    ". apply_visa, apply_passport and the my_* pages need a WorldStreet sign-in; a signed-out applicant is sent to sign in first.",
  parameters: params({ destination: choice("Where to go.", VIVID_DESTINATION_IDS) }, [
    "destination",
  ]),
  handler: ({ destination }) => {
    if (!inBrowser()) return noBrowser;
    const dest = findDestination(String(destination ?? ""));
    if (!dest)
      return {
        error: `Unknown destination "${String(destination)}".`,
        destinations: VIVID_DESTINATION_IDS,
      };
    if (dest.external) {
      window.location.assign(dest.path);
      return { success: true, leaving: dest.label };
    }
    navigate(dest.path);
    return { success: true, page: dest.label };
  },
  executionContext: "client",
});

const getCurrentPageContext = tool({
  name: "getCurrentPageContext",
  description:
    "What the applicant is looking at RIGHT NOW: the page, what is on it and what they can do there, whether they are signed in, whether a dialog is open, and — on an application form — the step, the fields on it and what is still missing. Call it before answering anything about 'this page' or 'this screen'.",
  parameters: params({}),
  handler: () => {
    if (!inBrowser()) return noBrowser;
    const path = window.location.pathname;
    const page = getPageInfo(path);
    const form = getActiveVividForm();
    return {
      path,
      page: page.name,
      summary: page.summary,
      ...(page.actions ? { actions: page.actions } : {}),
      signedIn: isSignedIn(),
      dialogOpen: Boolean(document.querySelector('[role="dialog"][data-state="open"]')),
      ...(form ? { form: describeForm(form) } : {}),
    };
  },
  executionContext: "client",
});

const checkVisaRequirement = tool({
  name: "checkVisaRequirement",
  description:
    "Which visa a trip needs, from E-Embassy's own route rules: eVisa or ETA (done fully online here), T.Visa (a traditional embassy visa — the applicant finishes in person), or no visa. Pass the country they travel FROM (their passport) and TO, as spoken. Returns the route, how long it usually takes, a short explanation and the next steps. It is a starting position, not legal advice — say so if they are relying on it.",
  parameters: params(
    {
      from: text("Country they travel from / whose passport they hold, e.g. Nigeria."),
      to: text("Destination country, e.g. Turkey."),
    },
    ["from", "to"],
  ),
  handler: ({ from, to }) => {
    const origin = resolveCountry(from);
    if (!origin || "ambiguous" in origin)
      return countryError("travelling from", from, origin);
    const destination = resolveCountry(to);
    if (!destination || "ambiguous" in destination)
      return countryError("travelling to", to, destination);
    const verdict = resolveVisaRoute(origin.code, destination.code);
    return {
      from: origin.name,
      to: destination.name,
      route: verdict.label,
      completedOnline: verdict.online,
      turnaround: verdict.turnaround,
      summary: verdict.summary,
      next: verdict.next,
    };
  },
  executionContext: "client",
});

const startVisaApplication = tool({
  name: "startVisaApplication",
  description:
    "Start (or restart) a visa application for a trip: opens the visa application if needed, runs the route check for FROM and TO, and moves on to step 1 of the form. For a visa-free trip it does not start anything and tells you so. Use when the applicant says they want to apply.",
  parameters: params(
    {
      from: text("Country they travel from / whose passport they hold."),
      to: text("Destination country."),
    },
    ["from", "to"],
  ),
  handler: async ({ from, to }) => {
    if (!inBrowser()) return noBrowser;
    const origin = resolveCountry(from);
    if (!origin || "ambiguous" in origin)
      return countryError("travelling from", from, origin);
    const destination = resolveCountry(to);
    if (!destination || "ambiguous" in destination)
      return countryError("travelling to", to, destination);

    const verdict = resolveVisaRoute(origin.code, destination.code);
    if (verdict.route === "visa-free") {
      return {
        visaFree: true,
        from: origin.name,
        to: destination.name,
        summary: verdict.summary,
        note: "No application needed. Offer the trip planner for the rest of the trip.",
      };
    }

    let form = getActiveVividForm();
    if (form?.id !== "visa") {
      if (!isSignedIn()) {
        return {
          error:
            "They need to sign in with WorldStreet first. Take them to apply_visa — it will send them to sign in.",
        };
      }
      navigate("/apply");
      form = await waitForForm("visa");
    }
    if (!form?.confirmRoute)
      return {
        error: "The visa application did not open. Try navigateToPage apply_visa.",
      };
    if (form.stage() === "submitted") {
      return {
        error:
          "An application was just submitted on this page. Reload apply_visa to start another.",
      };
    }

    form.confirmRoute(verdict);
    // The route re-renders the wizard (steps, schema); answer from that, not
    // from the render before it — and never let a fill land on the route check.
    const opened = form;
    if (!(await until(() => opened.stage() === "form"))) {
      return {
        error:
          "The application did not open. Try again, or use navigateToPage apply_visa.",
      };
    }
    return {
      success: true,
      route: verdict.label,
      completedOnline: verdict.online,
      from: origin.name,
      to: destination.name,
      steps: form.steps().map((s, i) => `${i + 1}. ${s.title}`),
      note: verdict.online
        ? "Now on step 1. Documents are the last step and the applicant uploads them."
        : "Now on step 1. No uploads for a T.Visa — the embassy takes documents in person.",
    };
  },
  executionContext: "client",
});

const getFormState = tool({
  name: "getFormState",
  description:
    "The application form on screen: which step they are on, every field on that step with its value (passport and NIN numbers masked), errors, options for choice fields, and every required field still missing across all steps. Call it before filling, when asked what is left, and after anything fails.",
  parameters: params({}),
  handler: () => {
    if (!inBrowser()) return noBrowser;
    const form = getActiveVividForm();
    return form ? describeForm(form) : noForm;
  },
  executionContext: "client",
});

const fillFormFields = tool({
  name: "fillFormFields",
  description:
    "Fill fields on the application form with what the applicant told you — several at once is fine. Use the field names from getFormState. Dates must be YYYY-MM-DD. Choice fields take one of their options. Nationality takes a nationality ('Nigerian') or country. Email comes from their WorldStreet account and cannot be changed; documents cannot be filled — the applicant uploads them. Only fill what they actually said; never invent a value. Returns what was filled, what the form rejected and why.",
  parameters: params(
    {
      entries: {
        type: "array",
        description: "The fields to fill.",
        items: {
          type: "object",
          properties: {
            field: text("Field name, e.g. firstName."),
            value: text("The value to put in it."),
          },
          required: ["field", "value"],
        },
      },
    },
    ["entries"],
  ),
  handler: async ({ entries }) => {
    if (!inBrowser()) return noBrowser;
    const form = getActiveVividForm();
    if (!form) return noForm;
    if (form.stage() !== "form") return describeForm(form);
    const list = Array.isArray(entries)
      ? (entries as { field?: string; value?: string }[])
      : [];
    if (!list.length) return { error: "No entries given." };
    return fillForm(form, list);
  },
  executionContext: "client",
});

const goToFormStep = tool({
  name: "goToFormStep",
  description:
    "Move the application form to another step — 'next', 'back', or a step number. Moving forward checks every step on the way exactly like the Continue button; if one has problems it stops there and returns them.",
  parameters: params({
    direction: choice("next or back. Leave empty when giving a step number.", [
      "next",
      "back",
    ]),
    step: number("Step number to go to, starting at 1."),
  }),
  handler: async ({ direction, step }) => {
    if (!inBrowser()) return noBrowser;
    const form = getActiveVividForm();
    if (!form) return noForm;
    if (form.stage() !== "form") return describeForm(form);
    const current = form.currentStep();
    const target =
      typeof step === "number" && Number.isFinite(step)
        ? Math.round(step) - 1
        : direction === "back"
          ? current - 1
          : current + 1;
    return moveToStep(form, target);
  },
  executionContext: "client",
});

const submitApplication = tool({
  name: "submitApplication",
  description:
    "Submit the application on screen. ALWAYS two calls. First with confirmed=false: nothing is sent — you get a summary and anything still missing. Read the key details back briefly (name, destination or passport type, dates) and ask plainly whether to submit. Only after a clear spoken yes, call again with confirmed=true. Never set confirmed on your own initiative. On success you get the application reference.",
  parameters: params(
    {
      confirmed: flag("true only after the applicant clearly said yes to submitting."),
    },
    ["confirmed"],
  ),
  handler: async ({ confirmed }) => {
    if (!inBrowser()) return noBrowser;
    const form = getActiveVividForm();
    if (!form) return noForm;
    if (form.stage() !== "form") return describeForm(form);

    if (confirmed !== true) {
      const state = describeForm(form);
      return {
        needsConfirmation: true,
        form: form.title,
        summary: summariseForm(form),
        missingRequired: "missingRequired" in state ? state.missingRequired : [],
        note: "Nothing was sent. Read back the key details, ask for a clear yes, then call again with confirmed=true.",
      };
    }

    const result = await form.submit();
    if ("reference" in result) {
      // Let the success screen render, so the next getFormState agrees.
      await until(() => form.stage() === "submitted", 2000);
      return {
        success: true,
        reference: result.reference,
        next: "A consultant reviews it and sets the fee; they will see it on My applications and by email, then pay by bank transfer quoting this reference.",
      };
    }
    return { ...result, form: describeForm(form) };
  },
  executionContext: "client",
});

// ── Page control (copied from the WorldStreet app, unchanged in behaviour) ──

const listPageControls = tool({
  name: "listPageControls",
  description:
    "See everything on the current screen you can point at, fill or press — sections, buttons and inputs, each with a stable id. CALL THIS FIRST whenever you intend to control the page: ids differ per screen and per dialog, and this list is the live truth. Items marked guarded need the applicant to confirm out loud before pressControl will fire them. For the application forms prefer getFormState / fillFormFields.",
  parameters: params({}),
  handler: () => {
    if (!inBrowser()) return noBrowser;
    const targets = listTargets();
    return targets.length > 0
      ? { targets }
      : {
          targets,
          note: "Nothing controllable is visible here. Navigate or open a panel first.",
        };
  },
  executionContext: "client",
});

const spotlightSection = tool({
  name: "spotlightSection",
  description:
    "Physically SHOW the applicant something: scroll it into view and dim everything else so only that element stays lit — e.g. the upload for their passport photo, the Continue button, a status. Use it whenever you say 'here' or 'this one'. The mask clears on its own when they touch the page. Get ids from listPageControls.",
  parameters: params(
    {
      target: text("The data-vivid-target id of the element to spotlight."),
      seconds: number(
        "How long to hold the mask. Defaults to 4; raise it only if your explanation runs longer.",
      ),
    },
    ["target"],
  ),
  handler: async ({ target, seconds }) => {
    if (!inBrowser()) return noBrowser;
    const id = String(target ?? "");
    const el = await waitForTarget(id);
    if (!el) return missReport(id);
    const secs =
      typeof seconds === "number" && seconds > 0
        ? Math.min(Math.max(seconds, 2), 10)
        : undefined;
    scrollToTarget(el);
    setSpotlight(id, secs ? secs * 1000 : undefined);
    return {
      success: true,
      spotlighting: id,
      heldForSeconds: secs ?? DEFAULT_HOLD_MS / 1000,
      note: "The rest of the page is dimmed. It clears on its own, or the moment the applicant touches the page.",
    };
  },
  executionContext: "client",
});

const scrollPage = tool({
  name: "scrollPage",
  description:
    "Scroll the screen for the applicant — call again for 'keep going'. If a dialog is open it scrolls that. top or bottom jump to either end. The result says whether you hit the end. To bring one specific thing into view, prefer spotlightSection.",
  parameters: params(
    {
      direction: choice("Which way to go.", ["down", "up", "top", "bottom"]),
      amount: choice("How far: small, medium (default) or large.", [
        "small",
        "medium",
        "large",
      ]),
      pixels: number(
        "Exact distance in pixels, when they name a number. Overrides amount.",
      ),
    },
    ["direction"],
  ),
  handler: async ({ direction, amount, pixels }) => {
    if (!inBrowser()) return noBrowser;
    const dir = (
      ["up", "down", "top", "bottom"].includes(String(direction)) ? direction : "down"
    ) as "up" | "down" | "top" | "bottom";
    const size = (
      ["small", "medium", "large"].includes(String(amount)) ? amount : "medium"
    ) as "small" | "medium" | "large";
    const r = await performScroll(
      dir,
      size,
      typeof pixels === "number" ? pixels : undefined,
    );
    return {
      success: true,
      scrolled: dir,
      by: Math.abs(r.scrolled),
      of: r.surface,
      atTop: r.atTop,
      atBottom: r.atBottom,
      ...(r.scrolled === 0
        ? {
            note: r.atBottom
              ? "Already at the bottom."
              : r.atTop
                ? "Already at the top."
                : "Nothing to scroll.",
          }
        : {}),
    };
  },
  executionContext: "client",
});

const clearSpotlight = tool({
  name: "clearSpotlight",
  description:
    "Remove the spotlight mask and restore the page, e.g. when moving on to a new topic.",
  parameters: params({}),
  handler: () => {
    if (!inBrowser()) return noBrowser;
    setSpotlight(null);
    return { success: true };
  },
  executionContext: "client",
});

const fillField = tool({
  name: "fillField",
  description:
    "Type into an input on screen that is NOT part of an application form — a search box, a filter. Works like the keyboard. Never submits anything. Get ids from listPageControls. For application fields use fillFormFields.",
  parameters: params(
    {
      target: text("The data-vivid-target id of the input."),
      value: text("Exactly what to type."),
    },
    ["target", "value"],
  ),
  handler: async ({ target, value }) => {
    if (!inBrowser()) return noBrowser;
    const id = String(target ?? "");
    const el = await waitForTarget(id);
    if (!el) return missReport(id);
    scrollToTarget(el);
    const result = setNativeInput(el, String(value ?? ""));
    if (!result.ok)
      return {
        error: `"${id}" is not a fillable input.`,
        availableTargets: listTargets(),
      };
    if (result.settled !== result.wrote) {
      return {
        partial: true,
        filled: id,
        fieldNowShows: result.settled,
        note: "The field did not keep exactly what was typed. Read back what it shows before continuing.",
      };
    }
    return { success: true, filled: id, fieldNowShows: result.settled };
  },
  executionContext: "client",
});

const pressControl = tool({
  name: "pressControl",
  description:
    "Press a button or link on screen for the applicant — open a tab, open an application, Continue. Controls marked guarded need a spoken yes first: tell them exactly what will happen, and only after they agree call again with confirmed=true. Never set confirmed on your own initiative. Get ids from listPageControls. To submit an application use submitApplication, not this.",
  parameters: params(
    {
      target: text("The data-vivid-target id of the button or link."),
      confirmed: flag(
        "Only for guarded controls: true once the applicant agreed to this exact action.",
      ),
    },
    ["target"],
  ),
  handler: async ({ target, confirmed }) => {
    if (!inBrowser()) return noBrowser;
    const id = String(target ?? "");
    const el = await waitForTarget(id);
    if (!el) return missReport(id);
    if (el.hasAttribute(GUARD_ATTR) && confirmed !== true) {
      scrollToTarget(el);
      setSpotlight(id);
      return {
        needsConfirmation: true,
        control: id,
        note: "Spotlighted but NOT pressed. Say exactly what pressing it does; only after a clear yes call again with confirmed=true.",
      };
    }
    scrollToTarget(el);
    el.click();
    return { success: true, pressed: id };
  },
  executionContext: "client",
});

// ── Server tools (stubs — real bodies in src/server/vivid/functions.server.ts) ──

const runsOnServer = () => ({ error: "Runs on the server." });

export const getMyApplications = tool({
  name: "getMyApplications",
  description:
    "The signed-in applicant's visa and passport applications, newest first: reference, type, destination, status, payment status, fees and what happens next. Call it for 'my applications', 'what's the status', 'have I paid'. Never answer those from memory — statuses change.",
  parameters: params({}),
  handler: runsOnServer,
  executionContext: "server",
});

export const getApplicationStatus = tool({
  name: "getApplicationStatus",
  description:
    "One of the applicant's applications in detail, by its reference (e.g. VISA-2026-1234 or PASSPORT-2026-1234): status, payment, fees, amount still due, notes from the consultant, rejection reason, and the next step. Only their own applications are visible.",
  parameters: params(
    { reference: text("The application reference, as they said it.") },
    ["reference"],
  ),
  handler: runsOnServer,
  executionContext: "server",
});

/** The full tool list, in the order Vivid is told about them. */
export const embassyFunctions: VoiceFunctionConfig[] = [
  navigateToPage,
  getCurrentPageContext,
  checkVisaRequirement,
  startVisaApplication,
  getFormState,
  fillFormFields,
  goToFormStep,
  submitApplication,
  getMyApplications,
  getApplicationStatus,
  listPageControls,
  spotlightSection,
  scrollPage,
  clearSpotlight,
  fillField,
  pressControl,
];
