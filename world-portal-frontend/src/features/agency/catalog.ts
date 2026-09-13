import {
  Baby,
  Brush,
  CarFront,
  ChefHat,
  HeartPulse,
  Languages,
  type LucideIcon,
  Map as MapIcon,
  PartyPopper,
  ShieldCheck,
  Truck,
} from "lucide-react";

import {
  agencyCategories,
  type AgencyCategory,
  type AgencyDocumentKind,
} from "@/features/agency/types";

/**
 * The service catalog, and the paperwork each service has to produce.
 *
 * Both live here so the listing flow stays a dumb renderer: it asks this file
 * what a category needs and draws it. Adding a service is one entry in
 * `categoryCatalog` plus its documents in `categoryDocuments` — no new screen,
 * no new branch in the wizard.
 */

export type CategoryEntry = {
  label: string;
  /** One line, shown on the picker card. */
  blurb: string;
  icon: LucideIcon;
  /** What a traveller is really buying. Used on the listing review step. */
  examples: string[];
};

export const categoryCatalog: Record<AgencyCategory, CategoryEntry> = {
  security: {
    label: "Security",
    blurb: "Close protection, venue and residence security.",
    icon: ShieldCheck,
    examples: ["Close protection officer", "Residence guarding", "Event security"],
  },
  catering: {
    label: "Catering & chefs",
    blurb: "Private chefs, in-villa dining and event catering.",
    icon: ChefHat,
    examples: ["Private chef", "Daily meal service", "Event catering"],
  },
  driving: {
    label: "Driving & transfers",
    blurb: "Vetted drivers, airport transfers and day hire.",
    icon: CarFront,
    examples: ["Airport transfer", "Full-day car and driver", "Intercity transfer"],
  },
  cleaning: {
    label: "Cleaning & housekeeping",
    blurb: "Housekeeping for stays, villas and short lets.",
    icon: Brush,
    examples: ["Daily housekeeping", "Deep clean", "Laundry service"],
  },
  tour_guide: {
    label: "Tour guides",
    blurb: "Licensed guides who know the ground.",
    icon: MapIcon,
    examples: ["City walking tour", "Multi-day guiding", "Cultural site access"],
  },
  interpreting: {
    label: "Interpreting & translation",
    blurb: "Accredited interpreters for meetings and appointments.",
    icon: Languages,
    examples: ["Business interpreting", "Medical appointments", "Document translation"],
  },
  childcare: {
    label: "Childcare",
    blurb: "Background-checked nannies and sitters.",
    icon: Baby,
    examples: ["Daytime nanny", "Evening sitter", "Travel nanny"],
  },
  logistics: {
    label: "Logistics & customs",
    blurb: "Freight, clearing and on-the-ground logistics.",
    icon: Truck,
    examples: ["Customs clearing", "Equipment freight", "Baggage logistics"],
  },
  events: {
    label: "Events",
    blurb: "Planning and running events at the destination.",
    icon: PartyPopper,
    examples: ["Event planning", "Venue sourcing", "On-site coordination"],
  },
  medical: {
    label: "Medical standby",
    blurb: "Licensed medics and on-call clinical cover.",
    icon: HeartPulse,
    examples: ["Event medic", "On-call doctor", "Medical escort"],
  },
};

export type DocumentEntry = {
  label: string;
  /** Why it is asked for — shown under the upload so the ask is never opaque. */
  why: string;
  /** Whether the listing can be submitted without it. */
  required: boolean;
  /** Documents that lapse must carry a date; the UI asks for one when true. */
  expires: boolean;
};

export const documentCatalog: Record<AgencyDocumentKind, DocumentEntry> = {
  business_registration: {
    label: "Certificate of incorporation",
    why: "Proves the company exists and names who owns it.",
    required: true,
    expires: false,
  },
  tax_certificate: {
    label: "Tax identification certificate",
    why: "Needed before the platform can pay the agency.",
    required: true,
    expires: true,
  },
  proof_of_address: {
    label: "Proof of business address",
    why: "A utility bill or lease no older than three months.",
    required: true,
    expires: true,
  },
  owner_id: {
    label: "Photo ID of the signing director",
    why: "Matches the person accepting the contract to the company record.",
    required: true,
    expires: true,
  },
  liability_insurance: {
    label: "Public liability insurance",
    why: "Covers the traveller if something goes wrong on the job.",
    required: true,
    expires: true,
  },
  security_operating_licence: {
    label: "Private security operating licence",
    why: "Guarding is licensed work in most jurisdictions.",
    required: true,
    expires: true,
  },
  guard_training_certificates: {
    label: "Guard training certificates",
    why: "Evidence each officer is trained, not just employed.",
    required: true,
    expires: true,
  },
  food_hygiene_certificate: {
    label: "Food hygiene certificate",
    why: "Anyone cooking for a traveller must hold current food safety training.",
    required: true,
    expires: true,
  },
  kitchen_inspection_report: {
    label: "Kitchen inspection report",
    why: "Required where food is prepared off-site before delivery.",
    required: false,
    expires: true,
  },
  fleet_insurance: {
    label: "Fleet insurance",
    why: "Must cover passengers, not just the vehicle.",
    required: true,
    expires: true,
  },
  vehicle_registration: {
    label: "Vehicle registration papers",
    why: "One per vehicle offered for hire.",
    required: true,
    expires: true,
  },
  driver_licences: {
    label: "Driver licences",
    why: "With the correct class for passenger carriage.",
    required: true,
    expires: true,
  },
  chemical_handling_assessment: {
    label: "Chemical handling assessment",
    why: "Cleaning products used around guests need a documented assessment.",
    required: false,
    expires: true,
  },
  tour_guide_licence: {
    label: "Tour guide licence",
    why: "Many sites refuse entry to parties led by an unlicensed guide.",
    required: true,
    expires: true,
  },
  first_aid_certificate: {
    label: "First aid certificate",
    why: "A guide is often the only trained person present.",
    required: true,
    expires: true,
  },
  interpreter_accreditation: {
    label: "Interpreter accreditation",
    why: "Medical and legal interpreting is not a general-language job.",
    required: true,
    expires: true,
  },
  childcare_background_checks: {
    label: "Background checks for childcare staff",
    why: "Non-negotiable, and re-checked yearly rather than once.",
    required: true,
    expires: true,
  },
  customs_broker_licence: {
    label: "Customs broker licence",
    why: "Clearing goods on someone's behalf is regulated work.",
    required: true,
    expires: true,
  },
  event_public_liability: {
    label: "Event public liability cover",
    why: "Sits on top of general cover, at the headcount you actually host.",
    required: true,
    expires: true,
  },
  medical_practitioner_licence: {
    label: "Practitioner licence",
    why: "Current registration for every clinician put on a job.",
    required: true,
    expires: true,
  },
};

/** Asked of every agency, whatever it sells. */
export const baseDocuments: AgencyDocumentKind[] = [
  "business_registration",
  "tax_certificate",
  "proof_of_address",
  "owner_id",
  "liability_insurance",
];

const categoryDocuments: Record<AgencyCategory, AgencyDocumentKind[]> = {
  security: ["security_operating_licence", "guard_training_certificates"],
  catering: ["food_hygiene_certificate", "kitchen_inspection_report"],
  driving: ["fleet_insurance", "vehicle_registration", "driver_licences"],
  cleaning: ["chemical_handling_assessment"],
  tour_guide: ["tour_guide_licence", "first_aid_certificate"],
  interpreting: ["interpreter_accreditation"],
  childcare: ["childcare_background_checks", "first_aid_certificate"],
  logistics: ["customs_broker_licence"],
  events: ["event_public_liability"],
  medical: ["medical_practitioner_licence", "first_aid_certificate"],
};

/**
 * Every document an agency must produce for the categories it has picked.
 *
 * De-duplicated, because several categories ask for the same certificate —
 * `first_aid_certificate` is wanted by guides, childcare and medical, and an
 * agency doing all three uploads it once.
 */
export function documentsForCategories(
  categories: readonly AgencyCategory[],
): AgencyDocumentKind[] {
  const wanted = new Set<AgencyDocumentKind>(baseDocuments);
  for (const category of categories) {
    for (const kind of categoryDocuments[category] ?? []) wanted.add(kind);
  }
  // Keep catalog order so the checklist never reshuffles between renders.
  return (Object.keys(documentCatalog) as AgencyDocumentKind[]).filter((kind) =>
    wanted.has(kind),
  );
}

/** The subset that actually blocks submission. */
export function requiredDocumentsFor(
  categories: readonly AgencyCategory[],
): AgencyDocumentKind[] {
  return documentsForCategories(categories).filter(
    (kind) => documentCatalog[kind].required,
  );
}

export const allCategories = agencyCategories;
