"use client";

import * as React from "react";

import { MailPlus, MoreHorizontal, Search, UserCheck, UserX } from "lucide-react";
import { toast } from "sonner";

import { ConfirmDialog, TableError, UserAvatar } from "@/components/admin";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { SkeletonList } from "@/components/ui/skeleton";
import { roleLabels, team as copy } from "@/content/admin";
import {
  useDeactivateMember,
  useResendInvite,
  useTeam,
  useUpdateMember,
} from "@/features/admin/api/use-team";
import { ApiError } from "@/lib/api-client";
import { toastWithUndo } from "@/lib/toast";
import { cn } from "@/lib/utils";
import type { AdminRole, TeamMember } from "@/types";

const ROLES: AdminRole[] = ["MANAGER", "STAFF", "PARTNER"];
const errorMessage = (error: unknown) =>
  error instanceof Error ? error.message : copy.genericError;

/**
 * The team, with what a manager can do to each member: change role (with
 * Undo), deactivate (confirmed — it takes access away), reactivate, resend
 * the invite. The service refuses self-demotion and removing the last manager
 * (409) and its reason is shown as-is; the console also never offers actions
 * on your own row.
 */
export function TeamList({
  currentUserEmail,
  canManage,
}: {
  currentUserEmail: string;
  canManage: boolean;
}) {
  const { data, isPending, isError, error, refetch, isRefetching } = useTeam();
  const update = useUpdateMember();
  const deactivate = useDeactivateMember();
  const resend = useResendInvite();
  const [query, setQuery] = React.useState("");
  const [toDeactivate, setToDeactivate] = React.useState<TeamMember | null>(null);

  if (isPending) return <SkeletonList count={3} />;

  if (isError) {
    if (error instanceof ApiError && error.status === 403) {
      return (
        <Alert>
          <AlertDescription>{copy.forbidden}</AlertDescription>
        </Alert>
      );
    }
    return (
      <TableError
        title={copy.loadFailed}
        error={error}
        onRetry={() => void refetch()}
        isRetrying={isRefetching}
      />
    );
  }

  const needle = query.trim().toLowerCase();
  const members = needle
    ? data.filter(
        (m) =>
          m.name.toLowerCase().includes(needle) ||
          m.email.toLowerCase().includes(needle),
      )
    : data;

  const changeRole = async (member: TeamMember, role: AdminRole) => {
    if (role === member.role) return;
    const previous = member.role;
    try {
      await update.mutateAsync({ id: member.id, role });
      toastWithUndo(copy.roleChanged(member.name, roleLabels[role]), () => {
        update
          .mutateAsync({ id: member.id, role: previous })
          .catch((err) => toast.error(errorMessage(err)));
      });
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  const reactivate = async (member: TeamMember) => {
    try {
      await update.mutateAsync({ id: member.id, isActive: true });
      toast.success(copy.reactivated(member.name));
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  const confirmDeactivate = async () => {
    if (!toDeactivate) return;
    try {
      await deactivate.mutateAsync(toDeactivate.id);
      toast.success(copy.deactivatedToast(toDeactivate.name));
      setToDeactivate(null);
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  const resendInvite = async (member: TeamMember) => {
    try {
      const { data } = await resend.mutateAsync(member.id);
      // The service answers 200 with `sent: false` when no email went out
      // (SendGrid unset or refusing). Saying "sent" then was untrue.
      if (data.sent) toast.success(copy.inviteResent(member.email));
      else toast.error(copy.inviteNotSent(member.email));
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {data.length > 5 ? (
        <Input
          size="sm"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={copy.searchPlaceholder}
          aria-label={copy.searchPlaceholder}
          leftIcon={<Search />}
          className="sm:max-w-xs"
        />
      ) : null}

      {members.length === 0 ? (
        <p className="text-[13px] text-muted-foreground">{copy.noMatches}</p>
      ) : (
        <ul className="flex flex-col divide-y divide-border/60">
          {members.map((member) => {
            const isSelf =
              member.email.toLowerCase() === currentUserEmail.toLowerCase();
            return (
              <li
                key={member.id}
                className="flex items-center justify-between gap-4 py-3.5 first:pt-0 last:pb-0"
              >
                <div className="flex min-w-0 items-center gap-3.5">
                  <UserAvatar user={member} size="sm" className="ring-border" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13.5px] font-semibold text-foreground">
                      {member.name}
                      {isSelf ? (
                        <span className="ml-2 text-[11px] font-medium text-muted-foreground">
                          {copy.you}
                        </span>
                      ) : null}
                    </p>
                    <p className="truncate text-[12px] text-muted-foreground">
                      {member.email}
                    </p>
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
                    className={cn(
                      "hidden items-center gap-1.5 text-[11px] font-medium sm:inline-flex",
                      member.isActive ? "text-success-text" : "text-destructive-text",
                    )}
                  >
                    <span
                      className={cn(
                        "size-1.5 rounded-full",
                        member.isActive ? "bg-success" : "bg-destructive",
                      )}
                    />
                    {member.isActive ? copy.active : copy.deactivated}
                  </span>

                  {canManage && !isSelf ? (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label={copy.actions(member.name)}
                        >
                          <MoreHorizontal />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-56">
                        <DropdownMenuLabel>{copy.changeRole}</DropdownMenuLabel>
                        <DropdownMenuRadioGroup
                          value={member.role}
                          onValueChange={(role) =>
                            void changeRole(member, role as AdminRole)
                          }
                        >
                          {ROLES.map((role) => (
                            <DropdownMenuRadioItem
                              key={role}
                              value={role}
                              disabled={!member.isActive}
                            >
                              {roleLabels[role]}
                            </DropdownMenuRadioItem>
                          ))}
                        </DropdownMenuRadioGroup>
                        <DropdownMenuSeparator />
                        {member.isActive ? (
                          <>
                            <DropdownMenuItem
                              onSelect={() => void resendInvite(member)}
                            >
                              <MailPlus />
                              {copy.resendInvite}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              variant="destructive"
                              onSelect={() => setToDeactivate(member)}
                            >
                              <UserX />
                              {copy.deactivate}
                            </DropdownMenuItem>
                          </>
                        ) : (
                          <DropdownMenuItem onSelect={() => void reactivate(member)}>
                            <UserCheck />
                            {copy.reactivate}
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <ConfirmDialog
        open={toDeactivate !== null}
        onOpenChange={(open) => (!open ? setToDeactivate(null) : undefined)}
        title={copy.deactivateTitle(toDeactivate?.name ?? "")}
        description={copy.deactivateBody}
        confirmLabel={copy.deactivateConfirm}
        onConfirm={() => void confirmDeactivate()}
        isPending={deactivate.isPending}
      />
    </div>
  );
}
