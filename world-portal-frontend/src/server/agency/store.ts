import {
  documentsForCategories,
  requiredDocumentsFor,
} from "@/features/agency/catalog";
import {
  agencies as seedAgencies,
  agencyAssignmentRecords,
  agencyPayoutRecords,
  agencyStaffRecords,
  agencyUsers as seedAgencyUsers,
} from "@/features/agency/fixtures";
import type {
  Agency,
  AgencyAssignment,
  AgencyCategory,
  AgencyDocument,
  AgencyDocumentKind,
  AgencyOverview,
  AgencyPayout,
  AgencyStaff,
  AgencyUser,
} from "@/features/agency/types";
import { slugify } from "@/lib/utils";
import { paginate } from "@/server/http";
import type { ListParams, Paginated } from "@/types";

/**
 * The one seam between the agency console and whatever eventually serves it.
 *
 * **There is no agency API on the World Portal service.** Every screen under
 * `/agency` goes through the route handlers, and the route handlers come here,
 * for exactly the reason `src/server/worldspace/client.ts` exists: when a real
 * service lands, this file is replaced wholesale and nothing above it changes.
 * Do not let a component, a hook or a page reach into
 * `src/features/agency/fixtures.ts` directly — that is the shortcut that turns
 * one seam into twenty.
 *
 * **Mutations are in memory and per process.** Assigning staff, uploading a
 * document, adding a person or submitting a listing writes to the module-level
 * `db` below and nowhere else. That means:
 *
 * - a `next dev` restart reverts everything to the fixtures;
 * - on serverless, two requests can land on two instances and disagree;
 * - nothing here is a transaction, and concurrent writes are last-one-wins.
 *
 * All of which is fine for a demo and a trap in a bug report: check whether
 * the server was restarted before chasing a "lost" assignment. This is fixture
 * data standing in for an API, not a database, and it must not grow into one.
 *
 * ## Tenancy
 *
 * An agency must never see another agency's assignments, staff or money, so
 * `agencyId` is not a filter applied somewhere convenient — it is the *first*
 * thing every read does, through `assignmentsOf()` / `staffOf()` /
 * `payoutsOf()` below, and every write re-checks that the record it found
 * belongs to the caller before touching it. Keep it structural: a new read
 * that starts from `db.assignments` rather than from one of those helpers is
 * a cross-tenant leak waiting for its first second customer.
 */

/* ---------------------------------------------------------------------------
 * State
 * ------------------------------------------------------------------------- */

/**
 * Cloned from the fixtures at module load so a mutation here can never corrupt
 * the seed data other modules (and the unit tests) import.
 */
const db = {
  agencies: structuredClone(seedAgencies),
  staff: structuredClone(agencyStaffRecords),
  assignments: structuredClone(agencyAssignmentRecords),
  payouts: structuredClone(agencyPayoutRecords),
  users: structuredClone(seedAgencyUsers),
};

let sequence = 0;

/** Readable, unique-enough within a process. Not an id scheme for a database. */
function nextId(prefix: string) {
  sequence += 1;
  return `${prefix}-${Date.now().toString(36)}-${sequence}`;
}

function clone<T>(value: T): T {
  return structuredClone(value);
}

function nowIso() {
  return new Date().toISOString();
}

/* ---------------------------------------------------------------------------
 * Tenancy — every read starts here
 * ------------------------------------------------------------------------- */

function agencyRecord(agencyId: string): Agency | undefined {
  return db.agencies.find((agency) => agency.id === agencyId);
}

function assignmentsOf(agencyId: string): AgencyAssignment[] {
  return db.assignments.filter((assignment) => assignment.agencyId === agencyId);
}

function staffOf(agencyId: string): AgencyStaff[] {
  return db.staff.filter((member) => member.agencyId === agencyId);
}

function payoutsOf(agencyId: string): AgencyPayout[] {
  return db.payouts.filter((payout) => payout.agencyId === agencyId);
}

/* ---------------------------------------------------------------------------
 * Filtering — same shape as the admin store's route handlers
 * ------------------------------------------------------------------------- */

function needleOf(params: ListParams) {
  const q = params.q?.trim().toLowerCase();
  return q ? q : null;
}

/** `undefined`, `""` and `"all"` all mean "do not filter". */
function statusOf(params: ListParams) {
  const status = params.status?.trim();
  return !status || status === "all" ? null : status;
}

function matches(needle: string, ...fields: (string | null | undefined)[]) {
  return fields.some((field) => field?.toLowerCase().includes(needle));
}

/**
 * The traveller's contact details are released only once the agency has put a
 * name against the job — so the redaction lives on the *read*, not in storage.
 * Assign staff and the same record comes back with the contact filled in.
 */
function withContactRule(assignment: AgencyAssignment): AgencyAssignment {
  if (assignment.assignedStaffIds.length > 0) return assignment;
  return {
    ...assignment,
    traveller: { ...assignment.traveller, email: null, phone: null },
  };
}

/* ---------------------------------------------------------------------------
 * The agency, and its listing
 * ------------------------------------------------------------------------- */

export function getAgency(agencyId: string): Agency | null {
  const agency = agencyRecord(agencyId);
  return agency ? clone(agency) : null;
}

/** The currency an agency trades in — taken from what it actually sells. */
function currencyOf(agency: Agency, assignments: AgencyAssignment[]) {
  return agency.offerings[0]?.currency ?? assignments[0]?.currency ?? "NGN";
}

function isExpired(document: AgencyDocument, at: Date) {
  return document.expiresAt !== undefined && new Date(document.expiresAt) < at;
}

/**
 * Everything on the dashboard is derived here and nothing is stored, so a
 * figure can never drift from the rows it is meant to summarise.
 */
export function getOverview(agencyId: string): AgencyOverview {
  const agency = agencyRecord(agencyId);
  const assignments = assignmentsOf(agencyId);
  const staff = staffOf(agencyId);

  if (!agency) {
    // A session for an agency that no longer exists. An empty console beats a
    // thrown error on a dashboard.
    return {
      openAssignments: 0,
      staffOnDuty: 0,
      staffTotal: 0,
      completedThisMonth: 0,
      earnedThisMonth: 0,
      pendingPayout: 0,
      currency: "NGN",
      outstandingDocuments: 0,
      verification: "unverified",
      listingStatus: "draft",
    };
  }

  const now = new Date();
  const month = now.getUTCMonth();
  const year = now.getUTCFullYear();

  const completedThisMonth = assignments.filter((assignment) => {
    if (assignment.status !== "completed") return false;
    const finished = new Date(assignment.endsAt);
    return finished.getUTCFullYear() === year && finished.getUTCMonth() === month;
  });

  // Anything settled in a payout that has actually been paid is off the books.
  const settled = new Set(
    payoutsOf(agencyId)
      .filter((payout) => payout.status === "paid")
      .flatMap((payout) => payout.assignmentIds),
  );

  const pendingPayout = assignments
    .filter(
      (assignment) => assignment.status === "completed" && !settled.has(assignment.id),
    )
    .reduce((total, assignment) => total + assignment.netToAgency, 0);

  const required = new Set(requiredDocumentsFor(agency.categories));
  const outstandingDocuments = agency.documents.filter(
    (document) =>
      required.has(document.kind) &&
      // A lapsed licence is as good as a missing one — the type says so.
      (document.status !== "approved" || isExpired(document, now)),
  ).length;

  return {
    openAssignments: assignments.filter((assignment) =>
      ["requested", "assigned", "in_progress"].includes(assignment.status),
    ).length,
    // "On duty" is anyone the agency could put on a job today: off-duty and
    // inactive people are on the books but not available to the desk.
    staffOnDuty: staff.filter(
      (member) => member.status === "available" || member.status === "assigned",
    ).length,
    staffTotal: staff.length,
    completedThisMonth: completedThisMonth.length,
    earnedThisMonth:
      Math.round(
        completedThisMonth.reduce(
          (total, assignment) => total + assignment.netToAgency,
          0,
        ) * 100,
      ) / 100,
    pendingPayout: Math.round(pendingPayout * 100) / 100,
    currency: currencyOf(agency, assignments),
    outstandingDocuments,
    verification: agency.verification,
    listingStatus: agency.listingStatus,
  };
}

/** What the listing wizard may change. Verification and money are not ours. */
export type ListingPatch = Partial<
  Pick<
    Agency,
    | "name"
    | "legalName"
    | "registrationNumber"
    | "countryCode"
    | "country"
    | "cities"
    | "categories"
    | "summary"
    | "about"
    | "logoUrl"
    | "email"
    | "phone"
    | "website"
    | "yearFounded"
    | "staffCount"
    | "languages"
    | "offerings"
  >
>;

/**
 * Rebuilds the checklist for a new set of categories, keeping what has already
 * been uploaded. Picking up childcare adds its checks as `missing`; dropping
 * catering drops the hygiene certificate rather than blocking submission on
 * paperwork for a service the agency no longer sells.
 */
function reconcileDocuments(
  existing: AgencyDocument[],
  categories: readonly AgencyCategory[],
): AgencyDocument[] {
  const byKind = new Map(existing.map((document) => [document.kind, document]));
  return documentsForCategories(categories).map(
    (kind) => byKind.get(kind) ?? { kind, status: "missing" as const },
  );
}

export function updateListing(agencyId: string, patch: ListingPatch): Agency | null {
  const agency = agencyRecord(agencyId);
  if (!agency) return null;

  Object.assign(agency, patch);
  if (patch.categories) {
    agency.documents = reconcileDocuments(agency.documents, patch.categories);
  }
  return clone(agency);
}

/**
 * Records an upload against one document.
 *
 * Returns `null` both for an unknown agency and for a kind this agency's
 * categories do not ask for — there is nowhere to put the latter, and silently
 * inventing a checklist row would make the wizard disagree with the catalog.
 */
export function setDocument(
  agencyId: string,
  kind: AgencyDocumentKind,
  file: { fileName: string; fileUrl: string; expiresAt?: string },
): Agency | null {
  const agency = agencyRecord(agencyId);
  if (!agency) return null;

  const document = agency.documents.find((entry) => entry.kind === kind);
  if (!document) return null;

  document.status = "uploaded";
  document.fileName = file.fileName;
  document.fileUrl = file.fileUrl;
  document.uploadedAt = nowIso();
  if (file.expiresAt) document.expiresAt = file.expiresAt;
  // A fresh file answers the reviewer's last note; leaving it would show a
  // rejection against a document that has since been replaced.
  delete document.note;

  return clone(agency);
}

/**
 * Which required documents still block submission.
 *
 * `missing` and `rejected` both block: a rejected file has been looked at and
 * sent back, so resubmitting without replacing it would waste a review cycle.
 * `uploaded` and `in_review` do not — submission is what *asks* for approval,
 * so requiring approval first would be circular.
 */
export function listingReadiness(agencyId: string): {
  ready: boolean;
  missing: AgencyDocumentKind[];
} {
  const agency = agencyRecord(agencyId);
  if (!agency) return { ready: false, missing: [] };

  const required = new Set(requiredDocumentsFor(agency.categories));
  const missing = agency.documents
    .filter(
      (document) =>
        required.has(document.kind) &&
        (document.status === "missing" || document.status === "rejected"),
    )
    .map((document) => document.kind);

  return { ready: missing.length === 0, missing };
}

export function submitListing(agencyId: string): {
  agency: Agency | null;
  message: string | null;
} {
  const agency = agencyRecord(agencyId);
  if (!agency) return { agency: null, message: "We could not find that agency." };

  const { ready, missing } = listingReadiness(agencyId);
  if (!ready) {
    return {
      agency: null,
      message: `Upload everything marked required before you submit — ${missing.length} document${
        missing.length === 1 ? " is" : "s are"
      } still outstanding.`,
    };
  }

  agency.listingStatus = "submitted";
  agency.verification = "pending";
  // Submission is what puts the file in front of a reviewer, so anything
  // merely uploaded joins the queue.
  for (const document of agency.documents) {
    if (document.status === "uploaded") document.status = "in_review";
  }

  return { agency: clone(agency), message: null };
}

/* ---------------------------------------------------------------------------
 * Assignments
 * ------------------------------------------------------------------------- */

export function listAssignments(
  agencyId: string,
  params: ListParams,
): Paginated<AgencyAssignment> {
  const needle = needleOf(params);
  const status = statusOf(params);

  const rows = assignmentsOf(agencyId)
    .filter((assignment) => !status || assignment.status === status)
    .filter(
      (assignment) =>
        !needle ||
        matches(
          needle,
          assignment.reference,
          assignment.offeringTitle,
          assignment.traveller.name,
          assignment.destination.city,
          assignment.destination.country,
        ),
    )
    // Soonest first, so the job that needs staffing today is at the top.
    .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime())
    .map((assignment) => withContactRule(clone(assignment)));

  return paginate(rows, params.page, params.perPage);
}

export function getAssignment(agencyId: string, id: string): AgencyAssignment | null {
  const assignment = assignmentsOf(agencyId).find((record) => record.id === id);
  return assignment ? withContactRule(clone(assignment)) : null;
}

/**
 * Puts the agency's own people against a booking.
 *
 * Refusals come back as a `message` rather than an exception: every one of
 * them is something the coordinator can fix on the screen they are looking at,
 * and a 500 would say nothing useful.
 */
export function assignStaff(
  agencyId: string,
  assignmentId: string,
  staffIds: string[],
): { assignment: AgencyAssignment | null; message: string | null } {
  const assignment = assignmentsOf(agencyId).find(
    (record) => record.id === assignmentId,
  );
  if (!assignment) {
    return { assignment: null, message: "We could not find that assignment." };
  }
  if (assignment.status === "completed" || assignment.status === "cancelled") {
    return {
      assignment: null,
      message: "This assignment is closed. Staff can no longer be changed.",
    };
  }

  const unique = [...new Set(staffIds)];
  if (unique.length !== staffIds.length) {
    return { assignment: null, message: "The same person is listed twice." };
  }

  const roster = staffOf(agencyId);
  const chosen: AgencyStaff[] = [];
  for (const id of unique) {
    // Tenancy again: a staff id from another agency must not resolve here.
    const member = roster.find((record) => record.id === id);
    if (!member) {
      return { assignment: null, message: "One of those people is not on your team." };
    }
    if (member.status === "inactive") {
      return {
        assignment: null,
        message: `${member.name} is marked inactive. Reactivate them or pick someone else.`,
      };
    }
    chosen.push(member);
  }

  if (chosen.length !== assignment.staffRequired) {
    return {
      assignment: null,
      message: `The traveller paid for ${assignment.staffRequired} ${
        assignment.staffRequired === 1 ? "person" : "people"
      }. You picked ${chosen.length}.`,
    };
  }

  const previous = new Set(assignment.assignedStaffIds);
  assignment.assignedStaffIds = chosen.map((member) => member.id);
  assignment.status = "assigned";
  for (const member of chosen) member.status = "assigned";
  // Anyone dropped from a reassignment goes back in the pool.
  for (const id of previous) {
    if (assignment.assignedStaffIds.includes(id)) continue;
    releaseStaff(agencyId, id);
  }

  return { assignment: withContactRule(clone(assignment)), message: null };
}

/** Puts someone back to `available` unless they are still on another live job. */
function releaseStaff(agencyId: string, staffId: string) {
  const member = staffOf(agencyId).find((record) => record.id === staffId);
  if (!member || member.status !== "assigned") return;

  const stillBusy = assignmentsOf(agencyId).some(
    (assignment) =>
      (assignment.status === "assigned" || assignment.status === "in_progress") &&
      assignment.assignedStaffIds.includes(staffId),
  );
  if (!stillBusy) member.status = "available";
}

export function completeAssignment(
  agencyId: string,
  id: string,
): { assignment: AgencyAssignment | null; message: string | null } {
  const assignment = assignmentsOf(agencyId).find((record) => record.id === id);
  if (!assignment) {
    return { assignment: null, message: "We could not find that assignment." };
  }
  if (assignment.status === "completed") {
    return {
      assignment: null,
      message: "This assignment is already marked completed.",
    };
  }
  if (assignment.status === "cancelled") {
    return { assignment: null, message: "A cancelled assignment cannot be completed." };
  }
  if (assignment.status === "requested") {
    return {
      assignment: null,
      message: "Assign staff before marking this one completed.",
    };
  }

  assignment.status = "completed";
  for (const staffId of assignment.assignedStaffIds) releaseStaff(agencyId, staffId);

  return { assignment: withContactRule(clone(assignment)), message: null };
}

/* ---------------------------------------------------------------------------
 * Staff
 * ------------------------------------------------------------------------- */

export function listStaff(
  agencyId: string,
  params: ListParams,
): Paginated<AgencyStaff> {
  const needle = needleOf(params);
  const status = statusOf(params);

  const rows = staffOf(agencyId)
    .filter((member) => !status || member.status === status)
    .filter(
      (member) =>
        !needle || matches(needle, member.name, member.role, ...member.languages),
    )
    .sort((a, b) => a.name.localeCompare(b.name))
    .map(clone);

  return paginate(rows, params.page, params.perPage);
}

export type NewStaffInput = {
  name: string;
  role: string;
  category: AgencyCategory;
  phone: string;
  languages: string[];
  experienceYears: number;
  backgroundChecked: boolean;
  /** Optional: `ProAvatar`-style monogram fallback covers the null case. */
  photoUrl?: string | null;
};

/**
 * Adds someone to the books. They start `available` and unrated — a rating is
 * something travellers give, not something an agency types in about itself.
 */
export function addStaff(agencyId: string, input: NewStaffInput): AgencyStaff {
  const member: AgencyStaff = {
    id: nextId("stf"),
    agencyId,
    name: input.name,
    role: input.role,
    category: input.category,
    photoUrl: input.photoUrl ?? null,
    phone: input.phone,
    languages: input.languages,
    experienceYears: input.experienceYears,
    status: "available",
    backgroundChecked: input.backgroundChecked,
    rating: null,
  };
  db.staff.push(member);
  return clone(member);
}

/* ---------------------------------------------------------------------------
 * Payouts
 * ------------------------------------------------------------------------- */

export function listPayouts(
  agencyId: string,
  params: ListParams,
): Paginated<AgencyPayout> {
  const needle = needleOf(params);
  const status = statusOf(params);

  const rows = payoutsOf(agencyId)
    .filter((payout) => !status || payout.status === status)
    .filter(
      (payout) =>
        !needle || matches(needle, payout.reference, payout.destinationAccount),
    )
    // Most recent run first: the money people ask about is the latest.
    .sort((a, b) => new Date(b.periodEnd).getTime() - new Date(a.periodEnd).getTime())
    .map(clone);

  return paginate(rows, params.page, params.perPage);
}

/* ---------------------------------------------------------------------------
 * Registration seam
 *
 * Not part of the console's read/write surface: these two exist so
 * `src/server/agency/auth.ts` can find and create accounts against the same
 * in-memory state the rest of this file serves. Nothing else should call them.
 * ------------------------------------------------------------------------- */

export function findAgencyUserByEmail(email: string): AgencyUser | null {
  const needle = email.trim().toLowerCase();
  const user = db.users.find((record) => record.email.toLowerCase() === needle);
  return user ? clone(user) : null;
}

/**
 * What a new agency is signed up on until someone negotiates otherwise. The
 * fixtures sit between 0.12 and 0.18; this is the middle of that band.
 */
const DEFAULT_COMMISSION_RATE = 0.15;

export type NewAgencyInput = {
  agencyName: string;
  contactName: string;
  email: string;
  phone: string;
  countryCode: string;
  country: string;
};

/**
 * Creates an agency in `draft` / `unverified` with an empty checklist.
 *
 * It has picked no categories yet, so `documentsForCategories([])` seeds the
 * base paperwork every agency owes and the services step adds the rest — the
 * checklist is derived from the catalog here exactly as it is everywhere else.
 */
export function createAgency(input: NewAgencyInput): {
  agency: Agency;
  user: AgencyUser;
} {
  const now = nowIso();
  const agency: Agency = {
    id: nextId("ag"),
    slug: slugify(input.agencyName),
    name: input.agencyName,
    legalName: input.agencyName,
    registrationNumber: "",
    countryCode: input.countryCode,
    country: input.country,
    cities: [],
    categories: [],
    summary: "",
    about: "",
    logoUrl: null,
    email: input.email,
    phone: input.phone,
    website: null,
    yearFounded: new Date(now).getUTCFullYear(),
    staffCount: 0,
    languages: [],
    verification: "unverified",
    listingStatus: "draft",
    documents: documentsForCategories([]).map((kind) => ({
      kind,
      status: "missing" as const,
    })),
    offerings: [],
    rating: null,
    completedJobs: 0,
    createdAt: now,
    commissionRate: DEFAULT_COMMISSION_RATE,
  };

  const user: AgencyUser = {
    id: nextId("agu"),
    name: input.contactName,
    email: input.email.trim(),
    role: "owner",
    agencyId: agency.id,
    agencyName: agency.name,
  };

  db.agencies.push(agency);
  db.users.push(user);
  return { agency: clone(agency), user: clone(user) };
}
