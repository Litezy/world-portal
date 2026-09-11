"use client";

import * as React from "react";

import { CheckCircle2, FileText, FileUp, RefreshCw } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { agencyListing } from "@/content/agency";
import { useSetListingDocument } from "@/features/agency/api/use-listing";
import { documentCatalog } from "@/features/agency/catalog";
import { DocumentStatusBadge } from "@/features/agency/components/agency-badges";
import { listingFlowCopy } from "@/features/agency/components/listing/copy";
import { isDocumentSatisfied } from "@/features/agency/components/listing/form";
import type { AgencyDocument, AgencyDocumentKind } from "@/features/agency/types";
import {
  ACCEPT_ATTRIBUTE,
  useUploadDocument,
  validateFile,
} from "@/features/visa/api/upload";
import { cn } from "@/lib/utils";

const copy = agencyListing.documents;

/** `<input type="date">` hands back exactly this, and nothing partial. */
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * One line of the compliance checklist.
 *
 * The file goes to `POST /upload` on selection — the same one-at-a-time
 * pattern as the visa flow — and only then is the returned URL recorded
 * against the listing. Uploading on selection rather than on submit means a
 * failed upload is visible while the agency is still looking at this row.
 */
export function DocumentRow({
  kind,
  document,
  disabled,
}: {
  kind: AgencyDocumentKind;
  document: AgencyDocument | undefined;
  disabled: boolean;
}) {
  const entry = documentCatalog[kind];
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [error, setError] = React.useState<string | null>(null);
  const upload = useUploadDocument();
  const setDocument = useSetListingDocument();
  const fileId = React.useId();
  const expiryId = `${fileId}-expiry`;

  const busy = upload.isPending || setDocument.isPending;
  const satisfied = isDocumentSatisfied(kind, document);
  const needsExpiry =
    entry.expires && Boolean(document?.fileUrl) && !document?.expiresAt;

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setError(null);

    const invalid = validateFile(file);
    if (invalid) {
      setError(invalid);
      return;
    }

    try {
      const uploaded = await upload.mutateAsync(file);
      await setDocument.mutateAsync({
        kind,
        fileName: uploaded.originalName ?? file.name,
        fileUrl: uploaded.url,
        // Re-uploading replaces the file; the date it was already carrying
        // stays unless the agency changes it.
        ...(document?.expiresAt ? { expiresAt: document.expiresAt } : {}),
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "That upload failed. Please try again.",
      );
    } finally {
      // Let the same file be chosen again after a failure.
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function handleExpiry(value: string) {
    if (!ISO_DATE.test(value)) return;
    if (!document?.fileUrl || !document.fileName) return;
    setError(null);

    try {
      await setDocument.mutateAsync({
        kind,
        fileName: document.fileName,
        fileUrl: document.fileUrl,
        expiresAt: value,
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not save that date. Try again.",
      );
    }
  }

  return (
    <div
      className={cn(
        "grid gap-3 rounded-2xl border p-4 transition-colors sm:p-5",
        satisfied ? "border-success/40 bg-success/6" : "border-border/70 bg-card",
        document?.status === "rejected" && "border-destructive/50 bg-destructive/5",
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <span
            className={cn(
              "grid size-9 shrink-0 place-items-center rounded-xl",
              satisfied
                ? "bg-success/15 text-success"
                : "bg-secondary text-muted-foreground",
            )}
          >
            {satisfied ? (
              <CheckCircle2 className="size-4" />
            ) : (
              <FileText className="size-4" />
            )}
          </span>
          <div className="min-w-0">
            <p className="flex items-center gap-px text-[14px] font-semibold text-ink-900">
              {entry.label}
              {entry.required ? (
                <span aria-hidden="true" className="text-ink-900">
                  *
                </span>
              ) : null}
            </p>
            {/* The ask is never opaque: every document says why it is wanted. */}
            <p className="mt-0.5 text-[12.5px] leading-snug text-muted-foreground">
              {entry.why}
            </p>
          </div>
        </div>

        <DocumentStatusBadge status={document?.status ?? "missing"} />
      </div>

      {document?.status === "rejected" && document.note ? (
        <Alert variant="destructive">
          {/* The reviewer's words, verbatim — paraphrasing them loses the fix. */}
          <AlertDescription>{document.note}</AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
        <div className="grid gap-1.5">
          <p className="truncate text-[13px] text-ink-800">
            {busy
              ? listingFlowCopy.uploading
              : (document?.fileName ?? listingFlowCopy.noFile)}
          </p>

          {busy ? (
            <div
              role="progressbar"
              aria-label={listingFlowCopy.uploading}
              className="h-1.5 w-full overflow-hidden rounded-full bg-primary/25"
            >
              <div className="h-full w-full animate-pulse rounded-full bg-primary" />
            </div>
          ) : (
            <p className="text-[11.5px] text-muted-foreground">{copy.accepted}</p>
          )}
        </div>

        <Button
          type="button"
          variant={document?.fileUrl ? "outline" : "solid"}
          size="sm"
          disabled={disabled || busy}
          onClick={() => inputRef.current?.click()}
        >
          {document?.fileUrl ? (
            <RefreshCw className="size-4" />
          ) : (
            <FileUp className="size-4" />
          )}
          {document?.fileUrl ? copy.replace : copy.upload}
        </Button>

        <input
          ref={inputRef}
          id={fileId}
          type="file"
          accept={ACCEPT_ATTRIBUTE}
          className="sr-only"
          aria-label={`${copy.upload} — ${entry.label}`}
          disabled={disabled || busy}
          onChange={(event) => handleFile(event.target.files?.[0])}
        />
      </div>

      {entry.expires ? (
        <div className="grid gap-1.5 border-t border-border/70 pt-3 sm:max-w-xs">
          <label
            htmlFor={expiryId}
            className="flex items-center gap-px text-[13px] leading-none font-semibold tracking-tight"
          >
            {copy.expiry}
            <span aria-hidden="true" className="text-ink-900">
              *
            </span>
          </label>
          <Input
            id={expiryId}
            type="date"
            size="sm"
            defaultValue={document?.expiresAt?.slice(0, 10) ?? ""}
            disabled={disabled || !document?.fileUrl || busy}
            aria-invalid={needsExpiry || undefined}
            onChange={(event) => handleExpiry(event.target.value)}
          />
          <p
            className={cn(
              "text-[11.5px]",
              needsExpiry ? "text-destructive" : "text-muted-foreground",
            )}
          >
            {!document?.fileUrl
              ? listingFlowCopy.expiryLocked
              : needsExpiry
                ? listingFlowCopy.expiryMissing
                : copy.expiryHint}
          </p>
        </div>
      ) : null}

      {error ? (
        <p role="alert" className="text-xs font-medium text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}
