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
  AgencyDocumentStatus,
  AgencyListingStatus,
  AgencyOverview,
  AgencyPayout,
  AgencyServiceOffering,
  AgencyStaff,
  AgencyUser,
  AgencyVerificationStatus,
} from "@/features/agency/types";
import { slugify } from "@/lib/utils";
import { serviceKeyHeaders } from "@/server/api/service-key";
import { paginate } from "@/server/http";
import type { ListParams, Paginated } from "@/types";

/**
 * The one seam between the agency console and the World Portal service's
 * `/agency` routes.
 *
 * Every screen under `/agency` goes through the route handlers, and the route
 * handlers come here; `credentials()` below decides whether a call goes with
 * the service key or a desk member's token. Do not let a component, a hook or
 * a page reach into `src/features/agency/fixtures.ts` directly — that is the
 * shortcut that turns one seam into twenty.
 *
 * **When the service refuses or is unreachable, most mutations fall back to
 * memory.** Assigning staff, uploading a document, adding a person or
 * submitting a listing then writes to the module-level `db` below and nowhere
 * else, and still reports success. That means:
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

function resolveAgencyId(agencyId: string): string {
  const needle = agencyId.toLowerCase();
  const match = db.agencies.find(
    (agency) => agency.id === agencyId || agency.email?.toLowerCase() === needle,
  );
  return match ? match.id : agencyId;
}

function agencyRecord(agencyId: string): Agency | undefined {
  const needle = agencyId.toLowerCase();
  const match = db.agencies.find(
    (agency) => agency.id === agencyId || agency.email?.toLowerCase() === needle,
  );
  return match ? match : undefined;
}

function assignmentsOf(agencyId: string): AgencyAssignment[] {
  const resolved = resolveAgencyId(agencyId);
  return db.assignments.filter((assignment) => assignment.agencyId === resolved);
}

function staffOf(agencyId: string): AgencyStaff[] {
  const resolved = resolveAgencyId(agencyId);
  return db.staff.filter((member) => member.agencyId === resolved);
}

function payoutsOf(agencyId: string): AgencyPayout[] {
  const resolved = resolveAgencyId(agencyId);
  return db.payouts.filter((payout) => payout.agencyId === resolved);
}

/* ---------------------------------------------------------------------------
 * Filtering — same shape as the admin store's route handlers
 * ------------------------------------------------------------------------- */

function needleOf(params?: ListParams) {
  const q = params?.q?.trim().toLowerCase();
  return q ? q : null;
}

/** `undefined`, `""` and `"all"` all mean "do not filter". */
function statusOf(params?: ListParams) {
  const status = params?.status?.trim();
  return !status || status === "all" ? null : status;
}

function matches(needle: string, ...fields: (string | null | undefined)[]) {
  return fields.some((field) => field?.toLowerCase().includes(needle));
}

/**
 * An assignment as it arrives: the API's rows are flat (`travellerName`,
 * `destinationCity`, upper-case enums, decimal strings), the fixtures nested.
 */
type RawAssignment = Partial<
  Omit<
    AgencyAssignment,
    | "traveller"
    | "destination"
    | "category"
    | "status"
    | "gross"
    | "platformFee"
    | "netToAgency"
  >
> & {
  traveller?: Partial<AgencyAssignment["traveller"]>;
  destination?: Partial<AgencyAssignment["destination"]>;
  category?: string;
  status?: string;
  gross?: number | string | null;
  platformFee?: number | string | null;
  netToAgency?: number | string | null;
  travellerName?: string;
  travellerEmail?: string | null;
  travellerPhone?: string | null;
  partySize?: number;
  destinationCity?: string;
  destinationCountry?: string;
  destinationCountryCode?: string;
};

function withContactRule(assignment: AgencyAssignment): AgencyAssignment {
  if (!assignment) return assignment;
  const raw: RawAssignment = assignment;

  const travellerName = raw.travellerName || raw.traveller?.name || "Applicant";
  const travellerEmail = raw.travellerEmail ?? raw.traveller?.email ?? null;
  const travellerPhone = raw.travellerPhone ?? raw.traveller?.phone ?? null;
  const partySize = raw.partySize ?? raw.traveller?.partySize ?? 1;

  const destinationCity =
    raw.destinationCity || raw.destination?.city || "Destination City";
  const destinationCountry =
    raw.destinationCountry || raw.destination?.country || "Destination Country";
  const destinationCountryCode =
    raw.destinationCountryCode || raw.destination?.countryCode || "US";

  const assignedStaffIds = Array.isArray(raw.assignedStaffIds)
    ? raw.assignedStaffIds
    : [];
  const hasStaff = assignedStaffIds.length > 0;

  return {
    ...raw,
    id: raw.id || `asg-${Date.now()}`,
    reference: raw.reference || `HIRE-${Date.now()}`,
    agencyId: raw.agencyId || "",
    category: (raw.category?.toLowerCase() || "freelancer") as AgencyCategory,
    offeringId: raw.offeringId || "",
    offeringTitle: raw.offeringTitle || "Service Package",
    traveller: {
      name: travellerName,
      email: hasStaff ? travellerEmail : null,
      phone: hasStaff ? travellerPhone : null,
      partySize,
    },
    destination: {
      city: destinationCity,
      country: destinationCountry,
      countryCode: destinationCountryCode,
    },
    startsAt: raw.startsAt || new Date().toISOString(),
    endsAt: raw.endsAt || new Date().toISOString(),
    status: (raw.status?.toLowerCase() || "requested") as AgencyAssignment["status"],
    assignedStaffIds,
    staffRequired: raw.staffRequired || 1,
    notes: raw.notes || null,
    gross: raw.gross !== undefined && raw.gross !== null ? Number(raw.gross) : 150,
    currency: raw.currency || "USD",
    platformFee:
      raw.platformFee !== undefined && raw.platformFee !== null
        ? Number(raw.platformFee)
        : 22.5,
    netToAgency:
      raw.netToAgency !== undefined && raw.netToAgency !== null
        ? Number(raw.netToAgency)
        : 127.5,
    createdAt: raw.createdAt || new Date().toISOString(),
  };
}

/* ---------------------------------------------------------------------------
 * The agency, and its listing
 * ------------------------------------------------------------------------- */

const BACKEND_API_URL = process.env.BACKEND_API_URL || "http://localhost:4000/api";

/**
 * Outside production, an admin change the service didn't take is made on the
 * in-memory fixtures instead, so the console still works with no service
 * running. In production that would report a save that never happened.
 */
const LOCAL_FALLBACK = process.env.NODE_ENV !== "production";

/** The admin console asking as the signed-in desk member. */
export type DeskCaller = { token: string };

/**
 * Who this server asks the API as. The API answers no one else on /agency.
 *
 * - With a desk member, it is the admin console: the member's own token goes,
 *   so the API checks that member's role.
 * - Without one, it is this server acting for the signed-in agency (whose id
 *   comes from the session cookie and nowhere else), for a signed-out /hire
 *   visitor, or for sign-in itself: it sends the service key.
 *
 * Never both, and a desk call never falls back to the key: verifying an agency
 * and ruling on its documents must be a desk member's decision.
 */
function credentials(desk?: DeskCaller): Record<string, string> {
  return desk ? { Authorization: `Bearer ${desk.token}` } : serviceKeyHeaders();
}

/** An agency as the API sends it: upper-case enums and decimal strings. */
type ApiAgency = Omit<
  Agency,
  "verification" | "listingStatus" | "documents" | "offerings"
> & {
  verification?: string;
  listingStatus?: string;
  documents?: (Omit<AgencyDocument, "kind" | "status"> & {
    kind?: string;
    status?: string;
  })[];
  offerings?: (Omit<AgencyServiceOffering, "price"> & {
    price?: number | string | null;
  })[];
};

function normalizeAgency(raw: ApiAgency | { data?: ApiAgency }): Agency {
  if (!raw || typeof raw !== "object") return raw as Agency;
  const agency = ("data" in raw ? raw.data : undefined) ?? (raw as ApiAgency);
  if (!agency || typeof agency !== "object" || !agency.id) return agency as Agency;

  return {
    ...agency,
    verification: (agency.verification?.toLowerCase() ??
      "unverified") as AgencyVerificationStatus,
    listingStatus: (agency.listingStatus?.toLowerCase() ??
      "draft") as AgencyListingStatus,
    documents: (agency.documents || []).map((doc) => ({
      ...doc,
      kind: (doc.kind?.toLowerCase() ?? doc.kind) as AgencyDocumentKind,
      status: (doc.status?.toLowerCase() ?? "missing") as AgencyDocumentStatus,
    })),
    offerings: (agency.offerings || []).map((offering) => ({
      ...offering,
      price:
        offering.price !== null && offering.price !== undefined
          ? Number(offering.price)
          : null,
    })),
  };
}

export async function getAgency(
  agencyId: string,
  desk?: DeskCaller,
): Promise<Agency | null> {
  try {
    const res = await fetch(
      `${BACKEND_API_URL}/agency/${encodeURIComponent(agencyId)}`,
      {
        headers: credentials(desk),
        cache: "no-store",
      },
    );
    if (res.ok) {
      const json = await res.json();
      const agency = normalizeAgency(json);
      if (agency && agency.id) return agency;
    }
  } catch {
    // Fallback to local store
  }
  const local = agencyRecord(agencyId);
  return local ? clone(local) : null;
}

/**
 * Every agency, filtered here. The admin console passes its desk member; the
 * public /hire listing passes none and must map the rows to listing fields
 * before anything reaches the browser.
 */
export async function listAgencies(
  params: ListParams = {},
  desk?: DeskCaller,
): Promise<Paginated<Agency>> {
  let backendRows: Agency[] = [];
  let fetchedFromBackend = false;
  try {
    const res = await fetch(`${BACKEND_API_URL}/agency?limit=100`, {
      headers: credentials(desk),
      cache: "no-store",
    });
    if (res.ok) {
      const json = await res.json();
      const payload = json.data ?? json;
      const rawRows = Array.isArray(payload)
        ? payload
        : Array.isArray(payload?.data)
          ? payload.data
          : [];
      backendRows = rawRows.map(normalizeAgency);
      fetchedFromBackend = true;
    }
  } catch {
    // Fallback to local store if backend fails
  }

  const mergedMap = new Map<string, Agency>();
  if (fetchedFromBackend) {
    for (const row of backendRows) {
      if (row && row.id) {
        mergedMap.set(row.id, row);
      }
    }
  } else {
    for (const localRow of db.agencies) {
      if (!localRow || !localRow.id) continue;
      mergedMap.set(localRow.id, localRow);
    }
  }
  const merged = Array.from(mergedMap.values());
  const needle = needleOf(params);
  const status = statusOf(params);
  const verificationRaw = params?.verification?.trim();
  const verification =
    verificationRaw && verificationRaw !== "undefined" && verificationRaw !== "ALL"
      ? verificationRaw
      : null;

  const filtered = merged
    .filter((agency) => !status || agency.listingStatus === status)
    .filter(
      (agency) =>
        !verification ||
        agency.verification?.toLowerCase() === verification.toLowerCase(),
    )
    .filter(
      (agency) =>
        !needle ||
        matches(
          needle,
          agency.name,
          agency.legalName,
          agency.country,
          agency.registrationNumber,
        ),
    )
    .sort((a, b) => {
      // The API's rows carry `updatedAt`; the fixtures only `createdAt`.
      const when = (agency: Agency & { updatedAt?: string }) =>
        new Date(agency.updatedAt || agency.createdAt || 0).getTime();
      return when(b) - when(a);
    });

  return paginate(filtered, params?.page, params?.perPage);
}

/** A desk decision: the API takes it from a desk member's token only. */
export async function updateAgencyVerification(
  agencyId: string,
  verification: string,
  desk: DeskCaller,
): Promise<Agency | null> {
  const vLower = verification.toLowerCase();
  const verificationStatus: AgencyVerificationStatus =
    vLower === "verified"
      ? "verified"
      : vLower === "pending"
        ? "pending"
        : vLower === "suspended" || vLower === "rejected"
          ? "suspended"
          : "unverified";

  const listingStatus: AgencyListingStatus =
    verificationStatus === "verified"
      ? "live"
      : verificationStatus === "suspended"
        ? "rejected"
        : "submitted";

  const applyLocally = (agency: Agency) => {
    agency.verification = verificationStatus;
    agency.listingStatus = listingStatus;
    if (verificationStatus === "verified" && agency.documents) {
      agency.documents.forEach((doc) => {
        if (doc.status !== "missing") {
          doc.status = "approved";
        }
      });
    }
  };

  // The service is the record. The in-memory copy used to change first and
  // be returned whenever the service failed, so the console said
  // "Verification updated" during an outage although nothing was saved.
  let res: Response | null = null;
  try {
    res = await fetch(
      `${BACKEND_API_URL}/agency/${encodeURIComponent(agencyId)}/verify`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...credentials(desk) },
        body: JSON.stringify({ verification }),
        cache: "no-store",
      },
    );
  } catch (error) {
    if (!LOCAL_FALLBACK) throw error;
  }

  // Never fall back to another agency: verifying an unknown id used to flip the
  // first agency in the store instead.
  const local = agencyRecord(agencyId);

  if (res?.ok) {
    const saved = normalizeAgency(await res.json());
    if (local) applyLocally(local);
    return saved;
  }
  if (!LOCAL_FALLBACK) {
    if (res?.status === 404) return null;
    throw new Error(`Agency verification was not saved (HTTP ${res?.status})`);
  }

  // Local development: the fixtures stand in for an agency service that
  // isn't running, or for an agency only they know about.
  if (!local) return null;
  applyLocally(local);
  return clone(local);
}

/** A desk decision: the API takes it from a desk member's token only. */
export async function updateAgencyDocumentStatus(
  agencyId: string,
  docId: string,
  status: string,
  note: string | undefined,
  desk: DeskCaller,
): Promise<Agency | null> {
  const sLower = status.toLowerCase();
  const docStatus: AgencyDocumentStatus =
    sLower === "approved" || sLower === "verified"
      ? "approved"
      : sLower === "rejected"
        ? "rejected"
        : sLower === "in_review"
          ? "in_review"
          : "uploaded";

  const agency = agencyRecord(agencyId);
  if (agency && agency.documents) {
    // The API's documents carry an id; the fixtures are keyed by kind.
    const doc = agency.documents.find(
      (d: AgencyDocument & { id?: string }) => d.id === docId || d.kind === docId,
    );
    if (doc) {
      doc.status = docStatus;
      if (note !== undefined) doc.note = note;
    }
  }

  try {
    const res = await fetch(
      `${BACKEND_API_URL}/agency/${encodeURIComponent(agencyId)}/documents/${encodeURIComponent(docId)}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...credentials(desk) },
        body: JSON.stringify({ status: docStatus.toUpperCase(), note }),
        cache: "no-store",
      },
    );
    if (res.ok) {
      const updatedAgency = await getAgency(agencyId, desk);
      if (updatedAgency) return updatedAgency;
    }
  } catch {
    // Fallback to local store
  }

  const updatedAgency = await getAgency(agencyId, desk);
  if (updatedAgency) return updatedAgency;

  return agency ? clone(agency) : null;
}

/** The currency an agency trades in — taken from what it actually sells. */
function currencyOf(agency: Agency, assignments: AgencyAssignment[]) {
  return agency.offerings[0]?.currency ?? assignments[0]?.currency ?? "NGN";
}

/**
 * Everything on the dashboard is derived here and nothing is stored, so a
 * figure can never drift from the rows it is meant to summarise.
 */
export async function getOverview(agencyId: string): Promise<AgencyOverview> {
  try {
    const res = await fetch(
      `${BACKEND_API_URL}/agency/${encodeURIComponent(agencyId)}/overview`,
      {
        headers: credentials(),
        cache: "no-store",
      },
    );
    if (res.ok) {
      const json = await res.json();
      return json.data ?? json;
    }
  } catch {
    // Return empty overview default if backend is unavailable
  }

  const agency = await getAgency(agencyId);
  const assignments = assignmentsOf(agencyId);
  const staff = staffOf(agencyId);
  const payouts = payoutsOf(agencyId);

  const activeAssignments = assignments.filter(
    (a) =>
      a.status === "in_progress" || a.status === "assigned" || a.status === "requested",
  );

  return {
    openAssignments: activeAssignments.length,
    staffOnDuty: staff.length,
    staffTotal: staff.length,
    completedThisMonth: assignments.filter((a) => a.status === "completed").length,
    earnedThisMonth: payouts.reduce(
      (sum, p) => sum + (p.status === "paid" ? p.net : 0),
      0,
    ),
    pendingPayout: payouts.reduce(
      (sum, p) => sum + (p.status === "pending" ? p.net : 0),
      0,
    ),
    currency: agency ? currencyOf(agency, assignments) : "USD",
    outstandingDocuments: agency
      ? agency.documents.filter(
          (d) => d.status === "missing" || d.status === "rejected",
        ).length
      : 0,
    verification: agency?.verification ?? "unverified",
    listingStatus: agency?.listingStatus ?? "draft",
  };
}

/**
 * What the listing wizard may change. Verification and money are not ours, and
 * neither is `email`: it is the sign-in email, which only a verified flow may
 * change (there isn't one yet).
 */
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

export async function updateListing(
  agencyId: string,
  listingPatch: ListingPatch,
): Promise<Agency | null> {
  // Dropped even if a caller slips one past the type: the sign-in email is
  // never changed by a listing save, here or on the service.
  const { email: _email, ...patch } = listingPatch as ListingPatch & {
    email?: unknown;
  };
  const local = agencyRecord(agencyId);
  if (local) {
    Object.assign(local, patch);
    if (patch.categories) {
      local.documents = reconcileDocuments(local.documents, patch.categories);
    }
  }

  try {
    const res = await fetch(
      `${BACKEND_API_URL}/agency/${encodeURIComponent(agencyId)}/listing`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...credentials() },
        body: JSON.stringify(patch),
        cache: "no-store",
      },
    );
    if (res.ok) {
      const json = await res.json();
      return normalizeAgency(json);
    }
  } catch {
    // Fallback to local store
  }

  return local ? clone(local) : null;
}

/**
 * Records an upload against one document.
 *
 * Returns `null` both for an unknown agency and for a kind this agency's
 * categories do not ask for — there is nowhere to put the latter, and silently
 * inventing a checklist row would make the wizard disagree with the catalog.
 */
export async function setDocument(
  agencyId: string,
  kind: AgencyDocumentKind,
  file: { fileName: string; fileUrl: string; expiresAt?: string },
): Promise<Agency | null> {
  try {
    const backendKind = kind.toUpperCase();
    const res = await fetch(
      `${BACKEND_API_URL}/agency/${encodeURIComponent(agencyId)}/documents`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", ...credentials() },
        body: JSON.stringify({
          kind: backendKind,
          fileName: file.fileName,
          fileUrl: file.fileUrl,
          expiresAt: file.expiresAt,
        }),
        cache: "no-store",
      },
    );
    if (res.ok) {
      const updatedAgency = await getAgency(agencyId);
      if (updatedAgency) return updatedAgency;
    }
  } catch {
    // Fallback to local store
  }

  let agency = agencyRecord(agencyId);
  if (!agency) {
    const fetched = await getAgency(agencyId);
    if (fetched) {
      agency = fetched;
    }
  }
  if (!agency) return null;

  let document = agency.documents.find((entry) => entry.kind === kind);
  if (!document) {
    document = { kind, status: "uploaded" };
    agency.documents.push(document);
  }

  document.status = "uploaded";
  document.fileName = file.fileName;
  document.fileUrl = file.fileUrl;
  document.uploadedAt = nowIso();
  if (file.expiresAt) document.expiresAt = file.expiresAt;
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
export async function listingReadiness(agencyId: string): Promise<{
  ready: boolean;
  missing: AgencyDocumentKind[];
}> {
  let agency: Agency | null | undefined = agencyRecord(agencyId);
  if (!agency) {
    agency = await getAgency(agencyId);
  }
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

export async function submitListing(agencyId: string): Promise<{
  agency: Agency | null;
  message: string | null;
}> {
  try {
    const res = await fetch(
      `${BACKEND_API_URL}/agency/${encodeURIComponent(agencyId)}/listing`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...credentials() },
        body: JSON.stringify({ listingStatus: "submitted", verification: "pending" }),
        cache: "no-store",
      },
    );
    if (res.ok) {
      const json = await res.json();
      const updatedAgency = json.data ?? json;
      return { agency: updatedAgency, message: null };
    }
  } catch {
    // Ignore backend sync failure
  }

  let agency: Agency | null | undefined = agencyRecord(agencyId);
  if (!agency) {
    agency = await getAgency(agencyId);
  }
  if (!agency) return { agency: null, message: "We could not find that agency." };

  const { ready, missing } = await listingReadiness(agencyId);
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
  for (const document of agency.documents) {
    if (document.status === "uploaded") document.status = "in_review";
  }

  return { agency: clone(agency), message: null };
}

/* ---------------------------------------------------------------------------
 * Assignments
 * ------------------------------------------------------------------------- */

export async function listAssignments(
  agencyId: string,
  params: ListParams = {},
): Promise<Paginated<AgencyAssignment>> {
  try {
    const res = await fetch(
      `${BACKEND_API_URL}/agency/${encodeURIComponent(agencyId)}/assignments`,
      {
        headers: credentials(),
        cache: "no-store",
      },
    );
    if (res.ok) {
      const json = await res.json();
      const payload = json.data ?? json;
      const rows: AgencyAssignment[] = Array.isArray(payload)
        ? payload
        : payload.data || [];
      const needle = needleOf(params);
      const status = statusOf(params);

      const filtered = rows
        .filter((assignment) => !status || assignment.status === status)
        .filter(
          (assignment) =>
            !needle ||
            matches(
              needle,
              assignment.reference,
              assignment.offeringTitle,
              assignment.traveller?.name,
              assignment.destination?.city,
              assignment.destination?.country,
            ),
        )
        .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime())
        .map((assignment) => withContactRule(clone(assignment)));

      return paginate(filtered, params.page, params.perPage);
    }
  } catch {
    // Fallback to local store
  }

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
          assignment.traveller?.name,
          assignment.destination?.city,
          assignment.destination?.country,
        ),
    )
    // Soonest first, so the job that needs staffing today is at the top.
    .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime())
    .map((assignment) => withContactRule(clone(assignment)));

  return paginate(rows, params?.page, params?.perPage);
}

export async function getAssignment(
  agencyId: string,
  id: string,
): Promise<AgencyAssignment | null> {
  try {
    const paginated = await listAssignments(agencyId, { perPage: 100 });
    const match = paginated.data.find(
      (record) => record.id === id || record.reference === id,
    );
    if (match) return withContactRule(clone(match));
  } catch {
    // Fallback to local store
  }

  const assignment = assignmentsOf(agencyId).find(
    (record) => record.id === id || record.reference === id,
  );
  return assignment ? withContactRule(clone(assignment)) : null;
}

/**
 * Puts the agency's own people against a booking.
 *
 * Refusals come back as a `message` rather than an exception: every one of
 * them is something the coordinator can fix on the screen they are looking at,
 * and a 500 would say nothing useful.
 */
export async function assignStaff(
  agencyId: string,
  assignmentId: string,
  staffIds: string[],
): Promise<{ assignment: AgencyAssignment | null; message: string | null }> {
  try {
    // The assignment id comes from the browser: escaped, so it can only ever
    // name an assignment under the session's own agency.
    const res = await fetch(
      `${BACKEND_API_URL}/agency/${encodeURIComponent(agencyId)}/assignments/${encodeURIComponent(assignmentId)}/assign`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", ...credentials() },
        body: JSON.stringify({ assignedStaffIds: staffIds }),
        cache: "no-store",
      },
    );
    if (res.ok) {
      const json = await res.json();
      const updated = json.data ?? json;
      return { assignment: withContactRule(clone(updated)), message: null };
    }
  } catch {
    // Fallback to local store
  }
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

export async function completeAssignment(
  agencyId: string,
  id: string,
): Promise<{ assignment: AgencyAssignment | null; message: string | null }> {
  try {
    // Escaped for the same reason as in assignStaff(): the id is the browser's.
    const res = await fetch(
      `${BACKEND_API_URL}/agency/${encodeURIComponent(agencyId)}/assignments/${encodeURIComponent(id)}/complete`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", ...credentials() },
        cache: "no-store",
      },
    );
    if (res.ok) {
      const json = await res.json();
      const updated = json.data ?? json;
      return { assignment: withContactRule(clone(updated)), message: null };
    }
  } catch {
    // Fallback to local store
  }

  const assignment = assignmentsOf(agencyId).find(
    (record) => record.id === id || record.reference === id,
  );
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

export async function listStaff(
  agencyId: string,
  params: ListParams = {},
): Promise<Paginated<AgencyStaff>> {
  let backendRows: AgencyStaff[] = [];
  try {
    const res = await fetch(
      `${BACKEND_API_URL}/agency/${encodeURIComponent(agencyId)}/staff`,
      {
        headers: credentials(),
        cache: "no-store",
      },
    );
    if (res.ok) {
      const json = await res.json();
      const payload = json.data ?? json;
      backendRows = Array.isArray(payload) ? payload : payload.data || [];
    }
  } catch {
    // Ignore backend fetch errors
  }

  const localRows = staffOf(agencyId);
  const combinedMap = new Map<string, AgencyStaff>();
  if (backendRows.length > 0) {
    for (const s of backendRows) combinedMap.set(s.id, s);
  } else {
    for (const s of localRows) combinedMap.set(s.id, s);
  }

  const rows = Array.from(combinedMap.values());
  const needle = needleOf(params);
  const status = statusOf(params);

  const filtered = rows
    .filter((member) => !status || member.status === status)
    .filter(
      (member) =>
        !needle ||
        matches(needle, member.name, member.role, ...(member.languages || [])),
    )
    .sort((a, b) => a.name.localeCompare(b.name))
    .map(clone);

  return paginate(filtered, params?.page, params?.perPage);
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
export async function addStaff(
  agencyId: string,
  input: NewStaffInput,
): Promise<AgencyStaff> {
  try {
    const res = await fetch(
      `${BACKEND_API_URL}/agency/${encodeURIComponent(agencyId)}/staff`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", ...credentials() },
        body: JSON.stringify(input),
        cache: "no-store",
      },
    );
    if (res.ok) {
      const json = await res.json();
      const backendMember = json.data ?? json;
      if (backendMember && backendMember.id) {
        return backendMember;
      }
    }
  } catch {
    // Fallback to local store member
  }

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

export async function listPayouts(
  agencyId: string,
  params: ListParams = {},
): Promise<Paginated<AgencyPayout>> {
  try {
    const res = await fetch(
      `${BACKEND_API_URL}/agency/${encodeURIComponent(agencyId)}/payouts`,
      {
        headers: credentials(),
        cache: "no-store",
      },
    );
    if (res.ok) {
      const json = await res.json();
      const payload = json.data ?? json;
      const rows: AgencyPayout[] = Array.isArray(payload)
        ? payload
        : payload.data || [];
      const needle = needleOf(params);
      const status = statusOf(params);
      const filtered = rows
        .filter((payout) => !status || payout.status === status)
        .filter(
          (payout) =>
            !needle || matches(needle, payout.reference, payout.destinationAccount),
        )
        .sort(
          (a, b) => new Date(b.periodEnd).getTime() - new Date(a.periodEnd).getTime(),
        )
        .map(clone);

      return paginate(filtered, params?.page, params?.perPage);
    }
  } catch {
    // Fallback to local store
  }

  const needle = needleOf(params);
  const status = statusOf(params);

  const rows = payoutsOf(agencyId)
    .filter((payout) => !status || payout.status === status)
    .filter(
      (payout) =>
        !needle || matches(needle, payout.reference, payout.destinationAccount),
    )
    .sort((a, b) => new Date(b.periodEnd).getTime() - new Date(a.periodEnd).getTime())
    .map(clone);

  return paginate(rows, params?.page, params?.perPage);
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
