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
  meta: { page: number; perPage: number; total: number; totalPages: number };
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

export type Applicant = { name: string; email: string; phone?: string };

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
  amountPaid: number;
  balanceDue: number;
  allowInstallment: boolean;
  travelDate: string;
  returnDate: string;
  purpose: string;
  nationality: string;
  passportNumber: string;
  verificationNotes: string | null;
  rejectionReason: string | null;
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
  validity: string;
  bookletType: string;
  stateOfOrigin: string;
  status: PassportStatus;
  verificationNotes: string | null;
  rejectionReason: string | null;
  reviewedBy: string | null;
  createdAt: string;
  updatedAt: string;
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
  lifetimeValue: number;
  currency: string;
  createdAt: string;
  lastActiveAt: string;
};

export type DashboardStats = {
  visas: { total: number; active: number; approved: number };
  passports: { total: number; active: number };
  customers: { total: number };
  revenue: { collected: number; outstanding: number; currency: string };
  visaPipeline: { status: VisaStatus; count: number }[];
  visasByCategory: { category: BackendVisaCategory; count: number }[];
  weekly: { label: string; visas: number; passports: number }[];
};

export type ListParams = {
  q?: string;
  status?: string;
  page?: number;
  perPage?: number;
};
