import type { VividFieldSpec, VividStepSpec } from "@/features/vivid/form-bridge";
import {
  bookletTypeLabels,
  type PassportApplicationType,
  passportApplicationTypes,
  type PassportEnquiryInput,
  passportTypeLabels,
  validityLabels,
} from "@/validations/passport";

const choice = (labels: Record<string, string>) =>
  Object.entries(labels).map(([value, label]) => ({ value, label }));
const same = (values: readonly string[]) => values.map((v) => ({ value: v, label: v }));

/**
 * What each step's Continue button validates. Shared by the wizard and by
 * Vivid's form bridge so the two can never disagree about a step being done.
 */
export function passportStepValidation(
  step: number,
  applicationType: PassportApplicationType | undefined,
): (keyof PassportEnquiryInput)[] {
  if (step === 0) {
    return applicationType !== "new"
      ? ["applicationType", "validity", "bookletType", "existingPassportNumber"]
      : ["applicationType", "validity", "bookletType"];
  }
  if (step === 1) {
    return [
      "surname",
      "firstName",
      "sex",
      "ninNumber",
      "dateOfBirth",
      "placeOfBirth",
      "stateOfOrigin",
      "homeTown",
      "nationality",
      "permanentAddress",
      "occupation",
      "contactPhone",
      "email",
      "maritalStatus",
    ];
  }
  if (step === 2) {
    return [
      "nextOfKinName",
      "nextOfKinRelationship",
      "nextOfKinPhone",
      "nextOfKinAddress",
    ];
  }
  return [];
}

/** The four steps as the applicant sees them, with every field on each. */
export const passportVividSteps: readonly VividStepSpec[] = [
  {
    title: "Category & Booklet",
    fields: ["applicationType", "existingPassportNumber", "validity", "bookletType"],
  },
  {
    title: "Personal Details",
    fields: [
      "surname",
      "firstName",
      "middleName",
      "sex",
      "ninNumber",
      "dateOfBirth",
      "placeOfBirth",
      "stateOfOrigin",
      "homeTown",
      "nationality",
      "occupation",
      "contactPhone",
      "email",
      "permanentAddress",
      "maritalStatus",
      "colourOfEyes",
      "colourOfHair",
      "height",
      "maidenName",
    ],
  },
  {
    title: "Next of Kin",
    fields: [
      "nextOfKinName",
      "nextOfKinRelationship",
      "nextOfKinPhone",
      "nextOfKinAddress",
    ],
  },
  {
    title: "Documents & Review",
    fields: ["passportPhotoUrl", "ninDocumentUrl", "birthCertificateUrl", "notes"],
  },
];

/** How Vivid sees the passport application's fields. */
export const passportVividFields: readonly VividFieldSpec[] = [
  {
    name: "applicationType",
    label: "Application type",
    kind: "choice",
    required: true,
    options: passportApplicationTypes.map((t) => ({
      value: t,
      label: passportTypeLabels[t],
    })),
  },
  {
    name: "existingPassportNumber",
    label: "Existing passport number",
    kind: "text",
    sensitive: true,
    hint: "Required for a renewal or a lost/damaged replacement.",
  },
  {
    name: "validity",
    label: "Validity",
    kind: "choice",
    required: true,
    options: choice(validityLabels),
  },
  {
    name: "bookletType",
    label: "Booklet",
    kind: "choice",
    required: true,
    options: choice(bookletTypeLabels),
  },
  { name: "surname", label: "Surname", kind: "text", required: true },
  { name: "firstName", label: "First name", kind: "text", required: true },
  { name: "middleName", label: "Middle name", kind: "text" },
  {
    name: "sex",
    label: "Sex",
    kind: "choice",
    required: true,
    options: [
      { value: "MALE", label: "Male" },
      { value: "FEMALE", label: "Female" },
    ],
  },
  {
    name: "ninNumber",
    label: "NIN",
    kind: "text",
    required: true,
    sensitive: true,
    hint: "National Identification Number — exactly 11 digits.",
  },
  { name: "dateOfBirth", label: "Date of birth", kind: "date", required: true },
  { name: "placeOfBirth", label: "Place of birth", kind: "text", required: true },
  { name: "stateOfOrigin", label: "State of origin", kind: "text", required: true },
  { name: "homeTown", label: "Home town", kind: "text", required: true },
  { name: "nationality", label: "Nationality", kind: "nationality", required: true },
  { name: "occupation", label: "Occupation", kind: "text", required: true },
  { name: "contactPhone", label: "Phone", kind: "phone", required: true },
  {
    name: "email",
    label: "Email address",
    kind: "text",
    required: true,
    readOnly:
      "Comes from the applicant's WorldStreet account and cannot be changed here.",
  },
  {
    name: "permanentAddress",
    label: "Permanent address",
    kind: "longtext",
    required: true,
  },
  {
    name: "maritalStatus",
    label: "Marital status",
    kind: "choice",
    required: true,
    options: same(["Single", "Married", "Divorced", "Widowed"]),
  },
  { name: "colourOfEyes", label: "Eye colour", kind: "text" },
  { name: "colourOfHair", label: "Hair colour", kind: "text" },
  { name: "height", label: "Height", kind: "text" },
  { name: "maidenName", label: "Maiden name", kind: "text" },
  { name: "nextOfKinName", label: "Next of kin — name", kind: "text", required: true },
  {
    name: "nextOfKinRelationship",
    label: "Next of kin — relationship",
    kind: "choice",
    required: true,
    options: [
      ...same(["Spouse", "Parent", "Sibling", "Child"]),
      { value: "Guardian", label: "Guardian / Other" },
    ],
  },
  {
    name: "nextOfKinPhone",
    label: "Next of kin — phone",
    kind: "phone",
    required: true,
  },
  {
    name: "nextOfKinAddress",
    label: "Next of kin — address",
    kind: "longtext",
    required: true,
  },
  {
    name: "passportPhotoUrl",
    label: "Passport photograph",
    kind: "document",
    required: true,
  },
  { name: "ninDocumentUrl", label: "NIN slip", kind: "document", required: true },
  { name: "birthCertificateUrl", label: "Birth certificate", kind: "document" },
  { name: "notes", label: "Notes", kind: "longtext" },
];
