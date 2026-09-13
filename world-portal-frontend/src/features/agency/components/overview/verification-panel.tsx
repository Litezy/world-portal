import Link from "next/link";

import { CircleCheckBig, ShieldCheck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { agencyListing, agencyOverview as copy } from "@/content/agency";
import {
  ListingStatusBadge,
  VerificationBadge,
} from "@/features/agency/components/agency-badges";
import type { AgencyOverview } from "@/features/agency/types";
import { cn } from "@/lib/utils";

/**
 * Verification is the only thing on this dashboard that blocks earning, so it
 * sits above the work. Once everything is in it stops shouting and becomes a
 * single quiet line — the agency has already done what was asked.
 */
export function VerificationPanel({
  overview,
  className,
}: {
  overview: AgencyOverview;
  className?: string;
}) {
  const outstanding =
    overview.verification !== "verified" || overview.outstandingDocuments > 0;

  if (!outstanding) {
    return (
      <Card
        variant="solid"
        radius="lg"
        padding="none"
        className={cn("flex-row items-center gap-3 p-5", className)}
      >
        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-emerald-500/15 text-emerald-600">
          <CircleCheckBig className="size-4" />
        </span>
        <div className="min-w-0 flex-1">
          <CardTitle className="text-base">{copy.verification.title}</CardTitle>
          <CardDescription className="text-[13px]">
            {copy.verification.done}
          </CardDescription>
        </div>
        <VerificationBadge status={overview.verification} />
      </Card>
    );
  }

  return (
    <Card
      variant="solid"
      radius="lg"
      padding="none"
      className={cn("gap-0 p-5", className)}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
            <ShieldCheck className="size-4" />
          </span>
          <div className="min-w-0">
            <CardTitle className="text-base">{copy.verification.title}</CardTitle>
            <CardDescription className="text-[13px]">
              {copy.verification.body}
            </CardDescription>
          </div>
        </div>

        <Button asChild variant="primary" size="sm">
          <Link href="/agency/listing">{copy.verification.cta}</Link>
        </Button>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-2">
        <VerificationBadge status={overview.verification} />
        <ListingStatusBadge status={overview.listingStatus} />
        {overview.outstandingDocuments > 0 ? (
          <Badge variant="softWarning" size="sm" dot>
            {overview.outstandingDocuments} {agencyListing.documents.title}
          </Badge>
        ) : null}
      </div>
    </Card>
  );
}
