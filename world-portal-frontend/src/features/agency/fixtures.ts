import { documentsForCategories } from "@/features/agency/catalog";
import type {
  Agency,
  AgencyAssignment,
  AgencyCategory,
  AgencyDocument,
  AgencyDocumentKind,
  AgencyPayout,
  AgencyServiceOffering,
  AgencyStaff,
  AgencyUser,
} from "@/features/agency/types";

/**
 * Seed data for the agency side of the platform.
 *
 * **None of this is a real business.** Every agency below is invented for
 * design: the trading names, the legal names, the registration numbers, the
 * addresses, the staff, the travellers, the jobs and the money are all made
 * up, exactly like the portraits in `public/images/pros` and the posts in
 * `src/features/worldspace/fixtures.ts` — and under the same standing rule. No
 * real company's registration number and no real person's name, phone number
 * or licence appears here, and none should be added. When real agencies sign
 * up they arrive through `src/server/agency/store.ts` from a real service;
 * this file is deleted, not edited.
 *
 * Two `photoUrl`s point at stock portraits already shipped in this repo, and
 * only at the file already cast for that same name in
 * `src/content/professionals.ts` — so no new face is attached to a new
 * invented person. Everything else is `null`, which is a supported state: the
 * UI falls back to a monogram, and that path has to be exercised on the real
 * page and not only in a test.
 *
 * ## Arithmetic
 *
 * Fees and payout totals are **computed here, never typed**:
 * `platformFee = round(gross * commissionRate)`, `netToAgency = gross -
 * platformFee`, and a payout's `gross`/`platformFee`/`net` are the sums over
 * the assignments it batches. A unit test asserts all three, so add a job by
 * giving it a `gross` and letting `buildAssignments()` do the rest.
 *
 * Every `gross` is a whole multiple of 100 in its own currency. That is
 * deliberate: at the commission rates used here the fee then lands on an exact
 * unit, so the figures read cleanly and no assertion can trip over a binary
 * floating-point tail. Keep it that way.
 *
 * "Today" for these fixtures is 2026-09-11: some jobs are upcoming, some are
 * past, and one document expires inside thirty days so the "expiring soon"
 * case has data behind it.
 */

/** Money is rounded to the minor unit, not left on a float tail. */
function roundMoney(amount: number) {
  return Math.round(amount * 100) / 100;
}

/** The platform's cut of a job. The one definition; nothing hand-types a fee. */
export function platformFeeFor(gross: number, commissionRate: number) {
  return roundMoney(gross * commissionRate);
}

type DocumentSeed = Omit<AgencyDocument, "kind">;

/**
 * Builds the checklist from the categories the agency picked, so a fixture can
 * never carry paperwork its services do not ask for — or miss paperwork they
 * do. Anything not named in `seeds` is `missing`.
 */
function documentsFor(
  categories: readonly AgencyCategory[],
  seeds: Partial<Record<AgencyDocumentKind, DocumentSeed>>,
): AgencyDocument[] {
  return documentsForCategories(categories).map((kind) => ({
    kind,
    ...(seeds[kind] ?? { status: "missing" as const }),
  }));
}

type OfferingSeed = Omit<AgencyServiceOffering, "currency">;

function buildOfferings(
  currency: string,
  seeds: OfferingSeed[],
): AgencyServiceOffering[] {
  return seeds.map((seed) => ({ ...seed, currency }));
}

type StaffSeed = Omit<AgencyStaff, "agencyId">;

function buildStaff(agencyId: string, seeds: StaffSeed[]): AgencyStaff[] {
  return seeds.map((seed) => ({ ...seed, agencyId }));
}

type AssignmentSeed = Omit<
  AgencyAssignment,
  "agencyId" | "currency" | "platformFee" | "netToAgency"
>;

function buildAssignments(
  agencyId: string,
  currency: string,
  commissionRate: number,
  seeds: AssignmentSeed[],
): AgencyAssignment[] {
  return seeds.map((seed) => {
    const platformFee = platformFeeFor(seed.gross, commissionRate);
    return {
      ...seed,
      agencyId,
      currency,
      platformFee,
      netToAgency: roundMoney(seed.gross - platformFee),
    };
  });
}

type PayoutSeed = Omit<
  AgencyPayout,
  "agencyId" | "currency" | "gross" | "platformFee" | "net"
>;

function buildPayouts(
  agencyId: string,
  currency: string,
  assignments: AgencyAssignment[],
  seeds: PayoutSeed[],
): AgencyPayout[] {
  return seeds.map((seed) => {
    const batch = seed.assignmentIds.map((id) => {
      const found = assignments.find((assignment) => assignment.id === id);
      // Loud on purpose: a payout that batches a job nobody can find is a
      // fixture bug, and the totals below would silently be wrong.
      if (!found) {
        throw new Error(`Payout ${seed.id} batches unknown assignment ${id}`);
      }
      return found;
    });
    const gross = roundMoney(batch.reduce((sum, item) => sum + item.gross, 0));
    const platformFee = roundMoney(
      batch.reduce((sum, item) => sum + item.platformFee, 0),
    );
    return {
      ...seed,
      agencyId,
      currency,
      gross,
      platformFee,
      net: roundMoney(gross - platformFee),
    };
  });
}

/* ---------------------------------------------------------------------------
 * 1. Sentinel Ridge — Nigeria. Security and driving, live and verified.
 * ------------------------------------------------------------------------- */

const SENTINEL_ID = "ag-sentinel-ridge";
const SENTINEL_CATEGORIES: AgencyCategory[] = ["security", "driving"];
const SENTINEL_RATE = 0.15;

const sentinel: Agency = {
  id: SENTINEL_ID,
  slug: "sentinel-ridge",
  name: "Sentinel Ridge",
  legalName: "Sentinel Ridge Protective Services Limited",
  registrationNumber: "RC-1489204",
  countryCode: "NG",
  country: "Nigeria",
  cities: ["Lagos", "Abuja", "Port Harcourt"],
  categories: SENTINEL_CATEGORIES,
  summary:
    "Close protection and vetted drivers across Nigeria's three business cities.",
  about:
    "Sentinel Ridge staffs close protection, residence guarding and executive transport for visitors who would rather not improvise on the ground. Officers are licensed, re-trained yearly and paired with a control room that stays on the phone for the length of the job.",
  logoUrl: null,
  email: "bookings@sentinelridge.example",
  phone: "+234 1 271 4408",
  website: "https://sentinelridge.example",
  yearFounded: 2012,
  staffCount: 46,
  languages: ["English", "Yoruba", "Igbo", "Hausa"],
  verification: "verified",
  listingStatus: "live",
  documents: documentsFor(SENTINEL_CATEGORIES, {
    business_registration: {
      status: "approved",
      fileName: "cac-certificate.pdf",
      fileUrl:
        "https://files.e-embassy.example/agency/sentinel-ridge/cac-certificate.pdf",
      uploadedAt: "2026-03-04T09:12:00.000Z",
    },
    tax_certificate: {
      status: "approved",
      fileName: "firs-tin.pdf",
      fileUrl: "https://files.e-embassy.example/agency/sentinel-ridge/firs-tin.pdf",
      uploadedAt: "2026-03-04T09:14:00.000Z",
      expiresAt: "2027-03-31T00:00:00.000Z",
    },
    proof_of_address: {
      status: "approved",
      fileName: "ikoyi-office-lease.pdf",
      fileUrl:
        "https://files.e-embassy.example/agency/sentinel-ridge/ikoyi-office-lease.pdf",
      uploadedAt: "2026-03-04T09:16:00.000Z",
      expiresAt: "2027-01-31T00:00:00.000Z",
    },
    owner_id: {
      status: "approved",
      fileName: "director-passport.jpg",
      fileUrl:
        "https://files.e-embassy.example/agency/sentinel-ridge/director-passport.jpg",
      uploadedAt: "2026-03-04T09:18:00.000Z",
      expiresAt: "2029-06-14T00:00:00.000Z",
    },
    liability_insurance: {
      status: "approved",
      fileName: "public-liability-2026.pdf",
      fileUrl:
        "https://files.e-embassy.example/agency/sentinel-ridge/public-liability-2026.pdf",
      uploadedAt: "2026-03-05T11:02:00.000Z",
      expiresAt: "2027-03-01T00:00:00.000Z",
    },
    security_operating_licence: {
      status: "approved",
      fileName: "nscdc-operating-licence.pdf",
      fileUrl:
        "https://files.e-embassy.example/agency/sentinel-ridge/nscdc-operating-licence.pdf",
      uploadedAt: "2026-03-05T11:06:00.000Z",
      expiresAt: "2027-02-28T00:00:00.000Z",
    },
    // The expiring-soon case: twenty-one days out from 2026-09-11.
    guard_training_certificates: {
      status: "approved",
      fileName: "guard-training-cohort-14.pdf",
      fileUrl:
        "https://files.e-embassy.example/agency/sentinel-ridge/guard-training-cohort-14.pdf",
      uploadedAt: "2025-10-02T08:40:00.000Z",
      expiresAt: "2026-10-02T00:00:00.000Z",
    },
    fleet_insurance: {
      status: "approved",
      fileName: "fleet-cover-2026.pdf",
      fileUrl:
        "https://files.e-embassy.example/agency/sentinel-ridge/fleet-cover-2026.pdf",
      uploadedAt: "2026-03-06T14:22:00.000Z",
      expiresAt: "2027-03-06T00:00:00.000Z",
    },
    vehicle_registration: {
      status: "approved",
      fileName: "fleet-registrations.pdf",
      fileUrl:
        "https://files.e-embassy.example/agency/sentinel-ridge/fleet-registrations.pdf",
      uploadedAt: "2026-03-06T14:25:00.000Z",
      expiresAt: "2027-05-30T00:00:00.000Z",
    },
    driver_licences: {
      status: "in_review",
      fileName: "driver-licences-q3.pdf",
      fileUrl:
        "https://files.e-embassy.example/agency/sentinel-ridge/driver-licences-q3.pdf",
      uploadedAt: "2026-09-08T16:31:00.000Z",
      expiresAt: "2028-04-19T00:00:00.000Z",
    },
  }),
  offerings: buildOfferings("NGN", [
    {
      id: "off-sr-close-protection",
      category: "security",
      title: "Close protection officer",
      description:
        "A licensed officer with you from arrival to departure, including venue recces and the drive between them.",
      price: 185000,
      unit: "officer per day",
      leadTimeHours: 48,
      capacity: 12,
    },
    {
      id: "off-sr-residence",
      category: "security",
      title: "Residence guarding",
      description:
        "Static cover on a house, short let or serviced flat, in twelve-hour shifts with a supervisor on call.",
      price: 92000,
      unit: "guard per shift",
      leadTimeHours: 24,
      capacity: 20,
    },
    {
      id: "off-sr-airport",
      category: "driving",
      title: "Airport transfer, executive saloon",
      description:
        "Meet and greet inside the terminal, a vetted driver, and a fixed price whatever the traffic does.",
      price: 78000,
      unit: "transfer",
      leadTimeHours: 12,
      capacity: 8,
    },
    {
      id: "off-sr-convoy",
      category: "security",
      title: "Convoy and route escort",
      description:
        "Multi-vehicle movement between cities, planned against a current route assessment. Priced per movement.",
      price: null,
      unit: "movement",
      leadTimeHours: 72,
      capacity: 6,
    },
  ]),
  rating: 4.8,
  completedJobs: 412,
  createdAt: "2026-03-04T08:55:00.000Z",
  commissionRate: SENTINEL_RATE,
};

const sentinelStaff = buildStaff(SENTINEL_ID, [
  {
    id: "stf-sr-emeka",
    name: "Emeka Okonkwo",
    role: "Close protection officer",
    category: "security",
    photoUrl: null,
    phone: "+234 803 118 2240",
    languages: ["English", "Igbo"],
    experienceYears: 11,
    status: "assigned",
    backgroundChecked: true,
    rating: 4.9,
  },
  {
    id: "stf-sr-fatima",
    name: "Fatima Bello",
    role: "Close protection officer",
    category: "security",
    photoUrl: null,
    phone: "+234 805 447 9013",
    languages: ["English", "Hausa", "French"],
    experienceYears: 7,
    status: "assigned",
    backgroundChecked: true,
    rating: 4.8,
  },
  {
    id: "stf-sr-tunde",
    name: "Tunde Alabi",
    role: "Executive driver",
    category: "driving",
    photoUrl: null,
    phone: "+234 802 660 7781",
    languages: ["English", "Yoruba"],
    experienceYears: 14,
    status: "assigned",
    backgroundChecked: true,
    rating: 4.9,
  },
  {
    id: "stf-sr-chiamaka",
    name: "Chiamaka Nwosu",
    role: "Control room supervisor",
    category: "security",
    photoUrl: null,
    phone: "+234 806 229 3357",
    languages: ["English", "Igbo"],
    experienceYears: 9,
    status: "available",
    backgroundChecked: true,
    rating: 4.7,
  },
  {
    id: "stf-sr-ibrahim",
    name: "Ibrahim Sule",
    role: "Residence guard",
    category: "security",
    photoUrl: null,
    phone: "+234 809 512 6602",
    languages: ["English", "Hausa"],
    experienceYears: 6,
    status: "assigned",
    backgroundChecked: true,
    rating: 4.6,
  },
  {
    id: "stf-sr-grace",
    name: "Grace Adeyemi",
    role: "Executive driver",
    category: "driving",
    photoUrl: null,
    phone: "+234 807 340 1198",
    languages: ["English", "Yoruba"],
    experienceYears: 8,
    status: "off_duty",
    backgroundChecked: true,
    rating: 4.8,
  },
  {
    id: "stf-sr-musa",
    name: "Musa Danjuma",
    role: "Residence guard",
    category: "security",
    photoUrl: null,
    phone: "+234 810 778 4425",
    languages: ["English", "Hausa"],
    experienceYears: 4,
    status: "assigned",
    backgroundChecked: true,
    rating: 4.5,
  },
  {
    id: "stf-sr-kelechi",
    name: "Kelechi Obi",
    role: "Convoy lead",
    category: "security",
    photoUrl: null,
    phone: "+234 811 205 9964",
    languages: ["English", "Igbo"],
    experienceYears: 12,
    status: "inactive",
    backgroundChecked: true,
    rating: 4.4,
  },
]);

const sentinelAssignments = buildAssignments(SENTINEL_ID, "NGN", SENTINEL_RATE, [
  {
    id: "asg-sr-1001",
    reference: "WPA-SR-1001",
    category: "security",
    offeringId: "off-sr-close-protection",
    offeringTitle: "Close protection officer",
    traveller: {
      name: "Hélène Mercier",
      email: "helene.mercier@example.com",
      phone: "+33 6 12 88 40 21",
      partySize: 2,
    },
    destination: { city: "Lagos", country: "Nigeria", countryCode: "NG" },
    startsAt: "2026-09-24T07:00:00.000Z",
    endsAt: "2026-09-26T19:00:00.000Z",
    status: "requested",
    assignedStaffIds: [],
    staffRequired: 2,
    notes:
      "Two site visits on Victoria Island on the middle day. Discreet, no visible kit.",
    gross: 370000,
    createdAt: "2026-09-09T10:22:00.000Z",
  },
  {
    id: "asg-sr-1002",
    reference: "WPA-SR-1002",
    category: "driving",
    offeringId: "off-sr-airport",
    offeringTitle: "Airport transfer, executive saloon",
    traveller: {
      name: "Daniel Whitfield",
      email: "d.whitfield@example.com",
      phone: "+44 7700 900412",
      partySize: 1,
    },
    destination: { city: "Abuja", country: "Nigeria", countryCode: "NG" },
    startsAt: "2026-09-18T21:40:00.000Z",
    endsAt: "2026-09-18T23:10:00.000Z",
    status: "requested",
    assignedStaffIds: [],
    staffRequired: 1,
    notes: null,
    gross: 78000,
    createdAt: "2026-09-10T15:04:00.000Z",
  },
  {
    id: "asg-sr-1003",
    reference: "WPA-SR-1003",
    category: "security",
    offeringId: "off-sr-residence",
    offeringTitle: "Residence guarding",
    traveller: {
      name: "Priya Nair",
      email: "priya.nair@example.com",
      phone: "+91 98200 44119",
      partySize: 4,
    },
    destination: { city: "Lagos", country: "Nigeria", countryCode: "NG" },
    startsAt: "2026-10-02T18:00:00.000Z",
    endsAt: "2026-10-09T06:00:00.000Z",
    status: "requested",
    assignedStaffIds: [],
    staffRequired: 3,
    notes: "Short let in Ikoyi. Family of four, two young children.",
    gross: 552000,
    createdAt: "2026-09-07T08:48:00.000Z",
  },
  {
    id: "asg-sr-1004",
    reference: "WPA-SR-1004",
    category: "security",
    offeringId: "off-sr-close-protection",
    offeringTitle: "Close protection officer",
    traveller: {
      name: "Marcus Oyelaran",
      email: "m.oyelaran@example.com",
      phone: "+1 415 555 0182",
      partySize: 1,
    },
    destination: { city: "Lagos", country: "Nigeria", countryCode: "NG" },
    startsAt: "2026-09-15T06:30:00.000Z",
    endsAt: "2026-09-17T20:00:00.000Z",
    status: "assigned",
    assignedStaffIds: ["stf-sr-emeka", "stf-sr-fatima"],
    staffRequired: 2,
    notes: "Conference at Eko Hotel, then a day in Lekki.",
    gross: 370000,
    createdAt: "2026-08-30T12:15:00.000Z",
  },
  {
    id: "asg-sr-1005",
    reference: "WPA-SR-1005",
    category: "driving",
    offeringId: "off-sr-airport",
    offeringTitle: "Airport transfer, executive saloon",
    traveller: {
      name: "Ana Sofía Ruiz",
      email: "ana.ruiz@example.com",
      phone: "+34 612 44 90 17",
      partySize: 2,
    },
    destination: { city: "Port Harcourt", country: "Nigeria", countryCode: "NG" },
    startsAt: "2026-09-13T14:20:00.000Z",
    endsAt: "2026-09-13T15:35:00.000Z",
    status: "assigned",
    assignedStaffIds: ["stf-sr-tunde"],
    staffRequired: 1,
    notes: null,
    gross: 78000,
    createdAt: "2026-09-02T09:00:00.000Z",
  },
  {
    id: "asg-sr-1006",
    reference: "WPA-SR-1006",
    category: "security",
    offeringId: "off-sr-residence",
    offeringTitle: "Residence guarding",
    traveller: {
      name: "Lars Bergqvist",
      email: "lars.bergqvist@example.com",
      phone: "+46 70 555 8823",
      partySize: 3,
    },
    destination: { city: "Abuja", country: "Nigeria", countryCode: "NG" },
    startsAt: "2026-09-10T18:00:00.000Z",
    endsAt: "2026-09-14T06:00:00.000Z",
    status: "in_progress",
    assignedStaffIds: ["stf-sr-ibrahim", "stf-sr-musa"],
    staffRequired: 2,
    notes: "Guest house in Maitama. Night cover only.",
    gross: 368000,
    createdAt: "2026-08-27T17:41:00.000Z",
  },
  {
    id: "asg-sr-1007",
    reference: "WPA-SR-1007",
    category: "security",
    offeringId: "off-sr-close-protection",
    offeringTitle: "Close protection officer",
    traveller: {
      name: "Ingrid Halvorsen",
      email: "ingrid.h@example.com",
      phone: "+47 400 55 218",
      partySize: 2,
    },
    destination: { city: "Lagos", country: "Nigeria", countryCode: "NG" },
    startsAt: "2026-09-02T07:00:00.000Z",
    endsAt: "2026-09-04T18:00:00.000Z",
    status: "completed",
    assignedStaffIds: ["stf-sr-emeka", "stf-sr-fatima"],
    staffRequired: 2,
    notes: null,
    gross: 370000,
    createdAt: "2026-08-14T11:30:00.000Z",
  },
  {
    id: "asg-sr-1008",
    reference: "WPA-SR-1008",
    category: "driving",
    offeringId: "off-sr-airport",
    offeringTitle: "Airport transfer, executive saloon",
    traveller: {
      name: "Kofi Mensah",
      email: "kofi.mensah@example.com",
      phone: "+233 24 555 7710",
      partySize: 1,
    },
    destination: { city: "Lagos", country: "Nigeria", countryCode: "NG" },
    startsAt: "2026-09-05T05:15:00.000Z",
    endsAt: "2026-09-05T06:30:00.000Z",
    status: "completed",
    assignedStaffIds: ["stf-sr-tunde"],
    staffRequired: 1,
    notes: null,
    gross: 78000,
    createdAt: "2026-08-28T13:12:00.000Z",
  },
  {
    id: "asg-sr-1009",
    reference: "WPA-SR-1009",
    category: "security",
    offeringId: "off-sr-residence",
    offeringTitle: "Residence guarding",
    traveller: {
      name: "Rebecca Adeniyi",
      email: "r.adeniyi@example.com",
      phone: "+1 646 555 0139",
      partySize: 5,
    },
    destination: { city: "Lagos", country: "Nigeria", countryCode: "NG" },
    startsAt: "2026-08-18T18:00:00.000Z",
    endsAt: "2026-08-25T06:00:00.000Z",
    status: "completed",
    assignedStaffIds: ["stf-sr-ibrahim", "stf-sr-musa", "stf-sr-chiamaka"],
    staffRequired: 3,
    notes: "Family reunion, house in Ikeja GRA.",
    gross: 644000,
    createdAt: "2026-07-30T10:05:00.000Z",
  },
  {
    id: "asg-sr-1010",
    reference: "WPA-SR-1010",
    category: "security",
    offeringId: "off-sr-convoy",
    offeringTitle: "Convoy and route escort",
    traveller: {
      name: "Tomás Ferreira",
      email: "tomas.ferreira@example.com",
      phone: "+351 912 555 044",
      partySize: 6,
    },
    destination: { city: "Port Harcourt", country: "Nigeria", countryCode: "NG" },
    startsAt: "2026-08-28T05:00:00.000Z",
    endsAt: "2026-08-28T21:00:00.000Z",
    status: "cancelled",
    assignedStaffIds: [],
    staffRequired: 4,
    notes: "Traveller's onward flight was rebooked; movement stood down.",
    gross: 480000,
    createdAt: "2026-08-11T16:20:00.000Z",
  },
  {
    id: "asg-sr-1011",
    reference: "WPA-SR-1011",
    category: "driving",
    offeringId: "off-sr-airport",
    offeringTitle: "Airport transfer, executive saloon",
    traveller: {
      name: "Yuki Tanaka",
      email: "yuki.tanaka@example.com",
      phone: "+81 90 5555 2201",
      partySize: 2,
    },
    destination: { city: "Abuja", country: "Nigeria", countryCode: "NG" },
    startsAt: "2026-08-12T19:00:00.000Z",
    endsAt: "2026-08-12T20:05:00.000Z",
    status: "completed",
    assignedStaffIds: ["stf-sr-grace"],
    staffRequired: 1,
    notes: null,
    gross: 78000,
    createdAt: "2026-08-01T07:55:00.000Z",
  },
  {
    id: "asg-sr-1012",
    reference: "WPA-SR-1012",
    category: "security",
    offeringId: "off-sr-convoy",
    offeringTitle: "Convoy and route escort",
    traveller: {
      name: "Claudia Weiss",
      email: "claudia.weiss@example.com",
      phone: "+49 151 5550 3382",
      partySize: 8,
    },
    destination: { city: "Lagos", country: "Nigeria", countryCode: "NG" },
    startsAt: "2026-07-29T05:00:00.000Z",
    endsAt: "2026-07-31T20:00:00.000Z",
    status: "completed",
    assignedStaffIds: [
      "stf-sr-kelechi",
      "stf-sr-emeka",
      "stf-sr-tunde",
      "stf-sr-grace",
    ],
    staffRequired: 4,
    notes: "Lagos to Ibadan and back, survey team and equipment.",
    gross: 960000,
    createdAt: "2026-07-08T09:33:00.000Z",
  },
]);

const sentinelPayouts = buildPayouts(SENTINEL_ID, "NGN", sentinelAssignments, [
  {
    id: "pay-sr-1",
    reference: "WPP-SR-0731",
    periodStart: "2026-07-01T00:00:00.000Z",
    periodEnd: "2026-07-31T23:59:59.000Z",
    assignmentIds: ["asg-sr-1012"],
    status: "paid",
    paidAt: "2026-08-04T10:02:00.000Z",
    destinationAccount: "GTBank ••••4471",
  },
  {
    id: "pay-sr-2",
    reference: "WPP-SR-0831",
    periodStart: "2026-08-01T00:00:00.000Z",
    periodEnd: "2026-08-31T23:59:59.000Z",
    assignmentIds: ["asg-sr-1009", "asg-sr-1011"],
    status: "on_hold",
    destinationAccount: "GTBank ••••4471",
  },
  {
    id: "pay-sr-3",
    reference: "WPP-SR-0907",
    periodStart: "2026-09-01T00:00:00.000Z",
    periodEnd: "2026-09-07T23:59:59.000Z",
    assignmentIds: ["asg-sr-1007"],
    status: "processing",
    destinationAccount: "GTBank ••••4471",
  },
  {
    id: "pay-sr-4",
    reference: "WPP-SR-0914",
    periodStart: "2026-09-08T00:00:00.000Z",
    periodEnd: "2026-09-14T23:59:59.000Z",
    assignmentIds: ["asg-sr-1008"],
    status: "pending",
    destinationAccount: "GTBank ••••4471",
  },
]);

/* ---------------------------------------------------------------------------
 * 2. Marula Table — South Africa. Catering, events and event medics.
 *
 * The reviewer has bounced this listing: the kitchen report was rejected and
 * the practitioner licence lapsed and was withdrawn, so a required document is
 * `missing` on a listing that used to be live. Its older assignments predate
 * that, which is exactly how this looks in practice.
 * ------------------------------------------------------------------------- */

const MARULA_ID = "ag-marula-table";
const MARULA_CATEGORIES: AgencyCategory[] = ["catering", "events", "medical"];
const MARULA_RATE = 0.12;

const marula: Agency = {
  id: MARULA_ID,
  slug: "marula-table",
  name: "Marula Table",
  legalName: "Marula Table Catering (Pty) Ltd",
  registrationNumber: "2019/448215/07",
  countryCode: "ZA",
  country: "South Africa",
  cities: ["Cape Town", "Stellenbosch", "Franschhoek"],
  categories: MARULA_CATEGORIES,
  summary: "Private chefs and event catering across the Cape winelands.",
  about:
    "Marula Table cooks in other people's kitchens — villas, guest farms and marquees — and runs the service, the bar and the medic when the evening is bigger than dinner. Menus are written against what the market has that week rather than a fixed card.",
  logoUrl: null,
  email: "hello@marulatable.example",
  phone: "+27 21 555 0148",
  website: "https://marulatable.example",
  yearFounded: 2019,
  staffCount: 22,
  languages: ["English", "Afrikaans", "isiXhosa"],
  verification: "pending",
  listingStatus: "rejected",
  documents: documentsFor(MARULA_CATEGORIES, {
    business_registration: {
      status: "approved",
      fileName: "cipc-registration.pdf",
      fileUrl:
        "https://files.e-embassy.example/agency/marula-table/cipc-registration.pdf",
      uploadedAt: "2026-04-18T07:40:00.000Z",
    },
    tax_certificate: {
      status: "approved",
      fileName: "sars-tax-clearance.pdf",
      fileUrl:
        "https://files.e-embassy.example/agency/marula-table/sars-tax-clearance.pdf",
      uploadedAt: "2026-04-18T07:42:00.000Z",
      expiresAt: "2027-02-28T00:00:00.000Z",
    },
    proof_of_address: {
      status: "uploaded",
      fileName: "woodstock-lease.pdf",
      fileUrl:
        "https://files.e-embassy.example/agency/marula-table/woodstock-lease.pdf",
      uploadedAt: "2026-09-06T12:18:00.000Z",
      expiresAt: "2027-08-31T00:00:00.000Z",
    },
    owner_id: {
      status: "approved",
      fileName: "director-id-card.jpg",
      fileUrl:
        "https://files.e-embassy.example/agency/marula-table/director-id-card.jpg",
      uploadedAt: "2026-04-18T07:45:00.000Z",
      expiresAt: "2031-11-02T00:00:00.000Z",
    },
    liability_insurance: {
      status: "in_review",
      fileName: "public-liability-renewal.pdf",
      fileUrl:
        "https://files.e-embassy.example/agency/marula-table/public-liability-renewal.pdf",
      uploadedAt: "2026-09-04T09:27:00.000Z",
      expiresAt: "2027-09-01T00:00:00.000Z",
    },
    food_hygiene_certificate: {
      status: "approved",
      fileName: "food-handling-certificates.pdf",
      fileUrl:
        "https://files.e-embassy.example/agency/marula-table/food-handling-certificates.pdf",
      uploadedAt: "2026-04-19T15:11:00.000Z",
      expiresAt: "2027-04-19T00:00:00.000Z",
    },
    kitchen_inspection_report: {
      status: "rejected",
      fileName: "kitchen-inspection-2024.pdf",
      fileUrl:
        "https://files.e-embassy.example/agency/marula-table/kitchen-inspection-2024.pdf",
      uploadedAt: "2026-08-21T10:03:00.000Z",
      expiresAt: "2025-09-30T00:00:00.000Z",
      note: "This report is from 2024 and has already lapsed. Please upload the current City of Cape Town inspection.",
    },
    first_aid_certificate: {
      status: "approved",
      fileName: "first-aid-level-2.pdf",
      fileUrl:
        "https://files.e-embassy.example/agency/marula-table/first-aid-level-2.pdf",
      uploadedAt: "2026-04-19T15:14:00.000Z",
      expiresAt: "2027-06-30T00:00:00.000Z",
    },
    event_public_liability: {
      status: "uploaded",
      fileName: "event-cover-500-guests.pdf",
      fileUrl:
        "https://files.e-embassy.example/agency/marula-table/event-cover-500-guests.pdf",
      uploadedAt: "2026-09-05T14:52:00.000Z",
      expiresAt: "2027-05-31T00:00:00.000Z",
    },
    // Deliberately absent: the medic's registration lapsed and was withdrawn.
  }),
  offerings: buildOfferings("ZAR", [
    {
      id: "off-mt-chef",
      category: "catering",
      title: "Private chef, dinner service",
      description:
        "Menu agreed a week out, shopping done on the day, and the kitchen left cleaner than it was found.",
      price: 4800,
      unit: "evening",
      leadTimeHours: 48,
      capacity: 6,
    },
    {
      id: "off-mt-daily",
      category: "catering",
      title: "Daily meal service for a villa",
      description:
        "Breakfast and dinner for the length of a stay, with the shopping folded into the price.",
      price: 2600,
      unit: "day",
      leadTimeHours: 72,
      capacity: 4,
    },
    {
      id: "off-mt-event",
      category: "events",
      title: "Event catering, seated",
      description:
        "Seated service from twenty to two hundred. Priced once we know the venue, the headcount and the kitchen.",
      price: null,
      unit: "event",
      leadTimeHours: 168,
      capacity: 20,
    },
    {
      id: "off-mt-coord",
      category: "events",
      title: "On-site event coordination",
      description:
        "One coordinator holding the run sheet, the suppliers and the timings for the whole day.",
      price: 7200,
      unit: "day",
      leadTimeHours: 120,
      capacity: 5,
    },
    {
      id: "off-mt-medic",
      category: "medical",
      title: "Event medic standby",
      description:
        "A registered medic on site with a full kit for the duration of the event.",
      price: 3400,
      unit: "day",
      leadTimeHours: 96,
      capacity: 3,
    },
  ]),
  rating: 4.9,
  completedJobs: 168,
  createdAt: "2026-04-18T07:30:00.000Z",
  commissionRate: MARULA_RATE,
};

const marulaStaff = buildStaff(MARULA_ID, [
  {
    id: "stf-mt-thandi",
    name: "Thandi Mokoena",
    role: "Head chef",
    category: "catering",
    // Stock portrait already cast to this name in src/content/professionals.ts.
    photoUrl: "/images/pros/thandi-mokoena.jpg",
    phone: "+27 82 555 0117",
    languages: ["English", "isiXhosa"],
    experienceYears: 15,
    status: "assigned",
    backgroundChecked: true,
    rating: 4.9,
  },
  {
    id: "stf-mt-lerato",
    name: "Lerato Khumalo",
    role: "Events coordinator",
    category: "events",
    // As above — same face, same name, no new person invented around a photo.
    photoUrl: "/images/pros/lerato-khumalo.jpg",
    phone: "+27 83 555 0204",
    languages: ["English", "Afrikaans", "isiZulu"],
    experienceYears: 9,
    status: "assigned",
    backgroundChecked: true,
    rating: 4.8,
  },
  {
    id: "stf-mt-pieter",
    name: "Pieter van Wyk",
    role: "Sous chef",
    category: "catering",
    photoUrl: null,
    phone: "+27 84 555 0339",
    languages: ["Afrikaans", "English"],
    experienceYears: 6,
    status: "assigned",
    backgroundChecked: true,
    rating: 4.6,
  },
  {
    id: "stf-mt-nomsa",
    name: "Nomsa Dlamini",
    role: "Service lead",
    category: "catering",
    photoUrl: null,
    phone: "+27 81 555 0466",
    languages: ["English", "isiZulu"],
    experienceYears: 11,
    status: "available",
    backgroundChecked: true,
    rating: 4.7,
  },
  {
    id: "stf-mt-riaan",
    name: "Riaan Botha",
    role: "Bar and service",
    category: "events",
    photoUrl: null,
    phone: "+27 82 555 0512",
    languages: ["Afrikaans", "English"],
    experienceYears: 4,
    status: "off_duty",
    backgroundChecked: false,
    rating: 4.3,
  },
  {
    id: "stf-mt-zanele",
    name: "Zanele Mthembu",
    role: "Pastry chef",
    category: "catering",
    photoUrl: null,
    phone: "+27 83 555 0687",
    languages: ["English", "isiXhosa"],
    experienceYears: 8,
    status: "available",
    backgroundChecked: true,
    rating: 4.8,
  },
  {
    id: "stf-mt-anele",
    name: "Anele Jantjies",
    role: "Event medic",
    category: "medical",
    photoUrl: null,
    phone: "+27 84 555 0723",
    languages: ["English", "Afrikaans"],
    experienceYears: 13,
    status: "inactive",
    backgroundChecked: true,
    rating: 4.9,
  },
]);

const marulaAssignments = buildAssignments(MARULA_ID, "ZAR", MARULA_RATE, [
  {
    id: "asg-mt-2001",
    reference: "WPA-MT-2001",
    category: "catering",
    offeringId: "off-mt-chef",
    offeringTitle: "Private chef, dinner service",
    traveller: {
      name: "Nina Kovač",
      email: "nina.kovac@example.com",
      phone: "+386 40 555 118",
      partySize: 8,
    },
    destination: { city: "Cape Town", country: "South Africa", countryCode: "ZA" },
    startsAt: "2026-09-26T16:00:00.000Z",
    endsAt: "2026-09-26T22:00:00.000Z",
    status: "requested",
    assignedStaffIds: [],
    staffRequired: 2,
    notes: "Two of the party are coeliac. Villa kitchen, gas hob only.",
    gross: 9600,
    createdAt: "2026-09-08T19:12:00.000Z",
  },
  {
    id: "asg-mt-2002",
    reference: "WPA-MT-2002",
    category: "events",
    offeringId: "off-mt-event",
    offeringTitle: "Event catering, seated",
    traveller: {
      name: "Oliver Grant",
      email: "oliver.grant@example.com",
      phone: "+44 7700 900255",
      partySize: 60,
    },
    destination: { city: "Franschhoek", country: "South Africa", countryCode: "ZA" },
    startsAt: "2026-10-10T15:00:00.000Z",
    endsAt: "2026-10-10T23:30:00.000Z",
    status: "requested",
    assignedStaffIds: [],
    staffRequired: 6,
    notes: "Wedding dinner at a wine estate. Kitchen on site but small.",
    gross: 48000,
    createdAt: "2026-09-05T11:47:00.000Z",
  },
  {
    id: "asg-mt-2003",
    reference: "WPA-MT-2003",
    category: "catering",
    offeringId: "off-mt-daily",
    offeringTitle: "Daily meal service for a villa",
    traveller: {
      name: "Ahmed Farouk",
      email: "a.farouk@example.com",
      phone: "+20 100 555 4417",
      partySize: 5,
    },
    destination: { city: "Stellenbosch", country: "South Africa", countryCode: "ZA" },
    startsAt: "2026-09-14T06:00:00.000Z",
    endsAt: "2026-09-19T21:00:00.000Z",
    status: "assigned",
    assignedStaffIds: ["stf-mt-thandi", "stf-mt-pieter"],
    staffRequired: 2,
    notes: "Halal only. Breakfast at seven.",
    gross: 15600,
    createdAt: "2026-08-29T08:20:00.000Z",
  },
  {
    id: "asg-mt-2004",
    reference: "WPA-MT-2004",
    category: "events",
    offeringId: "off-mt-coord",
    offeringTitle: "On-site event coordination",
    traveller: {
      name: "Camille Dubois",
      email: "camille.dubois@example.com",
      phone: "+33 6 55 20 41 88",
      partySize: 40,
    },
    destination: { city: "Cape Town", country: "South Africa", countryCode: "ZA" },
    startsAt: "2026-09-11T08:00:00.000Z",
    endsAt: "2026-09-12T01:00:00.000Z",
    status: "in_progress",
    assignedStaffIds: ["stf-mt-lerato"],
    staffRequired: 1,
    notes: "Company offsite, rooftop in the CBD.",
    gross: 14400,
    createdAt: "2026-08-20T14:05:00.000Z",
  },
  {
    id: "asg-mt-2005",
    reference: "WPA-MT-2005",
    category: "catering",
    offeringId: "off-mt-chef",
    offeringTitle: "Private chef, dinner service",
    traveller: {
      name: "Rasmus Holm",
      email: "rasmus.holm@example.com",
      phone: "+45 20 55 41 09",
      partySize: 6,
    },
    destination: { city: "Cape Town", country: "South Africa", countryCode: "ZA" },
    startsAt: "2026-09-04T16:30:00.000Z",
    endsAt: "2026-09-04T22:00:00.000Z",
    status: "completed",
    assignedStaffIds: ["stf-mt-thandi", "stf-mt-zanele"],
    staffRequired: 2,
    notes: null,
    gross: 9600,
    createdAt: "2026-08-22T10:38:00.000Z",
  },
  {
    id: "asg-mt-2006",
    reference: "WPA-MT-2006",
    category: "medical",
    offeringId: "off-mt-medic",
    offeringTitle: "Event medic standby",
    traveller: {
      name: "Grace Oduya",
      email: "grace.oduya@example.com",
      phone: "+254 722 555 301",
      partySize: 120,
    },
    destination: { city: "Cape Town", country: "South Africa", countryCode: "ZA" },
    startsAt: "2026-08-22T09:00:00.000Z",
    endsAt: "2026-08-22T20:00:00.000Z",
    status: "completed",
    assignedStaffIds: ["stf-mt-anele"],
    staffRequired: 1,
    notes: "Outdoor sports day, medic stationed at the finish.",
    gross: 3400,
    createdAt: "2026-08-02T07:14:00.000Z",
  },
  {
    id: "asg-mt-2007",
    reference: "WPA-MT-2007",
    category: "events",
    offeringId: "off-mt-event",
    offeringTitle: "Event catering, seated",
    traveller: {
      name: "Beatriz Almeida",
      email: "b.almeida@example.com",
      phone: "+55 21 95555 0182",
      partySize: 70,
    },
    destination: { city: "Stellenbosch", country: "South Africa", countryCode: "ZA" },
    startsAt: "2026-08-15T14:00:00.000Z",
    endsAt: "2026-08-16T00:30:00.000Z",
    status: "completed",
    assignedStaffIds: [
      "stf-mt-thandi",
      "stf-mt-pieter",
      "stf-mt-nomsa",
      "stf-mt-riaan",
      "stf-mt-zanele",
      "stf-mt-lerato",
    ],
    staffRequired: 6,
    notes: null,
    gross: 52000,
    createdAt: "2026-07-12T09:50:00.000Z",
  },
  {
    id: "asg-mt-2008",
    reference: "WPA-MT-2008",
    category: "catering",
    offeringId: "off-mt-daily",
    offeringTitle: "Daily meal service for a villa",
    traveller: {
      name: "Jonas Lindqvist",
      email: "jonas.l@example.com",
      phone: "+46 73 555 2290",
      partySize: 4,
    },
    destination: { city: "Cape Town", country: "South Africa", countryCode: "ZA" },
    startsAt: "2026-07-20T06:00:00.000Z",
    endsAt: "2026-07-27T21:00:00.000Z",
    status: "completed",
    assignedStaffIds: ["stf-mt-nomsa", "stf-mt-pieter"],
    staffRequired: 2,
    notes: null,
    gross: 18200,
    createdAt: "2026-07-01T12:02:00.000Z",
  },
  {
    id: "asg-mt-2009",
    reference: "WPA-MT-2009",
    category: "events",
    offeringId: "off-mt-coord",
    offeringTitle: "On-site event coordination",
    traveller: {
      name: "Ricardo Peña",
      email: "r.pena@example.com",
      phone: "+52 55 5555 8842",
      partySize: 25,
    },
    destination: { city: "Franschhoek", country: "South Africa", countryCode: "ZA" },
    startsAt: "2026-08-30T10:00:00.000Z",
    endsAt: "2026-08-30T22:00:00.000Z",
    status: "cancelled",
    assignedStaffIds: [],
    staffRequired: 1,
    notes: "Traveller cancelled the whole package.",
    gross: 7200,
    createdAt: "2026-08-09T15:31:00.000Z",
  },
  {
    id: "asg-mt-2010",
    reference: "WPA-MT-2010",
    category: "catering",
    offeringId: "off-mt-chef",
    offeringTitle: "Private chef, dinner service",
    traveller: {
      name: "Ayesha Rahman",
      email: "ayesha.rahman@example.com",
      phone: "+880 171 555 0092",
      partySize: 7,
    },
    destination: { city: "Cape Town", country: "South Africa", countryCode: "ZA" },
    startsAt: "2026-08-08T16:00:00.000Z",
    endsAt: "2026-08-08T22:00:00.000Z",
    status: "completed",
    assignedStaffIds: ["stf-mt-thandi", "stf-mt-nomsa"],
    staffRequired: 2,
    notes: null,
    gross: 9600,
    createdAt: "2026-07-25T18:44:00.000Z",
  },
]);

const marulaPayouts = buildPayouts(MARULA_ID, "ZAR", marulaAssignments, [
  {
    id: "pay-mt-1",
    reference: "WPP-MT-0731",
    periodStart: "2026-07-01T00:00:00.000Z",
    periodEnd: "2026-07-31T23:59:59.000Z",
    assignmentIds: ["asg-mt-2008"],
    status: "paid",
    paidAt: "2026-08-05T09:15:00.000Z",
    destinationAccount: "Standard Bank ••••8830",
  },
  {
    id: "pay-mt-2",
    reference: "WPP-MT-0831",
    periodStart: "2026-08-15T00:00:00.000Z",
    periodEnd: "2026-08-31T23:59:59.000Z",
    assignmentIds: ["asg-mt-2007", "asg-mt-2006"],
    status: "processing",
    destinationAccount: "Standard Bank ••••8830",
  },
  {
    id: "pay-mt-3",
    reference: "WPP-MT-0814",
    periodStart: "2026-08-01T00:00:00.000Z",
    periodEnd: "2026-08-14T23:59:59.000Z",
    assignmentIds: ["asg-mt-2010"],
    status: "on_hold",
    destinationAccount: "Standard Bank ••••8830",
  },
  {
    id: "pay-mt-4",
    reference: "WPP-MT-0907",
    periodStart: "2026-09-01T00:00:00.000Z",
    periodEnd: "2026-09-07T23:59:59.000Z",
    assignmentIds: ["asg-mt-2005"],
    status: "pending",
    destinationAccount: "Standard Bank ••••8830",
  },
]);

/* ---------------------------------------------------------------------------
 * 3. Kestrel & Wren — United Kingdom. Housekeeping and childcare, paused.
 *
 * Verified, complete on everything required, and paused by its own choice —
 * the one optional document it has not bothered with (chemical handling) is
 * the `missing` state on a file that is nonetheless submittable.
 * ------------------------------------------------------------------------- */

const KESTREL_ID = "ag-kestrel-wren";
const KESTREL_CATEGORIES: AgencyCategory[] = ["cleaning", "childcare"];
const KESTREL_RATE = 0.18;

const kestrel: Agency = {
  id: KESTREL_ID,
  slug: "kestrel-wren",
  name: "Kestrel & Wren",
  legalName: "Kestrel & Wren Household Services Limited",
  registrationNumber: "11204877",
  countryCode: "GB",
  country: "United Kingdom",
  cities: ["London", "Oxford", "Bath"],
  categories: KESTREL_CATEGORIES,
  summary: "Housekeeping and checked childcare for short lets and family stays.",
  about:
    "Kestrel & Wren places housekeepers and nannies into short lets and serviced flats, mostly for families who are somewhere for a fortnight rather than a night. Every person on the books is checked before their first booking and again each year.",
  logoUrl: null,
  email: "bookings@kestrelwren.example",
  phone: "+44 20 7946 0311",
  website: null,
  yearFounded: 2017,
  staffCount: 31,
  languages: ["English", "Polish", "Irish", "Tamil"],
  verification: "verified",
  listingStatus: "paused",
  documents: documentsFor(KESTREL_CATEGORIES, {
    business_registration: {
      status: "approved",
      fileName: "companies-house-certificate.pdf",
      fileUrl:
        "https://files.e-embassy.example/agency/kestrel-wren/companies-house-certificate.pdf",
      uploadedAt: "2026-01-22T10:30:00.000Z",
    },
    tax_certificate: {
      status: "approved",
      fileName: "hmrc-utr-letter.pdf",
      fileUrl:
        "https://files.e-embassy.example/agency/kestrel-wren/hmrc-utr-letter.pdf",
      uploadedAt: "2026-01-22T10:33:00.000Z",
      expiresAt: "2027-04-05T00:00:00.000Z",
    },
    proof_of_address: {
      status: "uploaded",
      fileName: "office-utility-bill.pdf",
      fileUrl:
        "https://files.e-embassy.example/agency/kestrel-wren/office-utility-bill.pdf",
      uploadedAt: "2026-09-02T08:05:00.000Z",
      expiresAt: "2026-12-01T00:00:00.000Z",
    },
    owner_id: {
      status: "approved",
      fileName: "director-passport.jpg",
      fileUrl:
        "https://files.e-embassy.example/agency/kestrel-wren/director-passport.jpg",
      uploadedAt: "2026-01-22T10:36:00.000Z",
      expiresAt: "2030-08-09T00:00:00.000Z",
    },
    liability_insurance: {
      status: "approved",
      fileName: "public-liability-5m.pdf",
      fileUrl:
        "https://files.e-embassy.example/agency/kestrel-wren/public-liability-5m.pdf",
      uploadedAt: "2026-01-23T09:10:00.000Z",
      expiresAt: "2027-01-22T00:00:00.000Z",
    },
    // chemical_handling_assessment is optional and deliberately absent.
    first_aid_certificate: {
      status: "approved",
      fileName: "paediatric-first-aid.pdf",
      fileUrl:
        "https://files.e-embassy.example/agency/kestrel-wren/paediatric-first-aid.pdf",
      uploadedAt: "2026-01-24T13:44:00.000Z",
      expiresAt: "2027-11-30T00:00:00.000Z",
    },
    childcare_background_checks: {
      status: "approved",
      fileName: "enhanced-dbs-summary.pdf",
      fileUrl:
        "https://files.e-embassy.example/agency/kestrel-wren/enhanced-dbs-summary.pdf",
      uploadedAt: "2026-02-11T11:20:00.000Z",
      expiresAt: "2027-02-11T00:00:00.000Z",
    },
  }),
  offerings: buildOfferings("GBP", [
    {
      id: "off-kw-housekeeping",
      category: "cleaning",
      title: "Daily housekeeping",
      description:
        "A two-hour visit each morning: beds, bathrooms, kitchen and a laundry load.",
      price: 140,
      unit: "visit",
      leadTimeHours: 24,
      capacity: 10,
    },
    {
      id: "off-kw-deep",
      category: "cleaning",
      title: "Deep clean before arrival",
      description:
        "A full turnover of the property the day before you land, linen included.",
      price: 320,
      unit: "property",
      leadTimeHours: 72,
      capacity: 6,
    },
    {
      id: "off-kw-nanny",
      category: "childcare",
      title: "Daytime nanny",
      description:
        "A checked nanny for the working day, with an agreed plan for meals and naps.",
      price: 190,
      unit: "day",
      leadTimeHours: 48,
      capacity: 8,
    },
    {
      id: "off-kw-sitter",
      category: "childcare",
      title: "Evening sitter",
      description:
        "Cover from bedtime until you are back. Priced on the hours and how late it runs.",
      price: null,
      unit: "evening",
      leadTimeHours: 24,
      capacity: 6,
    },
  ]),
  rating: 4.7,
  completedJobs: 903,
  createdAt: "2026-01-22T10:20:00.000Z",
  commissionRate: KESTREL_RATE,
};

const kestrelStaff = buildStaff(KESTREL_ID, [
  {
    id: "stf-kw-marta",
    name: "Marta Kowalska",
    role: "Housekeeping lead",
    category: "cleaning",
    photoUrl: null,
    phone: "+44 7700 900731",
    languages: ["Polish", "English"],
    experienceYears: 12,
    status: "assigned",
    backgroundChecked: true,
    rating: 4.9,
  },
  {
    id: "stf-kw-aoife",
    name: "Aoife Byrne",
    role: "Nanny",
    category: "childcare",
    photoUrl: null,
    phone: "+44 7700 900884",
    languages: ["English", "Irish"],
    experienceYears: 8,
    status: "assigned",
    backgroundChecked: true,
    rating: 5,
  },
  {
    id: "stf-kw-ruth",
    name: "Ruth Nkemdirim",
    role: "Nanny",
    category: "childcare",
    photoUrl: null,
    phone: "+44 7700 900217",
    languages: ["English", "Igbo"],
    experienceYears: 6,
    status: "available",
    backgroundChecked: true,
    rating: 4.8,
  },
  {
    id: "stf-kw-daniel",
    name: "Daniel Oyelaran",
    role: "Housekeeper",
    category: "cleaning",
    photoUrl: null,
    phone: "+44 7700 900455",
    languages: ["English", "Yoruba"],
    experienceYears: 3,
    status: "available",
    backgroundChecked: true,
    rating: 4.5,
  },
  {
    id: "stf-kw-priya",
    name: "Priya Raman",
    role: "Deep-clean specialist",
    category: "cleaning",
    photoUrl: null,
    phone: "+44 7700 900620",
    languages: ["English", "Tamil"],
    experienceYears: 9,
    status: "off_duty",
    backgroundChecked: true,
    rating: 4.7,
  },
  {
    id: "stf-kw-helen",
    name: "Helen Arkwright",
    role: "Evening sitter",
    category: "childcare",
    photoUrl: null,
    phone: "+44 7700 900908",
    languages: ["English"],
    experienceYears: 15,
    status: "inactive",
    backgroundChecked: true,
    rating: 4.6,
  },
]);

const kestrelAssignments = buildAssignments(KESTREL_ID, "GBP", KESTREL_RATE, [
  {
    id: "asg-kw-3001",
    reference: "WPA-KW-3001",
    category: "childcare",
    offeringId: "off-kw-nanny",
    offeringTitle: "Daytime nanny",
    traveller: {
      name: "Sanne de Vries",
      email: "sanne.devries@example.com",
      phone: "+31 6 5555 2018",
      partySize: 4,
    },
    destination: { city: "London", country: "United Kingdom", countryCode: "GB" },
    startsAt: "2026-09-21T08:00:00.000Z",
    endsAt: "2026-09-25T18:00:00.000Z",
    status: "requested",
    assignedStaffIds: [],
    staffRequired: 1,
    notes: "Two children, three and six. Both parents working from the flat.",
    gross: 900,
    createdAt: "2026-09-09T07:31:00.000Z",
  },
  {
    id: "asg-kw-3002",
    reference: "WPA-KW-3002",
    category: "cleaning",
    offeringId: "off-kw-deep",
    offeringTitle: "Deep clean before arrival",
    traveller: {
      name: "Idris Abubakar",
      email: "idris.abubakar@example.com",
      phone: "+971 50 555 4412",
      partySize: 6,
    },
    destination: { city: "Oxford", country: "United Kingdom", countryCode: "GB" },
    startsAt: "2026-09-19T09:00:00.000Z",
    endsAt: "2026-09-19T16:00:00.000Z",
    status: "requested",
    assignedStaffIds: [],
    staffRequired: 2,
    notes: null,
    gross: 600,
    createdAt: "2026-09-10T12:09:00.000Z",
  },
  {
    id: "asg-kw-3003",
    reference: "WPA-KW-3003",
    category: "cleaning",
    offeringId: "off-kw-housekeeping",
    offeringTitle: "Daily housekeeping",
    traveller: {
      name: "Marisol Castillo",
      email: "m.castillo@example.com",
      phone: "+57 310 555 0771",
      partySize: 3,
    },
    destination: { city: "London", country: "United Kingdom", countryCode: "GB" },
    startsAt: "2026-09-14T07:30:00.000Z",
    endsAt: "2026-09-20T10:00:00.000Z",
    status: "assigned",
    assignedStaffIds: ["stf-kw-marta"],
    staffRequired: 1,
    notes: "Mornings before ten, please.",
    gross: 1000,
    createdAt: "2026-08-31T16:22:00.000Z",
  },
  {
    id: "asg-kw-3004",
    reference: "WPA-KW-3004",
    category: "childcare",
    offeringId: "off-kw-nanny",
    offeringTitle: "Daytime nanny",
    traveller: {
      name: "Erik Sandberg",
      email: "erik.sandberg@example.com",
      phone: "+46 70 555 1147",
      partySize: 5,
    },
    destination: { city: "Bath", country: "United Kingdom", countryCode: "GB" },
    startsAt: "2026-09-09T08:00:00.000Z",
    endsAt: "2026-09-13T18:00:00.000Z",
    status: "in_progress",
    assignedStaffIds: ["stf-kw-aoife"],
    staffRequired: 1,
    notes: null,
    gross: 900,
    createdAt: "2026-08-25T09:47:00.000Z",
  },
  {
    id: "asg-kw-3005",
    reference: "WPA-KW-3005",
    category: "cleaning",
    offeringId: "off-kw-housekeeping",
    offeringTitle: "Daily housekeeping",
    traveller: {
      name: "Hannah Feldman",
      email: "hannah.feldman@example.com",
      phone: "+1 212 555 0164",
      partySize: 2,
    },
    destination: { city: "London", country: "United Kingdom", countryCode: "GB" },
    startsAt: "2026-09-01T07:30:00.000Z",
    endsAt: "2026-09-05T10:00:00.000Z",
    status: "completed",
    assignedStaffIds: ["stf-kw-daniel"],
    staffRequired: 1,
    notes: null,
    gross: 700,
    createdAt: "2026-08-18T14:12:00.000Z",
  },
  {
    id: "asg-kw-3006",
    reference: "WPA-KW-3006",
    category: "cleaning",
    offeringId: "off-kw-deep",
    offeringTitle: "Deep clean before arrival",
    traveller: {
      name: "Kwame Asante",
      email: "kwame.asante@example.com",
      phone: "+233 20 555 6612",
      partySize: 7,
    },
    destination: { city: "Oxford", country: "United Kingdom", countryCode: "GB" },
    startsAt: "2026-08-24T09:00:00.000Z",
    endsAt: "2026-08-24T17:00:00.000Z",
    status: "completed",
    assignedStaffIds: ["stf-kw-priya", "stf-kw-daniel"],
    staffRequired: 2,
    notes: null,
    gross: 600,
    createdAt: "2026-08-06T10:55:00.000Z",
  },
  {
    id: "asg-kw-3007",
    reference: "WPA-KW-3007",
    category: "childcare",
    offeringId: "off-kw-sitter",
    offeringTitle: "Evening sitter",
    traveller: {
      name: "Chiara Rossi",
      email: "chiara.rossi@example.com",
      phone: "+39 333 555 0204",
      partySize: 4,
    },
    destination: { city: "London", country: "United Kingdom", countryCode: "GB" },
    startsAt: "2026-08-14T18:30:00.000Z",
    endsAt: "2026-08-14T23:45:00.000Z",
    status: "completed",
    assignedStaffIds: ["stf-kw-helen"],
    staffRequired: 1,
    notes: "One child, eighteen months. Parents at the theatre.",
    gross: 200,
    createdAt: "2026-08-04T20:18:00.000Z",
  },
  {
    id: "asg-kw-3008",
    reference: "WPA-KW-3008",
    category: "cleaning",
    offeringId: "off-kw-housekeeping",
    offeringTitle: "Daily housekeeping",
    traveller: {
      name: "Pavel Novak",
      email: "pavel.novak@example.com",
      phone: "+420 601 555 388",
      partySize: 2,
    },
    destination: { city: "Bath", country: "United Kingdom", countryCode: "GB" },
    startsAt: "2026-08-29T08:00:00.000Z",
    endsAt: "2026-09-01T10:00:00.000Z",
    status: "cancelled",
    assignedStaffIds: [],
    staffRequired: 1,
    notes: "Stay shortened; traveller cancelled two days out.",
    gross: 500,
    createdAt: "2026-08-15T11:02:00.000Z",
  },
  {
    id: "asg-kw-3009",
    reference: "WPA-KW-3009",
    category: "childcare",
    offeringId: "off-kw-nanny",
    offeringTitle: "Daytime nanny",
    traveller: {
      name: "Layla Haddad",
      email: "layla.haddad@example.com",
      phone: "+961 3 555 219",
      partySize: 6,
    },
    destination: { city: "London", country: "United Kingdom", countryCode: "GB" },
    startsAt: "2026-07-15T08:00:00.000Z",
    endsAt: "2026-07-24T18:00:00.000Z",
    status: "completed",
    assignedStaffIds: ["stf-kw-ruth", "stf-kw-aoife"],
    staffRequired: 2,
    notes: null,
    gross: 1800,
    createdAt: "2026-06-28T09:25:00.000Z",
  },
]);

const kestrelPayouts = buildPayouts(KESTREL_ID, "GBP", kestrelAssignments, [
  {
    id: "pay-kw-1",
    reference: "WPP-KW-0731",
    periodStart: "2026-07-01T00:00:00.000Z",
    periodEnd: "2026-07-31T23:59:59.000Z",
    assignmentIds: ["asg-kw-3009"],
    status: "paid",
    paidAt: "2026-08-03T08:40:00.000Z",
    destinationAccount: "Starling ••••2291",
  },
  {
    id: "pay-kw-2",
    reference: "WPP-KW-0817",
    periodStart: "2026-08-01T00:00:00.000Z",
    periodEnd: "2026-08-17T23:59:59.000Z",
    assignmentIds: ["asg-kw-3007"],
    status: "on_hold",
    destinationAccount: "Starling ••••2291",
  },
  {
    id: "pay-kw-3",
    reference: "WPP-KW-0831",
    periodStart: "2026-08-18T00:00:00.000Z",
    periodEnd: "2026-08-31T23:59:59.000Z",
    assignmentIds: ["asg-kw-3006"],
    status: "processing",
    destinationAccount: "Starling ••••2291",
  },
  {
    id: "pay-kw-4",
    reference: "WPP-KW-0907",
    periodStart: "2026-09-01T00:00:00.000Z",
    periodEnd: "2026-09-07T23:59:59.000Z",
    assignmentIds: ["asg-kw-3005"],
    status: "pending",
    destinationAccount: "Starling ••••2291",
  },
]);

/* ---------------------------------------------------------------------------
 * 4. Anatolia Compass — Türkiye. Guiding, interpreting and customs clearing.
 *
 * The newest of the four: trading, with its annual renewal still sitting in
 * the reviewer's queue. Several documents are `uploaded` or `in_review`.
 * ------------------------------------------------------------------------- */

const ANATOLIA_ID = "ag-anatolia-compass";
const ANATOLIA_CATEGORIES: AgencyCategory[] = [
  "tour_guide",
  "interpreting",
  "logistics",
];
const ANATOLIA_RATE = 0.14;

const anatolia: Agency = {
  id: ANATOLIA_ID,
  slug: "anatolia-compass",
  name: "Anatolia Compass",
  legalName: "Anatolia Compass Turizm ve Tercüme Anonim Şirketi",
  registrationNumber: "0740119284",
  countryCode: "TR",
  country: "Türkiye",
  cities: ["Istanbul", "Cappadocia", "Izmir"],
  categories: ANATOLIA_CATEGORIES,
  summary: "Licensed guides, conference interpreters and customs clearing.",
  about:
    "Anatolia Compass began as two licensed guides in Sultanahmet and now also puts interpreters into meetings and clears equipment through customs for crews filming in the interior. Guides hold the national licence, which is what gets a party through a museum door without a queue.",
  logoUrl: null,
  email: "merhaba@anatoliacompass.example",
  phone: "+90 212 555 0166",
  website: "https://anatoliacompass.example",
  yearFounded: 2021,
  staffCount: 17,
  languages: ["Turkish", "English", "German", "Arabic", "Russian"],
  verification: "pending",
  listingStatus: "in_review",
  documents: documentsFor(ANATOLIA_CATEGORIES, {
    business_registration: {
      status: "approved",
      fileName: "ticaret-sicil-gazetesi.pdf",
      fileUrl:
        "https://files.e-embassy.example/agency/anatolia-compass/ticaret-sicil-gazetesi.pdf",
      uploadedAt: "2026-05-30T09:02:00.000Z",
    },
    tax_certificate: {
      status: "in_review",
      fileName: "vergi-levhasi-2026.pdf",
      fileUrl:
        "https://files.e-embassy.example/agency/anatolia-compass/vergi-levhasi-2026.pdf",
      uploadedAt: "2026-09-01T07:18:00.000Z",
      expiresAt: "2027-05-31T00:00:00.000Z",
    },
    proof_of_address: {
      status: "in_review",
      fileName: "office-lease-beyoglu.pdf",
      fileUrl:
        "https://files.e-embassy.example/agency/anatolia-compass/office-lease-beyoglu.pdf",
      uploadedAt: "2026-09-01T07:21:00.000Z",
      expiresAt: "2027-07-31T00:00:00.000Z",
    },
    owner_id: {
      status: "uploaded",
      fileName: "director-id.jpg",
      fileUrl:
        "https://files.e-embassy.example/agency/anatolia-compass/director-id.jpg",
      uploadedAt: "2026-09-06T18:40:00.000Z",
      expiresAt: "2032-03-17T00:00:00.000Z",
    },
    liability_insurance: {
      status: "uploaded",
      fileName: "mesleki-sorumluluk-sigortasi.pdf",
      fileUrl:
        "https://files.e-embassy.example/agency/anatolia-compass/mesleki-sorumluluk-sigortasi.pdf",
      uploadedAt: "2026-09-06T18:44:00.000Z",
      expiresAt: "2027-06-14T00:00:00.000Z",
    },
    tour_guide_licence: {
      status: "approved",
      fileName: "turist-rehberi-kimlik.pdf",
      fileUrl:
        "https://files.e-embassy.example/agency/anatolia-compass/turist-rehberi-kimlik.pdf",
      uploadedAt: "2026-05-30T09:10:00.000Z",
      expiresAt: "2027-12-31T00:00:00.000Z",
    },
    first_aid_certificate: {
      status: "uploaded",
      fileName: "ilk-yardim-sertifikasi.pdf",
      fileUrl:
        "https://files.e-embassy.example/agency/anatolia-compass/ilk-yardim-sertifikasi.pdf",
      uploadedAt: "2026-09-07T11:55:00.000Z",
      expiresAt: "2028-01-20T00:00:00.000Z",
    },
    interpreter_accreditation: {
      status: "in_review",
      fileName: "yeminli-tercuman-belgesi.pdf",
      fileUrl:
        "https://files.e-embassy.example/agency/anatolia-compass/yeminli-tercuman-belgesi.pdf",
      uploadedAt: "2026-09-02T13:26:00.000Z",
      expiresAt: "2028-09-02T00:00:00.000Z",
    },
    customs_broker_licence: {
      status: "approved",
      fileName: "gumruk-musaviri-izin-belgesi.pdf",
      fileUrl:
        "https://files.e-embassy.example/agency/anatolia-compass/gumruk-musaviri-izin-belgesi.pdf",
      uploadedAt: "2026-05-31T10:02:00.000Z",
      expiresAt: "2027-05-31T00:00:00.000Z",
    },
  }),
  offerings: buildOfferings("TRY", [
    {
      id: "off-ac-city",
      category: "tour_guide",
      title: "Licensed city guide, full day",
      description:
        "Eight hours with a nationally licensed guide, museum entries arranged in advance.",
      price: 9800,
      unit: "day",
      leadTimeHours: 48,
      capacity: 10,
    },
    {
      id: "off-ac-multi",
      category: "tour_guide",
      title: "Multi-day guided itinerary",
      description:
        "Istanbul, Cappadocia and the coast, planned around what you actually want to see. Priced per itinerary.",
      price: null,
      unit: "itinerary",
      leadTimeHours: 240,
      capacity: 4,
    },
    {
      id: "off-ac-interp",
      category: "interpreting",
      title: "Business interpreting",
      description:
        "Consecutive interpreting for meetings, factory visits and notary appointments.",
      price: 7400,
      unit: "day",
      leadTimeHours: 72,
      capacity: 6,
    },
    {
      id: "off-ac-customs",
      category: "logistics",
      title: "Customs clearing and equipment freight",
      description:
        "Carnet handling and clearance for film, survey and exhibition equipment.",
      price: 15600,
      unit: "consignment",
      leadTimeHours: 120,
      capacity: 3,
    },
  ]),
  rating: 4.6,
  completedJobs: 74,
  createdAt: "2026-05-30T08:50:00.000Z",
  commissionRate: ANATOLIA_RATE,
};

const anatoliaStaff = buildStaff(ANATOLIA_ID, [
  {
    id: "stf-ac-emre",
    name: "Emre Yıldırım",
    role: "Licensed guide",
    category: "tour_guide",
    photoUrl: null,
    phone: "+90 532 555 0142",
    languages: ["Turkish", "English", "German"],
    experienceYears: 13,
    status: "assigned",
    backgroundChecked: true,
    rating: 4.9,
  },
  {
    id: "stf-ac-selin",
    name: "Selin Kaya",
    role: "Conference interpreter",
    category: "interpreting",
    photoUrl: null,
    phone: "+90 533 555 0287",
    languages: ["Turkish", "English", "French"],
    experienceYears: 10,
    status: "assigned",
    backgroundChecked: true,
    rating: 4.9,
  },
  {
    id: "stf-ac-mert",
    name: "Mert Demir",
    role: "Licensed guide",
    category: "tour_guide",
    photoUrl: null,
    phone: "+90 535 555 0390",
    languages: ["Turkish", "English", "Russian"],
    experienceYears: 5,
    status: "available",
    backgroundChecked: true,
    rating: 4.6,
  },
  {
    id: "stf-ac-ayse",
    name: "Ayşe Çelik",
    role: "Customs clerk",
    category: "logistics",
    photoUrl: null,
    phone: "+90 536 555 0418",
    languages: ["Turkish", "English"],
    experienceYears: 7,
    status: "available",
    backgroundChecked: true,
    rating: 4.7,
  },
  {
    id: "stf-ac-burak",
    name: "Burak Aslan",
    role: "Driver and fixer",
    category: "logistics",
    photoUrl: null,
    phone: "+90 537 555 0566",
    languages: ["Turkish", "English"],
    experienceYears: 9,
    status: "off_duty",
    backgroundChecked: false,
    rating: 4.4,
  },
  {
    id: "stf-ac-deniz",
    name: "Deniz Şahin",
    role: "Medical interpreter",
    category: "interpreting",
    photoUrl: null,
    phone: "+90 538 555 0673",
    languages: ["Turkish", "English", "Arabic"],
    experienceYears: 6,
    status: "inactive",
    backgroundChecked: true,
    rating: 4.8,
  },
]);

const anatoliaAssignments = buildAssignments(ANATOLIA_ID, "TRY", ANATOLIA_RATE, [
  {
    id: "asg-ac-4001",
    reference: "WPA-AC-4001",
    category: "tour_guide",
    offeringId: "off-ac-city",
    offeringTitle: "Licensed city guide, full day",
    traveller: {
      name: "Mei-Ling Chen",
      email: "meiling.chen@example.com",
      phone: "+886 912 555 118",
      partySize: 4,
    },
    destination: { city: "Istanbul", country: "Türkiye", countryCode: "TR" },
    startsAt: "2026-09-23T06:00:00.000Z",
    endsAt: "2026-09-23T15:00:00.000Z",
    status: "requested",
    assignedStaffIds: [],
    staffRequired: 1,
    notes: "Topkapı and the cistern. One wheelchair user in the party.",
    gross: 9800,
    createdAt: "2026-09-09T13:40:00.000Z",
  },
  {
    id: "asg-ac-4002",
    reference: "WPA-AC-4002",
    category: "interpreting",
    offeringId: "off-ac-interp",
    offeringTitle: "Business interpreting",
    traveller: {
      name: "Stefan Müller",
      email: "s.mueller@example.com",
      phone: "+49 170 5550 221",
      partySize: 3,
    },
    destination: { city: "Izmir", country: "Türkiye", countryCode: "TR" },
    startsAt: "2026-09-17T07:00:00.000Z",
    endsAt: "2026-09-18T16:00:00.000Z",
    status: "requested",
    assignedStaffIds: [],
    staffRequired: 1,
    notes: "Two days of supplier meetings. Technical textile vocabulary.",
    gross: 14800,
    createdAt: "2026-09-10T08:05:00.000Z",
  },
  {
    id: "asg-ac-4003",
    reference: "WPA-AC-4003",
    category: "tour_guide",
    offeringId: "off-ac-multi",
    offeringTitle: "Multi-day guided itinerary",
    traveller: {
      name: "Fernanda Lopes",
      email: "fernanda.lopes@example.com",
      phone: "+55 11 95555 4471",
      partySize: 6,
    },
    destination: { city: "Cappadocia", country: "Türkiye", countryCode: "TR" },
    startsAt: "2026-10-05T05:00:00.000Z",
    endsAt: "2026-10-09T18:00:00.000Z",
    status: "requested",
    assignedStaffIds: [],
    staffRequired: 2,
    notes: null,
    gross: 62000,
    createdAt: "2026-09-06T16:52:00.000Z",
  },
  {
    id: "asg-ac-4004",
    reference: "WPA-AC-4004",
    category: "tour_guide",
    offeringId: "off-ac-city",
    offeringTitle: "Licensed city guide, full day",
    traveller: {
      name: "Alexei Petrov",
      email: "a.petrov@example.com",
      phone: "+7 921 555 0388",
      partySize: 2,
    },
    destination: { city: "Istanbul", country: "Türkiye", countryCode: "TR" },
    startsAt: "2026-09-15T06:30:00.000Z",
    endsAt: "2026-09-15T15:30:00.000Z",
    status: "assigned",
    assignedStaffIds: ["stf-ac-emre"],
    staffRequired: 1,
    notes: null,
    gross: 9800,
    createdAt: "2026-08-28T10:11:00.000Z",
  },
  {
    id: "asg-ac-4005",
    reference: "WPA-AC-4005",
    category: "interpreting",
    offeringId: "off-ac-interp",
    offeringTitle: "Business interpreting",
    traveller: {
      name: "Noor Al-Sabah",
      email: "noor.alsabah@example.com",
      phone: "+965 9955 5104",
      partySize: 2,
    },
    destination: { city: "Istanbul", country: "Türkiye", countryCode: "TR" },
    startsAt: "2026-09-10T07:00:00.000Z",
    endsAt: "2026-09-12T17:00:00.000Z",
    status: "in_progress",
    assignedStaffIds: ["stf-ac-selin"],
    staffRequired: 1,
    notes: "Notary appointment on the middle morning.",
    gross: 22200,
    createdAt: "2026-08-24T09:33:00.000Z",
  },
  {
    id: "asg-ac-4006",
    reference: "WPA-AC-4006",
    category: "tour_guide",
    offeringId: "off-ac-city",
    offeringTitle: "Licensed city guide, full day",
    traveller: {
      name: "Isabella Moretti",
      email: "i.moretti@example.com",
      phone: "+39 340 555 0917",
      partySize: 9,
    },
    destination: { city: "Cappadocia", country: "Türkiye", countryCode: "TR" },
    startsAt: "2026-09-02T05:00:00.000Z",
    endsAt: "2026-09-03T17:00:00.000Z",
    status: "completed",
    assignedStaffIds: ["stf-ac-emre", "stf-ac-mert"],
    staffRequired: 2,
    notes: null,
    gross: 19600,
    createdAt: "2026-08-12T14:28:00.000Z",
  },
  {
    id: "asg-ac-4007",
    reference: "WPA-AC-4007",
    category: "logistics",
    offeringId: "off-ac-customs",
    offeringTitle: "Customs clearing and equipment freight",
    traveller: {
      name: "Patrick O'Donnell",
      email: "p.odonnell@example.com",
      phone: "+353 87 555 2210",
      partySize: 5,
    },
    destination: { city: "Istanbul", country: "Türkiye", countryCode: "TR" },
    startsAt: "2026-08-19T06:00:00.000Z",
    endsAt: "2026-08-19T19:00:00.000Z",
    status: "completed",
    assignedStaffIds: ["stf-ac-ayse"],
    staffRequired: 1,
    notes: "Camera equipment on an ATA carnet.",
    gross: 15600,
    createdAt: "2026-08-01T11:07:00.000Z",
  },
  {
    id: "asg-ac-4008",
    reference: "WPA-AC-4008",
    category: "interpreting",
    offeringId: "off-ac-interp",
    offeringTitle: "Business interpreting",
    traveller: {
      name: "Hana Kobayashi",
      email: "hana.kobayashi@example.com",
      phone: "+81 80 5555 3390",
      partySize: 4,
    },
    destination: { city: "Izmir", country: "Türkiye", countryCode: "TR" },
    startsAt: "2026-08-06T07:00:00.000Z",
    endsAt: "2026-08-07T16:00:00.000Z",
    status: "completed",
    assignedStaffIds: ["stf-ac-selin"],
    staffRequired: 1,
    notes: null,
    gross: 14800,
    createdAt: "2026-07-21T15:19:00.000Z",
  },
  {
    id: "asg-ac-4009",
    reference: "WPA-AC-4009",
    category: "tour_guide",
    offeringId: "off-ac-multi",
    offeringTitle: "Multi-day guided itinerary",
    traveller: {
      name: "Elena Popescu",
      email: "elena.popescu@example.com",
      phone: "+40 722 555 148",
      partySize: 5,
    },
    destination: { city: "Cappadocia", country: "Türkiye", countryCode: "TR" },
    startsAt: "2026-08-25T05:00:00.000Z",
    endsAt: "2026-08-29T18:00:00.000Z",
    status: "cancelled",
    assignedStaffIds: [],
    staffRequired: 2,
    notes: "Balloon season fully booked; traveller rescheduled to next year.",
    gross: 58000,
    createdAt: "2026-07-30T09:44:00.000Z",
  },
  {
    id: "asg-ac-4010",
    reference: "WPA-AC-4010",
    category: "tour_guide",
    offeringId: "off-ac-city",
    offeringTitle: "Licensed city guide, full day",
    traveller: {
      name: "Samuel Boateng",
      email: "s.boateng@example.com",
      phone: "+233 27 555 8841",
      partySize: 3,
    },
    destination: { city: "Istanbul", country: "Türkiye", countryCode: "TR" },
    startsAt: "2026-07-18T06:00:00.000Z",
    endsAt: "2026-07-18T15:00:00.000Z",
    status: "completed",
    assignedStaffIds: ["stf-ac-mert"],
    staffRequired: 1,
    notes: null,
    gross: 9800,
    createdAt: "2026-07-04T10:50:00.000Z",
  },
]);

const anatoliaPayouts = buildPayouts(ANATOLIA_ID, "TRY", anatoliaAssignments, [
  {
    id: "pay-ac-1",
    reference: "WPP-AC-0731",
    periodStart: "2026-07-01T00:00:00.000Z",
    periodEnd: "2026-07-31T23:59:59.000Z",
    assignmentIds: ["asg-ac-4010"],
    status: "paid",
    paidAt: "2026-08-05T12:26:00.000Z",
    destinationAccount: "Garanti BBVA ••••6104",
  },
  {
    id: "pay-ac-2",
    reference: "WPP-AC-0810",
    periodStart: "2026-08-01T00:00:00.000Z",
    periodEnd: "2026-08-10T23:59:59.000Z",
    assignmentIds: ["asg-ac-4008"],
    status: "on_hold",
    destinationAccount: "Garanti BBVA ••••6104",
  },
  {
    id: "pay-ac-3",
    reference: "WPP-AC-0831",
    periodStart: "2026-08-11T00:00:00.000Z",
    periodEnd: "2026-08-31T23:59:59.000Z",
    assignmentIds: ["asg-ac-4007"],
    status: "processing",
    destinationAccount: "Garanti BBVA ••••6104",
  },
  {
    id: "pay-ac-4",
    reference: "WPP-AC-0907",
    periodStart: "2026-09-01T00:00:00.000Z",
    periodEnd: "2026-09-07T23:59:59.000Z",
    assignmentIds: ["asg-ac-4006"],
    status: "pending",
    destinationAccount: "Garanti BBVA ••••6104",
  },
]);

/* ---------------------------------------------------------------------------
 * The collections the store reads. Nothing else imports these directly.
 * ------------------------------------------------------------------------- */

export const agencies: Agency[] = [sentinel, marula, kestrel, anatolia];

export const agencyStaffRecords: AgencyStaff[] = [
  ...sentinelStaff,
  ...marulaStaff,
  ...kestrelStaff,
  ...anatoliaStaff,
];

export const agencyAssignmentRecords: AgencyAssignment[] = [
  ...sentinelAssignments,
  ...marulaAssignments,
  ...kestrelAssignments,
  ...anatoliaAssignments,
];

export const agencyPayoutRecords: AgencyPayout[] = [
  ...sentinelPayouts,
  ...marulaPayouts,
  ...kestrelPayouts,
  ...anatoliaPayouts,
];

/**
 * Who can sign in, and for which agency.
 *
 * There are no credentials here on purpose — `authenticateAgency()` compares
 * the password against one shared `AGENCY_PASSWORD`, exactly as the admin
 * console does, and these rows only say which agency an address belongs to.
 * See `src/server/agency/auth.ts`: it is a mock and says so.
 */
export const agencyUsers: AgencyUser[] = [
  {
    id: "agu-sr-owner",
    name: "Adaeze Okonkwo",
    email: "adaeze@sentinelridge.example",
    role: "owner",
    agencyId: SENTINEL_ID,
    agencyName: sentinel.name,
  },
  {
    id: "agu-sr-ops",
    name: "Bayo Ogundele",
    email: "ops@sentinelridge.example",
    role: "coordinator",
    agencyId: SENTINEL_ID,
    agencyName: sentinel.name,
  },
  {
    id: "agu-mt-owner",
    name: "Nadine Bekker",
    email: "nadine@marulatable.example",
    role: "owner",
    agencyId: MARULA_ID,
    agencyName: marula.name,
  },
  {
    id: "agu-mt-manager",
    name: "Sipho Radebe",
    email: "bookings@marulatable.example",
    role: "manager",
    agencyId: MARULA_ID,
    agencyName: marula.name,
  },
  {
    id: "agu-kw-owner",
    name: "Imogen Hart",
    email: "imogen@kestrelwren.example",
    role: "owner",
    agencyId: KESTREL_ID,
    agencyName: kestrel.name,
  },
  {
    id: "agu-ac-owner",
    name: "Leyla Arslan",
    email: "leyla@anatoliacompass.example",
    role: "owner",
    agencyId: ANATOLIA_ID,
    agencyName: anatolia.name,
  },
  {
    id: "agu-ac-coord",
    name: "Kaan Polat",
    email: "ops@anatoliacompass.example",
    role: "coordinator",
    agencyId: ANATOLIA_ID,
    agencyName: anatolia.name,
  },
];
