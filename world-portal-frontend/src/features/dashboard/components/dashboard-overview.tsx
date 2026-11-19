"use client";

import Link from "next/link";

import {
  ArrowRight,
  BookUser,
  CircleDollarSign,
  ClipboardList,
  FileCheck2,
  Hourglass,
  type LucideIcon,
  TrendingUp,
  Users,
} from "lucide-react";
import { MotionConfig } from "motion/react";

import { StatCard, TableError, VisaStatusBadge } from "@/components/admin";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton, SkeletonText } from "@/components/ui/skeleton";
import { overview, visaCategoryLabels, visaStatusLabels } from "@/content/admin";
import { useDashboard } from "@/features/dashboard/api/use-dashboard";
import { BarList } from "@/features/dashboard/components/bar-list";
import { ShareBar } from "@/features/dashboard/components/share-bar";
import { WeeklyChart } from "@/features/dashboard/components/weekly-chart";
import { formatMultiCurrencyInline, formatRelative } from "@/lib/utils";
import type { DashboardStats } from "@/types";

function ListLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Button
      asChild
      variant="link"
      size="sm"
      className="h-auto px-0 text-[12.5px] text-primary"
    >
      <Link href={href}>
        {children}
        <ArrowRight className="size-3.5" />
      </Link>
    </Button>
  );
}

/** "What needs attention first" — counts that open the queue behind them. */
function AttentionTiles({ stats }: { stats: DashboardStats }) {
  const count = (status: string) =>
    stats.visaPipeline.find((p) => p.status === status)?.count ?? 0;
  const copy = overview.attention;
  const tiles: {
    label: string;
    hint: string;
    status: string;
    icon: LucideIcon;
    tone: "info" | "warning" | "brand";
  }[] = [
    {
      label: copy.awaitingEvaluation,
      hint: copy.awaitingEvaluationHint,
      status: "SUBMITTED",
      icon: ClipboardList,
      tone: "info",
    },
    {
      label: copy.awaitingPayment,
      hint: copy.awaitingPaymentHint,
      status: "EVALUATED",
      icon: CircleDollarSign,
      tone: "warning",
    },
    {
      label: copy.underReview,
      hint: copy.underReviewHint,
      status: "UNDER_REVIEW",
      icon: Hourglass,
      tone: "brand",
    },
  ];

  return (
    <section aria-labelledby="attention-title" className="flex flex-col gap-3">
      <h2 id="attention-title" className="text-[13px] font-semibold text-foreground">
        {copy.title}
      </h2>
      <div className="grid gap-4 sm:grid-cols-3">
        {tiles.map((tile) => (
          <StatCard
            key={tile.status}
            icon={tile.icon}
            tone={tile.tone}
            label={tile.label}
            value={String(count(tile.status))}
            hint={tile.hint}
            action={
              <ListLink href={`/admin/applications?status=${tile.status}`}>
                {copy.open}
              </ListLink>
            }
          />
        ))}
      </div>
    </section>
  );
}

export function DashboardOverview() {
  const { data, isPending, isError, error, refetch, isRefetching } = useDashboard();

  if (isError) {
    return (
      <TableError
        title={overview.loadFailed}
        error={error}
        onRetry={() => void refetch()}
        isRetrying={isRefetching}
      />
    );
  }

  if (isPending) return <DashboardSkeleton />;

  const { stats, recent } = data;

  return (
    // Every chart animation respects the reader's reduced-motion setting.
    <MotionConfig reducedMotion="user">
      <div className="flex flex-col gap-6">
        <AttentionTiles stats={stats} />

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            icon={FileCheck2}
            label={overview.stats.visas}
            value={String(stats.visas.active)}
            hint={`${stats.visas.total} in total · ${stats.visas.approved} approved`}
            action={<ListLink href="/admin/applications">{overview.viewList}</ListLink>}
          />
          <StatCard
            icon={BookUser}
            label={overview.stats.passports}
            value={String(stats.passports.active)}
            hint={`${stats.passports.total} in total`}
            action={<ListLink href="/admin/passports">{overview.viewList}</ListLink>}
          />
          <StatCard
            icon={Users}
            label={overview.stats.customers}
            value={String(stats.customers.total)}
            action={<ListLink href="/admin/customers">{overview.viewList}</ListLink>}
          />
          <StatCard
            icon={TrendingUp}
            tone="success"
            label={overview.stats.revenue}
            value={formatMultiCurrencyInline(
              stats.revenue.revenueByCurrency,
              stats.revenue.currency,
              stats.revenue.collected,
            )}
            hint={`${formatMultiCurrencyInline(
              stats.revenue.outstandingByCurrency,
              stats.revenue.currency,
              stats.revenue.outstanding,
            )} outstanding`}
            action={<ListLink href="/admin/finance">{overview.viewList}</ListLink>}
          />
        </div>

        <div className="grid items-stretch gap-4 lg:grid-cols-3">
          <Card
            variant="solid"
            radius="lg"
            padding="none"
            className="flex flex-col justify-between p-5 lg:col-span-2"
          >
            <div>
              <CardTitle className="text-base">{overview.weekly.title}</CardTitle>
              <WeeklyChart data={stats.weekly} className="mt-5" />
            </div>
          </Card>

          <Card
            variant="solid"
            radius="lg"
            padding="none"
            className="flex flex-col justify-between p-5"
          >
            <div>
              <CardTitle className="text-base">{overview.services.title}</CardTitle>
              <ShareBar
                className="mt-5"
                segments={stats.visasByCategory.map((c) => ({
                  key: c.category,
                  label: visaCategoryLabels[c.category],
                  value: c.count,
                }))}
              />
            </div>
          </Card>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <Card variant="solid" radius="lg" padding="none" className="p-5">
            <CardTitle className="text-base">{overview.pipeline.title}</CardTitle>
            <CardDescription className="text-[13px]">
              {overview.pipeline.body}
            </CardDescription>
            <BarList
              className="mt-5"
              items={stats.visaPipeline.map((p) => ({
                key: p.status,
                label: visaStatusLabels[p.status],
                value: p.count,
                href: `/admin/applications?status=${p.status}`,
              }))}
            />
          </Card>

          <Card
            variant="solid"
            radius="lg"
            padding="none"
            className="gap-0 p-5 lg:col-span-2"
          >
            <div className="flex items-center justify-between gap-4">
              <CardTitle className="text-base">{overview.recent.title}</CardTitle>
              <Button
                asChild
                variant="ghost"
                size="sm"
                className="text-muted-foreground"
              >
                <Link href="/admin/applications">
                  {overview.recent.cta}
                  <ArrowRight className="size-3.5" />
                </Link>
              </Button>
            </div>

            {recent.length === 0 ? (
              <EmptyState
                icon={FileCheck2}
                title={overview.recent.emptyTitle}
                description={overview.recent.emptyBody}
                className="mt-5"
              />
            ) : (
              <ul className="mt-2 divide-y divide-border/60">
                {recent.map((application) => (
                  <li key={application.id}>
                    <Link
                      href={`/admin/applications/${application.id}`}
                      className="-mx-2 flex items-center gap-4 rounded-xl px-2 py-3 transition-colors hover:bg-muted/40"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13.5px] font-medium text-foreground">
                          {application.applicant.name}
                        </p>
                        <p className="truncate text-[12.5px] text-muted-foreground">
                          {visaCategoryLabels[application.category]} ·{" "}
                          {application.destination}
                        </p>
                      </div>
                      <VisaStatusBadge status={application.status} />
                      <span className="hidden w-24 shrink-0 text-right text-[12px] text-muted-foreground sm:block">
                        {formatRelative(application.createdAt)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </MotionConfig>
  );
}

function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i} className="rounded-2xl border border-border bg-card p-5">
            <Skeleton shape="text" className="w-28" />
            <Skeleton className="mt-4 h-9 w-16" />
          </div>
        ))}
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="rounded-2xl border border-border bg-card p-5">
            <Skeleton shape="text" className="w-28" />
            <Skeleton className="mt-4 h-9 w-24" />
            <Skeleton shape="pill" className="mt-3 h-5 w-20" />
          </div>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-5 lg:col-span-2">
          <Skeleton shape="text" className="w-32" />
          <Skeleton className="mt-5 h-[168px] w-full" />
        </div>
        <div className="rounded-2xl border border-border bg-card p-5">
          <Skeleton shape="text" className="w-32" />
          <Skeleton className="mt-5 h-3 w-full rounded-full" />
          <SkeletonText lines={3} className="mt-5" />
        </div>
      </div>
    </div>
  );
}
