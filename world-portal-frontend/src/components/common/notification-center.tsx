"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import {
  Bell,
  CheckCheck,
  CheckCircle2,
  Clock,
  DollarSign,
  Sparkles,
  UserCheck,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  useMarkAllNotificationsAsRead,
  useMarkNotificationAsRead,
  useNotifications,
} from "@/features/notifications/api/use-notifications";
import type {
  InAppNotification,
  NotificationAudience,
} from "@/features/notifications/types";
import { cn, formatRelative } from "@/lib/utils";

function getNotificationIcon(type: string) {
  switch (type) {
    case "STAFF_ASSIGNED":
      return <UserCheck className="size-4 shrink-0 text-primary" />;
    case "JOB_COMPLETED":
      return <CheckCircle2 className="text-success-600 size-4 shrink-0" />;
    case "PAYOUT_PROCESSED":
      return <DollarSign className="size-4 shrink-0 text-emerald-600" />;
    case "BOOKING_REQUESTED":
    default:
      return <Sparkles className="size-4 shrink-0 text-amber-500" />;
  }
}

const AUDIENCE: Record<"APPLICANT" | "AGENCY" | "ADMIN", NotificationAudience> = {
  APPLICANT: "applicant",
  AGENCY: "agency",
  ADMIN: "admin",
};

/**
 * `recipientId` is the signed-in email or agency id. It only shows the bell
 * once someone is signed in and keys the cache per account; it is never sent.
 * The server reads the inbox from the caller's own session.
 */
export function NotificationCenter({
  recipientId,
  recipientType,
}: {
  recipientId?: string | null;
  recipientType: "APPLICANT" | "AGENCY" | "ADMIN";
}) {
  const router = useRouter();
  const audience = AUDIENCE[recipientType];
  const { data } = useNotifications(audience, recipientId);
  const markAsRead = useMarkNotificationAsRead(audience, recipientId);
  const markAllAsRead = useMarkAllNotificationsAsRead(audience, recipientId);

  // `/api/notifications` always answers `{ data, unreadCount }`, unwrapped.
  const notifications: InAppNotification[] = Array.isArray(data?.data) ? data.data : [];
  const unreadCount = typeof data?.unreadCount === "number" ? data.unreadCount : 0;

  const handleNotificationClick = (item: InAppNotification) => {
    if (!item.isRead) {
      markAsRead.mutate(item.id);
    }

    if (recipientType === "AGENCY") {
      const assignmentId = item.metadata?.assignmentId;
      if (typeof assignmentId === "string" && assignmentId) {
        router.push(`/agency/assignments/${encodeURIComponent(assignmentId)}`);
      } else {
        router.push("/agency/assignments");
      }
    } else if (recipientType === "APPLICANT") {
      router.push("/applicant/hires");
    }
  };

  if (!recipientId) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="Notifications"
          className="relative inline-flex size-9 items-center justify-center rounded-xl border border-border/70 bg-background/80 text-foreground transition-colors hover:bg-muted/70 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          <Bell className="size-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex size-4 animate-in items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground shadow-sm zoom-in-50">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-80 p-0 shadow-xl sm:w-96">
        <div className="flex items-center justify-between border-b border-border/60 px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-foreground">Notifications</span>
            {unreadCount > 0 ? (
              <Badge variant="softWarning" size="sm" dot>
                {unreadCount} new
              </Badge>
            ) : null}
          </div>

          {unreadCount > 0 ? (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs text-muted-foreground hover:text-foreground"
              onClick={() => markAllAsRead.mutate()}
              isLoading={markAllAsRead.isPending}
            >
              <CheckCheck className="mr-1 size-3.5" />
              Mark all read
            </Button>
          ) : null}
        </div>

        <div className="max-h-[380px] divide-y divide-border/40 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-4 py-10 text-center">
              <div className="mb-2 flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
                <Bell className="size-5" />
              </div>
              <p className="text-sm font-medium text-foreground">
                No notifications yet
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                We will notify you here when bookings, assignments, and milestones
                occur.
              </p>
            </div>
          ) : (
            notifications.map((item) => (
              <div
                key={item.id}
                onClick={() => handleNotificationClick(item)}
                className={cn(
                  "flex cursor-pointer items-start gap-3 p-3.5 text-left transition-colors hover:bg-muted/50",
                  !item.isRead && "bg-primary/5",
                )}
              >
                <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg border border-border bg-background shadow-xs">
                  {getNotificationIcon(item.type)}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <p
                      className={cn(
                        "truncate text-xs font-semibold",
                        !item.isRead ? "text-foreground" : "text-muted-foreground",
                      )}
                    >
                      {item.title}
                    </p>
                    <span className="flex shrink-0 items-center gap-0.5 text-[10px] text-muted-foreground">
                      <Clock className="size-2.5" />
                      {formatRelative(item.createdAt)}
                    </span>
                  </div>

                  <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-foreground/85">
                    {item.message}
                  </p>
                </div>

                {!item.isRead && (
                  <span className="mt-1.5 size-2 shrink-0 rounded-full bg-primary" />
                )}
              </div>
            ))
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
