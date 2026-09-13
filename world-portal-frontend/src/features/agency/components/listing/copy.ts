/**
 * The handful of strings `src/content/agency.ts` does not carry.
 *
 * `agencyListing` owns every word the agency reads on this screen; what is
 * left here is the flow's own furniture — the two navigation buttons, the
 * autosave indicator, the option lists behind the currency and unit pickers.
 * They live in one module rather than scattered through the components, so
 * moving them into `src/content/agency.ts` is a copy-paste when that file is
 * next opened.
 */
export const listingFlowCopy = {
  back: "Back",
  continue: "Continue",
  edit: "Edit",
  saving: "Saving…",
  saved: "Saved",
  saveFailed: "Not saved — we will retry as you type",
  progressLabel: "Your listing",
  outstandingOne: "1 document outstanding",
  outstandingMany: (count: number) => `${count} documents outstanding`,
  outstandingNone: "All documents in",
  incompleteTitle: "Finish this step first",
  incompleteBody: "These are still empty:",
  readOnlyTitle: "This listing is with a reviewer",
  readOnlyBody:
    "Nothing can be edited while it is being checked. We will email you when there is news, and you can edit again if anything comes back.",
  liveTitle: "Your listing is live",
  liveBody:
    "Travellers can add you to their package. To change your services or prices, ask support to reopen the listing.",
  uploading: "Uploading…",
  noFile: "No file yet",
  expiryMissing: "Add the expiry date.",
  expiryLocked: "Upload the document first, then add its expiry date.",
  chipAdd: "Add",
  chipRemove: (value: string) => `Remove ${value}`,
  chipHint: "Type and press Enter.",
  categoryDrives: "What you pick here decides which documents we ask for.",
  categorySelected: (count: number) =>
    count === 1 ? "1 service selected" : `${count} services selected`,
  documentsFor: (count: number) =>
    count === 1 ? "1 document to produce" : `${count} documents to produce`,
  offeringCategory: "Service",
  reviewProfile: "Agency profile",
  reviewServices: "Services",
  reviewDocuments: "Documents",
  reviewNothing: "Not filled in yet",
  submitBlockedTitle: "We still need these",
  networkRetry: "Please try again shortly.",
} as const;

/** Small, deliberately short lists — agencies price per job, day or head. */
export const currencyOptions = [
  "USD",
  "EUR",
  "GBP",
  "NGN",
  "AED",
  "ZAR",
  "KES",
  "GHS",
] as const;

export const unitOptions = [
  "hour",
  "day",
  "job",
  "person",
  "person per day",
  "week",
] as const;
