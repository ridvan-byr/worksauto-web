"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { NotificationItem, NotificationsResponse } from "../types";
import { useAuth } from "@/features/auth/auth-context";

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
      const res = await apiClient.get<any>("/notifications", {
        params: {
          page,
          limit,
          unreadOnly: unreadOnly ? "true" : undefined,
          category,
        },
      });

      // Normalize array or object structure safely
      const rawList = Array.isArray(res)
        ? res
        : Array.isArray(res?.data)
        ? res.data
        : res?.data?.items || res?.items || [];

      const total = res?.meta?.total ?? res?.total ?? rawList.length;
      const unreadCount = res?.meta?.unreadCount ?? res?.unreadCount ?? 0;

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
      const res = await apiClient.get<any>("/notifications/unread-count");
      const rawCount =
        typeof res?.count === "number"
          ? res.count
          : typeof res?.unreadCount === "number"
          ? res.unreadCount
          : typeof res?.data?.count === "number"
          ? res.data.count
          : typeof res?.data?.unreadCount === "number"
          ? res.data.unreadCount
          : Number(res) || 0;

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
      const res = await apiClient.patch<any>(`/notifications/${id}/read`);
      return res?.data ?? res;
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
      const res = await apiClient.patch<any>("/notifications/read-all");
      return res?.data ?? res;
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
      const res = await apiClient.delete<any>(`/notifications/${id}`);
      return res?.data ?? res;
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
      const res = await apiClient.post<any>("/notifications/test");
      return res?.data ?? res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

