"use client";

import Link from "next/link";

import { ArrowRight, FileCheck2, Inbox, TrendingUp, Users } from "lucide-react";

import { EnquiryStatusBadge } from "@/components/admin";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton, SkeletonText } from "@/components/ui/skeleton";
import { applicationStatusLabels, overview, serviceLabels } from "@/content/admin";
import { useDashboard } from "@/features/dashboard/api/use-dashboard";
import { BarList } from "@/features/dashboard/components/bar-list";
import { ShareBar } from "@/features/dashboard/components/share-bar";
import { StatCard } from "@/features/dashboard/components/stat-card";
import { WeeklyChart } from "@/features/dashboard/components/weekly-chart";
import { formatCurrency, formatRelative } from "@/lib/utils";

export function DashboardOverview() {
  const { data, isPending, isError, error, refetch } = useDashboard();

  if (isError) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Could not load the dashboard</AlertTitle>
        <AlertDescription className="flex flex-col items-start gap-3">
          {error instanceof Error ? error.message : "Please try again."}
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            Retry
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  if (isPending) return <DashboardSkeleton />;

  const { stats, recent } = data;

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={Inbox}
          label={overview.stats.enquiries}
          value={String(stats.enquiries.open)}
          hint={`of ${stats.enquiries.total} total`}
          change={stats.enquiries.change}
        />
        <StatCard
          icon={FileCheck2}
          label={overview.stats.applications}
          value={String(stats.applications.active)}
          hint={`of ${stats.applications.total} total`}
          change={stats.applications.change}
        />
        <StatCard
          icon={Users}
          label={overview.stats.customers}
          value={String(stats.customers.total)}
          change={stats.customers.change}
        />
        <StatCard
          icon={TrendingUp}
          label={overview.stats.revenue}
          value={formatCurrency(stats.revenue.amount, stats.revenue.currency)}
          change={stats.revenue.change}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card variant="solid" radius="lg" padding="none" className="p-5 lg:col-span-2">
          <CardTitle className="text-base">{overview.weekly.title}</CardTitle>
          <WeeklyChart data={stats.weekly} className="mt-5" />
        </Card>

        <Card variant="solid" radius="lg" padding="none" className="p-5">
          <CardTitle className="text-base">{overview.services.title}</CardTitle>
          <ShareBar
            className="mt-5"
            segments={stats.enquiriesByService.map((s) => ({
              label: serviceLabels[s.service],
              value: s.count,
            }))}
          />
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
            items={stats.pipeline.map((p) => ({
              label: applicationStatusLabels[p.status],
              value: p.count,
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
            <Button asChild variant="ghost" size="sm" className="text-muted-foreground">
              <Link href="/admin/enquiries">
                {overview.recent.cta}
                <ArrowRight className="size-3.5" />
              </Link>
            </Button>
          </div>

          {recent.length === 0 ? (
            <EmptyState
              icon={Inbox}
              title="No enquiries yet"
              description="New submissions from the site land here."
              className="mt-5"
            />
          ) : (
            <ul className="mt-2 divide-y divide-border/60">
              {recent.map((enquiry) => (
                <li key={enquiry.id}>
                  <Link
                    href={`/admin/enquiries/${enquiry.id}`}
                    className="-mx-2 flex items-center gap-4 rounded-xl px-2 py-3 transition-colors hover:bg-ink-50"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13.5px] font-medium text-foreground">
                        {enquiry.fullName}
                      </p>
                      <p className="truncate text-[12.5px] text-muted-foreground">
                        {serviceLabels[enquiry.service]} · {enquiry.destination}
                      </p>
                    </div>
                    <EnquiryStatusBadge status={enquiry.status} />
                    <span className="hidden w-24 shrink-0 text-right text-[12px] text-muted-foreground sm:block">
                      {formatRelative(enquiry.createdAt)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-6">
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
