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
 * Admin
 * ------------------------------------------------------------------------- */

export type AdminRole = "admin" | "consultant";

export type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
  avatar?: string;
};

export type ServiceKind = "visa" | "booking" | "experience";

export type EnquiryStatus = "new" | "contacted" | "quoted" | "won" | "lost";

export type Enquiry = {
  id: string;
  reference: string;
  service: ServiceKind;
  fullName: string;
  email: string;
  phone?: string;
  destination: string;
  travelDate?: string;
  details?: string;
  status: EnquiryStatus;
  assigneeId?: string;
  createdAt: string;
  updatedAt: string;
};

export type VisaRoute = "evisa" | "consular" | "eta";

export type ApplicationEvent = {
  status: ApplicationStatus;
  at: string;
  note?: string;
};

export type VisaApplication = {
  id: string;
  reference: string;
  applicant: { name: string; email: string; customerId: string };
  destination: string;
  countryCode: string;
  category: VisaCategory;
  route: VisaRoute;
  status: ApplicationStatus;
  consultantId: string;
  fee: number;
  currency: string;
  submittedAt: string;
  dueAt: string;
  /** Server-computed: the decision date has passed and no decision is in. */
  overdue: boolean;
  timeline: ApplicationEvent[];
};

export type Customer = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  country: string;
  avatar?: string;
  applications: number;
  trips: number;
  lifetimeValue: number;
  currency: string;
  createdAt: string;
  lastActiveAt: string;
};

export type DashboardStats = {
  enquiries: { total: number; open: number; change: number };
  applications: { total: number; active: number; change: number };
  customers: { total: number; change: number };
  revenue: { amount: number; currency: string; change: number };
  pipeline: { status: ApplicationStatus; count: number }[];
  enquiriesByService: { service: ServiceKind; count: number }[];
  weekly: { label: string; enquiries: number; applications: number }[];
};

export type ListParams = {
  q?: string;
  status?: string;
  page?: number;
  perPage?: number;
};
