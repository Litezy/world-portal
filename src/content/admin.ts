import type {
  ApplicationStatus,
  EnquiryStatus,
  ServiceKind,
  VisaCategory,
  VisaRoute,
} from "@/types";

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
    enquiries: "Open enquiries",
    applications: "Active applications",
    customers: "Customers",
    revenue: "Revenue this month",
  },
  recent: { title: "Latest enquiries", cta: "View all" },
  pipeline: { title: "Visa pipeline", body: "Applications by stage" },
  services: { title: "Enquiries by service" },
  weekly: { title: "Last seven days" },
} as const;

export const enquiries = {
  headingLead: "Every",
  headingAccent: "enquiry.",
  body: "Every request that arrives from the site, routed by service.",
  searchPlaceholder: "Search by name, email, reference or destination",
  empty: {
    title: "No enquiries match",
    body: "Try a different search or clear the status filter.",
  },
  detail: {
    eyebrow: "Enquiry",
    message: "Message",
    noMessage: "The visitor did not leave any details.",
    traveller: "Traveller",
    assign: "Assigned consultant",
    unassigned: "Unassigned",
    status: "Status",
    reply: "Reply by email",
  },
} as const;

export const applications = {
  headingLead: "Visa",
  headingAccent: "applications.",
  body: "Every file in progress, with its stage, consultant and deadline.",
  searchPlaceholder: "Search by applicant, reference or destination",
  empty: {
    title: "No applications match",
    body: "Try a different search or clear the stage filter.",
  },
  detail: {
    eyebrow: "Application",
    timeline: "Timeline",
    advance: "Move to stage",
    noteLabel: "Note for the file",
    notePlaceholder: "What changed, or what the applicant needs to do next",
    applicant: "Applicant",
    consultant: "Consultant",
    due: "Decision due",
    fee: "Service fee",
    updateLabel: "Update application",
  },
} as const;

export const customers = {
  headingLead: "Your",
  headingAccent: "customers.",
  body: "Everyone who has travelled or applied with World Portal.",
  searchPlaceholder: "Search by name, email or country",
  empty: {
    title: "No customers match",
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
  danger: { title: "Session", body: "Sign out of this device.", action: "Sign out" },
} as const;

export const serviceLabels: Record<ServiceKind, string> = {
  visa: "Visa",
  booking: "Flights & hotels",
  experience: "Experiences",
};

export const enquiryStatusLabels: Record<EnquiryStatus, string> = {
  new: "New",
  contacted: "Contacted",
  quoted: "Quoted",
  won: "Won",
  lost: "Lost",
};

export const applicationStatusLabels: Record<ApplicationStatus, string> = {
  draft: "Draft",
  submitted: "Submitted",
  in_review: "In review",
  documents_required: "Documents required",
  biometrics_scheduled: "Biometrics scheduled",
  decision_pending: "Decision pending",
  approved: "Approved",
  rejected: "Rejected",
};

export const visaRouteLabels: Record<VisaRoute, string> = {
  evisa: "eVisa",
  consular: "Consular",
  eta: "ETA",
};

export const visaCategoryLabels: Record<VisaCategory, string> = {
  tourist: "Tourist",
  business: "Business",
  study: "Study",
  work: "Work",
  family: "Family",
  transit: "Transit",
  residency: "Residency",
};
