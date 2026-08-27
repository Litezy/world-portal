import type { PaymentStatus, VisaDocumentStatus } from "@/features/visa/types";

/** The happy path, in order. REJECTED is terminal and handled separately. */
export const STATUS_FLOW: VisaDocumentStatus[] = [
  "SUBMITTED",
  "EVALUATED",
  "UNDER_REVIEW",
  "APPROVED",
];

export const statusCopy: Record<
  VisaDocumentStatus,
  { label: string; description: string }
> = {
  SUBMITTED: {
    label: "Submitted",
    description:
      "We have your application and documents. A consultant is picking it up.",
  },
  EVALUATED: {
    label: "Costed",
    description: "Your fees are set and the application is ready for payment.",
  },
  UNDER_REVIEW: {
    label: "Under review",
    description:
      "Payment received. Your file is being checked and prepared for filing.",
  },
  APPROVED: {
    label: "Approved",
    description:
      "Your visa has been approved. We will be in touch with the next steps.",
  },
  REJECTED: {
    label: "Rejected",
    description: "This application was not successful. The reason is shown below.",
  },
};

export const paymentStatusCopy: Record<PaymentStatus, string> = {
  PENDING_EVALUATION: "Awaiting costing",
  AWAITING_PAYMENT: "Awaiting payment",
  PARTIALLY_PAID: "Part paid",
  FULLY_PAID: "Paid in full",
  REFUNDED: "Refunded",
};

/** -1 for REJECTED, which sits outside the linear flow. */
export function statusIndex(status: VisaDocumentStatus) {
  return STATUS_FLOW.indexOf(status);
}
