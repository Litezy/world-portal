import { paymentStatusCopy, statusCopy } from "@/features/visa/status";
import type { PaymentStatus, VisaDocumentStatus } from "@/features/visa/types";
import { getApplicationStatus, getMyApplications } from "@/features/vivid/functions";
import type { VoiceFunctionConfig } from "@/features/vivid/types";
import { backend, BackendError } from "@/server/api/backend";

/**
 * The real bodies of Vivid's server tools. Run only by /api/vivid/function,
 * which has already checked the WorldStreet session and Vivid access and
 * passes the caller's session token — the API then scopes every read to them.
 */

type ServerArgs = Record<string, unknown> & { userId: string; token: string | null };

type ApiApplication = {
  id: string;
  applicationNo: string;
  type: "VISA" | "PASSPORT";
  status: string;
  paymentStatus?: string | null;
  targetCountry?: string | null;
  visaCategory?: string | null;
  passportCategory?: string | null;
  totalAmount?: string | number | null;
  amountPaid?: string | number | null;
  balanceDue?: string | number | null;
  verificationNotes?: string | null;
  rejectionReason?: string | null;
  createdAt: string;
};

const amount = (v: string | number | null | undefined) =>
  v === null || v === undefined || v === "" ? null : Number(v);

/** What the applicant should do now, in one sentence Vivid can say. */
function nextStep(app: ApiApplication): string {
  const due = amount(app.balanceDue);
  switch (app.status) {
    case "SUBMITTED":
      return "A consultant is reviewing it and will set the fee — nothing to do yet.";
    case "EVALUATED":
      return `The fee is set${amount(app.totalAmount) !== null ? ` at ${amount(app.totalAmount)}` : ""}. Pay by bank transfer quoting ${app.applicationNo}; the bank details are on the application in My applications.`;
    case "UNDER_REVIEW":
      return app.paymentStatus === "PARTIALLY_PAID" && due
        ? `Part paid — ${due} is still due, by bank transfer quoting ${app.applicationNo}. Review continues meanwhile.`
        : "Paid and under review. Watch their email for an invitation to biometrics or an interview.";
    case "APPROVED":
      return "Approved.";
    case "REJECTED":
      return app.rejectionReason
        ? `Not approved: ${app.rejectionReason}`
        : "Not approved — the reason is on the application.";
    default:
      return "Open it on My applications for details.";
  }
}

function shape(app: ApiApplication) {
  const status = statusCopy[app.status as VisaDocumentStatus];
  return {
    reference: app.applicationNo,
    type: app.type === "PASSPORT" ? "Passport" : "Visa",
    ...(app.type === "VISA"
      ? { destination: app.targetCountry, category: app.visaCategory }
      : { passportType: app.passportCategory }),
    status: status?.label ?? app.status,
    ...(app.paymentStatus
      ? {
          payment:
            paymentStatusCopy[app.paymentStatus as PaymentStatus] ?? app.paymentStatus,
        }
      : {}),
    fee: amount(app.totalAmount),
    paid: amount(app.amountPaid),
    stillDue: amount(app.balanceDue),
    submitted: app.createdAt?.slice(0, 10),
    next: nextStep(app),
  };
}

function refusal(error: unknown) {
  if (error instanceof BackendError) {
    if (error.status === 404) return { error: error.message };
    if (error.status === 401)
      return {
        error: "Their WorldStreet session has expired — ask them to sign in again.",
      };
    if (error.status === 403) return { error: error.message };
  }
  return {
    error:
      "E-Embassy's records are unreachable right now. Suggest trying again shortly.",
  };
}

export const serverFunctions: VoiceFunctionConfig<ServerArgs>[] = [
  {
    ...(getMyApplications as VoiceFunctionConfig<ServerArgs>),
    handler: async ({ token }) => {
      try {
        const apps = await backend<ApiApplication[]>("/me/applications", { token });
        return apps.length
          ? { count: apps.length, applications: apps.map(shape) }
          : { count: 0, note: "No applications on this account yet." };
      } catch (error) {
        return refusal(error);
      }
    },
  },
  {
    ...(getApplicationStatus as VoiceFunctionConfig<ServerArgs>),
    handler: async ({ token, reference }) => {
      const ref = String(reference ?? "")
        .trim()
        .toUpperCase()
        .replace(/\s+/g, "");
      if (!ref) return { error: "Which application? Ask for its reference." };
      try {
        const app = await backend<ApiApplication>(
          `/me/applications/${encodeURIComponent(ref)}`,
          {
            token,
          },
        );
        return {
          ...shape(app),
          ...(app.verificationNotes ? { consultantNotes: app.verificationNotes } : {}),
        };
      } catch (error) {
        return refusal(error);
      }
    },
  },
];
