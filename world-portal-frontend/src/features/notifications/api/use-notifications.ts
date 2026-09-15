import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { InAppNotification, NotificationResponse } from "../types";

export const notificationKeys = {
  all: ["notifications"] as const,
  recipient: (recipientId?: string | null) => [...notificationKeys.all, recipientId] as const,
};

export function useNotifications(recipientId?: string | null) {
  return useQuery({
    queryKey: notificationKeys.recipient(recipientId),
    queryFn: async (): Promise<NotificationResponse> => {
      if (!recipientId) return { data: [], unreadCount: 0 };
      const res = await fetch(`/api/notifications?recipientId=${encodeURIComponent(recipientId)}&limit=30`);
      if (!res.ok) return { data: [], unreadCount: 0 };
      return res.json();
    },
    enabled: Boolean(recipientId),
    refetchInterval: 10000, // Poll every 10s for new in-app alerts
  });
}

export function useMarkNotificationAsRead(recipientId?: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.recipient(recipientId) });
    },
  });
}

export function useMarkAllNotificationsAsRead(recipientId?: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!recipientId) return;
      const res = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipientId, readAll: true }),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.recipient(recipientId) });
    },
  });
}
