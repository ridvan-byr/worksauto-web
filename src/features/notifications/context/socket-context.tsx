"use client";

import * as React from "react";
import { io, Socket } from "socket.io-client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "@/components/ui/sonner";
import { playNotificationChime } from "../sound/chime";
import { NotificationItem } from "../types";
import { useRouter } from "next/navigation";
import { useAuth } from "@/features/auth/auth-context";
import { getAccessToken, refreshAccessToken } from "@/lib/api-client";

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  isMuted: boolean;
  toggleMute: () => void;
  playChime: () => void;
}

const SocketContext = React.createContext<SocketContextType>({
  socket: null,
  isConnected: false,
  isMuted: false,
  toggleMute: () => {},
  playChime: () => {},
});

export function useSocket() {
  return React.useContext(SocketContext);
}

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const [socket, setSocket] = React.useState<Socket | null>(null);
  const socketRef = React.useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = React.useState(false);
  const [isMuted, setIsMuted] = React.useState(false);
  const isMutedRef = React.useRef(isMuted);
  const queryClient = useQueryClient();
  const router = useRouter();
  const { isAuthenticated, isLoading, user, tenant } = useAuth();

  // Keep isMutedRef in sync
  React.useEffect(() => {
    isMutedRef.current = isMuted;
  }, [isMuted]);

  const userRef = React.useRef(user);
  React.useEffect(() => {
    userRef.current = user;
  }, [user]);

  // Load sound mute preference
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("worksauto_sound_muted");
      if (saved === "true") {
        setIsMuted(true);
      }
    }
  }, []);

  const toggleMute = React.useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev;
      if (typeof window !== "undefined") {
        localStorage.setItem("worksauto_sound_muted", String(next));
      }
      return next;
    });
  }, []);

  // Manual test chime: always plays even if currently muted so user can test sound
  const playChime = React.useCallback(() => {
    playNotificationChime(false);
  }, []);

  // Connect / Disconnect socket based on auth state
  React.useEffect(() => {
    if (typeof window === "undefined" || !isAuthenticated || isLoading) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    const token = getAccessToken() || (typeof window !== "undefined" ? localStorage.getItem("worksauto_access_token") : null);
    if (!token || token === "null" || token === "undefined") {
      return;
    }

    let socketHost = "";
    if (typeof window !== "undefined") {
      if (window.location.hostname.endsWith(".test")) {
        socketHost = "https://api.worksauto.test";
      } else if (window.location.hostname.includes("worksauto.com.tr")) {
        socketHost = "https://api.worksauto.com.tr";
      } else if (window.location.protocol === "https:") {
        socketHost = window.location.origin;
      } else {
        const rawApiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";
        socketHost = rawApiUrl.replace(/\/api\/v1\/?$/, "") || "http://localhost:4000";
      }
    } else {
      socketHost = "http://api:4000";
    }

    const newSocket = io(`${socketHost}/events`, {
      auth: (cb) => {
        const currentToken =
          getAccessToken() ||
          (typeof window !== "undefined"
            ? localStorage.getItem("worksauto_access_token")
            : null);
        cb({ token: currentToken });
      },
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 2000,
      reconnectionDelayMax: 10000,
    });

    newSocket.on("connect", () => {
      setIsConnected(true);
    });

    newSocket.on("disconnect", async (reason) => {
      setIsConnected(false);
      // If server disconnected client (e.g. 15-minute JWT expired or server restart),
      // seamlessly refresh the token and re-establish the connection.
      if (reason === "io server disconnect") {
        try {
          const freshToken = await refreshAccessToken();
          if (freshToken && socketRef.current) {
            socketRef.current.auth = { token: freshToken };
            socketRef.current.connect();
          }
        } catch {
          // Token refresh failure will be handled by auth guard
        }
      }
    });

    newSocket.on("connect_error", async () => {
      setIsConnected(false);
      // On handshake or token expiration errors, attempt silent token refresh and retry
      try {
        const freshToken = await refreshAccessToken();
        if (freshToken && socketRef.current) {
          socketRef.current.auth = { token: freshToken };
          socketRef.current.connect();
        }
      } catch {
        // Will retry on next socket reconnect loop
      }
    });

    // 1. In-App Notification Broadcast
    newSocket.on("notification:new", (notification: NotificationItem) => {
      // Actor Isolation: İşlemi bizzat yapan kullanıcıya ses veya toast çalma
      const currentUserId = userRef.current?.id;
      if (
        notification.metadata?.actorUserId &&
        currentUserId &&
        notification.metadata.actorUserId === currentUserId
      ) {
        return;
      }

      // Play workshop sound chime using fresh ref
      playNotificationChime(isMutedRef.current);

      // Invalidate notifications cache immediately
      queryClient.invalidateQueries({ queryKey: ["notifications"] });

      // Show toast
      const toastType = notification.type === "SUCCESS"
        ? toast.success
        : notification.type === "WARNING"
        ? toast.warning
        : notification.type === "ERROR" || notification.type === "CRITICAL"
        ? toast.error
        : toast.info;

      toastType(notification.title, {
        description: notification.message,
        action: notification.link
          ? {
              label: "Görüntüle",
              onClick: () => router.push(notification.link!),
            }
          : undefined,
      });
    });

    // 2. Appointment Events -> Invalidate queries
    newSocket.on("appointment:created", () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
    });
    newSocket.on("appointment:status_changed", () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
    });
    newSocket.on("appointment:cancelled", () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
    });

    // 3. Work Order Events -> Invalidate Kanban / Lists / Details
    newSocket.on("work_order:created", () => {
      queryClient.invalidateQueries({ queryKey: ["work-orders"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
    });
    newSocket.on("work_order:status_changed", () => {
      queryClient.invalidateQueries({ queryKey: ["work-orders"] });
      queryClient.invalidateQueries({ queryKey: ["work-order"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
    });
    newSocket.on("work_order:completed", () => {
      queryClient.invalidateQueries({ queryKey: ["work-orders"] });
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
    });
    newSocket.on("work_order:item_added", () => {
      queryClient.invalidateQueries({ queryKey: ["work-orders"] });
      queryClient.invalidateQueries({ queryKey: ["work-order"] });
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
    });
    newSocket.on("work_order:item_removed", () => {
      queryClient.invalidateQueries({ queryKey: ["work-orders"] });
      queryClient.invalidateQueries({ queryKey: ["work-order"] });
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
    });

    // 4. Inventory Events
    newSocket.on("inventory:stock_changed", () => {
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
    });
    newSocket.on("inventory:low_stock", () => {
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
    });

    // 5. Payment Events
    newSocket.on("payment:received", () => {
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      queryClient.invalidateQueries({ queryKey: ["current-accounts"] });
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
    });

    // 6. Tenant Profile & Logo Broadcast
    newSocket.on("tenant:updated", (payload: Record<string, unknown>) => {
      queryClient.invalidateQueries({ queryKey: ["tenant-settings"] });
      queryClient.invalidateQueries({ queryKey: ["tenant-profile"] });
      if (typeof window !== "undefined" && payload) {
        window.dispatchEvent(new CustomEvent("worksauto:tenant-updated", { detail: payload }));
      }
    });

    socketRef.current = newSocket;
    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
      socketRef.current = null;
      setIsConnected(false);
    };
  }, [isAuthenticated, isLoading, user?.id, tenant?.id, queryClient, router]);

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        isMuted,
        toggleMute,
        playChime,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
}
