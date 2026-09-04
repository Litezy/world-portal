"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";

import { AlertTriangle, Check, Search, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useVisaApplication } from "@/features/visa/api/visa-documentation";
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

export function TrackPanel() {
  const params = useSearchParams();
  const initial = params.get("ref") ?? "";

  const [input, setInput] = React.useState(initial);
  const [reference, setReference] = React.useState(initial || null);

  const { data, isFetching, error } = useVisaApplication(reference);

  return (
    <div className="grid gap-8">
      <Card variant="glass" radius="2xl" padding="none" className="p-6 sm:p-7">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setReference(input.trim() || null);
          }}
          className="flex flex-col gap-3 sm:flex-row"
        >
          <label htmlFor="reference" className="sr-only">
            Application reference
          </label>
          <Input
            id="reference"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="VISA-2026-8941"
            autoComplete="off"
            spellCheck={false}
            className="font-mono uppercase"
            leftIcon={<Search />}
          />
          <Button
            type="submit"
            variant="primary"
            size="md"
            isLoading={isFetching}
            loadingText="Checking…"
            className="shrink-0"
          >
            Track application
          </Button>
        </form>
        <p className="mt-3 text-[12.5px] text-muted-foreground">
          Use the reference from your confirmation — it looks like{" "}
          <span className="font-mono">VISA-2026-8941</span>. No account needed.
        </p>
      </Card>

      {isFetching && !data ? <TrackSkeleton /> : null}
      {error && !isFetching ? <TrackError error={error} /> : null}
      {data && !isFetching ? <ApplicationSummary application={data} /> : null}
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
          ? "We could not find that reference"
          : "Could not load that application"}
      </h2>
      <p className="text-[13.5px] leading-relaxed text-muted-foreground">
        {notFound
          ? "Check the reference for typos. It is case-sensitive and looks like VISA-2026-8941."
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
