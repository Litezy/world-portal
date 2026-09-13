"use client";

import { Info } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { EmptyState } from "@/components/ui/empty-state";
import { agencyListing } from "@/content/agency";
import { documentCatalog, documentsForCategories } from "@/features/agency/catalog";
import { DocumentRow } from "@/features/agency/components/listing/document-row";
import { documentByKind } from "@/features/agency/components/listing/form";
import type {
  AgencyCategory,
  AgencyDocument,
  AgencyDocumentKind,
} from "@/features/agency/types";

const copy = agencyListing.documents;

/**
 * The checklist, derived — never declared.
 *
 * `documentsForCategories()` is the only thing that decides what appears here.
 * Pick security and the operating licence and guard training appear; pick
 * driving and fleet insurance, vehicle papers and driver licences do. Adding a
 * service to `catalog.ts` later needs no change in this file.
 */
export function DocumentsStep({
  categories,
  documents,
  disabled,
  targetKind,
}: {
  categories: AgencyCategory[];
  documents: AgencyDocument[];
  disabled: boolean;
  /** Scroll target when the review step points at a missing document. */
  targetKind?: AgencyDocumentKind | null;
}) {
  const kinds = documentsForCategories(categories);
  const byKind = documentByKind(documents);

  const required = kinds.filter((kind) => documentCatalog[kind].required);
  const optional = kinds.filter((kind) => !documentCatalog[kind].required);

  if (categories.length === 0) {
    return <EmptyState title={copy.title} description={agencyListing.services.body} />;
  }

  return (
    <div className="grid gap-8">
      <Alert variant="info">
        <Info />
        <AlertDescription>{copy.body}</AlertDescription>
      </Alert>

      <Group
        title={copy.required}
        kinds={required}
        byKind={byKind}
        disabled={disabled}
        targetKind={targetKind}
      />

      {optional.length > 0 ? (
        <Group
          title={copy.optional}
          kinds={optional}
          byKind={byKind}
          disabled={disabled}
          targetKind={targetKind}
        />
      ) : null}
    </div>
  );
}

function Group({
  title,
  kinds,
  byKind,
  disabled,
  targetKind,
}: {
  title: string;
  kinds: AgencyDocumentKind[];
  byKind: Map<AgencyDocumentKind, AgencyDocument>;
  disabled: boolean;
  targetKind?: AgencyDocumentKind | null;
}) {
  return (
    <section className="grid gap-3">
      <h3 className="text-[13px] font-semibold tracking-wide text-muted-foreground uppercase">
        {title}
      </h3>
      <ul className="grid gap-3">
        {kinds.map((kind) => (
          <li
            key={kind}
            // The review step links here by kind; the id is the anchor.
            id={`document-${kind}`}
            className={
              targetKind === kind ? "rounded-2xl ring-[3px] ring-ring/40" : undefined
            }
          >
            <DocumentRow kind={kind} document={byKind.get(kind)} disabled={disabled} />
          </li>
        ))}
      </ul>
    </section>
  );
}
