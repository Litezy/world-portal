import { NextResponse } from "next/server";

import { visaStatusLabels } from "@/content/admin";
import {
  canMove,
  type CaseStatus,
  nextStatuses,
} from "@/features/applications/workflow";

/**
 * Refuse a stage change the workflow doesn't allow (ADR 0017 §4.3), with the
 * moves that are allowed, before anything reaches the service. Moving to the
 * stage a file is already in is refused too: re-approving would email the
 * applicant again.
 */
export function refuseIllegalMove(from: CaseStatus, to: CaseStatus) {
  if (canMove(from, to)) return null;
  const allowed = nextStatuses(from);
  const options = allowed.map((s) => visaStatusLabels[s]).join(" or ");
  return NextResponse.json(
    {
      message: allowed.length
        ? `This file is ${visaStatusLabels[from].toLowerCase()}. It can only move to ${options}.`
        : `This file is ${visaStatusLabels[from].toLowerCase()}, which is final.`,
      allowed,
    },
    { status: 409 },
  );
}
