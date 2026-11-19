"use client";

import * as React from "react";

import {
  Building2,
  Calendar,
  CheckCircle2,
  ExternalLink,
  Eye,
  FileCheck2,
  Globe,
  Mail,
  MapPin,
  Phone,
  Users,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

import {
  ConfirmDialog,
  DataTablePagination,
  DataTableToolbar,
  StatusTabs,
  TableError,
} from "@/components/admin";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { agencies as copy } from "@/content/admin";
import {
  useAdminAgencies,
  useUpdateAgencyDocument,
  useUpdateAgencyVerification,
} from "@/features/agency/api/use-admin-agencies";
import { categoryCatalog, documentCatalog } from "@/features/agency/catalog";
import type {
  Agency,
  AgencyDocument,
  AgencyVerificationStatus,
} from "@/features/agency/types";
import {
  DocumentViewerModal,
  LinkUnavailable,
} from "@/features/applications/components/document-viewer-modal";
import { useListParams } from "@/hooks/use-list-params";
import { safeHttpsUrl } from "@/lib/safe-url";
import { cn } from "@/lib/utils";
import { rejectionNoteSchema } from "@/validations/admin";

const VERIFICATIONS = ["pending", "unverified", "verified", "suspended"] as const;

const verificationTone: Record<
  string,
  "solid" | "softWarning" | "destructive" | "muted"
> = {
  verified: "solid",
  pending: "softWarning",
  suspended: "destructive",
};

const documentTone: Record<string, "solid" | "softWarning" | "destructive"> = {
  approved: "solid",
  rejected: "destructive",
  missing: "destructive",
};

function isVerification(value?: string): value is AgencyVerificationStatus {
  return (VERIFICATIONS as readonly string[]).includes(value ?? "");
}

function documentLabel(kind: string) {
  return (
    documentCatalog[kind as keyof typeof documentCatalog]?.label ??
    kind
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ")
  );
}

function categoryLabel(category: string) {
  return categoryCatalog[category as keyof typeof categoryCatalog]?.label ?? category;
}

function paperwork(agency: Agency) {
  const docs = agency.documents ?? [];
  return {
    approved: docs.filter((d) => d.status === "approved").length,
    total: docs.length,
  };
}

type Decision = { kind: "verify" | "suspend"; agency: Agency };
type Rejecting = { agency: Agency; document: AgencyDocument };

/**
 * Partner agencies. List state (search, verification, page) is in the URL;
 * changes are applied at once and put back if the server refuses them.
 * Going live and coming off the platform both ask first.
 */
export function AdminAgenciesTable() {
  const { params, set } = useListParams();
  const verification = isVerification(params.status) ? params.status : undefined;
  const query = useAdminAgencies({ q: params.q, page: params.page, verification });
  const setVerification = useUpdateAgencyVerification();
  const setDocument = useUpdateAgencyDocument();

  const [openAgency, setOpenAgency] = React.useState<Agency | null>(null);
  const [decision, setDecision] = React.useState<Decision | null>(null);
  const [rejecting, setRejecting] = React.useState<Rejecting | null>(null);

  // The dialog follows the cache, so an optimistic change shows there too; it
  // keeps the last copy if a filter has just moved the agency off this page.
  const current = openAgency
    ? (query.data?.data.find((a) => a.id === openAgency.id) ?? openAgency)
    : null;

  async function decide() {
    if (!decision) return;
    const { kind, agency } = decision;
    setDecision(null);
    try {
      await setVerification.mutateAsync({
        id: agency.id,
        verification: kind === "verify" ? "verified" : "suspended",
      });
      toast.success(
        kind === "verify" ? copy.verified(agency.name) : copy.suspended(agency.name),
      );
    } catch {
      toast.error(copy.failed);
    }
  }

  async function approveDocument(agency: Agency, document: AgencyDocument) {
    try {
      await setDocument.mutateAsync({
        agencyId: agency.id,
        kind: document.kind,
        status: "approved",
      });
      toast.success(copy.docApproved(documentLabel(document.kind)));
    } catch {
      toast.error(copy.failed);
    }
  }

  return (
    <Card variant="solid" radius="lg" padding="none" className="gap-0 overflow-hidden">
      <DataTableToolbar
        search={params.q}
        onSearch={(q) => set({ q })}
        placeholder={copy.searchPlaceholder}
      />
      <StatusTabs
        label={copy.filterLabel}
        value={verification}
        onChange={(status) => set({ status })}
        options={VERIFICATIONS.map((value) => ({
          value,
          label: copy.verificationLabels[value],
        }))}
      />

      <div className="p-4 sm:p-6">
        {query.isError ? (
          <TableError
            title={copy.loadFailed}
            error={query.error}
            onRetry={() => void query.refetch()}
            isRetrying={query.isRefetching}
          />
        ) : query.isPending ? (
          <div className="grid gap-4 lg:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-3 rounded-2xl border border-border p-5">
                <Skeleton shape="text" className="h-5 w-48" />
                <Skeleton shape="text" className="h-4 w-3/4" />
                <Skeleton shape="pill" className="h-5 w-24" />
              </div>
            ))}
          </div>
        ) : query.data.data.length === 0 ? (
          <EmptyState
            icon={Building2}
            title={copy.empty.title}
            description={copy.empty.body}
            className="border-0"
          />
        ) : (
          <div
            data-pending={query.isPlaceholderData || undefined}
            className="grid gap-4 data-pending:opacity-60 lg:grid-cols-2"
          >
            {query.data.data.map((agency) => (
              <AgencyCard
                key={agency.id}
                agency={agency}
                onOpen={() => setOpenAgency(agency)}
                onDecide={(kind) => setDecision({ kind, agency })}
              />
            ))}
          </div>
        )}
      </div>

      {query.data ? (
        <DataTablePagination
          meta={query.data.meta}
          onPage={(page) => set({ page })}
          noun="agencies"
        />
      ) : null}

      <Dialog
        open={Boolean(current)}
        onOpenChange={(open) => (!open ? setOpenAgency(null) : null)}
      >
        {current ? (
          <AgencyDetails
            agency={current}
            busyKind={setDocument.isPending ? setDocument.variables?.kind : undefined}
            onApprove={(document) => void approveDocument(current, document)}
            onReject={(document) => setRejecting({ agency: current, document })}
            onDecide={(kind) => setDecision({ kind, agency: current })}
          />
        ) : null}
      </Dialog>

      {decision ? (
        <ConfirmDialog
          open
          onOpenChange={(open) => (!open ? setDecision(null) : null)}
          tone={decision.kind === "verify" ? "default" : "danger"}
          title={
            decision.kind === "verify"
              ? copy.verifyTitle(decision.agency.name)
              : copy.suspendTitle(decision.agency.name)
          }
          description={decision.kind === "verify" ? copy.verifyBody : copy.suspendBody}
          confirmLabel={
            decision.kind === "verify" ? copy.verifyConfirm : copy.suspendConfirm
          }
          onConfirm={() => void decide()}
        />
      ) : null}

      {rejecting ? (
        <RejectDocumentDialog
          key={`${rejecting.agency.id}:${rejecting.document.kind}`}
          rejecting={rejecting}
          onClose={() => setRejecting(null)}
        />
      ) : null}
    </Card>
  );
}

function AgencyCard({
  agency,
  onOpen,
  onDecide,
}: {
  agency: Agency;
  onOpen: () => void;
  onDecide: (kind: Decision["kind"]) => void;
}) {
  const docs = paperwork(agency);
  return (
    <article className="flex flex-col justify-between rounded-2xl border border-border bg-card p-5 shadow-card transition-colors hover:border-primary/50">
      <div>
        <div className="mb-2 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-base leading-tight font-semibold text-foreground">
              <button
                type="button"
                onClick={onOpen}
                className="text-left hover:text-primary focus-visible:underline focus-visible:outline-none"
              >
                {agency.name}
              </button>
            </h3>
            <p className="mt-0.5 truncate text-xs text-muted-foreground">
              {agency.legalName} · {agency.registrationNumber}
            </p>
          </div>
          <Badge variant={verificationTone[agency.verification] ?? "muted"} size="sm">
            {copy.verificationLabels[agency.verification] ?? agency.verification}
          </Badge>
        </div>

        <div className="my-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-muted-foreground">
          <span className="flex items-center gap-1 font-medium text-foreground">
            <MapPin className="size-3.5 text-primary" aria-hidden />
            {agency.country}
            {agency.cities.length ? ` (${agency.cities.join(", ")})` : ""}
          </span>
          <span className="flex items-center gap-1">
            <Users className="size-3.5 text-primary" aria-hidden />
            {copy.staff(agency.staffCount)}
          </span>
          <span className="flex items-center gap-1 font-medium text-foreground">
            <FileCheck2 className="size-3.5 text-primary" aria-hidden />
            {copy.paperwork(docs.approved, docs.total)}
          </span>
        </div>

        <div className="mb-4 flex flex-wrap gap-1.5">
          {agency.categories.map((cat) => (
            <Badge key={cat} variant="muted" size="sm" className="text-[11px]">
              {categoryLabel(cat)}
            </Badge>
          ))}
        </div>
      </div>

      <div className="mt-2 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-4">
        <Button
          variant="ghost"
          size="sm"
          className="text-xs text-muted-foreground"
          onClick={onOpen}
          leftIcon={<Eye className="size-3.5" />}
        >
          {copy.viewDetails}
        </Button>
        <VerificationButtons agency={agency} onDecide={onDecide} />
      </div>
    </article>
  );
}

function VerificationButtons({
  agency,
  onDecide,
}: {
  agency: Agency;
  onDecide: (kind: Decision["kind"]) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      {agency.verification !== "verified" ? (
        <Button
          variant="primary"
          size="sm"
          onClick={() => onDecide("verify")}
          leftIcon={<CheckCircle2 className="size-3.5" />}
        >
          {copy.verify}
        </Button>
      ) : null}
      {agency.verification !== "suspended" ? (
        <Button
          variant="outline"
          size="sm"
          onClick={() => onDecide("suspend")}
          leftIcon={<XCircle className="size-3.5 text-destructive-text" />}
        >
          {copy.suspend}
        </Button>
      ) : null}
    </div>
  );
}

/** Exported for its tests; the table is what renders it. */
export function AgencyDetails({
  agency,
  busyKind,
  onApprove,
  onReject,
  onDecide,
}: {
  agency: Agency;
  busyKind?: string;
  onApprove: (document: AgencyDocument) => void;
  onReject: (document: AgencyDocument) => void;
  onDecide: (kind: Decision["kind"]) => void;
}) {
  const docs = paperwork(agency);
  // The agency typed this itself: linked only when it is https.
  const website = safeHttpsUrl(agency.website);
  return (
    <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
      <DialogHeader className="border-b border-border pb-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <DialogTitle className="text-xl font-bold text-foreground">
              {agency.name}
            </DialogTitle>
            <DialogDescription className="mt-1 text-xs">
              {agency.legalName} · {agency.registrationNumber}
            </DialogDescription>
          </div>
          <Badge variant={verificationTone[agency.verification] ?? "muted"} size="sm">
            {copy.verificationLabels[agency.verification] ?? agency.verification}
          </Badge>
        </div>
      </DialogHeader>

      <div className="space-y-6 py-2">
        <div className="grid grid-cols-1 gap-4 rounded-xl border border-border bg-muted/30 p-4 text-xs sm:grid-cols-2">
          <div className="space-y-2">
            <p className="flex items-center gap-2 font-medium text-foreground">
              <Mail className="size-4 shrink-0 text-primary" aria-hidden />
              <span className="truncate">{agency.email || copy.notProvided}</span>
            </p>
            <p className="flex items-center gap-2 text-muted-foreground">
              <Phone className="size-4 shrink-0 text-primary" aria-hidden />
              {agency.phone || copy.notProvided}
            </p>
            {website ? (
              <a
                href={website}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-primary hover:underline"
              >
                <Globe className="size-4 shrink-0" aria-hidden />
                <span className="truncate">{website}</span>
                <ExternalLink className="size-3" aria-hidden />
              </a>
            ) : agency.website ? (
              <p className="flex items-center gap-2 text-muted-foreground">
                <Globe className="size-4 shrink-0 text-primary" aria-hidden />
                <LinkUnavailable />
              </p>
            ) : null}
          </div>
          <div className="space-y-2">
            <p className="flex items-center gap-2 font-medium text-foreground">
              <MapPin className="size-4 shrink-0 text-primary" aria-hidden />
              {agency.country}
              {agency.cities.length ? ` (${agency.cities.join(", ")})` : ""}
            </p>
            <p className="flex items-center gap-2 text-muted-foreground">
              <Users className="size-4 shrink-0 text-primary" aria-hidden />
              {copy.staff(agency.staffCount)}
            </p>
            {agency.yearFounded ? (
              <p className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="size-4 shrink-0 text-primary" aria-hidden />
                {copy.founded(agency.yearFounded)}
              </p>
            ) : null}
          </div>
        </div>

        <section className="space-y-3">
          <h4 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
            {copy.sections.services}
          </h4>
          <div className="flex flex-wrap gap-1.5">
            {agency.categories.map((cat) => (
              <Badge key={cat} variant="muted" className="text-xs">
                {categoryLabel(cat)}
              </Badge>
            ))}
          </div>
          {agency.languages?.length ? (
            <p className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
              <span className="mr-1">{copy.sections.languages}:</span>
              {agency.languages.map((lang) => (
                <Badge key={lang} variant="outline" className="text-[11px]">
                  {lang}
                </Badge>
              ))}
            </p>
          ) : null}
        </section>

        {agency.summary || agency.about ? (
          <section className="space-y-2">
            <h4 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
              {copy.sections.about}
            </h4>
            <p className="rounded-lg border border-border bg-card p-3 text-xs leading-relaxed text-foreground">
              {agency.summary || agency.about}
            </p>
          </section>
        ) : null}

        <section className="space-y-3">
          <h4 className="flex items-center justify-between text-xs font-semibold tracking-wider text-muted-foreground uppercase">
            <span>{copy.sections.paperwork}</span>
            <span className="text-xs font-semibold text-primary normal-case">
              {copy.paperwork(docs.approved, docs.total)}
            </span>
          </h4>

          {docs.total === 0 ? (
            <p className="rounded-lg border border-dashed border-border bg-muted/20 p-3 text-xs text-muted-foreground">
              {copy.noPaperwork}
            </p>
          ) : (
            <ul className="space-y-2">
              {agency.documents.map((doc) => (
                <DocumentRow
                  key={doc.kind}
                  document={doc}
                  busy={busyKind === doc.kind}
                  disabled={Boolean(busyKind)}
                  onApprove={() => onApprove(doc)}
                  onReject={() => onReject(doc)}
                />
              ))}
            </ul>
          )}
        </section>
      </div>

      <div className="mt-2 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
        <p className="text-xs text-muted-foreground">
          {copy.listing}:{" "}
          <span className="font-semibold text-foreground">
            {copy.listingLabels[agency.listingStatus] ?? agency.listingStatus}
          </span>
        </p>
        <VerificationButtons agency={agency} onDecide={onDecide} />
      </div>
    </DialogContent>
  );
}

function DocumentRow({
  document,
  busy,
  disabled,
  onApprove,
  onReject,
}: {
  document: AgencyDocument;
  busy: boolean;
  disabled: boolean;
  onApprove: () => void;
  onReject: () => void;
}) {
  const label = documentLabel(document.kind);
  const missing = document.status === "missing";
  return (
    <li className="flex flex-col justify-between gap-3 rounded-lg border border-border bg-card p-3 text-xs sm:flex-row sm:items-center">
      <div className="flex min-w-0 items-start gap-2.5">
        <FileCheck2 className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
        <div className="min-w-0">
          <p className="truncate font-medium text-foreground">{label}</p>
          {document.fileUrl ? (
            <div className="mt-1">
              <DocumentViewerModal label={label} url={document.fileUrl} />
            </div>
          ) : null}
          {document.status === "rejected" && document.note ? (
            <p className="mt-1.5 rounded-md border border-destructive/20 bg-destructive-wash p-2 text-[11px] leading-tight text-destructive-text">
              <span className="font-semibold">{copy.rejectionNote}</span>{" "}
              {document.note}
            </p>
          ) : null}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <Badge variant={documentTone[document.status] ?? "softWarning"} size="sm">
          {copy.documentLabels[document.status] ?? document.status}
        </Badge>
        {!missing ? (
          <div className="flex items-center gap-1">
            {document.status !== "approved" ? (
              <Button
                variant="outline"
                size="sm"
                className="h-7 px-2 text-[11px]"
                disabled={disabled}
                isLoading={busy}
                onClick={onApprove}
                leftIcon={<CheckCircle2 className="size-3 text-success-text" />}
              >
                {copy.approveDoc}
              </Button>
            ) : null}
            {document.status !== "rejected" ? (
              <Button
                variant="outline"
                size="sm"
                className="h-7 px-2 text-[11px]"
                disabled={disabled}
                onClick={onReject}
                leftIcon={<XCircle className="size-3 text-destructive-text" />}
              >
                {copy.rejectDoc}
              </Button>
            ) : null}
          </div>
        ) : null}
      </div>
    </li>
  );
}

/** The reason is required: the agency reads it and fixes the file from it. */
function RejectDocumentDialog({
  rejecting,
  onClose,
}: {
  rejecting: Rejecting;
  onClose: () => void;
}) {
  const setDocument = useUpdateAgencyDocument();
  const [note, setNote] = React.useState(rejecting.document.note ?? "");
  const [touched, setTouched] = React.useState(false);
  const parsed = rejectionNoteSchema.safeParse(note);
  const error = parsed.success ? undefined : parsed.error.issues[0]?.message;
  const label = documentLabel(rejecting.document.kind);

  async function reject() {
    if (!parsed.success) return;
    try {
      await setDocument.mutateAsync({
        agencyId: rejecting.agency.id,
        kind: rejecting.document.kind,
        status: "rejected",
        note: parsed.data,
      });
      toast.success(copy.docRejected(label));
      onClose();
    } catch {
      toast.error(copy.failed);
    }
  }

  return (
    <ConfirmDialog
      open
      onOpenChange={(open) => (!open ? onClose() : null)}
      title={copy.rejectTitle(label)}
      description={copy.rejectBody}
      confirmLabel={copy.rejectConfirm}
      onConfirm={() => void reject()}
      isPending={setDocument.isPending}
      confirmDisabled={!parsed.success}
    >
      <div className="grid gap-1.5">
        <Label htmlFor="reject-note">{copy.rejectReasonLabel}</Label>
        <Textarea
          id="reject-note"
          rows={3}
          autoFocus
          value={note}
          placeholder={copy.rejectReasonPlaceholder}
          onChange={(e) => setNote(e.target.value)}
          onBlur={() => setTouched(true)}
          aria-invalid={touched && Boolean(error)}
          aria-describedby="reject-note-error"
        />
        {touched && error ? (
          <p
            id="reject-note-error"
            className={cn("text-[11.5px] text-destructive-text")}
          >
            {error}
          </p>
        ) : null}
      </div>
    </ConfirmDialog>
  );
}
