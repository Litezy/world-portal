"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";

import {
  AlertTriangle,
  ArrowLeft,
  Check,
  KeyRound,
  Mail,
  Search,
  ShieldCheck,
  X,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { normalizeReference, useVisaApplication } from "@/features/visa/api/visa-documentation";
import {
  paymentStatusCopy,
  STATUS_FLOW,
  statusCopy,
  statusIndex,
} from "@/features/visa/status";
import { toAmount, type VisaDocumentation } from "@/features/visa/types";
import { BankAccountPaymentInfo } from "@/features/visa/components/bank-account-payment-info";
import { ApiError } from "@/lib/api-client";
import { cn, formatCurrency, formatDate } from "@/lib/utils";

import { BackendPassportApplication, PassportStatus } from "@/server/data/backend-types";

type TrackStep = "DETAILS" | "OTP" | "VERIFIED";

export function TrackPanel() {
  const params = useSearchParams();
  const initialRef = params.get("ref") ?? "";

  const [referenceInput, setReferenceInput] = React.useState(initialRef);
  const [emailInput, setEmailInput] = React.useState("");

  const [step, setStep] = React.useState<TrackStep>("DETAILS");
  const [otpCode, setOtpCode] = React.useState("");

  const [isSendingOtp, setIsSendingOtp] = React.useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = React.useState(false);
  const [otpError, setOtpError] = React.useState<string | null>(null);
  const [otpSuccessMsg, setOtpSuccessMsg] = React.useState<string | null>(null);

  const [verifiedRef, setVerifiedRef] = React.useState<string | null>(null);
  const [verifiedEmail, setVerifiedEmail] = React.useState<string | null>(null);

  const { data, isFetching, error } = useVisaApplication(verifiedRef, verifiedEmail);

  // Send OTP handler
  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!referenceInput.trim()) {
      setOtpError("Please enter your application reference number.");
      return;
    }
    if (!emailInput.trim() || !emailInput.includes("@")) {
      setOtpError("Please enter a valid applicant email address.");
      return;
    }

    setOtpError(null);
    setOtpSuccessMsg(null);
    setIsSendingOtp(true);

    try {
      const res = await fetch("/api/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailInput.trim() }),
      });
      const body = await res.json();
      if (!res.ok) {
        throw new Error(body.error || "Failed to send verification code");
      }

      setStep("OTP");
      setOtpSuccessMsg("Verification code sent to your email address.");
    } catch (err: any) {
      setOtpError(err.message || "Failed to send verification code.");
    } finally {
      setIsSendingOtp(false);
    }
  };

  // Verify OTP handler
  const handleVerifyOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!otpCode.trim() || otpCode.trim().length !== 6) {
      setOtpError("Please enter the 6-digit verification code.");
      return;
    }

    setOtpError(null);
    setOtpSuccessMsg(null);
    setIsVerifyingOtp(true);

    try {
      const res = await fetch("/api/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailInput.trim(), code: otpCode.trim() }),
      });
      const body = await res.json();
      if (!res.ok) {
        throw new Error(body.error || "Invalid or expired verification code");
      }

      // Verification successful! Set verified tracking state with normalized reference
      setVerifiedRef(normalizeReference(referenceInput));
      setVerifiedEmail(emailInput.trim());
      setStep("VERIFIED");
    } catch (err: any) {
      setOtpError(err.message || "Invalid or expired verification code.");
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const handleReset = () => {
    setStep("DETAILS");
    setVerifiedRef(null);
    setVerifiedEmail(null);
    setOtpCode("");
    setOtpError(null);
    setOtpSuccessMsg(null);
  };

  return (
    <div className="grid gap-8">
      {step !== "VERIFIED" ? (
        <Card variant="glass" radius="2xl" padding="none" className="p-6 sm:p-7">
          {step === "DETAILS" ? (
            <form onSubmit={handleSendOtp} className="flex flex-col gap-4">
              <div>
                <h2 className="text-[17px] font-semibold text-ink-900">
                  Verify & Track Application
                </h2>
                <p className="mt-1 text-[13px] text-muted-foreground">
                  Provide your application reference number and applicant email address to receive a verification code.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="reference"
                    className="mb-1.5 block text-[12.5px] font-medium text-ink-800"
                  >
                    Application Reference
                  </label>
                  <Input
                    id="reference"
                    value={referenceInput}
                    onChange={(e) => setReferenceInput(e.target.value)}
                    placeholder="VISA-2026-8941 or PASSPORT-2026-8941"
                    autoComplete="off"
                    spellCheck={false}
                    className="font-mono uppercase"
                    leftIcon={<Search />}
                  />
                </div>

                <div>
                  <label
                    htmlFor="email"
                    className="mb-1.5 block text-[12.5px] font-medium text-ink-800"
                  >
                    Applicant Email
                  </label>
                  <Input
                    id="email"
                    type="email"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder="applicant@example.com"
                    autoComplete="email"
                    leftIcon={<Mail />}
                  />
                </div>
              </div>

              {otpError ? (
                <p className="text-[13px] text-destructive font-medium">{otpError}</p>
              ) : null}

              <div className="flex justify-end">
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  isLoading={isSendingOtp}
                  loadingText="Sending OTP…"
                  className="w-full sm:w-auto"
                >
                  Send Verification Code
                </Button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="flex flex-col gap-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <Badge variant="solid" className="mb-2">
                    Step 2: Enter Verification Code
                  </Badge>
                  <h2 className="text-[17px] font-semibold text-ink-900">
                    Check your email inbox
                  </h2>
                  <p className="mt-1 text-[13px] text-muted-foreground">
                    We sent a 6-digit code to{" "}
                    <span className="font-semibold text-ink-900">{emailInput}</span> for
                    application{" "}
                    <span className="font-mono font-semibold text-ink-900">
                      {referenceInput}
                    </span>
                    .
                  </p>
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleReset}
                  className="shrink-0 text-muted-foreground"
                >
                  <ArrowLeft className="mr-1 size-3.5" />
                  Edit details
                </Button>
              </div>

              {/* OTP code sent via email */}

              <div>
                <label
                  htmlFor="otpCode"
                  className="mb-1.5 block text-[12.5px] font-medium text-ink-800"
                >
                  6-Digit OTP Code
                </label>
                <div className="flex gap-3">
                  <Input
                    id="otpCode"
                    value={otpCode}
                    onChange={(e) =>
                      setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                    }
                    placeholder="123456"
                    maxLength={6}
                    className="font-mono text-center tracking-widest text-[18px]"
                    leftIcon={<KeyRound />}
                  />
                  <Button
                    type="submit"
                    variant="primary"
                    size="md"
                    isLoading={isVerifyingOtp}
                    loadingText="Verifying…"
                    className="shrink-0"
                  >
                    Verify & Track
                  </Button>
                </div>
              </div>

              {otpError ? (
                <p className="text-[13px] text-destructive font-medium">{otpError}</p>
              ) : null}

              {otpSuccessMsg ? (
                <p className="text-[13px] text-success font-medium">
                  {otpSuccessMsg}
                </p>
              ) : null}

              <div className="flex items-center justify-between pt-2 border-t border-border/50 text-[12.5px]">
                <span className="text-muted-foreground">Didn't receive the code?</span>
                <button
                  type="button"
                  onClick={() => handleSendOtp()}
                  disabled={isSendingOtp}
                  className="font-medium text-primary hover:underline disabled:opacity-50"
                >
                  Resend code
                </button>
              </div>
            </form>
          )}
        </Card>
      ) : (
        <div className="flex items-center justify-between rounded-xl border border-success/30 bg-success/10 px-5 py-3.5">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="size-5 text-success" />
            <span className="text-[13.5px] font-medium text-ink-900">
              Verified identity for <span className="font-semibold">{verifiedEmail}</span>
            </span>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleReset}
          >
            Track another application
          </Button>
        </div>
      )}

      {step === "VERIFIED" && isFetching && !data ? <TrackSkeleton /> : null}
      {step === "VERIFIED" && error && !isFetching ? <TrackError error={error} /> : null}
      {step === "VERIFIED" && data && !isFetching ? (
        data.type === "PASSPORT" ? (
          <PassportApplicationSummary application={data.data} />
        ) : (
          <ApplicationSummary application={data.data} />
        )
      ) : null}
    </div>
  );
}

function TrackSkeleton() {
  return (
    <Card variant="solid" radius="2xl" padding="lg" className="gap-5">
      <Skeleton shape="text" className="w-40" />
      <Skeleton className="h-24 w-full rounded-xl" />
      <Skeleton shape="text" className="w-2/3" />
    </Card>
  );
}

function TrackError({ error }: { error: unknown }) {
  const notFound = error instanceof ApiError && error.status === 404;

  return (
    <Card variant="solid" radius="2xl" padding="lg" className="items-start gap-3">
      <span className="grid size-10 place-items-center rounded-full bg-destructive/12 text-destructive">
        <AlertTriangle className="size-5" />
      </span>
      <h2 className="text-[17px] font-semibold text-ink-900">
        {notFound
          ? "We could not find a matching application"
          : "Could not load that application"}
      </h2>
      <p className="text-[13.5px] leading-relaxed text-muted-foreground">
        {notFound
          ? "Please check that your application reference number and email address are correct. Reference numbers look like VISA-2026-8941 or PASSPORT-2026-8941."
          : error instanceof Error
            ? error.message
            : "Please try again shortly."}
      </p>
    </Card>
  );
}

function ApplicationSummary({ application }: { application: VisaDocumentation }) {
  const rejected = application.status === "REJECTED";
  const current = statusIndex(application.status);
  const total = toAmount(application.totalAmount);
  const paid = toAmount(application.amountPaid);
  const due = toAmount(application.balanceDue);

  return (
    <Card variant="solid" radius="2xl" padding="none" className="gap-0 p-6 sm:p-8">
      <header className="flex flex-wrap items-start justify-between gap-4 border-b border-border pb-6">
        <div>
          <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
            Application
          </p>
          <p className="font-mono text-[19px] font-semibold text-ink-900">
            {application.applicationNo}
          </p>
          <p className="mt-1 text-[13px] text-muted-foreground">
            {application.firstName} {application.lastName} · {application.targetCountry}
            {application.visaCategory
              ? ` · ${application.visaCategory.toLowerCase()}`
              : ""}
          </p>
        </div>
        <Badge variant={rejected ? "destructive" : "solid"} size="lg">
          {statusCopy[application.status].label}
        </Badge>
      </header>

      {rejected ? (
        <div className="mt-6 rounded-xl border border-destructive/25 bg-destructive/8 p-4">
          <p className="flex items-center gap-2 text-[13px] font-semibold text-destructive">
            <X className="size-4" strokeWidth={3} />
            Application rejected
          </p>
          <p className="mt-2 text-[13.5px] leading-relaxed text-ink-800">
            {application.rejectionReason ??
              "No reason was recorded. Please contact your consultant."}
          </p>
        </div>
      ) : (
        <ol className="mt-7 grid gap-0">
          {STATUS_FLOW.map((status, i) => {
            const done = i < current;
            const active = i === current;
            const last = i === STATUS_FLOW.length - 1;

            return (
              <li key={status} className="relative flex gap-4 pb-7 last:pb-0">
                {!last ? (
                  <span
                    aria-hidden="true"
                    className={cn(
                      "absolute top-8 left-[13px] h-[calc(100%-2rem)] w-px",
                      done ? "bg-success" : "bg-border",
                    )}
                  />
                ) : null}

                <span
                  className={cn(
                    "z-10 grid size-7 shrink-0 place-items-center rounded-full text-[11px] font-semibold",
                    done && "bg-success text-success-foreground",
                    active &&
                      "bg-primary text-primary-foreground ring-4 ring-primary/30",
                    !done && !active && "bg-secondary text-muted-foreground",
                  )}
                >
                  {done ? <Check className="size-3.5" strokeWidth={3} /> : i + 1}
                </span>

                <div className="pt-0.5">
                  <p
                    className={cn(
                      "text-[14.5px] font-semibold tracking-tight",
                      active || done ? "text-ink-900" : "text-muted-foreground",
                    )}
                  >
                    {statusCopy[status].label}
                  </p>
                  <p className="mt-1 max-w-md text-[13px] leading-relaxed text-muted-foreground">
                    {statusCopy[status].description}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
      )}

      <dl className="mt-2 grid gap-5 border-t border-border pt-6 sm:grid-cols-3">
        <div>
          <dt className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
            Payment
          </dt>
          <dd className="mt-1 text-[14px] font-medium text-ink-900">
            {paymentStatusCopy[application.paymentStatus]}
          </dd>
        </div>
        <div>
          <dt className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
            Total / paid
          </dt>
          <dd className="mt-1 text-[14px] font-medium text-ink-900">
            {/* Decimals arrive as strings — see types.ts */}
            {total === null
              ? "Not yet costed"
              : `${formatCurrency(total, application.currency)} · ${formatCurrency(paid ?? 0, application.currency)} paid`}
          </dd>
        </div>
        <div>
          <dt className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
            Balance due
          </dt>
          <dd className="mt-1 text-[14px] font-medium text-ink-900">
            {due === null ? "—" : formatCurrency(due, application.currency)}
          </dd>
        </div>
      </dl>

      {application.verificationNotes ? (
        <p className="mt-6 border-t border-border pt-5 text-[13px] leading-relaxed text-muted-foreground">
          <span className="font-medium text-ink-900">Note from your consultant: </span>
          {application.verificationNotes}
        </p>
      ) : null}

      {(application.status === "EVALUATED" ||
        application.paymentStatus === "AWAITING_PAYMENT" ||
        application.paymentStatus === "PARTIALLY_PAID") && (
        <BankAccountPaymentInfo applicationNo={application.applicationNo} />
      )}

      <p className="mt-6 text-[12px] text-muted-foreground">
        Submitted {formatDate(application.createdAt)} · last updated{" "}
        {formatDate(application.updatedAt)}
      </p>
    </Card>
  );
}

const PASSPORT_STATUS_FLOW: PassportStatus[] = [
  "SUBMITTED",
  "UNDER_REVIEW",
  "APPROVED",
];

const passportStatusCopy: Record<
  PassportStatus,
  { label: string; description: string }
> = {
  SUBMITTED: {
    label: "Submitted",
    description:
      "We have received your e-Passport application and uploaded documents. An immigration officer is reviewing your file.",
  },
  UNDER_REVIEW: {
    label: "Under Review",
    description:
      "Your details and National Identity Number (NIN) records are under official processing & verification.",
  },
  APPROVED: {
    label: "Approved & Ready",
    description:
      "Your passport application is approved and scheduled for physical biometric capture / passport collection.",
  },
  REJECTED: {
    label: "Rejected",
    description: "This passport application was not approved. The reason is shown below.",
  },
};

function PassportApplicationSummary({
  application,
}: {
  application: BackendPassportApplication;
}) {
  const rejected = application.status === "REJECTED";
  const current = PASSPORT_STATUS_FLOW.indexOf(application.status as PassportStatus);

  const categoryLabel =
    application.passportCategory === "FRESH"
      ? "Fresh Application"
      : application.passportCategory === "RENEWAL"
        ? "Re-issue / Renewal"
        : application.passportCategory === "DAMAGE"
          ? "Damaged Passport Replacement"
          : application.passportCategory;

  const validityLabel =
    application.validity === "FIVE_YEARS" ? "5 Years" : "10 Years";
  const bookletLabel =
    application.bookletType === "THIRTY_TWO_PAGES" ? "32 Pages" : "64 Pages";

  return (
    <Card variant="solid" radius="2xl" padding="none" className="gap-0 p-6 sm:p-8">
      <header className="flex flex-wrap items-start justify-between gap-4 border-b border-border pb-6">
        <div>
          <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
            Passport Application
          </p>
          <p className="font-mono text-[19px] font-semibold text-ink-900">
            {application.applicationNo}
          </p>
          <p className="mt-1 text-[13px] text-muted-foreground">
            {application.firstName} {application.surname} · Nigeria e-Passport ({categoryLabel})
          </p>
        </div>
        <Badge variant={rejected ? "destructive" : "solid"} size="lg">
          {passportStatusCopy[application.status as PassportStatus]?.label || application.status}
        </Badge>
      </header>

      {rejected ? (
        <div className="mt-6 rounded-xl border border-destructive/25 bg-destructive/8 p-4">
          <p className="flex items-center gap-2 text-[13px] font-semibold text-destructive">
            <X className="size-4" strokeWidth={3} />
            Application rejected
          </p>
          <p className="mt-2 text-[13.5px] leading-relaxed text-ink-800">
            {application.rejectionReason ??
              "No reason was recorded. Please contact support."}
          </p>
        </div>
      ) : (
        <ol className="mt-7 grid gap-0">
          {PASSPORT_STATUS_FLOW.map((status, i) => {
            const done = i < current;
            const active = i === current;
            const last = i === PASSPORT_STATUS_FLOW.length - 1;

            return (
              <li key={status} className="relative flex gap-4 pb-7 last:pb-0">
                {!last ? (
                  <span
                    aria-hidden="true"
                    className={cn(
                      "absolute top-8 left-[13px] h-[calc(100%-2rem)] w-px",
                      done ? "bg-success" : "bg-border",
                    )}
                  />
                ) : null}

                <span
                  className={cn(
                    "z-10 grid size-7 shrink-0 place-items-center rounded-full text-[11px] font-semibold",
                    done && "bg-success text-success-foreground",
                    active &&
                      "bg-primary text-primary-foreground ring-4 ring-primary/30",
                    !done && !active && "bg-secondary text-muted-foreground",
                  )}
                >
                  {done ? <Check className="size-3.5" strokeWidth={3} /> : i + 1}
                </span>

                <div className="pt-0.5">
                  <p
                    className={cn(
                      "text-[14.5px] font-semibold tracking-tight",
                      active || done ? "text-ink-900" : "text-muted-foreground",
                    )}
                  >
                    {passportStatusCopy[status].label}
                  </p>
                  <p className="mt-1 max-w-md text-[13px] leading-relaxed text-muted-foreground">
                    {passportStatusCopy[status].description}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
      )}

      <dl className="mt-2 grid gap-5 border-t border-border pt-6 sm:grid-cols-3">
        <div>
          <dt className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
            Passport Category
          </dt>
          <dd className="mt-1 text-[14px] font-medium text-ink-900">
            {categoryLabel}
          </dd>
        </div>
        <div>
          <dt className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
            Booklet Type
          </dt>
          <dd className="mt-1 text-[14px] font-medium text-ink-900">
            {bookletLabel} ({validityLabel})
          </dd>
        </div>
        <div>
          <dt className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
            State of Origin / Town
          </dt>
          <dd className="mt-1 text-[14px] font-medium text-ink-900">
            {application.stateOfOrigin || "N/A"}
          </dd>
        </div>
      </dl>

      {application.verificationNotes ? (
        <p className="mt-6 border-t border-border pt-5 text-[13px] leading-relaxed text-muted-foreground">
          <span className="font-medium text-ink-900">Note from officer: </span>
          {application.verificationNotes}
        </p>
      ) : null}

      <p className="mt-6 text-[12px] text-muted-foreground">
        Submitted {formatDate(application.createdAt)} · last updated{" "}
        {formatDate(application.updatedAt)}
      </p>
    </Card>
  );
}
