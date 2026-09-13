"use client";

import Link from "next/link";

import { Landmark, Pause, Play, Users } from "lucide-react";

import { DetailItem, DetailList, UserAvatar } from "@/components/admin";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { agencyPayouts, agencySettings as copy } from "@/content/agency";
import { useAgencyOverview } from "@/features/agency/api/use-overview";
import { useAgencyPayouts } from "@/features/agency/api/use-payouts";
import {
  ListingStatusBadge,
  VerificationBadge,
} from "@/features/agency/components/agency-badges";
import type { AgencyUser } from "@/features/agency/types";
import { formatCurrency } from "@/lib/utils";

/**
 * A reading screen. Everything that can actually be edited today lives in the
 * listing flow, so this states the position and hands over to `/agency/listing`
 * rather than growing a second set of forms against the same records.
 */
export function AgencySettingsView({ user }: { user?: AgencyUser }) {
  const overviewQuery = useAgencyOverview();
  const payoutsQuery = useAgencyPayouts({ perPage: 50 });

  const overview = overviewQuery.data;
  const paused = overview?.listingStatus === "paused";

  // The account is whatever the last run paid into — the only place the
  // masked destination is exposed to this side of the product.
  const account = [...(payoutsQuery.data?.data ?? [])].sort(
    (a, b) => new Date(b.periodEnd).getTime() - new Date(a.periodEnd).getTime(),
  )[0]?.destinationAccount;

  return (
    <div className="grid gap-4 lg:grid-cols-2 lg:items-start">
      <Card variant="solid" radius="lg" padding="none" className="gap-0 p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <CardTitle className="text-base">{copy.profile.title}</CardTitle>
            <CardDescription className="text-[13px]">
              {copy.profile.body}
            </CardDescription>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link href="/agency/listing">{copy.profile.cta}</Link>
          </Button>
        </div>

        {overviewQuery.isPending ? (
          <Skeleton shape="pill" className="mt-6 h-6 w-40" />
        ) : overview ? (
          <div className="mt-6 flex flex-wrap items-center gap-2">
            <VerificationBadge status={overview.verification} />
            <ListingStatusBadge status={overview.listingStatus} />
          </div>
        ) : null}
      </Card>

      <Card variant="solid" radius="lg" padding="none" className="gap-0 p-6">
        <div className="flex items-start gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
            <Landmark className="size-4" />
          </span>
          <div>
            <CardTitle className="text-base">{copy.payout.title}</CardTitle>
            <CardDescription className="text-[13px]">
              {copy.payout.body}
            </CardDescription>
          </div>
        </div>

        {payoutsQuery.isPending ? (
          <Skeleton shape="text" className="mt-6 w-44" />
        ) : (
          <DetailList className="mt-6 sm:grid-cols-2">
            <DetailItem label={agencyPayouts.columns.account}>
              {account ?? "—"}
            </DetailItem>
            <DetailItem label={agencyPayouts.stats.pending}>
              {overview ? (
                <span className="tabular-nums">
                  {formatCurrency(overview.pendingPayout, overview.currency)}
                </span>
              ) : (
                "—"
              )}
            </DetailItem>
          </DetailList>
        )}
      </Card>

      <Card variant="solid" radius="lg" padding="none" className="gap-0 p-6">
        <CardTitle className="text-base">{copy.team.title}</CardTitle>
        <CardDescription className="text-[13px]">{copy.team.body}</CardDescription>

        {user ? (
          <div className="mt-6 flex items-center gap-3">
            <UserAvatar user={{ name: user.name }} size="sm" className="ring-border" />
            <div className="min-w-0">
              <p className="truncate text-[13.5px] font-medium">{user.name}</p>
              <p className="truncate text-[12.5px] text-muted-foreground">
                {user.email}
              </p>
            </div>
          </div>
        ) : (
          <EmptyState
            icon={Users}
            title={copy.team.title}
            description={copy.team.body}
            className="mt-6"
          />
        )}
      </Card>

      <Card variant="solid" radius="lg" padding="none" className="gap-0 p-6">
        <CardTitle className="text-base">{copy.danger.title}</CardTitle>
        <CardDescription className="text-[13px]">{copy.danger.body}</CardDescription>

        {/* Pausing is a change to the listing, and the listing flow owns that
            write — this sends the owner to it rather than opening a second
            path to the same record. */}
        <Button asChild variant="outline" size="sm" className="mt-6 w-fit">
          <Link href="/agency/listing">
            {paused ? <Play className="size-4" /> : <Pause className="size-4" />}
            {paused ? copy.danger.resume : copy.danger.cta}
          </Link>
        </Button>
      </Card>
    </div>
  );
}
