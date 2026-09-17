/**
 * The people a traveller can hire at their destination.
 */

export const professions = [
  "driving",
  "security",
  "tour_guide",
  "catering",
  "interpreting",
  "cleaning",
  "childcare",
  "logistics",
  "events",
  "medical",
  "photographer",
  "videographer",
  "chef",
  "barber",
  "shopper",
  "interpreter",
  "event",
  "freelancer",
] as const;

export type Profession = (typeof professions)[number];

export const professionLabels: Record<Profession, string> = {
  driving: "Driving & transfers",
  security: "Private security",
  tour_guide: "Tour guides",
  catering: "Catering & private chefs",
  interpreting: "Interpreting & translation",
  cleaning: "Cleaning & housekeeping",
  childcare: "Childcare & nannies",
  logistics: "Logistics & customs",
  events: "Events & planning",
  medical: "Medical standby",
  photographer: "Photographer",
  videographer: "Videographer",
  chef: "Private chef / cook",
  barber: "Barber / stylist",
  shopper: "Personal shopper",
  interpreter: "Interpreter / translator",
  event: "Event planner",
  freelancer: "Freelancer / other",
};

/**
 * Primary display categories shown on the /hire filter
 */
export const unifiedDisplayCategories: Profession[] = [
  "driving",
  "security",
  "tour_guide",
  "catering",
  "interpreting",
  "cleaning",
  "childcare",
  "logistics",
  "events",
  "medical",
  "photographer",
  "videographer",
  "freelancer",
];

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
