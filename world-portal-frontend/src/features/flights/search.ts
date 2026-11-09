import { format, isValid, parse } from "date-fns";

import { findAirport } from "@/features/flights/airports";

/**
 * The hero's flight search, as plain data: what the form holds, what goes in
 * the URL when it hands over to `/start`, and how it reads back. The URL is
 * the only hand-over, so a search can be shared or reloaded and the trip
 * planner picks it up the same way every time.
 */
export type TripType = "return" | "one-way";
export type Cabin = "economy" | "premium" | "business" | "first";
export type Travellers = { adults: number; children: number; infants: number };

export type FlightSearch = {
  trip: TripType;
  /** Airport codes. */
  from: string;
  to: string;
  /** Local calendar days as yyyy-MM-dd, or null until picked. */
  depart: string | null;
  back: string | null;
  travellers: Travellers;
  cabin: Cabin;
};

export const MAX_TRAVELLERS = 9;

export const cabinLabels: Record<Cabin, string> = {
  economy: "Economy",
  premium: "Premium economy",
  business: "Business",
  first: "First",
};

const CABINS = Object.keys(cabinLabels) as Cabin[];
const DAY = "yyyy-MM-dd";

/** A local calendar day as yyyy-MM-dd (never via UTC, which can shift it a day). */
export function toDayKey(date: Date): string {
  return format(date, DAY);
}

export function fromDayKey(key: string | null | undefined): Date | undefined {
  if (!key || !/^\d{4}-\d{2}-\d{2}$/.test(key)) return undefined;
  const date = parse(key, DAY, new Date());
  return isValid(date) && toDayKey(date) === key ? date : undefined;
}

/** "Sat 12 Dec" */
export function dayLabel(key: string | null | undefined): string {
  const date = fromDayKey(key);
  return date ? format(date, "EEE d MMM") : "";
}

/** "1 adult", "2 adults, 1 child", "2 adults, 1 child, 1 infant" */
export function travellersLabel({ adults, children, infants }: Travellers): string {
  const parts = [`${adults} ${adults === 1 ? "adult" : "adults"}`];
  if (children) parts.push(`${children} ${children === 1 ? "child" : "children"}`);
  if (infants) parts.push(`${infants} ${infants === 1 ? "infant" : "infants"}`);
  return parts.join(", ");
}

/**
 * What still has to be picked before the search can go, in the order the
 * form asks for it, or null when it is ready.
 */
export function missingField(
  s: FlightSearch,
): "from" | "to" | "depart" | "back" | null {
  if (!findAirport(s.from)) return "from";
  if (!findAirport(s.to)) return "to";
  if (!fromDayKey(s.depart)) return "depart";
  if (s.trip === "return" && !fromDayKey(s.back)) return "back";
  return null;
}

/** The query string `/start` reads. */
export function toQuery(s: FlightSearch): string {
  const q = new URLSearchParams({ from: s.from, to: s.to, trip: s.trip });
  if (s.depart) q.set("depart", s.depart);
  if (s.trip === "return" && s.back) q.set("return", s.back);
  q.set("adults", String(s.travellers.adults));
  if (s.travellers.children) q.set("children", String(s.travellers.children));
  if (s.travellers.infants) q.set("infants", String(s.travellers.infants));
  q.set("cabin", s.cabin);
  return q.toString();
}

type Params = URLSearchParams | Record<string, string | string[] | undefined>;

function read(params: Params, key: string): string | undefined {
  if (params instanceof URLSearchParams) return params.get(key) ?? undefined;
  const v = params[key];
  return Array.isArray(v) ? v[0] : v;
}

function count(raw: string | undefined, min: number, max: number, fallback: number) {
  const n = Number.parseInt(raw ?? "", 10);
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback;
}

/**
 * A search back out of the URL, or null when it does not name two known
 * airports in different countries. Anything else that is off (a bad date, a
 * return before the departure, too many travellers) is dropped or clamped
 * rather than failing the whole search.
 */
export function parseFlightSearch(params: Params): FlightSearch | null {
  const from = findAirport(read(params, "from"));
  const to = findAirport(read(params, "to"));
  if (!from || !to || from.country === to.country) return null;

  const trip: TripType = read(params, "trip") === "one-way" ? "one-way" : "return";
  const departDate = fromDayKey(read(params, "depart"));
  const backDate = trip === "return" ? fromDayKey(read(params, "return")) : undefined;

  const adults = count(read(params, "adults"), 1, MAX_TRAVELLERS, 1);
  const children = count(read(params, "children"), 0, MAX_TRAVELLERS - adults, 0);
  // One lap per adult.
  const infants = count(
    read(params, "infants"),
    0,
    Math.min(adults, MAX_TRAVELLERS - adults - children),
    0,
  );

  const cabinRaw = read(params, "cabin");
  const cabin = CABINS.includes(cabinRaw as Cabin) ? (cabinRaw as Cabin) : "economy";

  return {
    trip,
    from: from.code,
    to: to.code,
    depart: departDate ? toDayKey(departDate) : null,
    back:
      backDate && (!departDate || backDate >= departDate) ? toDayKey(backDate) : null,
    travellers: { adults, children, infants },
    cabin,
  };
}

/** One line for the trip: "Return · Sat 12 Dec – Sat 19 Dec · 1 adult · Economy". */
export function tripDetails(s: FlightSearch): string {
  const dates =
    s.trip === "return" && s.back
      ? `${dayLabel(s.depart)} – ${dayLabel(s.back)}`
      : dayLabel(s.depart);
  return [
    s.trip === "return" ? "Return" : "One way",
    dates,
    travellersLabel(s.travellers),
    cabinLabels[s.cabin],
  ]
    .filter(Boolean)
    .join(" · ");
}
