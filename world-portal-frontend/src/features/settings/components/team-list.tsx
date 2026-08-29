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
            ? "Only a manager can see the full team list."
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
          className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"
        >
          <UserAvatar user={member} size="sm" className="ring-border" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13.5px] font-medium">{member.name}</p>
            <p className="truncate text-[12px] text-muted-foreground">{member.email}</p>
          </div>
          <Badge
            variant={member.isActive ? "softNeutral" : "softDestructive"}
            size="sm"
          >
            {member.isActive ? roleLabels[member.role] : "Deactivated"}
          </Badge>
        </li>
      ))}
    </ul>
  );
}
