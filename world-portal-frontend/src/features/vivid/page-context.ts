/**
 * What each E-Embassy page is, for Vivid.
 *
 * The session prompt is built once, when the voice session starts, so it goes
 * stale the moment the applicant navigates. Vivid therefore reads the live
 * page through getCurrentPageContext, which combines this static map with the
 * form bridge's live state.
 */

export type PageInfo = {
  name: string;
  /** What is on screen. */
  summary: string;
  /** What the applicant can do here. */
  actions?: string;
};

const PAGES: Record<string, PageInfo> = {
  "/": {
    name: "E-Embassy home",
    summary:
      "The landing page: passports, visas (eVisa, ETA and T.Visa), flights & hotels and experiences (both coming soon), hiring a professional at the destination, how it works, FAQ, and a section for agencies.",
    actions:
      "Start the trip planner, start a visa or passport application, browse professionals.",
  },
  "/start": {
    name: "Trip planner",
    summary:
      "Four questions — travelling from and to, passport status, whether they already have a visa, and extras — that produce an ordered list of next steps.",
    actions:
      "Answer the questions; follow the plan to the passport or visa application.",
  },
  "/apply": {
    name: "Visa application",
    summary:
      "Opens on a route check (travelling from / to) that decides eVisa, ETA, T.Visa or visa-free. Then the application: About you, Passport, Your trip, and Documents (online routes only).",
    actions:
      "Check the route, fill the application step by step, upload documents, submit.",
  },
  "/passport": {
    name: "Passport application",
    summary:
      "The Nigerian e-Passport application in four steps: Category & Booklet, Personal Details, Next of Kin, Documents & Review.",
    actions:
      "Fill the application step by step, upload the photo and NIN slip, submit.",
  },
  "/hire": {
    name: "Hire a professional",
    summary:
      "Vetted professionals at the destination — photographers, chefs, barbers, interpreters, fixers — with filters, profiles and an add-to-basket button.",
    actions: "Filter, open a profile, add a professional to the basket, check out.",
  },
  "/services": {
    name: "Service page",
    summary:
      "A service that is launching soon (flights, hotels or experiences), with a waitlist.",
  },
  "/applicant": {
    name: "Applicant dashboard",
    summary:
      "The signed-in applicant's overview: hire bookings with status, filters and spending.",
    actions: "Open a booking, go to applications or hires.",
  },
  "/applicant/applications": {
    name: "My applications",
    summary:
      "Every visa and passport application on the account with status and payment status. Opening one shows its timeline, fees, notes and, when payment is due, the bank accounts to transfer to.",
    actions: "Open an application, read its status, see how to pay.",
  },
  "/applicant/hires": {
    name: "My hires",
    summary:
      "The applicant's hire bookings with status, assigned staff and agency contact.",
    actions: "Open a booking.",
  },
  "/applicant/settings": {
    name: "Account settings",
    summary:
      "The WorldStreet account the applicant is signed in with (name and email) and a sign-out button.",
    actions: "Sign out, manage the account on WorldStreet.",
  },
};

/** Longest matching route prefix, so /applicant/hires beats /applicant. */
export function getPageInfo(pathname: string): PageInfo {
  const path = pathname.split(/[?#]/)[0] || "/";
  if (PAGES[path]) return PAGES[path];
  const match = Object.keys(PAGES)
    .filter((route) => route !== "/" && path.startsWith(`${route}/`))
    .sort((a, b) => b.length - a.length)[0];
  return match
    ? PAGES[match]
    : {
        name: "E-Embassy",
        summary: "A page on E-Embassy, WorldStreet's visa and travel service.",
      };
}
