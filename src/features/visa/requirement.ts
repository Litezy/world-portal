import type { Country } from "@/lib/countries";
import { findCountry } from "@/lib/countries";

export type VisaRoute = "evisa" | "tvisa" | "eta" | "visa-free";

export type VisaVerdict = {
  route: VisaRoute;
  /** True when the whole application can be completed on this site. */
  online: boolean;
  label: string;
  turnaround: string;
  summary: string;
  /** What actually happens after they submit. */
  next: string[];
  origin?: Country;
  destination?: Country;
};

/**
 * Countries that run an Electronic Travel Authorisation rather than a visa —
 * a short online approval you get before boarding.
 */
const ETA_DESTINATIONS = new Set([
  "US", // ESTA
  "CA", // eTA
  "GB", // UK ETA
  "AU", // ETA / eVisitor
  "NZ", // NZeTA
  "KR", // K-ETA
]);

/** Destinations with a working end-to-end electronic visa portal. */
const EVISA_DESTINATIONS = new Set([
  "IN",
  "TR",
  "KE",
  "EG",
  "VN",
  "LK",
  "AZ",
  "GE",
  "ET",
  "TZ",
  "UG",
  "RW",
  "ZM",
  "ZW",
  "MM",
  "KH",
  "LA",
  "QA",
  "BH",
  "OM",
  "AE",
  "SA",
  "JO",
  "MA",
  "SG",
  "MY",
  "ID",
  "PH",
  "TH",
  "AO",
  "BJ",
  "CI",
  "GA",
  "GN",
  "MW",
  "MZ",
  "NA",
  "SC",
  "SL",
  "TG",
  "DJ",
  "MG",
  "CV",
  "GY",
  "SR",
  "MD",
  "AM",
  "KG",
  "TJ",
  "UZ",
  "PK",
  "BD",
  "NP",
  "BT",
  "MV",
]);

/**
 * Blocs whose members can travel between one another without a visa. This is a
 * deliberately conservative list — it only claims freedom of movement where it
 * is unambiguous.
 */
const FREE_MOVEMENT: string[][] = [
  // Schengen + EU/EEA + Switzerland
  [
    "AT",
    "BE",
    "BG",
    "HR",
    "CY",
    "CZ",
    "DK",
    "EE",
    "FI",
    "FR",
    "DE",
    "GR",
    "HU",
    "IS",
    "IE",
    "IT",
    "LV",
    "LI",
    "LT",
    "LU",
    "MT",
    "NL",
    "NO",
    "PL",
    "PT",
    "RO",
    "SK",
    "SI",
    "ES",
    "SE",
    "CH",
  ],
  // ECOWAS
  [
    "BJ",
    "BF",
    "CV",
    "CI",
    "GM",
    "GH",
    "GN",
    "GW",
    "LR",
    "ML",
    "NE",
    "NG",
    "SN",
    "SL",
    "TG",
  ],
  // EAC
  ["BI", "KE", "RW", "SS", "TZ", "UG"],
  // GCC
  ["BH", "KW", "OM", "QA", "SA", "AE"],
  // CARICOM (partial)
  ["AG", "BB", "BZ", "DM", "GD", "GY", "JM", "KN", "LC", "VC", "SR", "TT"],
];

function sharesBloc(a: string, b: string) {
  return FREE_MOVEMENT.some((bloc) => bloc.includes(a) && bloc.includes(b));
}

const COPY: Record<VisaRoute, Omit<VisaVerdict, "route" | "origin" | "destination">> = {
  evisa: {
    online: true,
    label: "eVisa",
    turnaround: "3–7 days",
    summary:
      "Good news — this one is done entirely online. You will not need to visit an embassy or hand over your passport.",
    next: [
      "Fill in your details and upload your documents here",
      "We check everything and submit it to the portal for you",
      "Your approval arrives by email, usually within a week",
    ],
  },
  eta: {
    online: true,
    label: "ETA",
    turnaround: "24–72 hours",
    summary:
      "You do not need a full visa for this trip — just an electronic travel authorisation, which is a short online approval linked to your passport.",
    next: [
      "Answer a few questions and upload your passport page",
      "We submit it the same working day",
      "Approval usually lands within 24–72 hours",
    ],
  },
  tvisa: {
    online: false,
    label: "T.Visa (Traditional Visa)",
    turnaround: "2–4 weeks",
    summary:
      "This route cannot be completed online — the embassy requires you in person. Give us your details here and we will prepare the whole file, book your appointment, and brief you before you go in.",
    next: [
      "Fill in your details below — no documents needed yet",
      "We prepare your file and tell you exactly what to bring",
      "We book your embassy appointment and brief you beforehand",
      "You attend in person; we track the decision after that",
    ],
  },
  "visa-free": {
    online: false,
    label: "No visa needed",
    turnaround: "—",
    summary:
      "You can travel on your passport alone for this trip. Make sure it has at least six months left on it when you arrive.",
    next: [
      "Check your passport has six months of validity left",
      "If it does not, renew it before you book anything",
      "Otherwise you are free to book flights and a place to stay",
    ],
  },
};

/**
 * Which visa route applies to an origin/destination pair.
 *
 * This is a deterministic local ruleset, deliberately so: the trip planner and
 * the application flow are the first things a visitor touches, and they must
 * work whether or not the API is reachable. The backend exposes
 * `/visa-requirement/check`, which proxies a live third-party dataset — when it
 * is up, prefer it and treat this as the fallback. It is a starting position,
 * not legal advice, and the UI says so.
 */
export function resolveVisaRoute(
  originCode: string,
  destinationCode: string,
): VisaVerdict {
  const origin = findCountry(originCode);
  const destination = findCountry(destinationCode);
  const from = origin?.code ?? "";
  const to = destination?.code ?? "";

  let route: VisaRoute;
  if (!from || !to || from === to) route = "visa-free";
  else if (sharesBloc(from, to)) route = "visa-free";
  else if (ETA_DESTINATIONS.has(to)) route = "eta";
  else if (EVISA_DESTINATIONS.has(to)) route = "evisa";
  else route = "tvisa";

  return { route, origin, destination, ...COPY[route] };
}

/** The API's VisaCategory is about *purpose*; this maps our route onto it. */
export const routeToApiNote: Record<VisaRoute, string> = {
  evisa: "eVisa — online application",
  eta: "ETA — electronic travel authorisation",
  tvisa: "T.Visa — traditional embassy application, documents to follow in person",
  "visa-free": "No visa required for this pair",
};
