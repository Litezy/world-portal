import { Badge, type BadgeProps } from "@/components/ui/badge";
import {
  assignmentStatusLabels,
  documentStatusLabels,
  listingStatusLabels,
  payoutStatusLabels,
  staffStatusLabels,
  verificationLabels,
} from "@/content/agency";
import type {
  AgencyDocumentStatus,
  AgencyListingStatus,
  AgencyStaffStatus,
  AgencyVerificationStatus,
  AssignmentStatus,
  PayoutStatus,
} from "@/features/agency/types";

/**
 * Every status pill the agency dashboard shows, in one place — the mirror of
 * `components/admin/status-badge.tsx`. Each status carries a tone *and* a word
 * from the content file, so colour is never the only signal.
 */

type Tone = NonNullable<BadgeProps["variant"]>;

const verificationTone: Record<AgencyVerificationStatus, Tone> = {
  unverified: "softNeutral",
  pending: "softWarning",
  verified: "softSuccess",
  suspended: "softDestructive",
};

const listingTone: Record<AgencyListingStatus, Tone> = {
  draft: "softNeutral",
  submitted: "softInfo",
  in_review: "softWarning",
  live: "softSuccess",
  rejected: "softDestructive",
  paused: "softNeutral",
};

const assignmentTone: Record<AssignmentStatus, Tone> = {
  requested: "softWarning",
  assigned: "softInfo",
  in_progress: "softInfo",
  completed: "softSuccess",
  cancelled: "softDestructive",
};

const payoutTone: Record<PayoutStatus, Tone> = {
  pending: "softWarning",
  processing: "softInfo",
  paid: "softSuccess",
  on_hold: "softDestructive",
};

const staffTone: Record<AgencyStaffStatus, Tone> = {
  available: "softSuccess",
  assigned: "softInfo",
  off_duty: "softNeutral",
  inactive: "softNeutral",
};

const documentTone: Record<AgencyDocumentStatus, Tone> = {
  missing: "softNeutral",
  uploaded: "softInfo",
  in_review: "softWarning",
  approved: "softSuccess",
  rejected: "softDestructive",
};

type Props<T> = { status: T } & Omit<BadgeProps, "variant" | "children">;

export function VerificationBadge({
  status,
  ...props
}: Props<AgencyVerificationStatus>) {
  return (
    <Badge variant={verificationTone[status]} size="sm" dot {...props}>
      {verificationLabels[status]}
    </Badge>
  );
}

export function ListingStatusBadge({ status, ...props }: Props<AgencyListingStatus>) {
  return (
    <Badge variant={listingTone[status]} size="sm" dot {...props}>
      {listingStatusLabels[status]}
    </Badge>
  );
}

export function AssignmentStatusBadge({ status, ...props }: Props<AssignmentStatus>) {
  return (
    <Badge variant={assignmentTone[status]} size="sm" dot {...props}>
      {assignmentStatusLabels[status]}
    </Badge>
  );
}

export function PayoutStatusBadge({ status, ...props }: Props<PayoutStatus>) {
  return (
    <Badge variant={payoutTone[status]} size="sm" dot {...props}>
      {payoutStatusLabels[status]}
    </Badge>
  );
}

export function StaffStatusBadge({ status, ...props }: Props<AgencyStaffStatus>) {
  return (
    <Badge variant={staffTone[status]} size="sm" dot {...props}>
      {staffStatusLabels[status]}
    </Badge>
  );
}

export function DocumentStatusBadge({ status, ...props }: Props<AgencyDocumentStatus>) {
  return (
    <Badge variant={documentTone[status]} size="sm" dot {...props}>
      {documentStatusLabels[status]}
    </Badge>
  );
}
