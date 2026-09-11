import { agencyListing } from "@/content/agency";
import { documentCatalog, requiredDocumentsFor } from "@/features/agency/catalog";
import type {
  Agency,
  AgencyCategory,
  AgencyDocument,
  AgencyDocumentKind,
  AgencyServiceOffering,
} from "@/features/agency/types";
import { countryName } from "@/lib/countries";
import type { ListingPatchInput } from "@/validations/agency";

/**
 * The listing flow's value shape, and the pure functions around it.
 *
 * Kept out of the components so the form, the rail and the review step all
 * agree on one answer to "is this step finished?" — the rail's outstanding
 * count and the Continue button must never disagree.
 */

export type StepId = (typeof agencyListing.steps)[number]["id"];

export const stepIds = agencyListing.steps.map((s) => s.id) as StepId[];

/** The fields each step owns — what `form.trigger()` is given on Continue. */
export const stepFieldNames = {
  profile: [
    "name",
    "legalName",
    "registrationNumber",
    "countryCode",
    "country",
    "cities",
    "summary",
    "about",
    "yearFounded",
    "staffCount",
    "languages",
    "email",
    "phone",
    "website",
  ],
  services: ["categories", "offerings"],
  documents: [],
  review: [],
} satisfies Record<StepId, readonly (keyof ListingFormValues)[]>;

export type ListingFormValues = {
  name: string;
  legalName: string;
  registrationNumber: string;
  countryCode: string;
  country: string;
  cities: string[];
  categories: AgencyCategory[];
  summary: string;
  about: string;
  email: string;
  phone: string;
  website: string;
  /** Undefined, never null, while empty — an optional zod number takes one and not the other. */
  yearFounded: number | undefined;
  staffCount: number | undefined;
  languages: string[];
  offerings: AgencyServiceOffering[];
};

export function toFormValues(agency: Agency): ListingFormValues {
  return {
    name: agency.name ?? "",
    legalName: agency.legalName ?? "",
    registrationNumber: agency.registrationNumber ?? "",
    countryCode: agency.countryCode ?? "",
    country: agency.country ?? "",
    cities: agency.cities ?? [],
    categories: agency.categories ?? [],
    summary: agency.summary ?? "",
    about: agency.about ?? "",
    email: agency.email ?? "",
    phone: agency.phone ?? "",
    website: agency.website ?? "",
    yearFounded: agency.yearFounded || undefined,
    staffCount: agency.staffCount || undefined,
    languages: agency.languages ?? [],
    offerings: agency.offerings ?? [],
  };
}

/**
 * The body actually sent to `PATCH /api/agency/listing`.
 *
 * Blank strings and unset numbers are dropped rather than sent: this is an
 * autosave that runs while the agency is halfway through typing, and an empty
 * optional URL or a half-typed year must not fail the whole save. Arrays are
 * always sent, because emptying one is a real edit.
 */
export function toPatch(values: ListingFormValues): ListingPatchInput {
  const patch: Record<string, unknown> = {
    cities: values.cities,
    categories: values.categories,
    languages: values.languages,
    offerings: values.offerings,
  };

  const text = {
    name: values.name,
    legalName: values.legalName,
    registrationNumber: values.registrationNumber,
    countryCode: values.countryCode,
    country: values.country,
    summary: values.summary,
    about: values.about,
    email: values.email,
    phone: values.phone,
    website: values.website,
  };

  for (const [key, value] of Object.entries(text)) {
    const trimmed = value?.trim() ?? "";
    if (trimmed) patch[key] = trimmed;
  }

  if (typeof values.yearFounded === "number" && !Number.isNaN(values.yearFounded)) {
    patch.yearFounded = values.yearFounded;
  }
  if (typeof values.staffCount === "number" && !Number.isNaN(values.staffCount)) {
    patch.staffCount = values.staffCount;
  }

  // Built loosely and asserted once: every key here is a key of the schema,
  // and the schema itself re-checks the body on the way into the route.
  return patch as ListingPatchInput;
}

/** Keeps `country` and `countryCode` in step — the listing shows the name. */
export function countryFieldsFor(code: string) {
  return { countryCode: code, country: countryName(code) };
}

/* ---------------------------------------------------------------------------
 * Completeness — presence, not format. The schema owns format.
 * ------------------------------------------------------------------------- */

/** What step 1 is still waiting for, by the label the agency sees. */
export function missingProfileFields(values: ListingFormValues): string[] {
  const copy = agencyListing.profile;
  const missing: string[] = [];

  if (!values.name.trim()) missing.push(copy.name);
  if (!values.legalName.trim()) missing.push(copy.legalName);
  if (!values.registrationNumber.trim()) missing.push(copy.registrationNumber);
  if (!values.countryCode) missing.push(copy.country);
  if (values.cities.length === 0) missing.push(copy.cities);
  if (!values.summary.trim()) missing.push(copy.summary);
  if (!values.about.trim()) missing.push(copy.about);
  if (!values.yearFounded) missing.push(copy.yearFounded);
  if (!values.staffCount) missing.push(copy.staffCount);
  if (values.languages.length === 0) missing.push(copy.languages);
  if (!values.email.trim()) missing.push(copy.email);
  if (!values.phone.trim()) missing.push(copy.phone);

  return missing;
}

/** What step 2 is still waiting for. */
export function missingServiceFields(values: ListingFormValues): string[] {
  const copy = agencyListing.services;
  const missing: string[] = [];

  if (values.categories.length === 0) missing.push(copy.title);
  if (values.offerings.length === 0) missing.push(copy.offeringsTitle);
  else if (values.offerings.some((offering) => !offering.title.trim())) {
    missing.push(copy.fields.title);
  }

  return missing;
}

export function documentByKind(
  documents: readonly AgencyDocument[],
): Map<AgencyDocumentKind, AgencyDocument> {
  return new Map(documents.map((document) => [document.kind, document]));
}

/**
 * A document counts as in only when there is a file against it, a reviewer has
 * not sent it back, and — where it lapses — it carries its date. A licence
 * with no expiry on file is as good as no licence.
 */
export function isDocumentSatisfied(
  kind: AgencyDocumentKind,
  document: AgencyDocument | undefined,
): boolean {
  if (!document?.fileUrl) return false;
  if (document.status === "missing" || document.status === "rejected") return false;
  if (documentCatalog[kind].expires && !document.expiresAt) return false;
  return true;
}

/** The required paperwork still blocking submission, in catalog order. */
export function outstandingDocuments(
  categories: readonly AgencyCategory[],
  documents: readonly AgencyDocument[],
): AgencyDocumentKind[] {
  const byKind = documentByKind(documents);
  return requiredDocumentsFor(categories).filter(
    (kind) => !isDocumentSatisfied(kind, byKind.get(kind)),
  );
}

export type StepCompletion = Record<StepId, boolean>;

export function stepCompletion(
  values: ListingFormValues,
  documents: readonly AgencyDocument[],
  submitted: boolean,
): StepCompletion {
  return {
    profile: missingProfileFields(values).length === 0,
    services: missingServiceFields(values).length === 0,
    documents: outstandingDocuments(values.categories, documents).length === 0,
    review: submitted,
  };
}

/**
 * Where the agency may go. Back is always free; forward only into a step whose
 * predecessors are done — so nobody reaches Review to be told step 1 was wrong.
 */
export function reachableSteps(
  completion: StepCompletion,
  current: number,
): (index: number) => boolean {
  const firstIncomplete = stepIds.findIndex((id) => !completion[id]);
  return (index) =>
    index <= current || firstIncomplete === -1 || index <= firstIncomplete;
}

/** Listing states where editing would be wrong rather than merely awkward. */
export function isListingLocked(agency: Agency): boolean {
  return (
    agency.listingStatus === "submitted" ||
    agency.listingStatus === "in_review" ||
    agency.listingStatus === "live"
  );
}

export function newOffering(category: AgencyCategory): AgencyServiceOffering {
  return {
    id:
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `offering-${Date.now()}`,
    category,
    title: "",
    description: "",
    // Null is the "quoted after review" case, and the default: an agency that
    // has not typed a price has not agreed to one.
    price: null,
    currency: "USD",
    unit: "day",
    leadTimeHours: 24,
    capacity: 1,
  };
}
