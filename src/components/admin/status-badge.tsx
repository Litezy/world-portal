import { Badge, type BadgeProps } from "@/components/ui/badge";
import {
  passportStatusLabels,
  paymentStatusLabels,
  visaStatusLabels,
} from "@/content/admin";
import type {
  BackendPaymentStatus,
  PassportStatus,
  VisaStatus,
} from "@/server/data/backend-types";

type Tone = NonNullable<BadgeProps["variant"]>;

const visaTone: Record<VisaStatus, Tone> = {
  SUBMITTED: "softInfo",
  EVALUATED: "softNeutral",
  UNDER_REVIEW: "softWarning",
  APPROVED: "softSuccess",
  REJECTED: "softDestructive",
};

const passportTone: Record<PassportStatus, Tone> = {
  SUBMITTED: "softInfo",
  UNDER_REVIEW: "softWarning",
  APPROVED: "softSuccess",
  REJECTED: "softDestructive",
};

const paymentTone: Record<BackendPaymentStatus, Tone> = {
  PENDING_EVALUATION: "softNeutral",
  AWAITING_PAYMENT: "softWarning",
  PARTIALLY_PAID: "softInfo",
  FULLY_PAID: "softSuccess",
  REFUNDED: "softDestructive",
};

type Props<T> = { status: T } & Omit<BadgeProps, "variant" | "children">;

export function VisaStatusBadge({ status, ...props }: Props<VisaStatus>) {
  return (
    <Badge variant={visaTone[status]} size="sm" dot {...props}>
      {visaStatusLabels[status]}
    </Badge>
  );
}

export function PassportStatusBadge({ status, ...props }: Props<PassportStatus>) {
  return (
    <Badge variant={passportTone[status]} size="sm" dot {...props}>
      {passportStatusLabels[status]}
    </Badge>
  );
}

export function PaymentStatusBadge({ status, ...props }: Props<BackendPaymentStatus>) {
  return (
    <Badge variant={paymentTone[status]} size="sm" dot {...props}>
      {paymentStatusLabels[status]}
    </Badge>
  );
}
