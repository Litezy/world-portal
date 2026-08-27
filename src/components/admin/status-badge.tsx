import { Badge, type BadgeProps } from "@/components/ui/badge";
import { applicationStatusLabels, enquiryStatusLabels } from "@/content/admin";
import type { ApplicationStatus, EnquiryStatus } from "@/types";

type Tone = NonNullable<BadgeProps["variant"]>;

const enquiryTone: Record<EnquiryStatus, Tone> = {
  new: "softInfo",
  contacted: "softNeutral",
  quoted: "softWarning",
  won: "softSuccess",
  lost: "softDestructive",
};

const applicationTone: Record<ApplicationStatus, Tone> = {
  draft: "softNeutral",
  submitted: "softInfo",
  in_review: "softInfo",
  documents_required: "softWarning",
  biometrics_scheduled: "softNeutral",
  decision_pending: "softWarning",
  approved: "softSuccess",
  rejected: "softDestructive",
};

export function EnquiryStatusBadge({
  status,
  ...props
}: { status: EnquiryStatus } & Omit<BadgeProps, "variant" | "children">) {
  return (
    <Badge variant={enquiryTone[status]} size="sm" dot {...props}>
      {enquiryStatusLabels[status]}
    </Badge>
  );
}

export function ApplicationStatusBadge({
  status,
  ...props
}: { status: ApplicationStatus } & Omit<BadgeProps, "variant" | "children">) {
  return (
    <Badge variant={applicationTone[status]} size="sm" dot {...props}>
      {applicationStatusLabels[status]}
    </Badge>
  );
}
