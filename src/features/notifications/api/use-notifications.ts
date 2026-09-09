"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { NotificationItem } from "../types";
import { useAuth } from "@/features/auth/auth-context";

interface NotificationsApiResponse {
  data?: NotificationItem[] | { items?: NotificationItem[] };
  items?: NotificationItem[];
  meta?: { total?: number; unreadCount?: number };
  total?: number;
  unreadCount?: number;
}

interface UnreadCountResponse {
  count?: number;
  unreadCount?: number;
  data?: { count?: number; unreadCount?: number };
}

export function useNotifications(options?: {
  page?: number;
  limit?: number;
  unreadOnly?: boolean;
  category?: string;
  enabled?: boolean;
}) {
  const { user } = useAuth();
  const page = options?.page ?? 1;
  const limit = options?.limit ?? 20;
  const unreadOnly = options?.unreadOnly ?? false;
  const category = options?.category && options.category !== 'ALL' ? options.category : undefined;

  return useQuery<{ items: NotificationItem[]; total: number; unreadCount: number }>({
    queryKey: ["notifications", user?.id || "guest", { page, limit, unreadOnly, category }],
    queryFn: async () => {
      const res = await apiClient.get<NotificationsApiResponse | NotificationItem[]>("/notifications", {
        params: {
          page,
          limit,
          unreadOnly: unreadOnly ? "true" : undefined,
          category,
        },
      });

      // Normalize array or object structure safely
      const rawList: NotificationItem[] = Array.isArray(res)
        ? res
        : Array.isArray(res?.data)
        ? res.data
        : (res?.data && typeof res.data === "object" && "items" in res.data && Array.isArray(res.data.items))
        ? res.data.items
        : res?.items || [];

      const total = Array.isArray(res) ? rawList.length : (res?.meta?.total ?? res?.total ?? rawList.length);
      const unreadCount = Array.isArray(res) ? 0 : (res?.meta?.unreadCount ?? res?.unreadCount ?? 0);

      return {
        items: rawList,
        total,
        unreadCount,
      };
    },
    enabled: options?.enabled !== false && !!user?.id,
    placeholderData: (previousData) => previousData,
    staleTime: 1000 * 5, // 5 seconds
  });
}

export function useUnreadNotificationCount(options?: { enabled?: boolean }) {
  const { user } = useAuth();

  return useQuery<{ count: number }>({
    queryKey: ["notifications", user?.id || "guest", "unread-count"],
    queryFn: async () => {
      const res = await apiClient.get<UnreadCountResponse | number>("/notifications/unread-count");
      let rawCount = 0;
      if (typeof res === "number") {
        rawCount = res;
      } else if (res && typeof res === "object") {
        if (typeof res.count === "number") rawCount = res.count;
        else if (typeof res.unreadCount === "number") rawCount = res.unreadCount;
        else if (typeof res.data?.count === "number") rawCount = res.data.count;
        else if (typeof res.data?.unreadCount === "number") rawCount = res.data.unreadCount;
      }

      return { count: rawCount };
    },
    enabled: options?.enabled !== false && !!user?.id,
    refetchInterval: 1000 * 30, // Poll fallback every 30s
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await apiClient.patch<{ data?: unknown } | unknown>(`/notifications/${id}/read`);
      return (res && typeof res === "object" && "data" in res) ? (res as { data: unknown }).data : res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const res = await apiClient.patch<{ data?: unknown } | unknown>("/notifications/read-all");
      return (res && typeof res === "object" && "data" in res) ? (res as { data: unknown }).data : res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

export function useDeleteNotification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await apiClient.delete<{ data?: unknown } | unknown>(`/notifications/${id}`);
      return (res && typeof res === "object" && "data" in res) ? (res as { data: unknown }).data : res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

export function useSendTestNotification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const res = await apiClient.post<{ data?: unknown } | unknown>("/notifications/test");
      return (res && typeof res === "object" && "data" in res) ? (res as { data: unknown }).data : res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

