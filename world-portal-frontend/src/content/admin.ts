import type {
  BackendPaymentStatus,
  BackendUserRole,
  BackendVisaCategory,
  PassportStatus,
  VisaStatus,
} from "@/server/data/backend-types";

/** What the staff side is called, everywhere it names itself. */
export const adminBrand = {
  name: "E-Embassy Admin",
  tag: "Admin",
  navLabel: "Admin navigation",
  backToSite: "Back to site",
  searchPlaceholder: "Search files or people",
  signOut: "Sign out",
} as const;

export const login = {
  title: adminBrand.name,
  body: "Sign in to work visa and passport applications.",
  submitLabel: "Sign in",
  backToSite: adminBrand.backToSite,
} as const;

/** The appearance menu: colours on top of light / dark. */
export const appearance = {
  label: "Appearance",
  colours: "Colours",
  mode: "Mode",
  palettes: { embassy: "E-Embassy blue", worldstreet: "WorldStreet gold" },
  modes: { light: "Light", dark: "Dark", system: "Match my device" },
} as const;

/** Settings → team (`features/settings/components/team-list.tsx`, invite modal). */
export const team = {
  searchPlaceholder: "Search the team",
  you: "You",
  noMatches: "No one matches that search.",
  forbidden: "Only a manager can see and manage the full team list.",
  loadFailed: "Could not load the team",
  active: "Active",
  deactivated: "Deactivated",
  actions: (name: string) => `Manage ${name}`,
  changeRole: "Change role",
  roleChanged: (name: string, role: string) => `${name} is now ${role}`,
  deactivate: "Deactivate",
  reactivate: "Reactivate",
  reactivated: (name: string) => `${name} can sign in again`,
  deactivateTitle: (name: string) => `Deactivate ${name}?`,
  deactivateBody:
    "They lose access to the console straight away. Their past work stays on record, and you can reactivate them later.",
  deactivateConfirm: "Deactivate",
  deactivatedToast: (name: string) => `${name} has been deactivated`,
  resendInvite: "Resend invite",
  inviteResent: (email: string) => `Invite sent again to ${email}`,
  inviteNotSent: (email: string) =>
    `The invite to ${email} wasn't sent. Email may not be set up yet. Try again later, or give them the sign-in link yourself.`,
  genericError: "That didn't go through. Try again in a moment.",
  invite: {
    trigger: "Invite team member",
    title: "Invite a team member",
    body: "They get an email with their role. Managers see everything; staff work applications; partners only see what they submit.",
    firstName: "First name",
    lastName: "Last name",
    email: "Work email",
    role: "Role",
    roles: {
      MANAGER: "Manager — everything, including money and the team",
      STAFF: "Staff — works visa and passport applications",
      PARTNER: "Partner — an outside agency submitting applications",
    },
    submit: "Send invitation",
    cancel: "Cancel",
    sent: (email: string) => `Invitation sent to ${email}`,
  },
} as const;

/** Settings → bank accounts applicants pay into. */
export const bankAccounts = {
  loadFailed: "Could not load bank accounts",
  genericError: "That didn't go through. Try again in a moment.",
  toggled: (bank: string, active: boolean) =>
    active
      ? `${bank} is active — applicants will see it`
      : `${bank} is hidden from applicants`,
  deleted: (bank: string) => `${bank} account deleted`,
  deleteTitle: (bank: string) => `Delete the ${bank} account?`,
  deleteBody:
    "Applicants will stop seeing it in payment emails and on the tracking page straight away. This can't be undone — to hide it for a while, deactivate it instead.",
  deleteConfirm: "Delete account",
} as const;

export const agencies = {
  metaTitle: "Agencies",
  headingLead: "Agency",
  headingAccent: "verification.",
  body: "Registered partner agencies: check their paperwork, review what they offer, and decide who goes live.",
  searchPlaceholder: "Search by name, registration number or country",
  filterLabel: "Filter by verification",
  verificationLabels: {
    unverified: "Unverified",
    pending: "Awaiting review",
    verified: "Verified",
    suspended: "Suspended",
  } as Record<string, string>,
  listingLabels: {
    draft: "Draft",
    submitted: "Submitted",
    in_review: "In review",
    live: "Live",
    rejected: "Off the platform",
    paused: "Paused",
  } as Record<string, string>,
  documentLabels: {
    missing: "Missing",
    uploaded: "Uploaded",
    in_review: "In review",
    approved: "Approved",
    rejected: "Rejected",
  } as Record<string, string>,
  loadFailed: "Could not load agencies",
  empty: {
    title: "No agencies found",
    body: "Nothing matches these filters. Clear the search or pick another status.",
  },
  staff: (n: number) => `${n} staff`,
  paperwork: (approved: number, total: number) =>
    `Paperwork ${approved}/${total} approved`,
  viewDetails: "View details",
  verify: "Verify",
  verifyTitle: (name: string) => `Verify ${name}?`,
  verifyBody:
    "Every document they've uploaded is marked approved and their listing goes live, so travellers can book them.",
  verifyConfirm: "Verify and go live",
  verified: (name: string) => `${name} is verified and live`,
  suspend: "Suspend",
  suspendTitle: (name: string) => `Suspend ${name}?`,
  suspendBody:
    "Their listing comes off the platform straight away, so travellers can't book them. You can verify them again later.",
  suspendConfirm: "Suspend agency",
  suspended: (name: string) => `${name} has been suspended`,
  failed: "That didn't go through, so nothing changed. Try again in a moment.",
  sections: {
    services: "Categories & services",
    languages: "Languages",
    about: "About",
    paperwork: "Paperwork",
    staff: (n: number) => `Staff (${n})`,
  },
  notProvided: "Not provided",
  founded: (year: number) => `Founded ${year}`,
  noPaperwork: "No paperwork submitted yet.",
  approveDoc: "Approve",
  rejectDoc: "Reject",
  docApproved: (label: string) => `${label} approved`,
  rejectTitle: (label: string) => `Reject ${label}?`,
  rejectBody:
    "The agency sees your reason in their portal and can upload a corrected file.",
  rejectReasonLabel: "Reason (the agency will read this)",
  rejectReasonPlaceholder: "e.g. The scan is blurry, or the certificate has expired",
  rejectConfirm: "Reject document",
  docRejected: (label: string) => `${label} rejected. The agency has been told why.`,
  rejectionNote: "Why it was rejected:",
  listing: "Listing",
} as const;

export const professionals = {
  metaTitle: "Professionals",
  headingLead: "Professional",
  headingAccent: "moderation.",
  body: "Destination professionals listed on Hire: verify identity and qualifications before their profile shows a badge.",
  searchPlaceholder: "Search by name, title, city or bio",
  filterLabel: "Filter by verification",
  categoryLabel: "Category",
  allCategories: "All categories",
  categories: {
    photographer: "Photographer",
    videographer: "Videographer",
    chef: "Chef & catering",
    interpreter: "Interpreter",
    security: "Security",
    childcare: "Childcare",
    event: "Event planner",
    freelancer: "Freelancer / other",
  } as Record<string, string>,
  statusLabels: { verified: "Verified", unverified: "Unverified" } as Record<
    string,
    string
  >,
  loadFailed: "Could not load professionals",
  empty: {
    title: "No professionals found",
    body: "Nothing matches these filters. Clear the search or pick another category.",
  },
  jobs: (n: number) => `${n} jobs completed`,
  perHour: "/ hr",
  viewDetails: "View details",
  verify: "Verify",
  verified: (name: string) => `${name} now shows a verified badge`,
  revoke: "Remove badge",
  revokeTitle: (name: string) => `Remove ${name}'s verified badge?`,
  revokeBody:
    "Travellers will see their profile as unverified straight away. You can verify them again later.",
  revokeConfirm: "Remove badge",
  revoked: (name: string) => `${name} is no longer marked verified`,
  failed: "That didn't go through, so nothing changed. Try again in a moment.",
  sections: {
    rate: "Hourly rate",
    location: "Location",
    contact: "Contact",
    about: (name: string) => `About ${name}`,
    languages: "Languages",
    skills: "Specialties",
  },
  noBio: "No biography yet.",
  notProvided: "Not provided",
  rating: (value: string) => `${value} rating`,
  profileId: "Profile ID",
} as const;

/** Dashboard charts (`features/dashboard/components/*`). */
export const chartCopy = {
  showTable: "Show as a table",
  visas: "Visas",
  passports: "Passports",
  day: "Day",
  category: "Category",
  stage: "Stage",
  count: "Count",
  share: "Share",
  weeklyEmpty: "No applications in the last seven days.",
  categoriesEmpty: "No visa applications yet.",
  pipelineEmpty: "Nothing in the pipeline yet.",
  weeklyCaption: "Applications per day over the last seven days",
  categoriesCaption: "Visa applications by category",
  pipelineCaption: "Visa applications by stage",
} as const;

/** Shared list controls (`components/admin/list-controls.tsx`, `admin-data-table.tsx`). */
export const listControls = {
  all: "All",
  from: "Submitted from",
  to: "Submitted to",
  export: "Export CSV",
  columns: "Columns",
  columnsLabel: "Show columns",
  selectAll: "Select all on this page",
  selectRow: (name: string) => `Select ${name}`,
  selected: (n: number) => `${n} selected`,
  exportSelected: "Export selected",
  copyReferences: "Copy references",
  copied: (n: number) => `${n} reference${n === 1 ? "" : "s"} copied`,
  clear: "Clear",
  rowActions: "Actions",
  open: "Open",
  quickView: "Quick view",
  copyReference: "Copy reference",
  referenceCopied: "Reference copied",
  openFull: "Open full record",
  sortBy: (column: string) => `Sort by ${column}`,
} as const;

/** The ⌘K palette in the topbar (`components/admin/command-palette.tsx`). */
export const commandPalette = {
  trigger: "Search…",
  label: "Search the console",
  placeholder: "Search references, names, pages…",
  groups: {
    recent: "Recent",
    pages: "Go to",
    visas: "Visa applications",
    passports: "Passport applications",
    applicants: "Applicants",
  },
  applicantHint: (count: number) => `${count} application${count === 1 ? "" : "s"}`,
  typeMore: "Type two or more characters to search applications and applicants.",
  searching: "Searching…",
  failed: "Search is unavailable right now. Try again in a moment.",
  noMatches: (q: string) => `Nothing matches “${q}”.`,
  footer: "↑↓ to move · Enter to open · Esc to close",
} as const;

/** `RoleGate` — a page this role can't use explains itself instead of failing. */
export const roleGate = {
  title: "This page isn't available to your role",
  body: (role: string, needs: string) =>
    `You're signed in as ${role}. This page needs ${needs}. Ask a manager if you need access.`,
  back: "Go to your home page",
} as const;

/**
 * Nothing checks an upload before staff open it, so the viewer must not call
 * it "verified" — that is the reviewer's call to make.
 */
export const documentViewer = {
  description: "Uploaded by the applicant — not yet reviewed",
} as const;

/** Detail pages whose record did not load — see `DetailLoadError`. */
export const detailErrors = {
  notFoundTitle: (noun: string) => `This ${noun} doesn't exist`,
  notFoundBody:
    "The link may be wrong, or the file was removed. Nothing has changed on it.",
  failedTitle: (noun: string) => `Could not load this ${noun}`,
  failedBody: "The service didn't answer. Try again in a moment.",
  retry: "Try again",
} as const;

/** The console's own error boundary (`app/(admin)/admin/(console)/error.tsx`). */
export const consoleError = {
  title: "This page hit a problem",
  body: "Nothing you entered was saved by this error. Try again — if it keeps happening, note the reference and tell the team.",
  reference: "Reference",
  retry: "Try again",
  home: "Back to overview",
} as const;

/** `app/(admin)/admin/(console)/not-found.tsx`. */
export const consoleNotFound = {
  title: "Page not found",
  body: "That address isn't part of the console.",
  home: "Back to overview",
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
  recent: {
    title: "Latest visa applications",
    cta: "View all",
    emptyTitle: "No applications yet",
    emptyBody: "Submissions from the site land here.",
  },
  loadFailed: "Could not load the dashboard",
  /** Triage tiles: each count opens the queue behind it. */
  attention: {
    title: "Needs attention",
    awaitingEvaluation: "Awaiting a price",
    awaitingEvaluationHint: "Submitted, not yet evaluated",
    awaitingPayment: "Awaiting payment",
    awaitingPaymentHint: "Priced, payment not confirmed",
    underReview: "Under review",
    underReviewHint: "Paid, waiting for a decision",
    open: "Open queue",
  },
  viewList: "View list",
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

/** Status changes and pricing on a visa or passport file (`status-actions.tsx`, `evaluate-cost-form.tsx`). */
export const caseWorkflow = {
  title: "Next step",
  readOnly:
    "Staff price this file, record payments and move it to the next stage. You'll see each step here as it happens.",
  current: "Current stage",
  final: (stage: string) =>
    `This file is ${stage.toLowerCase()}. That's final, so there are no further steps.`,
  waitingForCost:
    "Set the cost so the applicant can pay. You can also start the review now and set the cost later.",
  actions: {
    UNDER_REVIEW: "Start review",
    APPROVED: "Approve",
    REJECTED: "Reject",
  } as Record<string, string>,
  confirm: {
    UNDER_REVIEW: {
      title: (ref: string) => `Start reviewing ${ref}?`,
      body: "The applicant's tracking page will show it as under review.",
      action: "Start review",
    },
    APPROVED: {
      title: (name: string) => `Approve ${name}'s application?`,
      body: "The applicant is emailed that it's approved. This is final: the file can't be moved to another stage afterwards.",
      action: "Approve and email",
    },
    REJECTED: {
      title: (name: string) => `Reject ${name}'s application?`,
      body: "The applicant is emailed your reason. This is final: the file can't be moved to another stage afterwards.",
      action: "Reject and email",
    },
  },
  noteLabel: "Note for the file (optional)",
  notePlaceholder: "What you checked, or what happens next",
  reasonLabel: "Reason (the applicant will read this)",
  reasonPlaceholder: "e.g. The bank statement doesn't cover the last six months",
  done: {
    UNDER_REVIEW: "Review started",
    APPROVED: "Approved. The applicant has been emailed.",
    REJECTED: "Rejected. The applicant has been emailed the reason.",
  } as Record<string, string>,
  failed: "Could not update the file",
  evaluate: {
    locked: "The cost is fixed: the applicant has already paid towards it.",
    closed: (stage: string) =>
      `The cost can't be changed once a file is ${stage.toLowerCase()}.`,
    confirmTitle: (amount: string) => `Bill the applicant ${amount}?`,
    confirmBody: (name: string, instalment: string | null) =>
      instalment
        ? `${name} is emailed the total and how to pay. They can pay ${instalment} now and the rest later. You can change the amount until they pay.`
        : `${name} is emailed the total and how to pay. You can change the amount until they pay.`,
    confirmAction: "Save and email",
    done: "Cost saved. The applicant has been emailed the amount due.",
    failed: "Could not save the cost",
  },
} as const;

/** Recording a bank transfer (`confirm-bank-payment-modal.tsx`). */
export const bankPayment = {
  title: "Bank transfer",
  body: "Record a transfer once you can see it in the bank account.",
  outstanding: "Outstanding",
  trigger: "Record a payment",
  dialogTitle: "Record a bank transfer",
  dialogBody:
    "This updates the applicant's balance, moves the file to Under review and emails them a receipt.",
  option: "What did they pay?",
  full: "The full balance",
  half: "50% instalment",
  halfUnavailable: (allowed: boolean) =>
    allowed ? "Already paid an instalment" : "Instalments weren't allowed",
  amount: (currency: string) => `Amount received (${currency})`,
  overBalance: (balance: string) => `That's more than the ${balance} still owed.`,
  reference: "Bank reference",
  referenceHint:
    "Each reference can be recorded once, so a transfer is never counted twice.",
  notes: "Note for the file (optional)",
  notesPlaceholder: "e.g. Seen on the GTBank statement for 14 May",
  cancel: "Cancel",
  submit: "Record payment",
  done: (amount: string) =>
    `${amount} recorded. The applicant has been emailed a receipt.`,
  failed: "Could not record the payment",
} as const;

/** Inviting an applicant to an appointment (`invite-applicant-modal.tsx`). */
export const appointmentInvite = {
  title: "Appointment",
  body: (name: string) =>
    `Invite ${name} for biometrics, an interview or a document check.`,
  hint: "They're emailed the date, time and venue.",
  trigger: "Invite applicant",
  dialogTitle: "Invite to an appointment",
  dialogBody: (email: string) => `The invitation is emailed to ${email}.`,
  purpose: "What it's for",
  purposes: [
    "Biometric data capture",
    "Document verification",
    "Visa interview",
    "Passport submission or pick-up",
    "Medical and security screening",
  ],
  otherPurpose: "Something else",
  customPurpose: "Describe it",
  customPurposePlaceholder: "e.g. Collect the original bank statement",
  date: "Date",
  time: "Time",
  venue: "Venue",
  defaultVenue: "Embassy Headquarters, Room 302",
  note: "Instructions (optional)",
  notePlaceholder: "e.g. Bring your original passport and two photographs",
  cancel: "Cancel",
  submit: "Send invitation",
  done: (email: string) => `Invitation emailed to ${email}`,
  failed: "Could not send the invitation",
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
    phone: "Phone",
    dateOfBirth: "Date of birth",
    gender: "Gender",
    passportExpiry: "Passport expires",
    expiresSoon: "less than six months after return",
    address: "Residence address",
    evaluatedBy: "Priced by",
    reviewedBy: "Reviewed by",
    notGiven: "Not given",
    notYet: "Not yet",
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
  copyEmails: "Copy emails",
  emailsCopied: (n: number) => `${n} email${n === 1 ? "" : "s"} copied`,
  detail: {
    back: "All applicants",
    eyebrow: "Applicant",
    email: "Email",
    phone: "Phone",
    country: "Country",
    firstSeen: "First applied",
    lastActive: "Last active",
    paid: "Paid to date",
    nothingPaid: "Nothing yet",
    visas: (n: number) => `Visa applications (${n})`,
    passports: (n: number) => `Passport applications (${n})`,
    noVisas: "No visa applications.",
    noPassports: "No passport applications.",
    reference: "Reference",
    destination: "Destination",
    category: "Category",
    stage: "Stage",
    payment: "Payment",
    cost: "Cost",
    submitted: "Submitted",
    notPriced: "Not priced",
    open: (ref: string) => `Open ${ref}`,
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
    unavailable:
      "Email alerts for staff aren't set up yet, so these can't be switched on. Applicants still get their own emails.",
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

export const finance = {
  headingLead: "Financial",
  headingAccent: "operations.",
  body: "Transactions, refund requests and platform fee configuration.",
  searchPlaceholder: "Search by transaction reference or method",
  refundSearchPlaceholder: "Search by refund or transaction reference, or reason",
  tabs: {
    transactions: "Transactions",
    refunds: "Refunds",
    config: "Fee Settings",
  },
  cards: {
    revenue: "Collected",
    revenueCaption: "Confirmed payments",
    outstanding: "Outstanding",
    outstandingCaption: "Still owed on evaluated applications",
    refunds: "Refunds",
    refundsCaption: (volume: string) => `${volume} returned`,
    serviceFee: "Service fee",
    serviceFeeCaption: "As set in Fee Settings",
    surcharge: "Surcharge",
  },
  transactionStatusLabels: {
    INITIATED: "Awaiting payment",
    CONFIRMED: "Confirmed",
    FAILED: "Failed",
    REFUNDED: "Refunded",
  } as Record<string, string>,
  refundStatusLabels: {
    REQUESTED: "Requested",
    APPROVED: "Approved",
    PROCESSED: "Processed",
    REJECTED: "Rejected",
  } as Record<string, string>,
  paymentOptionLabels: {
    FULL: "Full payment",
    HALF_INSTALLMENT: "50% instalment",
  } as Record<string, string>,
  loadFailed: {
    transactions: "Could not load transactions",
    refunds: "Could not load refunds",
    config: "Could not load the fee settings",
  },
  refundsEmpty: {
    title: "No refunds yet",
    body: "Refunds start from a confirmed transaction: open its menu and choose Refund.",
  },
  refund: {
    action: "Refund",
    title: (ref: string) => `Refund ${ref}?`,
    body: (original: string, surcharge: string, net: string) =>
      `The applicant paid ${original}. After the ${surcharge} refund charge they get ${net} back. Their application will show the payment as refunded and they'll be emailed. This can't be undone.`,
    reasonLabel: "Reason (the applicant will read this)",
    confirm: (net: string) => `Refund ${net}`,
    done: (net: string) =>
      `Refund of ${net} processed — the applicant has been emailed`,
    managerOnly: "Only a manager can refund.",
  },
  fees: {
    title: "Platform fee rates",
    body: "Used when pricing applications and when calculating refunds.",
    partnerMarkup: "Partner agency markup (%)",
    partnerMarkupHint: "Added to partner-referred visa processing.",
    serviceFee: "Service fee (%)",
    serviceFeeHint: "Platform processing fee on public submissions.",
    refundSurcharge: "Refund charge (%)",
    refundSurchargeHint: "Kept from the original payment when a refund is issued.",
    save: "Save fee settings",
    saved: "Fee settings saved",
    managerOnly: "Only a manager can change fee settings.",
    lastUpdated: (by: string, when: string) => `Last changed by ${by}, ${when}`,
    rulesTitle: "How these are used",
    instalmentRule:
      "50% instalment: when allowed at pricing, the applicant pays half up front and the rest before release.",
    refundRule: "Refund = original payment − (original payment × refund charge %).",
  },
  /** Shown in place of a figure the service did not return — never a guess. */
  unavailable: "—",
  empty: {
    title: "No financial records found",
    body: "Try adjusting your search query or filters.",
  },
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
  EVALUATED: "Evaluated",
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
