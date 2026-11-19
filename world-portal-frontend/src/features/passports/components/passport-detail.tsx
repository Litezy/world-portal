"use client";

import Link from "next/link";

import { ArrowLeft, FileText, Mail, ShieldCheck, UserCheck } from "lucide-react";

import {
  DetailItem,
  DetailList,
  DetailLoadError,
  PassportStatusBadge,
  PaymentStatusBadge,
} from "@/components/admin";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Skeleton, SkeletonText } from "@/components/ui/skeleton";
import { applications, humanise, passports as copy } from "@/content/admin";
import { ApplicationTimeline } from "@/features/applications/components/application-timeline";
import { ConfirmBankPaymentModal } from "@/features/applications/components/confirm-bank-payment-modal";
import { DocumentViewerModal } from "@/features/applications/components/document-viewer-modal";
import { EvaluateCostForm } from "@/features/applications/components/evaluate-cost-form";
import { InviteApplicantModal } from "@/features/applications/components/invite-applicant-modal";
import { ReadOnlyCaseNote } from "@/features/applications/components/read-only-case-note";
import { StatusActions } from "@/features/applications/components/status-actions";
import { usePassport } from "@/features/passports/api/use-passport";
import { formatCurrency, formatDate, formatRelative } from "@/lib/utils";

/** `canAct`: the signed-in role may work the desk (MANAGER or STAFF). */
export function PassportDetail({ id, canAct }: { id: string; canAct: boolean }) {
  const { data: record, isPending, isError, error, refetch } = usePassport(id);

  if (isError) {
    return (
      <DetailLoadError
        error={error}
        onRetry={() => void refetch()}
        backHref="/admin/passports"
        backLabel="Back to passport applications"
        noun="passport application"
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
        <Link href="/admin/passports">
          <ArrowLeft />
          All passport applications
        </Link>
      </Button>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] lg:items-start">
        {/* Main Application Details Card */}
        <Card variant="solid" radius="lg" padding="none" className="gap-0 p-6 sm:p-7">
          {/* Header */}
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border/70 pb-6">
            <div>
              <p className="text-[11px] font-medium tracking-[0.12em] text-muted-foreground uppercase">
                {copy.detail.eyebrow} · {record.reference}
              </p>
              <h1 className="mt-2 text-2xl font-semibold tracking-[-0.02em] text-foreground">
                {record.applicant.key ? (
                  <Link
                    href={`/admin/customers/${record.applicant.key}`}
                    className="hover:underline"
                  >
                    {record.applicant.name}
                  </Link>
                ) : (
                  record.applicant.name
                )}
              </h1>
              <p className="mt-1 text-[13px] text-muted-foreground">
                Nigeria e-Passport · {humanise(record.category)} (
                {humanise(record.bookletType)}, {humanise(record.validity)}) ·{" "}
                {formatRelative(record.createdAt)}
              </p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <PassportStatusBadge status={record.status} size="md" />
              <PaymentStatusBadge status={record.paymentStatus} />
            </div>
          </div>

          {/* Financial Summary & Fee Evaluation */}
          <DetailList className="mt-6 border-b border-border/70 pb-6 sm:grid-cols-3">
            <DetailItem label="Total Processing Fee">
              <span className="font-semibold text-foreground">
                {record.totalAmount > 0
                  ? formatCurrency(record.totalAmount, record.currency)
                  : "Not evaluated"}
              </span>
            </DetailItem>
            <DetailItem label="Amount Paid">
              <span className="font-mono font-medium text-success-text">
                {formatCurrency(record.amountPaid, record.currency)}
              </span>
            </DetailItem>
            <DetailItem label="Balance Outstanding">
              <span className="font-mono font-medium text-foreground">
                {formatCurrency(record.balanceDue, record.currency)}
              </span>
            </DetailItem>
            <DetailItem label={applications.detail.evaluatedBy}>
              {record.evaluatedBy ?? applications.detail.notYet}
            </DetailItem>
            <DetailItem label={applications.detail.reviewedBy}>
              {record.reviewedBy ?? applications.detail.notYet}
            </DetailItem>
          </DetailList>

          {/* Personal Identification & Demographics */}
          <div className="mt-6">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold text-primary">
              <UserCheck className="size-4" />
              Personal Identification & Demographics
            </CardTitle>

            <DetailList className="mt-4 sm:grid-cols-3">
              <DetailItem label={copy.detail.applicant}>
                <a
                  href={`mailto:${record.applicant.email}`}
                  className="inline-flex items-center gap-1.5 font-medium text-primary hover:underline"
                >
                  <Mail className="size-3.5 text-muted-foreground" />
                  {record.applicant.email}
                </a>
              </DetailItem>
              <DetailItem label="Phone Number">
                {record.applicant.phone ?? "—"}
              </DetailItem>
              <DetailItem label="NIN Number">
                <span className="font-mono font-medium text-foreground">
                  {record.ninNumber || "—"}
                </span>
              </DetailItem>
              <DetailItem label="Gender / Sex">{record.sex || "—"}</DetailItem>
              <DetailItem label="Date of Birth">
                {record.dateOfBirth ? formatDate(record.dateOfBirth) : "—"}
              </DetailItem>
              <DetailItem label="Place of Birth">
                {record.placeOfBirth || "—"}
              </DetailItem>
              <DetailItem label="State of Origin">
                {record.stateOfOrigin || "—"}
              </DetailItem>
              <DetailItem label="Home Town">{record.homeTown || "—"}</DetailItem>
              <DetailItem label="Occupation">{record.occupation || "—"}</DetailItem>
              <DetailItem label="Marital Status">
                {record.maritalStatus || "—"}
              </DetailItem>
              <DetailItem label="Booklet & Validity">
                {humanise(record.bookletType)} ({humanise(record.validity)})
              </DetailItem>
              <DetailItem label="Existing Passport #">
                <span className="font-mono text-xs">
                  {record.existingPassportNumber || "None (Fresh)"}
                </span>
              </DetailItem>
            </DetailList>

            <div className="mt-4 border-t border-border/50 pt-4">
              <DetailItem label="Permanent Address">
                <span className="text-[13px] leading-relaxed text-foreground">
                  {record.permanentAddress || "—"}
                </span>
              </DetailItem>
            </div>

            {/* Features summary */}
            {(record.colourOfEyes ||
              record.colourOfHair ||
              record.height ||
              record.maidenName) && (
              <div className="mt-4 grid gap-3 border-t border-border/50 pt-4 text-xs sm:grid-cols-4">
                <div>
                  <span className="block text-[11px] text-muted-foreground">
                    Eye Colour
                  </span>
                  <span className="font-medium text-foreground">
                    {record.colourOfEyes || "—"}
                  </span>
                </div>
                <div>
                  <span className="block text-[11px] text-muted-foreground">
                    Hair Colour
                  </span>
                  <span className="font-medium text-foreground">
                    {record.colourOfHair || "—"}
                  </span>
                </div>
                <div>
                  <span className="block text-[11px] text-muted-foreground">
                    Height
                  </span>
                  <span className="font-medium text-foreground">
                    {record.height || "—"}
                  </span>
                </div>
                <div>
                  <span className="block text-[11px] text-muted-foreground">
                    Maiden Name
                  </span>
                  <span className="font-medium text-foreground">
                    {record.maidenName || "—"}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Next of Kin Information */}
          {record.nextOfKin && (
            <div className="mt-8 border-t border-border/70 pt-6">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold text-primary">
                <ShieldCheck className="size-4" />
                Next of Kin Details
              </CardTitle>

              <DetailList className="mt-4 sm:grid-cols-3">
                <DetailItem label="Next of Kin Name">
                  {record.nextOfKin.name || "—"}
                </DetailItem>
                <DetailItem label="Relationship">
                  {record.nextOfKin.relationship || "—"}
                </DetailItem>
                <DetailItem label="Contact Phone">
                  {record.nextOfKin.phone || "—"}
                </DetailItem>
              </DetailList>
              <div className="mt-3">
                <DetailItem label="Residential Address">
                  {record.nextOfKin.address || "—"}
                </DetailItem>
              </div>
            </div>
          )}

          {/* Uploaded Document Attachments */}
          <div className="mt-8 border-t border-border/70 pt-6">
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="size-4 text-primary" />
              Uploaded Passport Documents & Slips
            </CardTitle>
            <CardDescription className="text-[12.5px]">
              Review mandatory white background photo, NIN slip, and optional birth
              certificate attachments.
            </CardDescription>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {record.documents && record.documents.length > 0 ? (
                record.documents.map((doc, idx) => (
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

          {/* Review Notes */}
          {(record.verificationNotes || record.rejectionReason) && (
            <div className="mt-8 border-t border-border/70 pt-6">
              <CardTitle className="text-base">{copy.detail.notes}</CardTitle>
              <p className="mt-3 rounded-xl border border-border/60 bg-muted/40 p-4 text-[13.5px] leading-relaxed text-pretty text-muted-foreground">
                {record.rejectionReason ?? record.verificationNotes}
              </p>
            </div>
          )}

          {/* Application Audit Timeline */}
          {record.timeline && record.timeline.length > 0 && (
            <div className="mt-8 border-t border-border/70 pt-6">
              <CardTitle className="text-base">
                {applications.detail.timeline}
              </CardTitle>
              <CardDescription className="text-[12.5px]">
                {applications.detail.timelineNote}
              </CardDescription>
              <ApplicationTimeline events={record.timeline} />
            </div>
          )}
        </Card>

        {/* Action Sidebar */}
        {canAct ? (
          <div className="flex flex-col gap-4">
            <Card variant="solid" radius="lg" padding="none" className="p-6">
              <StatusActions
                type="passport"
                id={id}
                status={record.status}
                reference={record.reference}
                applicantName={record.applicant.name}
              />
            </Card>

            {/* Fee Evaluation Form */}
            <Card variant="solid" radius="lg" padding="none" className="gap-4 p-6">
              <CardTitle className="text-base">
                {applications.detail.evaluate}
              </CardTitle>
              <EvaluateCostForm
                id={id}
                totalAmount={record.totalAmount}
                currency={record.currency}
                allowInstallment={record.allowInstallment}
                type="passport"
                status={record.status}
                paymentStatus={record.paymentStatus}
                applicantName={record.applicant.name}
              />
            </Card>

            {/* Bank Payment Confirmation */}
            <ConfirmBankPaymentModal
              id={id}
              totalAmount={record.totalAmount}
              amountPaid={record.amountPaid}
              balanceDue={record.balanceDue}
              currency={record.currency}
              allowInstallment={record.allowInstallment}
              type="passport"
            />

            {/* Appointment Invitation Modal */}
            <InviteApplicantModal
              id={id}
              applicantName={record.applicant.name}
              applicantEmail={record.applicant.email}
              status={record.status}
              type="passport"
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
        <SkeletonText lines={8} className="mt-8" />
      </div>
      <div className="rounded-2xl border border-border bg-card p-6">
        <Skeleton className="h-11 w-full" />
      </div>
    </div>
  );
}
