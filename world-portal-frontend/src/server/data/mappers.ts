import type {
  BackendPassportApplication,
  BackendProfile,
  BackendVisaApplication,
} from "@/server/data/backend-types";
import { toAmount } from "@/server/data/backend-types";
import type {
  ApplicationEvent,
  Customer,
  PassportApplication,
  SubmittedDocument,
  TeamMember,
  VisaApplication,
} from "@/types";

const fullName = (first: string, last: string) => `${first} ${last}`.trim();

/**
 * The API stores no review history, so the timeline is reconstructed from the
 * stamps it does keep. It is therefore a summary, not an audit trail — say so
 * rather than implying events we never recorded.
 */
function visaTimeline(record: BackendVisaApplication): ApplicationEvent[] {
  const events: ApplicationEvent[] = [{ status: "SUBMITTED", at: record.createdAt }];

  if (record.evaluatedAt) {
    events.push({
      status: "EVALUATED",
      at: record.evaluatedAt,
      note: record.evaluatedBy ? `Cost evaluated by ${record.evaluatedBy}.` : undefined,
    });
  }

  if (record.status !== "SUBMITTED" && record.status !== "EVALUATED") {
    events.push({
      status: record.status,
      at: record.updatedAt,
      note:
        record.status === "REJECTED"
          ? (record.rejectionReason ?? undefined)
          : (record.verificationNotes ?? undefined),
    });
  }

  return events;
}

function extractVisaDocuments(record: BackendVisaApplication) {
  const docs: { label: string; url: string }[] = [];
  if (record.passportDataPageUrl) {
    docs.push({ label: "Passport Data Page", url: record.passportDataPageUrl });
  }
  if (record.passportPhotoWhiteBgUrl) {
    docs.push({ label: "Passport Photograph (White Bg)", url: record.passportPhotoWhiteBgUrl });
  }
  if (record.proofOfFunds6MonthsUrl) {
    docs.push({ label: "Proof of Funds (6 Months Statement)", url: record.proofOfFunds6MonthsUrl });
  }
  if (record.businessRegistrationCertUrl) {
    docs.push({ label: "Business Registration Certificate (CAC)", url: record.businessRegistrationCertUrl });
  }
  if (record.taxCertificateUrl) {
    docs.push({ label: "Tax Certificate", url: record.taxCertificateUrl });
  }
  if (record.marriageCertificateUrl) {
    docs.push({ label: "Marriage Certificate", url: record.marriageCertificateUrl });
  }
  if (Array.isArray(record.childrenBirthCertUrls)) {
    record.childrenBirthCertUrls.forEach((url, i) => {
      if (url) docs.push({ label: `Child Birth Certificate ${i + 1}`, url });
    });
  }
  if (Array.isArray(record.landedPropertyDocUrls)) {
    record.landedPropertyDocUrls.forEach((url, i) => {
      if (url) docs.push({ label: `Landed Property Document ${i + 1}`, url });
    });
  }
  if (Array.isArray(record.previousVisasScanUrls)) {
    record.previousVisasScanUrls.forEach((url, i) => {
      if (url) docs.push({ label: `Previous Visa Scan ${i + 1}`, url });
    });
  }
  if (Array.isArray(record.supportingDocUrls)) {
    record.supportingDocUrls.forEach((url, i) => {
      if (url) docs.push({ label: `Supporting Document ${i + 1}`, url });
    });
  }
  return docs;
}

export function toVisaApplication(record: BackendVisaApplication): VisaApplication {
  return {
    id: record.id,
    reference: record.applicationNo,
    applicant: {
      name: fullName(record.firstName, record.lastName),
      email: record.email,
      phone: record.phone,
    },
    destination: record.targetCountry,
    category: record.visaCategory,
    status: record.status,
    paymentStatus: record.paymentStatus,
    totalAmount: toAmount(record.totalAmount),
    currency: record.currency || "USD",
    amountPaid: toAmount(record.amountPaid),
    balanceDue: toAmount(record.balanceDue),
    allowInstallment: record.allowInstallment,
    travelDate: record.intendedArrivalDate,
    returnDate: record.intendedDepartureDate,
    purpose: record.purposeOfVisit,
    nationality: record.nationality,
    passportNumber: record.passportNumber,
    verificationNotes: record.verificationNotes,
    rejectionReason: record.rejectionReason,
    reviewedBy: record.reviewedBy,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    timeline: visaTimeline(record),
    documents: extractVisaDocuments(record),
  };
}


function extractPassportDocuments(record: BackendPassportApplication): SubmittedDocument[] {
  const docs: SubmittedDocument[] = [];
  if (record.passportPhotoUrl) {
    docs.push({ label: "Passport Photograph (White BG)", url: record.passportPhotoUrl });
  }
  if (record.ninDocumentUrl) {
    docs.push({ label: "NIN Slip / Document", url: record.ninDocumentUrl });
  }
  if (record.birthCertificateUrl) {
    docs.push({ label: "Birth Certificate / Age Declaration", url: record.birthCertificateUrl });
  }
  return docs;
}

function passportTimeline(record: BackendPassportApplication): ApplicationEvent[] {
  const events: ApplicationEvent[] = [
    { status: "SUBMITTED", at: record.createdAt },
  ];
  if (record.evaluatedAt) {
    events.push({
      status: "EVALUATED",
      at: record.evaluatedAt,
      note: `Processing fee set to ${record.currency || "USD"} ${record.totalAmount}`,
    });
  }
  if (record.status === "UNDER_REVIEW" || record.status === "APPROVED" || record.status === "REJECTED") {
    events.push({
      status: record.status,
      at: record.updatedAt,
      note: record.verificationNotes ?? record.rejectionReason ?? undefined,
    });
  }
  return events;
}

export function toPassportApplication(
  record: BackendPassportApplication,
): PassportApplication {
  return {
    id: record.id,
    reference: record.applicationNo,
    applicant: {
      name: fullName(record.firstName, record.surname),
      email: record.email,
      phone: record.contactPhone,
    },
    category: record.passportCategory,
    sex: record.sex,
    ninNumber: record.ninNumber,
    dateOfBirth: record.dateOfBirth,
    placeOfBirth: record.placeOfBirth,
    existingPassportNumber: record.existingPassportNumber,
    homeTown: record.homeTown,
    stateOfOrigin: record.stateOfOrigin,
    permanentAddress: record.permanentAddress,
    occupation: record.occupation,
    maritalStatus: record.maritalStatus,
    colourOfEyes: record.colourOfEyes,
    colourOfHair: record.colourOfHair,
    height: record.height,
    maidenName: record.maidenName,
    nextOfKin: {
      name: record.nextOfKinName,
      phone: record.nextOfKinPhone,
      relationship: record.nextOfKinRelationship,
      address: record.nextOfKinAddress,
    },
    validity: record.validity,
    bookletType: record.bookletType,
    paymentStatus: record.paymentStatus || "PENDING_EVALUATION",
    totalAmount: toAmount(record.totalAmount),
    currency: record.currency || "USD",
    amountPaid: toAmount(record.amountPaid),
    balanceDue: toAmount(record.balanceDue),
    allowInstallment: Boolean(record.allowInstallment),
    evaluatedBy: record.evaluatedBy,
    evaluatedAt: record.evaluatedAt,
    status: record.status,
    verificationNotes: record.verificationNotes,
    rejectionReason: record.rejectionReason,
    reviewedBy: record.reviewedBy,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    timeline: passportTimeline(record),
    documents: extractPassportDocuments(record),
  };
}

export function toTeamMember(profile: BackendProfile): TeamMember {
  return {
    id: profile.id,
    name: fullName(profile.firstName, profile.lastName) || profile.email,
    email: profile.email,
    phone: profile.phone,
    role: profile.role,
    isActive: profile.isActive,
    createdAt: profile.createdAt,
  };
}

/**
 * The API has no customer table — applicants are stored on each application.
 * Group them by email so the console can show who it is actually serving.
 */
export function toCustomers(
  visas: VisaApplication[],
  passports: PassportApplication[],
): Customer[] {
  const byEmail = new Map<string, Customer>();

  const upsert = (
    email: string,
    name: string,
    phone: string | undefined,
    country: string | undefined,
    at: string,
    spend: number,
  ) => {
    const key = email.toLowerCase();
    const existing = byEmail.get(key);
    if (existing) {
      existing.applications += 1;
      existing.lifetimeValue += spend;
      if (at > existing.lastActiveAt) existing.lastActiveAt = at;
      if (at < existing.createdAt) existing.createdAt = at;
      existing.phone ??= phone;
      existing.country ||= country ?? "";
      return;
    }
    byEmail.set(key, {
      id: key,
      name,
      email,
      phone,
      country: country ?? "",
      applications: 1,
      lifetimeValue: spend,
      currency: "USD",
      createdAt: at,
      lastActiveAt: at,
    });
  };

  for (const visa of visas) {
    upsert(
      visa.applicant.email,
      visa.applicant.name,
      visa.applicant.phone,
      visa.nationality,
      visa.createdAt,
      visa.amountPaid,
    );
  }
  for (const passport of passports) {
    upsert(
      passport.applicant.email,
      passport.applicant.name,
      passport.applicant.phone,
      passport.stateOfOrigin,
      passport.createdAt,
      0,
    );
  }

  return [...byEmail.values()].sort((a, b) =>
    b.lastActiveAt.localeCompare(a.lastActiveAt),
  );
}
