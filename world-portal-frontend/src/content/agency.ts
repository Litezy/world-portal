import type {
  AgencyListingStatus,
  AgencyStaffStatus,
  AgencyVerificationStatus,
  AssignmentStatus,
  PayoutStatus,
} from "@/features/agency/types";

/**
 * Every word the agency side says, in one place — the landing section, the
 * sign-in screens and all six console pages. Components read from here; none
 * of them hold copy of their own.
 */

/** The `#agency` section on the landing page. */
export const agencySection = {
  eyebrow: "For service agencies",
  headingLead: "You already do the work.",
  headingAccent: "List it where the travellers are.",
  body: "Security, catering, driving, cleaning, guiding — if you run a team at a destination, travellers can add you to their trip before they land. You pick who goes. We handle the booking and pay you after the job.",
  points: [
    {
      title: "Get found before they arrive",
      body: "Travellers build their package weeks out. Your listing sits in it alongside the visa and the flight.",
    },
    {
      title: "Assign your own people",
      body: "A booking arrives with the dates, the city and the headcount. You put your own staff against it.",
    },
    {
      title: "Paid without chasing",
      body: "The traveller pays us up front. We settle you after the job, minus the platform fee, on a fixed run.",
    },
  ],
  cta: { label: "List your agency", href: "/agency/signup" },
  secondaryCta: { label: "Agency sign in", href: "/agency/login" },
  note: "Listing is free. You are paid per completed job.",
} as const;

export const agencyAuth = {
  login: {
    eyebrow: "Agency",
    headingLead: "Welcome",
    headingAccent: "back.",
    body: "Sign in to your assignments, staff and payouts using passwordless OTP.",
    sendOtpLabel: "Send verification code",
    submitLabel: "Sign in with code",
    switchPrompt: "New here?",
    switchCta: "List your agency",
    switchHref: "/agency/signup",
    hint: "Enter your work email to receive a 6-digit code.",
  },
  signup: {
    eyebrow: "Agency",
    headingLead: "List your",
    headingAccent: "agency.",
    body: "Tell us who you are and where you work. The paperwork comes after — you can finish that in the dashboard.",
    sendOtpLabel: "Send verification code",
    submitLabel: "Create account",
    switchPrompt: "Already listed?",
    switchCta: "Sign in",
    switchHref: "/agency/login",
    consent: "By continuing you confirm you are authorised to act for this business.",
    hint: "",
  },
  image: {
    src: "/images/hero.jpg",
    alt: "A turquoise lagoon seen from above",
  },
  fields: {
    agencyName: "Agency name",
    contactName: "Your name",
    email: "Work email",
    phone: "Phone",
    country: "Country you operate in",
    otp: "Verification code (OTP)",
    remember: "Keep me signed in",
  },
} as const;

export const agencyOverview = {
  headingLead: "Good to see you,",
  body: "Where your agency stands this week.",
  stats: {
    openAssignments: "Open assignments",
    staff: "Staff on duty",
    completed: "Completed this month",
    earned: "Earned this month",
    pendingPayout: "Awaiting payout",
  },
  verification: {
    title: "Verification",
    body: "Your listing goes live once these are approved.",
    cta: "Finish listing",
    done: "Everything we asked for is in.",
  },
  upcoming: {
    title: "Next assignments",
    cta: "View all",
    empty: "Nothing booked yet.",
  },
  unassigned: {
    title: "Waiting on you",
    body: "These have no staff against them yet.",
    cta: "Assign",
  },
} as const;

export const agencyListing = {
  headingLead: "Your",
  headingAccent: "listing.",
  body: "What travellers see, and the paperwork behind it.",
  steps: [
    { id: "profile", title: "Agency profile", body: "Who you are and where you work." },
    { id: "services", title: "Services", body: "What you sell, and what it costs." },
    { id: "documents", title: "Documents", body: "Proof that you can do it legally." },
    { id: "review", title: "Review", body: "Check it, then send it for approval." },
  ],
  profile: {
    name: "Trading name",
    legalName: "Registered legal name",
    registrationNumber: "Company registration number",
    country: "Country",
    cities: "Cities you cover",
    citiesHint: "Add every city your team can actually reach.",
    summary: "One-line summary",
    summaryHint: "What a traveller sees under your name.",
    about: "About the agency",
    yearFounded: "Year founded",
    staffCount: "People on the books",
    languages: "Languages your staff speak",
    email: "Booking email",
    phone: "Booking phone",
    website: "Website",
  },
  services: {
    title: "What do you offer?",
    body: "Pick every service you can staff. The documents step changes with what you choose.",
    offeringsTitle: "Your services",
    offeringsBody: "Price each one. Leave the price blank if it depends on the job.",
    addOffering: "Add a service",
    removeOffering: "Remove",
    fields: {
      title: "Service name",
      description: "What it includes",
      price: "Price",
      unit: "Per",
      currency: "Currency",
      leadTime: "Notice needed (hours)",
      capacity: "People you can field",
    },
    quotedLabel: "Quoted after review",
    empty: "No services yet. Add the first one.",
  },
  documents: {
    title: "Documents",
    body: "We ask for these because a traveller is trusting a stranger in another country. Anything that expires needs its date.",
    required: "Required",
    optional: "Optional",
    upload: "Upload",
    replace: "Replace",
    expiry: "Expires",
    expiryHint: "We will remind you a month before.",
    accepted: "PDF, JPG, PNG or WEBP, up to 10MB.",
    blocked: "Upload everything marked required before you submit.",
  },
  review: {
    title: "Ready to submit",
    body: "A reviewer checks the documents against the services you picked. It usually takes two working days.",
    submit: "Submit for approval",
    resubmit: "Resubmit",
    submitted: "Submitted. We will email you when it has been looked at.",
    incomplete: "Something is still missing",
  },
} as const;

export const agencyAssignments = {
  headingLead: "Assignments",
  headingAccent: "from travellers.",
  body: "Every booking a traveller has added to their package.",
  searchPlaceholder: "Search by reference, traveller or city",
  empty: {
    title: "No assignments match",
    body: "Try a different search or clear the status filter.",
  },
  columns: {
    reference: "Reference",
    service: "Service",
    traveller: "Traveller",
    destination: "Where",
    dates: "When",
    staff: "Staff",
    status: "Status",
    net: "You earn",
  },
  detail: {
    eyebrow: "Assignment",
    traveller: "Traveller",
    partySize: "Party size",
    notes: "Traveller notes",
    noNotes: "The traveller left no notes.",
    contactLocked: "Contact details are released once you assign staff.",
    assignTitle: "Assign staff",
    assignBody: "Pick who is going. You can change this until the job starts.",
    assignCta: "Assign",
    reassignCta: "Change staff",
    required: "Needed",
    earnings: "What you earn",
    gross: "Traveller paid",
    fee: "Platform fee",
    net: "Your share",
    markComplete: "Mark completed",
  },
} as const;

export const agencyStaff = {
  headingLead: "Your",
  headingAccent: "people.",
  body: "Who you can put against a job, and what they are cleared for.",
  searchPlaceholder: "Search by name or role",
  add: "Add staff",
  empty: {
    title: "Nobody on the books yet",
    body: "Add the people you can actually send.",
  },
  columns: {
    name: "Name",
    role: "Role",
    category: "Service",
    languages: "Languages",
    experience: "Experience",
    status: "Status",
  },
  fields: {
    name: "Full name",
    role: "Role",
    category: "Service they work in",
    phone: "Phone",
    languages: "Languages",
    experienceYears: "Years of experience",
    backgroundChecked: "Background checked",
  },
  vetted: "Background checked",
  notVetted: "Not checked",
} as const;

export const agencyPayouts = {
  headingLead: "Your",
  headingAccent: "money.",
  body: "The traveller pays the platform. The platform pays you after the job.",
  searchPlaceholder: "Search by reference",
  howItWorks: {
    title: "How settlement works",
    steps: [
      "The traveller pays for the whole package up front, including your part.",
      "You complete the job and mark the assignment done.",
      "We settle on the next run, minus the platform fee agreed on your listing.",
    ],
  },
  stats: {
    pending: "Awaiting payout",
    paid: "Paid out",
    fees: "Platform fees",
  },
  columns: {
    reference: "Reference",
    period: "Period",
    jobs: "Jobs",
    gross: "Collected",
    fee: "Platform fee",
    net: "Paid to you",
    status: "Status",
    account: "To",
  },
  empty: {
    title: "No payouts yet",
    body: "Complete an assignment and it appears here.",
  },
} as const;

export const agencySettings = {
  headingLead: "Agency",
  headingAccent: "settings.",
  body: "Your profile, your contact details and where the money goes.",
  profile: {
    title: "Agency profile",
    body: "This is what travellers see.",
    cta: "Edit listing",
  },
  payout: {
    title: "Payout account",
    body: "Where we send settlement. Changing it pauses the next run for review.",
  },
  team: {
    title: "Who can sign in",
    body: "People from your agency with dashboard access.",
  },
  danger: {
    title: "Pause listing",
    body: "Your listing stops appearing in packages. Existing assignments are unaffected.",
    cta: "Pause listing",
    resume: "Resume listing",
  },
} as const;

export const verificationLabels: Record<AgencyVerificationStatus, string> = {
  unverified: "Not verified",
  pending: "In review",
  verified: "Verified",
  suspended: "Suspended",
};

export const listingStatusLabels: Record<AgencyListingStatus, string> = {
  draft: "Draft",
  submitted: "Submitted",
  in_review: "In review",
  live: "Live",
  rejected: "Changes needed",
  paused: "Paused",
};

export const assignmentStatusLabels: Record<AssignmentStatus, string> = {
  requested: "Needs staff",
  assigned: "Staff assigned",
  in_progress: "In progress",
  completed: "Completed",
  cancelled: "Cancelled",
};

export const payoutStatusLabels: Record<PayoutStatus, string> = {
  pending: "Pending",
  processing: "Processing",
  paid: "Paid",
  on_hold: "On hold",
};

export const staffStatusLabels: Record<AgencyStaffStatus, string> = {
  available: "Available",
  assigned: "On a job",
  off_duty: "Off duty",
  inactive: "Inactive",
};

export const documentStatusLabels = {
  missing: "Not uploaded",
  uploaded: "Uploaded",
  in_review: "In review",
  approved: "Approved",
  rejected: "Rejected",
} as const;
