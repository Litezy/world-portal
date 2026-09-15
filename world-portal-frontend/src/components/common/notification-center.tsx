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
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  useMarkAllNotificationsAsRead,
  useMarkNotificationAsRead,
  useNotifications,
} from "@/features/notifications/api/use-notifications";
import type { InAppNotification } from "@/features/notifications/types";
import { cn, formatRelative } from "@/lib/utils";

function getNotificationIcon(type: string) {
  switch (type) {
    case "STAFF_ASSIGNED":
      return <UserCheck className="size-4 text-primary shrink-0" />;
    case "JOB_COMPLETED":
      return <CheckCircle2 className="size-4 text-success-600 shrink-0" />;
    case "PAYOUT_PROCESSED":
      return <DollarSign className="size-4 text-emerald-600 shrink-0" />;
    case "BOOKING_REQUESTED":
    default:
      return <Sparkles className="size-4 text-amber-500 shrink-0" />;
  }
}

export function NotificationCenter({
  recipientId,
  recipientType,
}: {
  recipientId?: string | null;
  recipientType: "APPLICANT" | "AGENCY" | "ADMIN";
}) {
  const router = useRouter();
  const { data } = useNotifications(recipientId);
  const markAsRead = useMarkNotificationAsRead(recipientId);
  const markAllAsRead = useMarkAllNotificationsAsRead(recipientId);

  const notifications: InAppNotification[] = Array.isArray(data?.data)
    ? data.data
    : Array.isArray((data as any)?.data?.data)
    ? (data as any).data.data
    : Array.isArray(data)
    ? (data as any)
    : [];

  const unreadCount =
    typeof data?.unreadCount === "number"
      ? data.unreadCount
      : typeof (data as any)?.data?.unreadCount === "number"
      ? (data as any).data.unreadCount
      : 0;

  const handleNotificationClick = (item: InAppNotification) => {
    if (!item.isRead) {
      markAsRead.mutate(item.id);
    }

    if (recipientType === "AGENCY") {
      if (item.metadata?.assignmentId) {
        router.push(`/agency/assignments/${item.metadata.assignmentId}`);
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
          className="relative inline-flex size-9 items-center justify-center rounded-xl border border-border/70 bg-background/80 text-foreground transition-colors hover:bg-muted/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Bell className="size-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground shadow-sm animate-in zoom-in-50">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-80 sm:w-96 p-0 shadow-xl">
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
              <CheckCheck className="size-3.5 mr-1" />
              Mark all read
            </Button>
          ) : null}
        </div>

        <div className="max-h-[380px] overflow-y-auto divide-y divide-border/40">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
              <div className="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground mb-2">
                <Bell className="size-5" />
              </div>
              <p className="text-sm font-medium text-foreground">No notifications yet</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                We will notify you here when bookings, assignments, and milestones occur.
              </p>
            </div>
          ) : (
            notifications.map((item) => (
              <div
                key={item.id}
                onClick={() => handleNotificationClick(item)}
                className={cn(
                  "flex items-start gap-3 p-3.5 text-left transition-colors cursor-pointer hover:bg-muted/50",
                  !item.isRead && "bg-primary/5",
                )}
              >
                <div className="mt-0.5 flex size-8 items-center justify-center rounded-lg bg-background border border-border shrink-0 shadow-xs">
                  {getNotificationIcon(item.type)}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <p className={cn("text-xs font-semibold truncate", !item.isRead ? "text-foreground" : "text-muted-foreground")}>
                      {item.title}
                    </p>
                    <span className="text-[10px] text-muted-foreground shrink-0 flex items-center gap-0.5">
                      <Clock className="size-2.5" />
                      {formatRelative(item.createdAt)}
                    </span>
                  </div>

                  <p className="text-xs text-foreground/85 line-clamp-2 mt-0.5 leading-relaxed">
                    {item.message}
                  </p>
                </div>

                {!item.isRead && (
                  <span className="size-2 rounded-full bg-primary shrink-0 mt-1.5" />
                )}
              </div>
            ))
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
