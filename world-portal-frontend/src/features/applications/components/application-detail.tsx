"use client";

import Link from "next/link";

import { ArrowLeft, FileText, Mail } from "lucide-react";

import {
  DetailItem,
  DetailList,
  DetailLoadError,
  PaymentStatusBadge,
  VisaStatusBadge,
} from "@/components/admin";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Skeleton, SkeletonText } from "@/components/ui/skeleton";
import { applications as copy, visaCategoryLabels } from "@/content/admin";
import { useApplication } from "@/features/applications/api/use-application";
import { ApplicationTimeline } from "@/features/applications/components/application-timeline";
import { ConfirmBankPaymentModal } from "@/features/applications/components/confirm-bank-payment-modal";
import { DocumentViewerModal } from "@/features/applications/components/document-viewer-modal";
import { EvaluateCostForm } from "@/features/applications/components/evaluate-cost-form";
import { InviteApplicantModal } from "@/features/applications/components/invite-applicant-modal";
import { ReadOnlyCaseNote } from "@/features/applications/components/read-only-case-note";
import { StatusActions } from "@/features/applications/components/status-actions";
import { cn, formatCurrency, formatDate } from "@/lib/utils";

/**
 * Most embassies want six months of validity beyond the stay. Flag a passport
 * that runs out before then so it is caught at review, not at the border.
 */
function passportExpiresSoon(expiry: string, returnDate: string) {
  const expires = Date.parse(expiry);
  const back = Date.parse(returnDate);
  if (Number.isNaN(expires) || Number.isNaN(back)) return false;
  const sixMonths = 182 * 86_400_000;
  return expires < back + sixMonths;
}

/** `canAct`: the signed-in role may work the desk (MANAGER or STAFF). */
export function ApplicationDetail({ id, canAct }: { id: string; canAct: boolean }) {
  const { data: application, isPending, isError, error, refetch } = useApplication(id);

  if (isError) {
    return (
      <DetailLoadError
        error={error}
        onRetry={() => void refetch()}
        backHref="/admin/applications"
        backLabel="Back to applications"
        noun="application"
      />
    );
  }

  if (isPending) return <DetailSkeleton />;

  return (
    <div className="flex flex-col gap-6">
      <Button
        asChild
        variant="ghost"
        size="sm"
        className="-ml-2 w-fit text-muted-foreground"
      >
        <Link href="/admin/applications">
          <ArrowLeft />
          All applications
        </Link>
      </Button>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] lg:items-start">
        <Card variant="solid" radius="lg" padding="none" className="gap-0 p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-medium tracking-[0.12em] text-muted-foreground uppercase">
                {copy.detail.eyebrow} · {application.reference}
              </p>
              <h1 className="mt-2 text-2xl font-semibold tracking-[-0.02em] text-foreground">
                {application.applicant.key ? (
                  <Link
                    href={`/admin/customers/${application.applicant.key}`}
                    className="hover:underline"
                  >
                    {application.applicant.name}
                  </Link>
                ) : (
                  application.applicant.name
                )}
              </h1>
              <p className="mt-1 text-[13px] text-muted-foreground">
                {application.destination} · {visaCategoryLabels[application.category]}
              </p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <VisaStatusBadge status={application.status} size="md" />
              <PaymentStatusBadge status={application.paymentStatus} />
            </div>
          </div>

          <DetailList className="mt-8 sm:grid-cols-3">
            <DetailItem label={copy.detail.applicant}>
              <a
                href={`mailto:${application.applicant.email}`}
                className="inline-flex items-center gap-2 hover:underline"
              >
                <Mail className="size-3.5 text-muted-foreground" />
                {application.applicant.email}
              </a>
            </DetailItem>
            <DetailItem label={copy.detail.phone}>
              {application.applicant.phone ? (
                <a
                  href={`tel:${application.applicant.phone}`}
                  className="hover:underline"
                >
                  {application.applicant.phone}
                </a>
              ) : (
                copy.detail.notGiven
              )}
            </DetailItem>
            <DetailItem label={copy.detail.nationality}>
              {application.nationality}
            </DetailItem>
            <DetailItem label={copy.detail.dateOfBirth}>
              {application.dateOfBirth
                ? formatDate(application.dateOfBirth)
                : copy.detail.notGiven}
            </DetailItem>
            <DetailItem label={copy.detail.gender}>
              {application.gender ?? copy.detail.notGiven}
            </DetailItem>
            <DetailItem label={copy.detail.passport}>
              <span className="font-mono text-[12.5px]">
                {application.passportNumber}
              </span>
            </DetailItem>
            <DetailItem label={copy.detail.passportExpiry}>
              {application.passportExpiryDate ? (
                <span
                  className={cn(
                    passportExpiresSoon(
                      application.passportExpiryDate,
                      application.returnDate,
                    ) && "font-medium text-destructive-text",
                  )}
                >
                  {formatDate(application.passportExpiryDate)}
                  {passportExpiresSoon(
                    application.passportExpiryDate,
                    application.returnDate,
                  )
                    ? ` · ${copy.detail.expiresSoon}`
                    : null}
                </span>
              ) : (
                copy.detail.notGiven
              )}
            </DetailItem>
            <DetailItem label={copy.detail.travel}>
              {formatDate(application.travelDate, { day: "numeric", month: "short" })}
              {" – "}
              {formatDate(application.returnDate)}
            </DetailItem>
            <DetailItem label={copy.detail.fee}>
              {application.totalAmount > 0
                ? formatCurrency(application.totalAmount, application.currency)
                : "Not evaluated"}
            </DetailItem>
            <DetailItem label={copy.detail.outstanding}>
              {formatCurrency(application.balanceDue, application.currency)}
              <span className="ml-2 text-[12px] text-muted-foreground">
                {formatCurrency(application.amountPaid, application.currency)}{" "}
                {copy.detail.paid.toLowerCase()}
              </span>
            </DetailItem>
          </DetailList>

          <DetailList className="mt-8 sm:grid-cols-2">
            <DetailItem label={copy.detail.purpose}>{application.purpose}</DetailItem>
            <DetailItem label={copy.detail.address}>
              {application.residenceAddress ?? copy.detail.notGiven}
            </DetailItem>
            <DetailItem label={copy.detail.evaluatedBy}>
              {application.evaluatedBy
                ? `${application.evaluatedBy}${
                    application.evaluatedAt
                      ? ` · ${formatDate(application.evaluatedAt)}`
                      : ""
                  }`
                : copy.detail.notYet}
            </DetailItem>
            <DetailItem label={copy.detail.reviewedBy}>
              {application.reviewedBy ?? copy.detail.notYet}
            </DetailItem>
          </DetailList>

          {/* Uploaded Documents & Files */}
          <div className="mt-8">
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="size-4 text-primary" />
              Uploaded Documents & Files
            </CardTitle>
            <CardDescription className="text-[12.5px]">
              Review files and verification attachments submitted by applicant.
            </CardDescription>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {application.documents && application.documents.length > 0 ? (
                application.documents.map((doc, idx) => (
                  <div
                    key={`${doc.label}-${idx}`}
                    className="flex items-center justify-between gap-3 rounded-xl border border-border/70 bg-muted/30 p-3.5 transition-colors hover:border-primary/40"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                        <FileText className="size-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-xs font-semibold text-foreground">
                          {doc.label}
                        </p>
                        <p className="truncate font-mono text-[11px] text-muted-foreground">
                          Attachment #{idx + 1}
                        </p>
                      </div>
                    </div>

                    <DocumentViewerModal label={doc.label} url={doc.url} />
                  </div>
                ))
              ) : (
                <div className="col-span-2 rounded-xl border border-dashed border-border/70 bg-muted/20 p-4 text-center text-xs text-muted-foreground">
                  No uploaded document files attached to this application.
                </div>
              )}
            </div>
          </div>

          <div className="mt-8">
            <CardTitle className="text-base">{copy.detail.timeline}</CardTitle>
            <CardDescription className="text-[12.5px]">
              {copy.detail.timelineNote}
            </CardDescription>
            <ApplicationTimeline events={application.timeline} />
          </div>
        </Card>

        {canAct ? (
          <div className="flex flex-col gap-4">
            <Card variant="solid" radius="lg" padding="none" className="p-6">
              <StatusActions
                type="visa"
                id={id}
                status={application.status}
                reference={application.reference}
                applicantName={application.applicant.name}
              />
            </Card>

            <Card variant="solid" radius="lg" padding="none" className="gap-4 p-6">
              <CardTitle className="text-base">{copy.detail.evaluate}</CardTitle>
              <EvaluateCostForm
                id={id}
                totalAmount={application.totalAmount}
                currency={application.currency}
                allowInstallment={application.allowInstallment}
                status={application.status}
                paymentStatus={application.paymentStatus}
                applicantName={application.applicant.name}
              />
            </Card>

            <ConfirmBankPaymentModal
              id={id}
              totalAmount={application.totalAmount}
              amountPaid={application.amountPaid}
              balanceDue={application.balanceDue}
              currency={application.currency}
              allowInstallment={application.allowInstallment}
            />

            <InviteApplicantModal
              id={id}
              applicantName={application.applicant.name}
              applicantEmail={application.applicant.email}
              status={application.status}
            />
          </div>
        ) : (
          <ReadOnlyCaseNote />
        )}
      </div>
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
      <div className="rounded-2xl border border-border bg-card p-6">
        <Skeleton shape="text" className="w-36" />
        <Skeleton className="mt-3 h-7 w-52" />
        <SkeletonText lines={5} className="mt-8" />
      </div>
      <div className="rounded-2xl border border-border bg-card p-6">
        <Skeleton className="h-11 w-full" />
        <Skeleton className="mt-4 h-20 w-full" />
      </div>
    </div>
  );
}
