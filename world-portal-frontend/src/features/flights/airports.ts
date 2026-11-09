import { countryName, findCountry } from "@/lib/countries";

/**
 * The airports the hero's flight search offers: Nigeria's own, then the places
 * people from here fly to most. Bundled like the country list, because the
 * search is the first thing on the page and must not wait on an API. `country`
 * is the ISO code the trip planner already speaks, so a search hands straight
 * over to its passport and visa questions.
 */
export type Airport = {
  code: string;
  city: string;
  name: string;
  country: string;
  /** Extra words people type: "uk", "uae", "dubai airport". */
  aliases?: string[];
};

export const airports: Airport[] = [
  // Nigeria
  { code: "LOS", city: "Lagos", name: "Murtala Muhammed International", country: "NG" },
  { code: "ABV", city: "Abuja", name: "Nnamdi Azikiwe International", country: "NG" },
  {
    code: "PHC",
    city: "Port Harcourt",
    name: "Port Harcourt International",
    country: "NG",
  },
  { code: "KAN", city: "Kano", name: "Mallam Aminu Kano International", country: "NG" },
  { code: "ENU", city: "Enugu", name: "Akanu Ibiam International", country: "NG" },

  // Africa
  { code: "ACC", city: "Accra", name: "Kotoka International", country: "GH" },
  { code: "NBO", city: "Nairobi", name: "Jomo Kenyatta International", country: "KE" },
  {
    code: "JNB",
    city: "Johannesburg",
    name: "O. R. Tambo International",
    country: "ZA",
  },
  { code: "CPT", city: "Cape Town", name: "Cape Town International", country: "ZA" },
  { code: "CAI", city: "Cairo", name: "Cairo International", country: "EG" },
  { code: "CMN", city: "Casablanca", name: "Mohammed V International", country: "MA" },
  { code: "RAK", city: "Marrakesh", name: "Marrakesh Menara", country: "MA" },
  { code: "ADD", city: "Addis Ababa", name: "Bole International", country: "ET" },
  { code: "KGL", city: "Kigali", name: "Kigali International", country: "RW" },
  {
    code: "ZNZ",
    city: "Zanzibar",
    name: "Abeid Amani Karume International",
    country: "TZ",
  },
  { code: "DSS", city: "Dakar", name: "Blaise Diagne International", country: "SN" },
  {
    code: "ABJ",
    city: "Abidjan",
    name: "Félix-Houphouët-Boigny International",
    country: "CI",
  },
  { code: "DLA", city: "Douala", name: "Douala International", country: "CM" },
  {
    code: "MRU",
    city: "Mauritius",
    name: "Sir Seewoosagur Ramgoolam International",
    country: "MU",
  },
  {
    code: "SEZ",
    city: "Mahé",
    name: "Seychelles International",
    country: "SC",
    aliases: ["seychelles"],
  },

  // Middle East
  { code: "DXB", city: "Dubai", name: "Dubai International", country: "AE" },
  { code: "AUH", city: "Abu Dhabi", name: "Zayed International", country: "AE" },
  { code: "DOH", city: "Doha", name: "Hamad International", country: "QA" },
  { code: "RUH", city: "Riyadh", name: "King Khalid International", country: "SA" },
  { code: "JED", city: "Jeddah", name: "King Abdulaziz International", country: "SA" },
  { code: "IST", city: "Istanbul", name: "Istanbul Airport", country: "TR" },

  // Europe
  { code: "LHR", city: "London", name: "Heathrow", country: "GB" },
  { code: "LGW", city: "London", name: "Gatwick", country: "GB" },
  { code: "MAN", city: "Manchester", name: "Manchester Airport", country: "GB" },
  { code: "CDG", city: "Paris", name: "Charles de Gaulle", country: "FR" },
  { code: "AMS", city: "Amsterdam", name: "Schiphol", country: "NL" },
  { code: "FRA", city: "Frankfurt", name: "Frankfurt Airport", country: "DE" },
  { code: "BER", city: "Berlin", name: "Berlin Brandenburg", country: "DE" },
  { code: "BRU", city: "Brussels", name: "Brussels Airport", country: "BE" },
  { code: "ZRH", city: "Zurich", name: "Zurich Airport", country: "CH" },
  { code: "FCO", city: "Rome", name: "Fiumicino", country: "IT" },
  { code: "MAD", city: "Madrid", name: "Adolfo Suárez Madrid–Barajas", country: "ES" },
  {
    code: "BCN",
    city: "Barcelona",
    name: "Josep Tarradellas Barcelona–El Prat",
    country: "ES",
  },
  { code: "LIS", city: "Lisbon", name: "Humberto Delgado", country: "PT" },
  { code: "DUB", city: "Dublin", name: "Dublin Airport", country: "IE" },

  // The Americas
  {
    code: "JFK",
    city: "New York",
    name: "John F. Kennedy International",
    country: "US",
  },
  {
    code: "IAD",
    city: "Washington, D.C.",
    name: "Dulles International",
    country: "US",
  },
  {
    code: "ATL",
    city: "Atlanta",
    name: "Hartsfield–Jackson Atlanta International",
    country: "US",
  },
  { code: "IAH", city: "Houston", name: "George Bush Intercontinental", country: "US" },
  {
    code: "LAX",
    city: "Los Angeles",
    name: "Los Angeles International",
    country: "US",
  },
  { code: "MIA", city: "Miami", name: "Miami International", country: "US" },
  {
    code: "YYZ",
    city: "Toronto",
    name: "Toronto Pearson International",
    country: "CA",
  },
  {
    code: "YUL",
    city: "Montreal",
    name: "Montréal–Trudeau International",
    country: "CA",
  },
  { code: "YVR", city: "Vancouver", name: "Vancouver International", country: "CA" },
  {
    code: "GRU",
    city: "São Paulo",
    name: "Guarulhos International",
    country: "BR",
    aliases: ["sao paulo"],
  },
  {
    code: "CUN",
    city: "Cancún",
    name: "Cancún International",
    country: "MX",
    aliases: ["cancun"],
  },

  // Asia and Oceania
  {
    code: "MLE",
    city: "Malé",
    name: "Velana International",
    country: "MV",
    aliases: ["male"],
  },
  { code: "BKK", city: "Bangkok", name: "Suvarnabhumi", country: "TH" },
  { code: "SIN", city: "Singapore", name: "Changi", country: "SG" },
  {
    code: "KUL",
    city: "Kuala Lumpur",
    name: "Kuala Lumpur International",
    country: "MY",
  },
  {
    code: "PEK",
    city: "Beijing",
    name: "Beijing Capital International",
    country: "CN",
  },
  {
    code: "CAN",
    city: "Guangzhou",
    name: "Guangzhou Baiyun International",
    country: "CN",
  },
  { code: "NRT", city: "Tokyo", name: "Narita International", country: "JP" },
  { code: "DEL", city: "Delhi", name: "Indira Gandhi International", country: "IN" },
  {
    code: "BOM",
    city: "Mumbai",
    name: "Chhatrapati Shivaji Maharaj International",
    country: "IN",
  },
  { code: "SYD", city: "Sydney", name: "Sydney Kingsford Smith", country: "AU" },
  { code: "MEL", city: "Melbourne", name: "Melbourne Airport", country: "AU" },
];

/** Where the search starts: most of E-Embassy's travellers leave from Lagos. */
export const DEFAULT_ORIGIN = "LOS";

const byCode = new Map(airports.map((a) => [a.code, a]));

// What people type for a country that its display name does not contain.
const COUNTRY_WORDS: Record<string, string[]> = {
  GB: ["uk", "england", "britain", "united kingdom"],
  US: ["usa", "america", "united states"],
  AE: ["uae", "emirates"],
  NL: ["holland", "netherlands"],
  CI: ["ivory coast"],
  TR: ["turkey"],
};

export function findAirport(code: string | null | undefined): Airport | undefined {
  return code ? byCode.get(code.toUpperCase()) : undefined;
}

/** Everything an airport should match on: city, code, airport, country. */
function terms(a: Airport): string[] {
  return [
    a.city.toLowerCase(),
    a.code.toLowerCase(),
    a.name.toLowerCase(),
    countryName(a.country).toLowerCase(),
    ...(COUNTRY_WORDS[a.country] ?? []),
    ...(a.aliases ?? []),
  ];
}

/**
 * Airports matching what was typed, best first: an exact code, then a city
 * or code that starts with it, then anything that contains it.
 */
export function searchAirports(query: string, exclude?: string): Airport[] {
  const q = query.trim().toLowerCase();
  const pool = airports.filter((a) => !exclude || a.country !== exclude);
  if (!q) return pool;
  const rank = (a: Airport) => {
    if (a.code.toLowerCase() === q) return 0;
    if (a.city.toLowerCase().startsWith(q)) return 1;
    if (terms(a).some((t) => t.startsWith(q))) return 2;
    return 3;
  };
  return pool
    .filter((a) => terms(a).some((t) => t.includes(q)))
    .map((a, i) => ({ a, i, r: rank(a) }))
    .sort((x, y) => x.r - y.r || x.i - y.i)
    .map(({ a }) => a);
}

export function airportFlag(a: Airport): string {
  return findCountry(a.country)?.flag ?? "";
}
