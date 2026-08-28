import { countryName } from "@/lib/countries";

export type PassportAnswer = "yes" | "expiring" | "no";
export type VisaAnswer = "yes" | "no" | "unsure";
export type Extra = "flights" | "hotels" | "experiences";

export type TripAnswers = {
  origin: string;
  destination: string;
  passport: PassportAnswer | null;
  visa: VisaAnswer | null;
  extras: Extra[];
};

export type PlanStep = {
  id: string;
  title: string;
  body: string;
  href: string;
  cta: string;
  /** "now" is the one thing to do next; everything else waits on it. */
  state: "now" | "next" | "soon" | "done";
};

export const extraLabels: Record<Extra, string> = {
  flights: "Flights",
  hotels: "Somewhere to stay",
  experiences: "Tours and things to do",
};

/**
 * Turns the answers into an ordered plan.
 *
 * The ordering is not cosmetic — it is the actual dependency chain. A visa is
 * stamped into a passport, so a missing or nearly-expired passport has to be
 * fixed first or the visa application is wasted. Flights are last because
 * booking them before you have permission to enter is how people lose money.
 */
export function buildPlan(answers: TripAnswers): PlanStep[] {
  const { passport, visa, extras, destination } = answers;
  const where = countryName(destination) || "your destination";
  const steps: PlanStep[] = [];

  // 1. Passport.
  if (passport === "no") {
    steps.push({
      id: "passport",
      title: "Get your passport",
      body: "You cannot apply for a visa without one — the visa is stamped into it. This is the first thing to sort, and it is the longest step, so start it today.",
      href: "/passport",
      cta: "Start passport application",
      state: "now",
    });
  } else if (passport === "expiring") {
    steps.push({
      id: "passport",
      title: "Renew your passport first",
      body: `Most countries want at least six months left on your passport when you arrive, and ${where} may refuse a visa on one that is running out. Renew before you apply.`,
      href: "/passport",
      cta: "Start passport renewal",
      state: "now",
    });
  } else if (passport === "yes") {
    steps.push({
      id: "passport",
      title: "Passport — you are set",
      body: "You already have a valid passport with enough time left on it. Nothing to do here.",
      href: "/passport",
      cta: "Passport services",
      state: "done",
    });
  }

  // 2. Visa — blocked until the passport exists.
  const passportBlocking = passport === "no" || passport === "expiring";
  if (visa === "no" || visa === "unsure") {
    steps.push({
      id: "visa",
      title:
        visa === "unsure"
          ? `Check what ${where} requires`
          : `Apply for your ${where} visa`,
      body:
        visa === "unsure"
          ? "Not sure whether you need one? Tell us your passport and dates and we will confirm which visa applies — or that you do not need one at all — usually the same day."
          : "We confirm which visa applies, prepare the file, submit it, and follow it up until there is a decision.",
      href: "/apply",
      cta: visa === "unsure" ? "Check my visa options" : "Start visa application",
      state: passportBlocking ? "next" : "now",
    });
  } else if (visa === "yes") {
    steps.push({
      id: "visa",
      title: "Visa — already sorted",
      body: `You told us you already hold a valid visa for ${where}. We will double-check the dates when we speak.`,
      href: "/apply",
      cta: "Visa services",
      state: "done",
    });
  }

  // 3. Everything else, only if they asked for it.
  if (extras.includes("flights") || extras.includes("hotels")) {
    const both = extras.includes("flights") && extras.includes("hotels");
    steps.push({
      id: "flights-hotels",
      title: both
        ? "Flights and somewhere to stay"
        : extras.includes("flights")
          ? "Book your flights"
          : "Find somewhere to stay",
      body: "We will quote real prices the same day and hold them while you decide. Opening shortly — we will contact you the moment it is live.",
      href: "/services/flights",
      cta: "See how it will work",
      state: "soon",
    });
  }
  if (extras.includes("experiences")) {
    steps.push({
      id: "experiences",
      title: "Plan what you actually do there",
      body: "Guides, tickets and a day-by-day plan with room to breathe. Opening shortly.",
      href: "/services/experiences",
      cta: "See how it will work",
      state: "soon",
    });
  }

  return steps;
}

/** The single most useful thing to do next, for the headline CTA. */
export function primaryStep(steps: PlanStep[]) {
  return steps.find((s) => s.state === "now") ?? steps.find((s) => s.state === "next");
}
