import { WORLDSTREET_URL } from "@/config/auth";

/**
 * Where Vivid may take the applicant. The model picks an id from this list —
 * never a raw path — so a wrong guess is refused instead of landing on a 404.
 */
export type VividDestination = {
  id: string;
  path: string;
  label: string;
  /** Leaves E-Embassy for another WorldStreet site. */
  external?: boolean;
};

export const VIVID_DESTINATIONS = [
  { id: "home", path: "/", label: "E-Embassy home" },
  { id: "passports_section", path: "/#passports", label: "Passports on the home page" },
  { id: "visas_section", path: "/#visas", label: "Visas on the home page" },
  { id: "how_it_works", path: "/#journey", label: "How it works" },
  { id: "faq", path: "/#faq", label: "Frequently asked questions" },
  { id: "trip_planner", path: "/start", label: "Trip planner" },
  { id: "apply_visa", path: "/apply", label: "Visa application" },
  { id: "apply_passport", path: "/passport", label: "Passport application" },
  { id: "hire_a_pro", path: "/hire", label: "Hire a professional" },
  { id: "flights", path: "/services/flights", label: "Flights (coming soon)" },
  { id: "hotels", path: "/services/hotels", label: "Hotels (coming soon)" },
  {
    id: "experiences",
    path: "/services/experiences",
    label: "Experiences (coming soon)",
  },
  { id: "my_dashboard", path: "/applicant", label: "Applicant dashboard" },
  { id: "my_applications", path: "/applicant/applications", label: "My applications" },
  { id: "my_hires", path: "/applicant/hires", label: "My hires" },
  { id: "my_settings", path: "/applicant/settings", label: "Account settings" },
  {
    id: "worldstreet",
    path: WORLDSTREET_URL,
    label: "WorldStreet hub",
    external: true,
  },
] as const satisfies readonly VividDestination[];

export type VividDestinationId = (typeof VIVID_DESTINATIONS)[number]["id"];

export const VIVID_DESTINATION_IDS = VIVID_DESTINATIONS.map((d) => d.id);

export function findDestination(id: string): VividDestination | undefined {
  return VIVID_DESTINATIONS.find((d) => d.id === id);
}
