import type {
  BackendPaymentStatus,
  BackendUserRole,
  BackendVisaCategory,
  PassportStatus,
  VisaStatus,
} from "@/server/data/backend-types";

export type VisaCategory =
  "tourist" | "business" | "study" | "work" | "family" | "transit" | "residency";

export type ApplicationStatus =
  | "draft"
  | "submitted"
  | "in_review"
  | "documents_required"
  | "biometrics_scheduled"
  | "decision_pending"
  | "approved"
  | "rejected";

export type Destination = {
  id: string;
  slug: string;
  name: string;
  countryCode: string;
  region: string;
  heroImage: string;
  summary: string;
  popular?: boolean;
  visaCategories: VisaCategory[];
};

export type VisaService = {
  id: string;
  slug: string;
  title: string;
  category: VisaCategory;
  summary: string;
  /** Government fee excluded — quoted separately per destination. */
  startingPrice: number;
  currency: string;
  processing: { minDays: number; maxDays: number };
  requirements: string[];
  successRate?: number;
};

export type Testimonial = {
  id: string;
  name: string;
  role?: string;
  destination?: string;
  avatar?: string;
  rating: 1 | 2 | 3 | 4 | 5;
  quote: string;
};

export type FaqItem = {
  question: string;
  answer: string;
  category?: string;
};

export type Consultant = {
  id: string;
  name: string;
  title: string;
  avatar: string;
  bio: string;
  specialisms: string[];
};

/** Envelope every API route in this app returns. */
export type ApiResponse<T> = {
  data: T;
  message?: string;
};

export type Paginated<T> = {
  data: T[];
  meta: {
    page: number;
    perPage: number;
    total: number;
    totalPages: number;
    /**
     * Rows per status across the whole filtered set (search and dates applied,
     * the status filter not) — the counts on a list's status tabs.
     */
    counts?: Record<string, number>;
  };
};

/* ---------------------------------------------------------------------------
 * Admin console
 *
 * These are the console's view models. They mirror the World Portal API's
 * records (see src/server/data/backend-types.ts) with the decimals already
 * parsed and the applicant flattened.
 * ------------------------------------------------------------------------- */

export type AdminRole = BackendUserRole;

export type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
  avatar?: string;
};

/**
 * The signed-in console user as components receive it. The session cookie
 * also carries the World Portal access token, and whatever a client component
 * is handed is serialized into the page, so `token` and `exp` are typed
 * `never`: passing the session itself does not compile. Build one with
 * `toClientUser(session)` from `src/server/auth/client-user.ts`.
 */
export type ClientAdminUser = AdminUser & { token?: never; exp?: never };

export type Applicant = {
  name: string;
  email: string;
  phone?: string;
  /** Opaque link key for `/admin/customers/[key]` — never the email itself. */
  key?: string;
};

export type ApplicationEvent = {
  status: VisaStatus | PassportStatus;
  at: string;
  note?: string;
};

export type SubmittedDocument = {
  label: string;
  url: string;
};

export type VisaApplication = {
  id: string;
  reference: string;
  applicant: Applicant;
  destination: string;
  category: BackendVisaCategory;
  status: VisaStatus;
  paymentStatus: BackendPaymentStatus;
  /** Parsed from the API's string decimals. */
  totalAmount: number;
  currency: string;
  amountPaid: number;
  balanceDue: number;
  allowInstallment: boolean;
  travelDate: string;
  returnDate: string;
  purpose: string;
  nationality: string;
  passportNumber: string;
  passportExpiryDate: string | null;
  dateOfBirth: string | null;
  gender: string | null;
  residenceAddress: string | null;
  verificationNotes: string | null;
  rejectionReason: string | null;
  evaluatedBy: string | null;
  evaluatedAt: string | null;
  reviewedBy: string | null;
  createdAt: string;
  updatedAt: string;
  timeline: ApplicationEvent[];
  documents: SubmittedDocument[];
};

export type PassportApplication = {
  id: string;
  reference: string;
  applicant: Applicant;
  category: string;
  sex: string;
  ninNumber: string;
  dateOfBirth: string;
  placeOfBirth: string;
  existingPassportNumber?: string | null;
  homeTown: string;
  stateOfOrigin: string;
  permanentAddress: string;
  occupation: string;
  maritalStatus: string;
  colourOfEyes?: string | null;
  colourOfHair?: string | null;
  height?: string | null;
  maidenName?: string | null;
  nextOfKin: {
    name: string;
    phone: string;
    relationship: string;
    address: string;
  };
  validity: string;
  bookletType: string;
  paymentStatus: BackendPaymentStatus;
  totalAmount: number;
  currency: string;
  amountPaid: number;
  balanceDue: number;
  allowInstallment: boolean;
  status: PassportStatus;
  verificationNotes: string | null;
  rejectionReason: string | null;
  reviewedBy: string | null;
  evaluatedBy?: string | null;
  evaluatedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  timeline: ApplicationEvent[];
  documents: SubmittedDocument[];
};

export type TeamMember = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: AdminRole;
  isActive: boolean;
  createdAt: string;
};

/** Derived from applications — the API has no customer table. */
export type Customer = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  country: string;
  applications: number;
  /**
   * What this applicant has paid, per currency, across visas and passports.
   * Never one summed figure: naira plus dollars is not a number.
   */
  paidByCurrency: Record<string, number>;
  createdAt: string;
  lastActiveAt: string;
};

/** `GET /api/admin/customers/[key]` — one applicant and everything they've applied for. */
export type CustomerDetail = {
  customer: Customer;
  visas: VisaApplication[];
  passports: PassportApplication[];
};

/** `GET /api/admin/search` — the ⌘K palette's groups. No emails: names only. */
export type AdminSearchResults = {
  visas: { id: string; reference: string; name: string; status: VisaStatus }[];
  passports: { id: string; reference: string; name: string; status: PassportStatus }[];
  applicants: { name: string; applications: number }[];
};

export type DashboardStats = {
  visas: { total: number; active: number; approved: number };
  passports: { total: number; active: number };
  customers: { total: number };
  revenue: {
    collected: number;
    outstanding: number;
    currency: string;
    revenueByCurrency?: Record<string, number>;
    outstandingByCurrency?: Record<string, number>;
  };
  visaPipeline: { status: VisaStatus; count: number }[];
  visasByCategory: { category: BackendVisaCategory; count: number }[];
  weekly: { label: string; visas: number; passports: number }[];
};

export type SortDirection = "asc" | "desc";

export type ListParams = {
  q?: string;
  status?: string;
  verification?: string;
  page?: number;
  perPage?: number;
  /** A sort key the list's route allows; anything else falls back to newest first. */
  sort?: string;
  dir?: SortDirection;
  /** Inclusive `YYYY-MM-DD` bounds on the submission date. */
  from?: string;
  to?: string;
};
