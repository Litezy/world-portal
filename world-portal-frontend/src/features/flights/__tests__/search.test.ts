import { describe, expect, it } from "vitest";

import { airports, findAirport, searchAirports } from "@/features/flights/airports";
import {
  type FlightSearch,
  fromDayKey,
  missingField,
  parseFlightSearch,
  toQuery,
  travellersLabel,
  tripDetails,
} from "@/features/flights/search";
import { findCountry } from "@/lib/countries";

const trip: FlightSearch = {
  trip: "return",
  from: "LOS",
  to: "DXB",
  depart: "2026-12-12",
  back: "2026-12-19",
  travellers: { adults: 2, children: 1, infants: 0 },
  cabin: "business",
};

/**
 * The URL is the only hand-over from the hero's search to the trip planner,
 * so what goes in has to come back out the same, and anything mangled on the
 * way has to degrade into a usable trip rather than an error page.
 */
describe("flight search", () => {
  it("round-trips through the URL", () => {
    expect(parseFlightSearch(new URLSearchParams(toQuery(trip)))).toEqual(trip);
  });

  it("reads the page's searchParams object too", () => {
    const parsed = parseFlightSearch({
      from: "LOS",
      to: ["LHR", "JFK"],
      trip: "one-way",
    });
    expect(parsed?.to).toBe("LHR");
    expect(parsed?.trip).toBe("one-way");
  });

  it("needs two known airports in different countries", () => {
    expect(parseFlightSearch({ from: "LOS" })).toBeNull();
    expect(parseFlightSearch({ from: "LOS", to: "XXX" })).toBeNull();
    // Lagos to Abuja is not a trip abroad: no passport or visa to check.
    expect(parseFlightSearch({ from: "LOS", to: "ABV" })).toBeNull();
  });

  it("drops a return that comes before the departure, and any on a one-way", () => {
    expect(
      parseFlightSearch({
        from: "LOS",
        to: "DXB",
        depart: "2026-12-12",
        return: "2026-12-01",
      })?.back,
    ).toBeNull();
    expect(
      parseFlightSearch({
        from: "LOS",
        to: "DXB",
        trip: "one-way",
        depart: "2026-12-12",
        return: "2026-12-19",
      })?.back,
    ).toBeNull();
  });

  it("ignores dates that are not real days", () => {
    expect(fromDayKey("2026-02-30")).toBeUndefined();
    expect(fromDayKey("12/12/2026")).toBeUndefined();
    expect(
      parseFlightSearch({ from: "LOS", to: "DXB", depart: "soon" })?.depart,
    ).toBeNull();
  });

  it("keeps travellers to nine, at least one adult, and one infant per adult", () => {
    const t = parseFlightSearch({
      from: "LOS",
      to: "DXB",
      adults: "0",
      children: "40",
      infants: "5",
    })?.travellers;
    expect(t).toEqual({ adults: 1, children: 8, infants: 0 });
    expect(
      parseFlightSearch({ from: "LOS", to: "DXB", adults: "2", infants: "5" })
        ?.travellers.infants,
    ).toBe(2);
  });

  it("falls back to economy for an unknown cabin", () => {
    expect(parseFlightSearch({ from: "LOS", to: "DXB", cabin: "jet" })?.cabin).toBe(
      "economy",
    );
  });

  it("asks for what is missing in the order the form does", () => {
    const empty: FlightSearch = { ...trip, to: "", depart: null, back: null };
    expect(missingField(empty)).toBe("to");
    expect(missingField({ ...empty, to: "DXB" })).toBe("depart");
    expect(missingField({ ...empty, to: "DXB", depart: "2026-12-12" })).toBe("back");
    expect(
      missingField({ ...empty, to: "DXB", depart: "2026-12-12", trip: "one-way" }),
    ).toBeNull();
  });

  it("describes the trip in one line", () => {
    expect(travellersLabel({ adults: 1, children: 0, infants: 0 })).toBe("1 adult");
    expect(tripDetails(trip)).toBe(
      "Return · Sat 12 Dec – Sat 19 Dec · 2 adults, 1 child · Business",
    );
  });
});

describe("airports", () => {
  it("all sit in countries the trip planner knows", () => {
    for (const a of airports) expect(findCountry(a.country), a.code).toBeDefined();
  });

  it("has each code once", () => {
    expect(new Set(airports.map((a) => a.code)).size).toBe(airports.length);
  });

  it("finds by code, city, country and the words people use", () => {
    expect(searchAirports("los")[0]?.code).toBe("LOS");
    // An exact code wins: "dub" is Dublin's, then Dubai by its city.
    expect(
      searchAirports("dub")
        .map((a) => a.code)
        .slice(0, 2),
    ).toEqual(["DUB", "DXB"]);
    expect(searchAirports("uk").map((a) => a.code)).toContain("LHR");
    expect(searchAirports("uae").map((a) => a.code)).toEqual(["DXB", "AUH"]);
    expect(searchAirports("male")[0]?.code).toBe("MLE");
  });

  it("leaves out the other end's country", () => {
    expect(searchAirports("", "NG").some((a) => a.country === "NG")).toBe(false);
    expect(findAirport("lhr")?.city).toBe("London");
  });
});
