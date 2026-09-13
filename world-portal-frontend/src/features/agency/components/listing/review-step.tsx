"use client";

import { ArrowRight, CheckCircle2, PencilLine, TriangleAlert } from "lucide-react";

import { DetailItem, DetailList } from "@/components/admin/detail-list";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { agencyListing } from "@/content/agency";
import {
  categoryCatalog,
  documentCatalog,
  documentsForCategories,
} from "@/features/agency/catalog";
import { DocumentStatusBadge } from "@/features/agency/components/agency-badges";
import { listingFlowCopy } from "@/features/agency/components/listing/copy";
import {
  documentByKind,
  type ListingFormValues,
  type StepId,
} from "@/features/agency/components/listing/form";
import type { AgencyDocument, AgencyDocumentKind } from "@/features/agency/types";
import { countryName } from "@/lib/countries";
import { cn } from "@/lib/utils";

const copy = agencyListing.review;
const profileCopy = agencyListing.profile;
const servicesCopy = agencyListing.services;

export function ReviewStep({
  values,
  documents,
  submitted,
  missing,
  isSubmitting,
  error,
  onEdit,
  onFixDocument,
  onSubmit,
}: {
  values: ListingFormValues;
  documents: AgencyDocument[];
  /** True once the listing has left the agency's hands. */
  submitted: boolean;
  /** From the submit route's 422 — exactly what is not in yet. */
  missing: AgencyDocumentKind[];
  isSubmitting: boolean;
  error: string | null;
  onEdit: (step: StepId) => void;
  onFixDocument: (kind: AgencyDocumentKind) => void;
  onSubmit: () => void;
}) {
  const byKind = documentByKind(documents);
  const kinds = documentsForCategories(values.categories);

  return (
    <div className="grid gap-6">
      {submitted ? (
        <Alert variant="success">
          <CheckCircle2 />
          <AlertDescription>{copy.submitted}</AlertDescription>
        </Alert>
      ) : (
        <div className="grid gap-1">
          <h3 className="text-[15px] font-semibold tracking-tight text-ink-900">
            {copy.title}
          </h3>
          <p className="text-[13px] leading-relaxed text-muted-foreground">
            {copy.body}
          </p>
        </div>
      )}

      {missing.length > 0 ? (
        <Alert variant="destructive">
          <TriangleAlert />
          <AlertTitle>{listingFlowCopy.submitBlockedTitle}</AlertTitle>
          <AlertDescription>
            <ul className="mt-1 grid gap-1">
              {missing.map((kind) => (
                <li key={kind}>
                  <button
                    type="button"
                    onClick={() => onFixDocument(kind)}
                    className="inline-flex items-center gap-1.5 text-left font-medium underline decoration-current underline-offset-4"
                  >
                    {documentCatalog[kind]?.label ?? kind}
                    <ArrowRight className="size-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      ) : null}

      {error && missing.length === 0 ? (
        <Alert variant="destructive">
          <TriangleAlert />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <Panel title={listingFlowCopy.reviewProfile} onEdit={() => onEdit("profile")}>
        <DetailList className="sm:grid-cols-2">
          <DetailItem label={profileCopy.name}>{text(values.name)}</DetailItem>
          <DetailItem label={profileCopy.legalName}>
            {text(values.legalName)}
          </DetailItem>
          <DetailItem label={profileCopy.registrationNumber}>
            {text(values.registrationNumber)}
          </DetailItem>
          <DetailItem label={profileCopy.country}>
            {text(values.country || countryName(values.countryCode))}
          </DetailItem>
          <DetailItem label={profileCopy.cities}>{list(values.cities)}</DetailItem>
          <DetailItem label={profileCopy.languages}>
            {list(values.languages)}
          </DetailItem>
          <DetailItem label={profileCopy.yearFounded}>
            {text(values.yearFounded ? String(values.yearFounded) : "")}
          </DetailItem>
          <DetailItem label={profileCopy.staffCount}>
            {text(values.staffCount ? String(values.staffCount) : "")}
          </DetailItem>
          <DetailItem label={profileCopy.email}>{text(values.email)}</DetailItem>
          <DetailItem label={profileCopy.phone}>{text(values.phone)}</DetailItem>
          <DetailItem label={profileCopy.website}>{text(values.website)}</DetailItem>
          <DetailItem label={profileCopy.summary}>{text(values.summary)}</DetailItem>
        </DetailList>

        <p className="mt-5 text-[13px] leading-relaxed whitespace-pre-line text-ink-800">
          {values.about || listingFlowCopy.reviewNothing}
        </p>
      </Panel>

      <Panel title={listingFlowCopy.reviewServices} onEdit={() => onEdit("services")}>
        {values.categories.length === 0 ? (
          <p className="text-[13px] text-muted-foreground">
            {listingFlowCopy.reviewNothing}
          </p>
        ) : (
          <ul className="flex flex-wrap gap-1.5">
            {values.categories.map((category) => (
              <li key={category}>
                <Badge variant="muted" size="sm">
                  {categoryCatalog[category].label}
                </Badge>
              </li>
            ))}
          </ul>
        )}

        {values.offerings.length > 0 ? (
          <ul className="mt-5 grid gap-3">
            {values.offerings.map((offering) => (
              <li
                key={offering.id}
                className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-t border-border pt-3 first:border-0 first:pt-0"
              >
                <div className="min-w-0">
                  <p className="text-[14px] font-semibold text-ink-900">
                    {offering.title || listingFlowCopy.reviewNothing}
                  </p>
                  {offering.description ? (
                    <p className="mt-0.5 text-[12.5px] leading-snug text-muted-foreground">
                      {offering.description}
                    </p>
                  ) : null}
                </div>
                <p
                  className={cn(
                    "text-[13px] font-medium",
                    offering.price === null ? "text-muted-foreground" : "text-ink-900",
                  )}
                >
                  {offering.price === null
                    ? servicesCopy.quotedLabel
                    : `${money(offering.price, offering.currency)} / ${offering.unit}`}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-5 text-[13px] text-muted-foreground">{servicesCopy.empty}</p>
        )}
      </Panel>

      <Panel title={listingFlowCopy.reviewDocuments} onEdit={() => onEdit("documents")}>
        <ul className="grid gap-2">
          {kinds.map((kind) => (
            <li
              key={kind}
              className="flex flex-wrap items-center justify-between gap-2 border-t border-border py-2 first:border-0 first:pt-0"
            >
              <span className="text-[13px] text-ink-800">
                {documentCatalog[kind].label}
                {documentCatalog[kind].required ? (
                  <span aria-hidden="true" className="text-ink-900">
                    *
                  </span>
                ) : null}
              </span>
              <DocumentStatusBadge status={byKind.get(kind)?.status ?? "missing"} />
            </li>
          ))}
        </ul>
      </Panel>

      {!submitted ? (
        <div className="flex flex-wrap items-center justify-end gap-3 border-t border-border pt-6">
          <Button
            type="button"
            variant="primary"
            size="md"
            isLoading={isSubmitting}
            onClick={onSubmit}
          >
            {missing.length > 0 || error ? copy.resubmit : copy.submit}
          </Button>
        </div>
      ) : null}
    </div>
  );
}

function Panel({
  title,
  onEdit,
  children,
}: {
  title: string;
  onEdit: () => void;
  children: React.ReactNode;
}) {
  return (
    <Card variant="solid" radius="lg" padding="none" className="gap-4 p-5 sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <h4 className="text-[13px] font-semibold tracking-wide text-muted-foreground uppercase">
          {title}
        </h4>
        <Button type="button" variant="ghost" size="sm" onClick={onEdit}>
          <PencilLine className="size-4" />
          {listingFlowCopy.edit}
        </Button>
      </div>
      <div>{children}</div>
    </Card>
  );
}

function text(value: string) {
  return value?.trim() ? value : listingFlowCopy.reviewNothing;
}

function list(values: string[]) {
  return values.length > 0 ? values.join(", ") : listingFlowCopy.reviewNothing;
}

/** Currency codes come from a picker, but a bad one must not blank the page. */
function money(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}
