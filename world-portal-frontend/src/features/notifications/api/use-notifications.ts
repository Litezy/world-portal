import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { NotificationAudience, NotificationResponse } from "../types";

/**
 * The server reads whose inbox this is from the caller's own session; the
 * browser only says which console it is in (`audience`). `viewer` — the
 * signed-in email or agency id — is never sent: it keys the cache so a
 * different account never sees the previous one's list, and gates the query
 * until there is someone signed in.
 */
export const notificationKeys = {
  all: ["notifications"] as const,
  inbox: (audience: NotificationAudience, viewer?: string | null) =>
    [...notificationKeys.all, audience, viewer] as const,
};

const EMPTY: NotificationResponse = { data: [], unreadCount: 0 };

export function useNotifications(
  audience: NotificationAudience,
  viewer?: string | null,
) {
  return useQuery({
    queryKey: notificationKeys.inbox(audience, viewer),
    queryFn: async (): Promise<NotificationResponse> => {
      const res = await fetch(`/api/notifications?audience=${audience}&limit=30`);
      if (!res.ok) return EMPTY;
      return res.json();
    },
    enabled: Boolean(viewer),
    refetchInterval: 10000, // Poll every 10s for new in-app alerts
  });
}

async function patchNotifications(body: Record<string, unknown>) {
  const res = await fetch("/api/notifications", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return res.json();
}

export function useMarkNotificationAsRead(
  audience: NotificationAudience,
  viewer?: string | null,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => patchNotifications({ audience, id }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: notificationKeys.inbox(audience, viewer),
      });
    },
  });
}

export function useMarkAllNotificationsAsRead(
  audience: NotificationAudience,
  viewer?: string | null,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!viewer) return;
      return patchNotifications({ audience, readAll: true });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: notificationKeys.inbox(audience, viewer),
      });
    },
  });
}
