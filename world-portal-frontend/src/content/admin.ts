import type {
  BackendPaymentStatus,
  BackendUserRole,
  BackendVisaCategory,
  PassportStatus,
  VisaStatus,
} from "@/server/data/backend-types";

export const login = {
  eyebrow: "Console",
  headingLead: "Welcome",
  headingAccent: "back.",
  body: "Sign in to manage enquiries, applications and customers.",
  submitLabel: "Sign in",
  hint: "Demo credentials: admin@worldportal.travel / worldportal",
  image: {
    src: "/images/hero.jpg",
    alt: "A turquoise lagoon seen from above",
  },
} as const;

export const overview = {
  headingLead: "Good to see you,",
  body: "Here is what moved across the desk this week.",
  stats: {
    visas: "Visa applications",
    passports: "Passport applications",
    customers: "Applicants",
    revenue: "Collected",
  },
  recent: { title: "Latest visa applications", cta: "View all" },
  pipeline: { title: "Visa pipeline", body: "Applications by stage" },
  services: { title: "Visas by category" },
  weekly: { title: "Last seven days" },
} as const;

export const passports = {
  headingLead: "Passport",
  headingAccent: "applications.",
  body: "Every booklet request, with its category, validity and stage.",
  searchPlaceholder: "Search by applicant, reference or email",
  empty: {
    title: "No passport applications match",
    body: "Try a different search or clear the stage filter.",
  },
  detail: {
    eyebrow: "Passport application",
    applicant: "Applicant",
    category: "Category",
    validity: "Validity",
    booklet: "Booklet",
    origin: "State of origin",
    notes: "Verification notes",
    noNotes: "Nothing has been recorded against this file yet.",
    advance: "Move to stage",
    noteLabel: "Note for the file",
    notePlaceholder: "What changed, or what the applicant needs to do next",
    rejectionLabel: "Reason for rejection",
    updateLabel: "Update application",
    reply: "Email the applicant",
  },
} as const;

export const applications = {
  headingLead: "Visa",
  headingAccent: "applications.",
  body: "Every file in progress, with its stage, cost and payment position.",
  searchPlaceholder: "Search by name, email, passport number or reference",
  empty: {
    title: "No applications match",
    body: "Try a different search or clear the stage filter.",
  },
  detail: {
    eyebrow: "Visa application",
    timeline: "Progress",
    timelineNote:
      "Reconstructed from the record's own stamps — the service keeps no separate review log.",
    advance: "Move to stage",
    noteLabel: "Verification notes",
    notePlaceholder: "What changed, or what the applicant needs to do next",
    rejectionLabel: "Reason for rejection",
    applicant: "Applicant",
    travel: "Intended travel",
    purpose: "Purpose of visit",
    nationality: "Nationality",
    passport: "Passport number",
    fee: "Total cost",
    paid: "Paid",
    outstanding: "Outstanding",
    updateLabel: "Update application",
    evaluate: "Set the cost",
    evaluateHint:
      "Evaluating sets the total, moves the file to Evaluated and emails the applicant.",
    amountLabel: "Total processing cost",
    installmentLabel: "Allow a 50% instalment",
    evaluateAction: "Save evaluation",
    reply: "Email the applicant",
  },
} as const;

export const customers = {
  headingLead: "Your",
  headingAccent: "applicants.",
  body: "Everyone who has applied, gathered from their applications.",
  searchPlaceholder: "Search by name or email",
  empty: {
    title: "No applicants match",
    body: "Try a different search.",
  },
} as const;

export const settings = {
  headingLead: "Account &",
  headingAccent: "workspace.",
  body: "Who you are, and how the console behaves.",
  profile: { title: "Profile", body: "How you appear on files and replies." },
  notifications: {
    title: "Notifications",
    body: "Where new enquiries and deadline reminders go.",
    items: [
      {
        key: "newEnquiry",
        label: "New enquiry",
        hint: "Email me when the form is submitted",
      },
      {
        key: "dueSoon",
        label: "Deadline approaching",
        hint: "Three days before a decision is due",
      },
      {
        key: "weekly",
        label: "Weekly digest",
        hint: "A Monday summary of the pipeline",
      },
    ],
  },
  team: {
    title: "Team",
    body: "Everyone with access to this console, from the service.",
  },
  danger: { title: "Session", body: "Sign out of this device.", action: "Sign out" },
} as const;

export const visaStatusLabels: Record<VisaStatus, string> = {
  SUBMITTED: "Submitted",
  EVALUATED: "Evaluated",
  UNDER_REVIEW: "Under review",
  APPROVED: "Approved",
  REJECTED: "Rejected",
};

export const passportStatusLabels: Record<PassportStatus, string> = {
  SUBMITTED: "Submitted",
  UNDER_REVIEW: "Under review",
  APPROVED: "Approved",
  REJECTED: "Rejected",
};

export const paymentStatusLabels: Record<BackendPaymentStatus, string> = {
  PENDING_EVALUATION: "Awaiting evaluation",
  AWAITING_PAYMENT: "Awaiting payment",
  PARTIALLY_PAID: "Part paid",
  FULLY_PAID: "Paid",
  REFUNDED: "Refunded",
};

export const visaCategoryLabels: Record<BackendVisaCategory, string> = {
  TOURIST: "Tourist",
  BUSINESS: "Business",
  STUDENT: "Student",
  WORK: "Work",
  TRANSIT: "Transit",
};

export const roleLabels: Record<BackendUserRole, string> = {
  MANAGER: "Manager",
  PARTNER: "Partner",
  STAFF: "Staff",
};

/** `FIVE_YEARS` / `THIRTY_TWO_PAGES` and friends read badly untouched. */
export function humanise(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part, i) => (i === 0 ? part.charAt(0).toUpperCase() + part.slice(1) : part))
    .join(" ");
}
