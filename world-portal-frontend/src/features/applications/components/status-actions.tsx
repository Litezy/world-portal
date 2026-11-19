"use client";

import * as React from "react";

import { CheckCircle2, PlayCircle, XCircle } from "lucide-react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/admin";
import { Button } from "@/components/ui/button";
import { CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { caseWorkflow as copy, visaStatusLabels } from "@/content/admin";
import { useUpdateApplication } from "@/features/applications/api/use-update-application";
import { type CaseStatus, nextStatuses } from "@/features/applications/workflow";
import { useUpdatePassport } from "@/features/passports/api/use-update-passport";
import { ApiError } from "@/lib/api-client";
import { cn } from "@/lib/utils";

type Target = "UNDER_REVIEW" | "APPROVED" | "REJECTED";

const icons = { UNDER_REVIEW: PlayCircle, APPROVED: CheckCircle2, REJECTED: XCircle };

const REASON_MIN = 10;

/**
 * The next step on a file, as buttons: only the moves the workflow allows
 * from where the file is (`caseTransitions`). Approving and rejecting email
 * the applicant and are final, so both ask first; rejecting needs a reason.
 * Replaces a free "move to any stage" select.
 */
export function StatusActions({
  type,
  id,
  status,
  reference,
  applicantName,
}: {
  type: "visa" | "passport";
  id: string;
  status: CaseStatus;
  reference: string;
  applicantName: string;
}) {
  const visa = useUpdateApplication(id);
  const passport = useUpdatePassport(id);
  const update = type === "passport" ? passport : visa;
  const [target, setTarget] = React.useState<Target | null>(null);

  const next = nextStatuses(status).filter(
    (s): s is Target => s === "UNDER_REVIEW" || s === "APPROVED" || s === "REJECTED",
  );

  return (
    <div className="grid gap-4">
      <div>
        <CardTitle className="text-base">{copy.title}</CardTitle>
        <p className="mt-1 text-[12.5px] text-muted-foreground">
          {copy.current}:{" "}
          <span className="font-medium text-foreground">
            {visaStatusLabels[status]}
          </span>
        </p>
      </div>

      {next.length === 0 ? (
        <p className="rounded-xl border border-border/70 bg-muted/30 p-3.5 text-[12.5px] text-muted-foreground">
          {copy.final(visaStatusLabels[status])}
        </p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {next.map((to) => {
            const Icon = icons[to];
            return (
              <Button
                key={to}
                size="md"
                variant={to === "REJECTED" ? "outline" : "primary"}
                className={cn("flex-1", to === "REJECTED" && "text-destructive-text")}
                leftIcon={<Icon className="size-4" />}
                onClick={() => setTarget(to)}
              >
                {copy.actions[to]}
              </Button>
            );
          })}
        </div>
      )}

      {status === "SUBMITTED" ? (
        <p className="text-[12px] text-muted-foreground">{copy.waitingForCost}</p>
      ) : null}

      {target ? (
        <ConfirmStatusDialog
          key={target}
          target={target}
          reference={reference}
          applicantName={applicantName}
          isPending={update.isPending}
          onClose={() => setTarget(null)}
          onConfirm={async (input) => {
            try {
              await update.mutateAsync({ status: target, ...input });
              toast.success(copy.done[target]);
              setTarget(null);
            } catch (error) {
              toast.error(copy.failed, {
                description:
                  error instanceof ApiError || error instanceof Error
                    ? error.message
                    : undefined,
              });
            }
          }}
        />
      ) : null}
    </div>
  );
}

function ConfirmStatusDialog({
  target,
  reference,
  applicantName,
  isPending,
  onClose,
  onConfirm,
}: {
  target: Target;
  reference: string;
  applicantName: string;
  isPending: boolean;
  onClose: () => void;
  onConfirm: (input: { verificationNotes?: string; rejectionReason?: string }) => void;
}) {
  const [note, setNote] = React.useState("");
  const [reason, setReason] = React.useState("");
  const rejecting = target === "REJECTED";
  const reasonOk = reason.trim().length >= REASON_MIN;
  const text = copy.confirm[target];

  return (
    <ConfirmDialog
      open
      onOpenChange={(open) => (!open ? onClose() : null)}
      tone={rejecting ? "danger" : "default"}
      title={
        target === "UNDER_REVIEW" ? text.title(reference) : text.title(applicantName)
      }
      description={text.body}
      confirmLabel={text.action}
      isPending={isPending}
      confirmDisabled={rejecting && !reasonOk}
      onConfirm={() =>
        onConfirm({
          verificationNotes: note.trim() || undefined,
          rejectionReason: rejecting ? reason.trim() : undefined,
        })
      }
    >
      <div className="grid gap-4">
        {rejecting ? (
          <div className="grid gap-1.5">
            <Label htmlFor="status-reason">{copy.reasonLabel}</Label>
            <Textarea
              id="status-reason"
              rows={3}
              autoFocus
              maxLength={500}
              value={reason}
              placeholder={copy.reasonPlaceholder}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>
        ) : null}
        <div className="grid gap-1.5">
          <Label htmlFor="status-note">{copy.noteLabel}</Label>
          <Textarea
            id="status-note"
            rows={2}
            maxLength={500}
            value={note}
            placeholder={copy.notePlaceholder}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>
      </div>
    </ConfirmDialog>
  );
}
