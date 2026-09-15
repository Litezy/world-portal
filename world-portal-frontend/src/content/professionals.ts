/**
 * The people a traveller can hire at their destination.
 */

export const professions = [
  "photographer",
  "videographer",
  "chef",
  "barber",
  "shopper",
  "interpreter",
  "security",
  "childcare",
  "event",
  "freelancer",
] as const;

export type Profession = (typeof professions)[number];

export const professionLabels: Record<Profession, string> = {
  photographer: "Photographer",
  videographer: "Videographer",
  chef: "Private chef / cook",
  barber: "Barber / stylist",
  shopper: "Personal shopper",
  interpreter: "Interpreter / translator",
  security: "Private security",
  childcare: "Babysitter / nanny",
  event: "Event planner",
  freelancer: "Freelancer / other",
};

export type Professional = {
  id: string;
  name: string;
  tagline: string;
  profession: Profession;
  city: string;
  country: string;
  languages: string[];
  rating: number;
  jobs: number;
  years: number;
  /** Headline rate. `unit` is what the price buys. */
  price: number;
  currency?: string;
  unit: string;
  about: string;
  availability: string;
  packages: { name: string; description: string; price: number; currency?: string }[];
  included: string[];
  skills: string[];
  cancellation: string;
  verified: boolean;
  /** Optional real portrait; the monogram tile is used when absent. */
  photo?: string;
};

export const professionals: Professional[] = [];

/** Every city with at least one professional, alphabetised. */
export const professionalCities = [
  "Athens",
  "Bangkok",
  "Barcelona",
  "Dubai",
  "Lagos",
  "London",
  "New York",
  "Paris",
  "Rome",
  "Santorini",
  "Tokyo",
].sort();
