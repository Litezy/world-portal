"use client";

import * as React from "react";
import Link from "next/link";

import { CircleCheckBig, UserPlus, Users } from "lucide-react";

import { UserAvatar } from "@/components/admin";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { EmptyState } from "@/components/ui/empty-state";
import { SkeletonList } from "@/components/ui/skeleton";
import { agencyAssignments as copy, agencyStaff as staffCopy } from "@/content/agency";
import {
  useAssignStaff,
  useCompleteAssignment,
} from "@/features/agency/api/use-assignments";
import { useAgencyListing } from "@/features/agency/api/use-listing";
import { useAgencyStaff } from "@/features/agency/api/use-staff";
import { StaffStatusBadge } from "@/features/agency/components/agency-badges";
import type { AgencyAssignment, AgencyStaff } from "@/features/agency/types";
import { cn } from "@/lib/utils";

/**
 * Putting names against a job.
 *
 * The rule the traveller paid for — exactly `staffRequired` people — is
 * enforced in the UI, not discovered from a 422: the counter shows the target,
 * unpicked rows switch off once it is met, and the submit stays disabled until
 * it is. The server still refuses a bad payload; this is so nobody ever has to
 * see that refusal.
 *
 * Editable while the job has not started. `in_progress` keeps the roster but
 * swaps the form for the completion action; `completed` and `cancelled` are
 * read-only.
 */
export function AssignStaffPanel({ assignment }: { assignment: AgencyAssignment }) {
  const editable =
    assignment.status === "requested" || assignment.status === "assigned";

  const staffQuery = useAgencyStaff({ perPage: 100 });
  const listingQuery = useAgencyListing();
  const assign = useAssignStaff(assignment.id);
  const complete = useCompleteAssignment(assignment.id);

  const [selected, setSelected] = React.useState<string[]>(assignment.assignedStaffIds);

  const roster = staffQuery.data?.data ?? [];
  const registeredCategories = listingQuery.data?.categories;
  const normalizeCat = (cat?: string) => (cat || "").toLowerCase().replace(/[\s_]+/g, "");

  const staffInRegisteredCategories = React.useMemo(() => {
    if (!registeredCategories || registeredCategories.length === 0) return roster;
    return roster.filter(
      (person) => !person.category || registeredCategories.includes(person.category),
    );
  }, [roster, registeredCategories]);

  const matchingCategoryStaff = staffInRegisteredCategories.filter((person) => {
    if (!person.category || !assignment.category) return true;
    const pCat = normalizeCat(person.category);
    const aCat = normalizeCat(assignment.category);
    return pCat === aCat || pCat === "freelancer" || aCat === "freelancer";
  });

  const staffPool =
    matchingCategoryStaff.length > 0 ? matchingCategoryStaff : staffInRegisteredCategories;

  const eligible = staffPool.filter(
    (person) =>
      person.status !== "inactive" || assignment.assignedStaffIds.includes(person.id),
  );
  const assigned = assignment.assignedStaffIds
    .map((id) => roster.find((person) => person.id === id))
    .filter((person): person is AgencyStaff => Boolean(person));

  const atCapacity = selected.length >= assignment.staffRequired;
  const isReady = selected.length === assignment.staffRequired;

  // Functional update: two clicks inside one React batch would otherwise both
  // read the same array and the second would discard the first.
  const toggle = (id: string) =>
    setSelected((current) =>
      current.includes(id) ? current.filter((value) => value !== id) : [...current, id],
    );

  return (
    <Card variant="solid" radius="lg" padding="none" className="gap-0 p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <CardTitle className="text-base">{copy.detail.assignTitle}</CardTitle>
          {editable ? (
            <CardDescription className="text-[13px]">
              {copy.detail.assignBody}
            </CardDescription>
          ) : null}
        </div>
        <Badge variant={isReady ? "softSuccess" : "softWarning"} size="sm" dot>
          {copy.detail.required} {selected.length}/{assignment.staffRequired}
        </Badge>
      </div>

      {staffQuery.isPending ? (
        <SkeletonList count={3} className="mt-6" />
      ) : editable ? (
        eligible.length === 0 ? (
          <EmptyState
            icon={Users}
            title={staffCopy.empty.title}
            description={staffCopy.empty.body}
            className="mt-6"
            action={
              <Button asChild variant="outline" size="sm">
                <Link href="/agency/staff">
                  <UserPlus className="size-4" />
                  {staffCopy.add}
                </Link>
              </Button>
            }
          />
        ) : (
          <ul className="mt-5 flex flex-col gap-2">
            {eligible.map((person) => {
              const isSelected = selected.includes(person.id);
              const disabled = !isSelected && atCapacity;

              return (
                <li key={person.id}>
                  <label
                    className={cn(
                      "flex cursor-pointer items-center gap-3 rounded-xl border border-border/70 p-3 transition-colors",
                      isSelected
                        ? "border-primary/50 bg-primary/5"
                        : "hover:bg-muted/40",
                      disabled && "cursor-not-allowed opacity-50",
                    )}
                  >
                    <Checkbox
                      checked={isSelected}
                      disabled={disabled}
                      onCheckedChange={() => toggle(person.id)}
                      aria-label={person.name}
                    />
                    <UserAvatar
                      user={{ name: person.name, avatar: person.photoUrl ?? undefined }}
                      size="sm"
                      className="ring-border"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13.5px] font-medium">
                        {person.name}
                      </p>
                      <p className="truncate text-[12px] text-muted-foreground">
                        {person.role} · {person.experienceYears}y
                        {person.backgroundChecked ? ` · ${staffCopy.vetted}` : ""}
                      </p>
                    </div>
                    <StaffStatusBadge status={person.status} />
                  </label>
                </li>
              );
            })}
          </ul>
        )
      ) : assigned.length === 0 ? (
        <EmptyState icon={Users} title={staffCopy.empty.title} className="mt-6" />
      ) : (
        <ul className="mt-5 flex flex-col gap-2">
          {assigned.map((person) => (
            <li
              key={person.id}
              className="flex items-center gap-3 rounded-xl border border-border/70 p-3"
            >
              <UserAvatar
                user={{ name: person.name, avatar: person.photoUrl ?? undefined }}
                size="sm"
                className="ring-border"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13.5px] font-medium">{person.name}</p>
                <p className="truncate text-[12px] text-muted-foreground">
                  {person.role}
                </p>
              </div>
              <StaffStatusBadge status={person.status} />
            </li>
          ))}
        </ul>
      )}

      {assign.isError ? (
        <Alert variant="destructive" className="mt-5">
          <AlertDescription>
            {assign.error instanceof Error
              ? assign.error.message
              : "That could not be saved."}
          </AlertDescription>
        </Alert>
      ) : null}

      {complete.isError ? (
        <Alert variant="destructive" className="mt-5">
          <AlertDescription>
            {complete.error instanceof Error
              ? complete.error.message
              : "That could not be saved."}
          </AlertDescription>
        </Alert>
      ) : null}

      {editable && eligible.length > 0 ? (
        <Button
          className="mt-5"
          size="block"
          disabled={!isReady || assign.isPending}
          isLoading={assign.isPending}
          onClick={() => assign.mutate(selected)}
        >
          {assignment.assignedStaffIds.length > 0
            ? copy.detail.reassignCta
            : copy.detail.assignCta}
        </Button>
      ) : null}

      {(assignment.status === "assigned" || assignment.status === "in_progress") &&
      assignment.assignedStaffIds.length > 0 ? (
        <Button
          className="mt-3"
          size="block"
          variant="outline"
          isLoading={complete.isPending}
          onClick={() => complete.mutate()}
        >
          <CircleCheckBig className="size-4 text-success-600" />
          {copy.detail.markComplete}
        </Button>
      ) : null}
    </Card>
  );
}
