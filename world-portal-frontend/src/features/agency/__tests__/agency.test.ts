import { existsSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  baseDocuments,
  categoryCatalog,
  documentCatalog,
  documentsForCategories,
  requiredDocumentsFor,
} from "@/features/agency/catalog";
import {
  agencies,
  agencyAssignmentRecords,
  agencyPayoutRecords,
  agencyStaffRecords,
  agencyUsers,
} from "@/features/agency/fixtures";
import { agencyCategories, type AgencyDocumentKind } from "@/features/agency/types";

/** Every kind the type union declares, read back off the catalog. */
const allDocumentKinds = Object.keys(documentCatalog) as AgencyDocumentKind[];

const agencyIds = new Set(agencies.map((agency) => agency.id));

describe("the service catalog", () => {
  it("describes every category the type union declares", () => {
    // A category with no entry crashes the picker rather than rendering an
    // empty card, because the listing flow reads label, blurb and icon.
    for (const category of agencyCategories) {
      const entry = categoryCatalog[category];
      expect(entry, `no catalog entry for "${category}"`).toBeTruthy();
      expect(entry.label, category).toBeTruthy();
      expect(entry.blurb, category).toBeTruthy();
      expect(entry.icon, `"${category}" has no icon`).toBeTruthy();
      expect(entry.examples.length, category).toBeGreaterThan(0);
    }
  });

  it("holds nothing the type union does not declare", () => {
    const declared = new Set<string>(agencyCategories);
    for (const key of Object.keys(categoryCatalog)) {
      expect(declared.has(key), `"${key}" is catalogued but not a category`).toBe(true);
    }
  });

  it("explains every document it asks for", () => {
    // `why` is shown under the upload so the ask is never opaque — an empty one
    // is a demand with no reason attached.
    for (const kind of allDocumentKinds) {
      const entry = documentCatalog[kind];
      expect(entry.label, kind).toBeTruthy();
      expect(entry.why, kind).toBeTruthy();
      expect(typeof entry.required, kind).toBe("boolean");
      expect(typeof entry.expires, kind).toBe("boolean");
    }
  });

  it("catalogues every document any category can demand", () => {
    // Reached through the public function rather than the private map, so this
    // covers the base set and every category's extras in one pass.
    const reachable = documentsForCategories(agencyCategories);
    for (const kind of reachable) {
      expect(
        documentCatalog[kind],
        `"${kind}" is demanded but not catalogued`,
      ).toBeTruthy();
    }
    // And nothing in the catalog is unreachable — a document no category can
    // ask for is a document nobody will ever be asked to upload.
    expect(new Set(reachable)).toEqual(new Set(allDocumentKinds));
  });
});

describe("documentsForCategories", () => {
  it("asks every agency for the base set, whatever it sells", () => {
    for (const category of agencyCategories) {
      const kinds = documentsForCategories([category]);
      for (const base of baseDocuments) {
        expect(kinds, `"${category}" skips "${base}"`).toContain(base);
      }
    }
  });

  it("asks for nothing but the base set when nothing is picked", () => {
    // The first screen of the listing flow, before a category is chosen.
    expect(documentsForCategories([])).toEqual(baseDocuments);
  });

  it("asks for a shared certificate once, not once per category", () => {
    // Guides, childcare and medics all want first aid. An agency doing all
    // three uploads the certificate once; a duplicate here is a checklist that
    // demands the same PDF three times.
    const kinds = documentsForCategories(["tour_guide", "childcare", "medical"]);
    expect(kinds.filter((kind) => kind === "first_aid_certificate")).toHaveLength(1);
    expect(new Set(kinds).size).toBe(kinds.length);
  });

  it("returns catalog order, so the checklist never reshuffles", () => {
    const picked = documentsForCategories(["medical", "security", "driving"]);
    const expected = allDocumentKinds.filter((kind) => picked.includes(kind));
    expect(picked).toEqual(expected);

    // Order is the catalog's, not the caller's: the same set picked in a
    // different order comes back identical.
    expect(documentsForCategories(["driving", "security", "medical"])).toEqual(picked);
  });
});

describe("requiredDocumentsFor", () => {
  it("is a subset of what is asked for", () => {
    for (const category of agencyCategories) {
      const asked = documentsForCategories([category]);
      const required = requiredDocumentsFor([category]);
      for (const kind of required) {
        expect(
          asked,
          `"${category}" requires "${kind}" without asking for it`,
        ).toContain(kind);
      }
      expect(required.length).toBeLessThanOrEqual(asked.length);
    }
  });

  it("keeps only the documents that block submission", () => {
    const required = requiredDocumentsFor(agencyCategories);
    for (const kind of required) {
      expect(documentCatalog[kind].required, `"${kind}" is optional`).toBe(true);
    }
    for (const kind of documentsForCategories(agencyCategories)) {
      if (documentCatalog[kind].required) expect(required).toContain(kind);
    }
  });

  it("blocks a listing on the whole base set", () => {
    // Every base document is required, so a listing can never be submitted
    // with no paperwork at all.
    expect(requiredDocumentsFor([])).toEqual(baseDocuments);
  });
});

describe("the fixture agencies", () => {
  it("gives every record a unique id", () => {
    // Four collections, and the store looks a record up by id in each of them.
    // A duplicate anywhere silently serves the wrong agency's job.
    for (const [label, ids] of [
      ["agencies", agencies.map((a) => a.id)],
      ["staff", agencyStaffRecords.map((s) => s.id)],
      ["assignments", agencyAssignmentRecords.map((a) => a.id)],
      ["payouts", agencyPayoutRecords.map((p) => p.id)],
      ["users", agencyUsers.map((u) => u.id)],
    ] as const) {
      const duplicates = ids.filter((id, i) => ids.indexOf(id) !== i);
      expect(duplicates, `duplicate ${label} id`).toEqual([]);
    }
  });

  it("hangs every record off an agency that exists", () => {
    // An orphan renders a dashboard belonging to nobody, or an empty one.
    for (const staff of agencyStaffRecords) {
      expect(agencyIds.has(staff.agencyId), `${staff.name} → ${staff.agencyId}`).toBe(
        true,
      );
    }
    for (const assignment of agencyAssignmentRecords) {
      expect(
        agencyIds.has(assignment.agencyId),
        `${assignment.reference} → ${assignment.agencyId}`,
      ).toBe(true);
    }
    for (const payout of agencyPayoutRecords) {
      expect(
        agencyIds.has(payout.agencyId),
        `${payout.reference} → ${payout.agencyId}`,
      ).toBe(true);
    }
    for (const user of agencyUsers) {
      expect(agencyIds.has(user.agencyId), `${user.email} → ${user.agencyId}`).toBe(
        true,
      );
    }
  });

  it("only asks an agency for paperwork its services demand", () => {
    for (const agency of agencies) {
      const expected = documentsForCategories(agency.categories);
      expect(
        agency.documents.map((doc) => doc.kind),
        `${agency.name} has the wrong checklist`,
      ).toEqual(expected);

      for (const doc of agency.documents) {
        expect(documentCatalog[doc.kind], `${agency.name}: "${doc.kind}"`).toBeTruthy();
      }
    }
  });

  it("points every logo and portrait at a file that actually exists", () => {
    // A typo in the path renders a broken image with no error anywhere. `null`
    // is a supported state — the UI falls back to a monogram — so only the
    // paths that claim a file are checked.
    const paths = [
      ...agencies.map((a) => [a.name, a.logoUrl] as const),
      ...agencyStaffRecords.map((s) => [s.name, s.photoUrl] as const),
    ];

    for (const [owner, path] of paths) {
      if (path === null) continue;
      expect(
        existsSync(join(process.cwd(), "public", path)),
        `${owner}: missing public${path}`,
      ).toBe(true);
    }
  });
});

describe("the fixture money", () => {
  it("splits every job into a fee and a share that add back up", () => {
    // The dashboard shows `netToAgency` and the admin side shows `platformFee`.
    // If they do not sum to what the traveller paid, one of those screens is
    // lying about real money.
    for (const assignment of agencyAssignmentRecords) {
      expect(
        assignment.platformFee + assignment.netToAgency,
        `${assignment.reference}: ${assignment.platformFee} + ${assignment.netToAgency} ≠ ${assignment.gross}`,
      ).toBeCloseTo(assignment.gross, 2);

      expect(assignment.platformFee, assignment.reference).toBeGreaterThanOrEqual(0);
      expect(assignment.netToAgency, assignment.reference).toBeGreaterThan(0);
    }
  });

  it("totals every payout from the jobs it batches", () => {
    const byId = new Map(agencyAssignmentRecords.map((a) => [a.id, a]));

    for (const payout of agencyPayoutRecords) {
      expect(
        payout.assignmentIds.length,
        `${payout.reference} batches nothing`,
      ).toBeGreaterThan(0);

      const batch = payout.assignmentIds.map((id) => {
        const assignment = byId.get(id);
        expect(assignment, `${payout.reference} batches unknown ${id}`).toBeTruthy();
        return assignment!;
      });

      // Same agency throughout: a payout that batches another agency's job
      // pays the wrong company.
      for (const assignment of batch) {
        expect(
          assignment.agencyId,
          `${payout.reference} ← ${assignment.reference}`,
        ).toBe(payout.agencyId);
        expect(assignment.currency, payout.reference).toBe(payout.currency);
      }

      const sum = (pick: (a: (typeof batch)[number]) => number) =>
        batch.reduce((total, assignment) => total + pick(assignment), 0);

      expect(payout.gross, `${payout.reference} gross`).toBeCloseTo(
        sum((a) => a.gross),
        2,
      );
      expect(payout.platformFee, `${payout.reference} fee`).toBeCloseTo(
        sum((a) => a.platformFee),
        2,
      );
      expect(payout.net, `${payout.reference} net`).toBeCloseTo(
        sum((a) => a.netToAgency),
        2,
      );
      // And the payout balances on its own terms, not only against the batch.
      expect(payout.platformFee + payout.net, payout.reference).toBeCloseTo(
        payout.gross,
        2,
      );
    }
  });

  it("never settles the same job twice", () => {
    // Two payouts batching one assignment pays for it twice.
    const settled = agencyPayoutRecords.flatMap((payout) => payout.assignmentIds);
    const duplicates = settled.filter((id, i) => settled.indexOf(id) !== i);
    expect(duplicates, "settled more than once").toEqual([]);
  });
});
