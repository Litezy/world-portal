/**
 * The agency side of the platform.
 *
 * A service agency — security, catering, driving, cleaning, guiding — lists
 * itself here so a traveller can add it to their package. When they do, the
 * booking arrives as an `AgencyAssignment`, the agency puts one of its own
 * `AgencyStaff` against it, and the platform settles the agency afterwards
 * through an `AgencyPayout` from what the traveller already paid.
 *
 * There is no agency service on the World Portal API yet. Everything here is
 * served from `src/server/agency/store.ts`, which is the single seam to swap
 * when one exists — see the WorldSpace section in CLAUDE.md for the same
 * pattern. Keep this file the source of truth for the shapes; the store, the
 * route handlers and every screen are written against it.
 */

/** What an agency sells. Ordered as the catalog presents them. */
export const agencyCategories = [
  "security",
  "catering",
  "driving",
  "cleaning",
  "tour_guide",
  "interpreting",
  "childcare",
  "logistics",
  "events",
  "medical",
] as const;

export type AgencyCategory = (typeof agencyCategories)[number];

/**
 * Compliance paperwork. The base set is asked of every agency; the rest are
 * demanded per category by `documentsForCategory()` in `catalog.ts`.
 *
 * This list is a considered default, not a legal opinion: it is the paperwork
 * a serious operator in these trades would already hold. Expect the real set
 * to be settled with whoever owns onboarding risk, and edit `catalog.ts`
 * rather than scattering conditionals through the listing flow.
 */
export type AgencyDocumentKind =
  // Asked of everyone
  | "business_registration"
  | "tax_certificate"
  | "proof_of_address"
  | "owner_id"
  | "liability_insurance"
  // Security
  | "security_operating_licence"
  | "guard_training_certificates"
  // Catering / chef
  | "food_hygiene_certificate"
  | "kitchen_inspection_report"
  // Driving
  | "fleet_insurance"
  | "vehicle_registration"
  | "driver_licences"
  // Cleaning
  | "chemical_handling_assessment"
  // Tour guide
  | "tour_guide_licence"
  | "first_aid_certificate"
  // Interpreting
  | "interpreter_accreditation"
  // Childcare
  | "childcare_background_checks"
  // Logistics
  | "customs_broker_licence"
  // Events
  | "event_public_liability"
  // Medical
  | "medical_practitioner_licence";

export type AgencyDocumentStatus =
  "missing" | "uploaded" | "in_review" | "approved" | "rejected";

/** One piece of paperwork against an agency's file. */
export type AgencyDocument = {
  kind: AgencyDocumentKind;
  status: AgencyDocumentStatus;
  /** Set once uploaded. Absent while `missing`. */
  fileName?: string;
  fileUrl?: string;
  /** ISO 8601. */
  uploadedAt?: string;
  /** Expiry matters: a lapsed licence is as good as a missing one. */
  expiresAt?: string;
  /** Why a reviewer rejected it — shown back to the agency verbatim. */
  note?: string;
};

/** Where the agency stands with the platform. */
export type AgencyVerificationStatus =
  "unverified" | "pending" | "verified" | "suspended";

/** Where one listing stands. An agency can be verified and still be a draft. */
export type AgencyListingStatus =
  "draft" | "submitted" | "in_review" | "live" | "rejected" | "paused";

export type AgencyRole = "owner" | "manager" | "coordinator";

/** The signed-in person. Mirrors `AdminUser` deliberately. */
export type AgencyUser = {
  id: string;
  name: string;
  email: string;
  role: AgencyRole;
  agencyId: string;
  agencyName: string;
};

export type AgencyServiceOffering = {
  id: string;
  category: AgencyCategory;
  title: string;
  description: string;
  /** Per `unit`, in `currency`. `null` means quoted after review. */
  price: number | null;
  currency: string;
  unit: string;
  /** How much notice the agency needs, in hours. */
  leadTimeHours: number;
  /** Head count this offering can field at once. */
  capacity: number;
};

export type Agency = {
  id: string;
  slug: string;
  name: string;
  legalName: string;
  registrationNumber: string;
  /** Where it can actually work. ISO-3166 alpha-2. */
  countryCode: string;
  country: string;
  cities: string[];
  categories: AgencyCategory[];
  summary: string;
  about: string;
  logoUrl: string | null;
  email: string;
  phone: string;
  website: string | null;
  yearFounded: number;
  staffCount: number;
  languages: string[];
  verification: AgencyVerificationStatus;
  listingStatus: AgencyListingStatus;
  documents: AgencyDocument[];
  offerings: AgencyServiceOffering[];
  rating: number | null;
  completedJobs: number;
  /** ISO 8601. */
  createdAt: string;
  /** Platform commission on this agency's work, as a fraction (0.15 = 15%). */
  commissionRate: number;
};

export type AgencyStaffStatus = "available" | "assigned" | "off_duty" | "inactive";

export type AgencyStaff = {
  id: string;
  agencyId: string;
  name: string;
  role: string;
  category: AgencyCategory;
  photoUrl: string | null;
  phone: string;
  languages: string[];
  /** Years in the trade. */
  experienceYears: number;
  status: AgencyStaffStatus;
  /** Vetting the agency has done on this person. */
  backgroundChecked: boolean;
  rating: number | null;
};

export type AssignmentStatus =
  "requested" | "assigned" | "in_progress" | "completed" | "cancelled";

/**
 * A traveller added this agency to their package. The agency's job is to put a
 * name against it before `startsAt`.
 */
export type AgencyAssignment = {
  id: string;
  reference: string;
  agencyId: string;
  category: AgencyCategory;
  offeringId: string;
  offeringTitle: string;
  traveller: {
    name: string;
    /** Contact is released only once staff are assigned. */
    email: string | null;
    phone: string | null;
    partySize: number;
  };
  destination: { city: string; country: string; countryCode: string };
  /** ISO 8601. */
  startsAt: string;
  endsAt: string;
  status: AssignmentStatus;
  /** Null until the agency assigns someone. */
  assignedStaffIds: string[];
  /** How many people the traveller paid for. */
  staffRequired: number;
  notes: string | null;
  /** What the traveller paid, in `currency`. */
  gross: number;
  currency: string;
  /** Platform's cut of `gross`. */
  platformFee: number;
  /** What the agency is owed: `gross - platformFee`. */
  netToAgency: number;
  createdAt: string;
};

export type PayoutStatus = "pending" | "processing" | "paid" | "on_hold";

/**
 * The platform holds the traveller's money and pays the agency after the job.
 * A payout batches the assignments settled in one run.
 */
export type AgencyPayout = {
  id: string;
  reference: string;
  agencyId: string;
  /** ISO 8601 — the run this batch belongs to. */
  periodStart: string;
  periodEnd: string;
  assignmentIds: string[];
  gross: number;
  platformFee: number;
  net: number;
  currency: string;
  status: PayoutStatus;
  /** Set once `paid`. */
  paidAt?: string;
  /** Masked, e.g. "GTBank ••••4471". */
  destinationAccount: string;
};

/** The dashboard's headline figures. Derived, never stored. */
export type AgencyOverview = {
  openAssignments: number;
  staffOnDuty: number;
  staffTotal: number;
  completedThisMonth: number;
  earnedThisMonth: number;
  pendingPayout: number;
  currency: string;
  /** Documents still blocking verification. */
  outstandingDocuments: number;
  verification: AgencyVerificationStatus;
  listingStatus: AgencyListingStatus;
};
