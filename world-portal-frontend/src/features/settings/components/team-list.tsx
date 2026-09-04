"use client";

import { UserAvatar } from "@/components/admin";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { SkeletonList } from "@/components/ui/skeleton";
import { roleLabels } from "@/content/admin";
import { useTeam } from "@/features/admin/api/use-team";
import { ApiError } from "@/lib/api-client";

export function TeamList() {
  const { data, isPending, isError, error } = useTeam();

  if (isPending) return <SkeletonList count={3} />;

  if (isError) {
    const forbidden = error instanceof ApiError && error.status === 403;
    return (
      <Alert variant={forbidden ? "default" : "destructive"}>
        <AlertDescription>
          {forbidden
            ? "Only a manager can see and manage the full team list."
            : error instanceof Error
              ? error.message
              : "Could not load the team."}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <ul className="flex flex-col divide-y divide-border/60">
      {data.map((member) => (
        <li
          key={member.id}
          className="flex items-center justify-between gap-4 py-3.5 first:pt-0 last:pb-0"
        >
          <div className="flex items-center gap-3.5 min-w-0">
            <UserAvatar user={member} size="sm" className="ring-border" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13.5px] font-semibold text-foreground">{member.name}</p>
              <p className="truncate text-[12px] text-muted-foreground">{member.email}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Badge
              variant={member.role === "MANAGER" ? "success" : "softNeutral"}
              size="sm"
            >
              {roleLabels[member.role]}
            </Badge>

            <span
              className={`inline-flex items-center gap-1.5 text-[11px] font-medium ${
                member.isActive ? "text-emerald-600" : "text-destructive"
              }`}
            >
              <span
                className={`size-1.5 rounded-full ${
                  member.isActive ? "bg-emerald-500" : "bg-destructive"
                }`}
              />
              {member.isActive ? "Active" : "Deactivated"}
            </span>
          </div>
        </li>
      ))}
    </ul>
  );
}
