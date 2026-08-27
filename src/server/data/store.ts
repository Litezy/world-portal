import type {
  ApplicationStatus,
  Customer,
  DashboardStats,
  Enquiry,
  EnquiryStatus,
  ListParams,
  Paginated,
  VisaApplication,
} from "@/types";

import { seedApplications, seedCustomers, seedEnquiries } from "./seed";

/**
 * In-memory store so the console works end to end today. Each function mirrors
 * a call the real backend will expose; swap the bodies, keep the signatures.
 */
const DECIDED: ApplicationStatus[] = ["approved", "rejected"];

/** The deadline is judged by the server clock, never the visitor's. */
function withOverdue(application: Omit<VisaApplication, "overdue">): VisaApplication {
  return {
    ...application,
    overdue:
      !DECIDED.includes(application.status) &&
      Date.parse(application.dueAt) < Date.now(),
  };
}

const db = {
  enquiries: [...seedEnquiries],
  applications: seedApplications.map(withOverdue),
  customers: [...seedCustomers],
};

const ACTIVE_STAGES: ApplicationStatus[] = [
  "submitted",
  "in_review",
  "documents_required",
  "biometrics_scheduled",
  "decision_pending",
];

const OPEN_ENQUIRY: EnquiryStatus[] = ["new", "contacted", "quoted"];

function paginate<T>(items: T[], { page = 1, perPage = 10 }: ListParams): Paginated<T> {
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * perPage;
  return {
    data: items.slice(start, start + perPage),
    meta: { page: safePage, perPage, total, totalPages },
  };
}

function matches(haystack: (string | undefined)[], q?: string) {
  if (!q) return true;
  const needle = q.toLowerCase();
  return haystack.some((v) => v?.toLowerCase().includes(needle));
}

const byNewest = (a: { createdAt: string }, b: { createdAt: string }) =>
  b.createdAt.localeCompare(a.createdAt);

export function listEnquiries(params: ListParams) {
  const items = db.enquiries
    .filter((e) => !params.status || e.status === params.status)
    .filter((e) => matches([e.fullName, e.email, e.reference, e.destination], params.q))
    .sort(byNewest);
  return paginate(items, params);
}

export function getEnquiry(id: string) {
  return db.enquiries.find((e) => e.id === id) ?? null;
}

export function updateEnquiry(
  id: string,
  patch: Partial<Pick<Enquiry, "status" | "assigneeId">>,
) {
  const current = getEnquiry(id);
  if (!current) return null;
  const next: Enquiry = {
    ...current,
    ...patch,
    updatedAt: new Date().toISOString(),
  };
  db.enquiries = db.enquiries.map((e) => (e.id === id ? next : e));
  return next;
}

export function listApplications(params: ListParams) {
  const items = db.applications
    .filter((a) => !params.status || a.status === params.status)
    .filter((a) =>
      matches(
        [a.applicant.name, a.applicant.email, a.reference, a.destination],
        params.q,
      ),
    )
    .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
  return paginate(items, params);
}

export function getApplication(id: string) {
  return db.applications.find((a) => a.id === id) ?? null;
}

export function advanceApplication(
  id: string,
  status: ApplicationStatus,
  note?: string,
) {
  const current = getApplication(id);
  if (!current) return null;
  const next = withOverdue({
    ...current,
    status,
    timeline: [...current.timeline, { status, at: new Date().toISOString(), note }],
  });
  db.applications = db.applications.map((a) => (a.id === id ? next : a));
  return next;
}

export function listCustomers(params: ListParams) {
  const items = db.customers
    .filter((c) => matches([c.name, c.email, c.country], params.q))
    .sort((a, b) => b.lastActiveAt.localeCompare(a.lastActiveAt));
  return paginate(items, params);
}

export function getCustomer(id: string): Customer | null {
  return db.customers.find((c) => c.id === id) ?? null;
}

export function getDashboardStats(): DashboardStats {
  const now = Date.now();
  const day = 86_400_000;
  const within = (iso: string, days: number) => now - Date.parse(iso) < days * day;

  const thisWeek = db.enquiries.filter((e) => within(e.createdAt, 7)).length;
  const lastWeek = db.enquiries.filter(
    (e) => within(e.createdAt, 14) && !within(e.createdAt, 7),
  ).length;

  const approved = db.applications.filter((a) => a.status === "approved");
  const revenue = approved
    .filter((a) => within(a.submittedAt, 30))
    .reduce((sum, a) => sum + a.fee, 0);
  const previousRevenue = approved
    .filter((a) => within(a.submittedAt, 60) && !within(a.submittedAt, 30))
    .reduce((sum, a) => sum + a.fee, 0);

  const change = (current: number, previous: number) =>
    previous === 0
      ? current === 0
        ? 0
        : 100
      : Math.round(((current - previous) / previous) * 100);

  const stages: ApplicationStatus[] = [
    "submitted",
    "in_review",
    "documents_required",
    "biometrics_scheduled",
    "decision_pending",
    "approved",
    "rejected",
  ];

  const weekly = Array.from({ length: 7 }, (_, i) => {
    const dayStart = new Date(now - (6 - i) * day);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = dayStart.getTime() + day;
    const inDay = (iso: string) => {
      const t = Date.parse(iso);
      return t >= dayStart.getTime() && t < dayEnd;
    };
    return {
      label: dayStart.toLocaleDateString("en-US", { weekday: "short" }),
      enquiries: db.enquiries.filter((e) => inDay(e.createdAt)).length,
      applications: db.applications.filter((a) => inDay(a.submittedAt)).length,
    };
  });

  return {
    enquiries: {
      total: db.enquiries.length,
      open: db.enquiries.filter((e) => OPEN_ENQUIRY.includes(e.status)).length,
      change: change(thisWeek, lastWeek),
    },
    applications: {
      total: db.applications.length,
      active: db.applications.filter((a) => ACTIVE_STAGES.includes(a.status)).length,
      change: change(
        db.applications.filter((a) => within(a.submittedAt, 7)).length,
        db.applications.filter(
          (a) => within(a.submittedAt, 14) && !within(a.submittedAt, 7),
        ).length,
      ),
    },
    customers: {
      total: db.customers.length,
      change: change(
        db.customers.filter((c) => within(c.createdAt, 30)).length,
        db.customers.filter((c) => within(c.createdAt, 60) && !within(c.createdAt, 30))
          .length,
      ),
    },
    revenue: {
      amount: revenue,
      currency: "USD",
      change: change(revenue, previousRevenue),
    },
    pipeline: stages.map((status) => ({
      status,
      count: db.applications.filter((a) => a.status === status).length,
    })),
    enquiriesByService: (["visa", "booking", "experience"] as const).map((service) => ({
      service,
      count: db.enquiries.filter((e) => e.service === service).length,
    })),
    weekly,
  };
}

export function recentEnquiries(limit = 5) {
  return [...db.enquiries].sort(byNewest).slice(0, limit);
}
