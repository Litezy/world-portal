"use client";

import Link from "next/link";

import { ArrowLeft, Mail, Phone } from "lucide-react";

import {
  DetailItem,
  DetailList,
  DetailLoadError,
  PassportStatusBadge,
  PaymentStatusBadge,
  VisaStatusBadge,
} from "@/components/admin";
import { UserAvatar } from "@/components/admin/user-avatar";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Skeleton, SkeletonText } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { customers, visaCategoryLabels } from "@/content/admin";
import { useCustomer } from "@/features/customers/api/use-customers";
import { formatCurrency, formatDate, formatMultiCurrencyInline } from "@/lib/utils";
import type { PassportApplication, VisaApplication } from "@/types";

const copy = customers.detail;

function cost(app: { totalAmount: number; currency: string }) {
  return app.totalAmount > 0
    ? formatCurrency(app.totalAmount, app.currency)
    : copy.notPriced;
}

/** One applicant, gathered from their applications — the desk's "who is this?" page. */
export function CustomerDetail({ customerKey }: { customerKey: string }) {
  const { data, isPending, isError, error, refetch } = useCustomer(customerKey);

  if (isError) {
    return (
      <DetailLoadError
        error={error}
        onRetry={() => void refetch()}
        backHref="/admin/customers"
        backLabel={copy.back}
        noun="applicant"
      />
    );
  }
  if (isPending) return <DetailSkeleton />;

  const { customer, visas, passports } = data;
  const paid = formatMultiCurrencyInline(customer.paidByCurrency);

  return (
    <div className="flex flex-col gap-6">
      <Button
        asChild
        variant="ghost"
        size="sm"
        className="-ml-2 w-fit text-muted-foreground"
      >
        <Link href="/admin/customers">
          <ArrowLeft />
          {copy.back}
        </Link>
      </Button>

      <Card variant="solid" radius="lg" padding="none" className="gap-0 p-6">
        <div className="flex items-center gap-4">
          <UserAvatar user={{ name: customer.name }} size="lg" />
          <div className="min-w-0">
            <p className="text-[11px] font-medium tracking-[0.12em] text-muted-foreground uppercase">
              {copy.eyebrow}
            </p>
            <h1 className="mt-1 truncate text-2xl font-semibold tracking-[-0.02em] text-foreground">
              {customer.name}
            </h1>
          </div>
        </div>

        <DetailList className="mt-8 sm:grid-cols-3">
          <DetailItem label={copy.email}>
            <a
              href={`mailto:${customer.email}`}
              className="inline-flex items-center gap-2 break-all hover:underline"
            >
              <Mail className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
              {customer.email}
            </a>
          </DetailItem>
          <DetailItem label={copy.phone}>
            {customer.phone ? (
              <a
                href={`tel:${customer.phone}`}
                className="inline-flex items-center gap-2 hover:underline"
              >
                <Phone className="size-3.5 text-muted-foreground" aria-hidden />
                {customer.phone}
              </a>
            ) : (
              "—"
            )}
          </DetailItem>
          <DetailItem label={copy.country}>{customer.country || "—"}</DetailItem>
          <DetailItem label={copy.firstSeen}>
            {formatDate(customer.createdAt)}
          </DetailItem>
          <DetailItem label={copy.lastActive}>
            {formatDate(customer.lastActiveAt)}
          </DetailItem>
          <DetailItem label={copy.paid}>
            <span className="font-semibold tabular-nums">
              {paid || copy.nothingPaid}
            </span>
          </DetailItem>
        </DetailList>
      </Card>

      <ApplicationsCard
        title={copy.visas(visas.length)}
        empty={copy.noVisas}
        rows={visas}
        hrefOf={(v) => `/admin/applications/${v.id}`}
        detailOf={(v: VisaApplication) =>
          `${v.destination} · ${visaCategoryLabels[v.category]}`
        }
        stageOf={(v: VisaApplication) => <VisaStatusBadge status={v.status} />}
      />
      <ApplicationsCard
        title={copy.passports(passports.length)}
        empty={copy.noPassports}
        rows={passports}
        hrefOf={(p) => `/admin/passports/${p.id}`}
        detailOf={(p: PassportApplication) => p.category}
        stageOf={(p: PassportApplication) => <PassportStatusBadge status={p.status} />}
      />
    </div>
  );
}

function ApplicationsCard<T extends VisaApplication | PassportApplication>({
  title,
  empty,
  rows,
  hrefOf,
  detailOf,
  stageOf,
}: {
  title: string;
  empty: string;
  rows: T[];
  hrefOf: (row: T) => string;
  detailOf: (row: T) => string;
  stageOf: (row: T) => React.ReactNode;
}) {
  return (
    <Card variant="solid" radius="lg" padding="none" className="gap-0 overflow-hidden">
      <div className="p-6 pb-3">
        <CardTitle className="text-base">{title}</CardTitle>
      </div>
      {rows.length === 0 ? (
        <p className="px-6 pb-6 text-[13px] text-muted-foreground">{empty}</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>{copy.reference}</TableHead>
              <TableHead className="hidden sm:table-cell">{copy.destination}</TableHead>
              <TableHead>{copy.stage}</TableHead>
              <TableHead className="hidden md:table-cell">{copy.payment}</TableHead>
              <TableHead className="text-right">{copy.cost}</TableHead>
              <TableHead className="hidden text-right md:table-cell">
                {copy.submitted}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell>
                  <Link
                    href={hrefOf(row)}
                    className="font-mono font-medium text-primary hover:underline"
                    aria-label={copy.open(row.reference)}
                  >
                    {row.reference}
                  </Link>
                </TableCell>
                <TableCell className="hidden text-muted-foreground sm:table-cell">
                  {detailOf(row)}
                </TableCell>
                <TableCell>{stageOf(row)}</TableCell>
                <TableCell className="hidden md:table-cell">
                  <PaymentStatusBadge status={row.paymentStatus} />
                </TableCell>
                <TableCell className="text-right tabular-nums">{cost(row)}</TableCell>
                <TableCell className="hidden text-right text-muted-foreground md:table-cell">
                  {formatDate(row.createdAt)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </Card>
  );
}

function DetailSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-2xl border border-border bg-card p-6">
        <Skeleton className="h-7 w-52" />
        <SkeletonText lines={4} className="mt-8" />
      </div>
      <div className="rounded-2xl border border-border bg-card p-6">
        <SkeletonText lines={3} />
      </div>
    </div>
  );
}
