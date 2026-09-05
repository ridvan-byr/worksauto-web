"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Bell,
  Check,
  CheckCheck,
  Volume2,
  VolumeX,
  Wrench,
  Calendar,
  Package,
  CreditCard,
  ShieldAlert,
  Info,
  ExternalLink,
  Trash2,
  Sparkles,
} from "lucide-react";
import {
  useNotifications,
  useUnreadNotificationCount,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
  useDeleteNotification,
  useSendTestNotification,
} from "../api/use-notifications";
import { useSocket } from "../context/socket-context";
import { NotificationItem, NotificationType } from "../types";
import { cn } from "@/lib/utils";

function getCategoryIcon(category: string) {
  switch (category) {
    case "WORK_ORDER":
      return <Wrench className="w-4 h-4 text-sky-500" />;
    case "APPOINTMENT":
      return <Calendar className="w-4 h-4 text-indigo-500" />;
    case "INVENTORY":
      return <Package className="w-4 h-4 text-amber-500" />;
    case "FINANCE":
      return <CreditCard className="w-4 h-4 text-emerald-500" />;
    case "SECURITY":
      return <ShieldAlert className="w-4 h-4 text-rose-500" />;
    default:
      return <Info className="w-4 h-4 text-slate-400" />;
  }
}

function getTypeBadgeStyles(type: NotificationType) {
  switch (type) {
    case "SUCCESS":
      return "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400";
    case "WARNING":
      return "border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400";
    case "ERROR":
    case "CRITICAL":
      return "border-rose-500/20 bg-rose-500/10 text-rose-600 dark:text-rose-400";
    default:
      return "border-sky-500/20 bg-sky-500/10 text-sky-600 dark:text-sky-400";
  }
}

function formatRelativeTime(dateStr: string): string {
  try {
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const diffSec = Math.floor(diffMs / 1000);
    if (diffSec < 60) return "Az önce";
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin} dk önce`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `${diffHours} sa önce`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays} gün önce`;
    return new Date(dateStr).toLocaleDateString("tr-TR");
  } catch {
    return "";
  }
}

const CATEGORIES = [
  { key: "ALL", label: "Tümü" },
  { key: "WORK_ORDER", label: "İş Emri" },
  { key: "APPOINTMENT", label: "Randevu" },
  { key: "INVENTORY", label: "Stok" },
  { key: "FINANCE", label: "Finans" },
];

export function NotificationPopover() {
  const [isOpen, setIsOpen] = React.useState(false);
  const [filterUnread, setFilterUnread] = React.useState(false);
  const [selectedCategory, setSelectedCategory] = React.useState<string>("ALL");
  const containerRef = React.useRef<HTMLDivElement>(null);
  const router = useRouter();

  const { isConnected, isMuted, toggleMute, playChime } = useSocket();
  const { data: unreadData } = useUnreadNotificationCount();
  const { data: notifData, isLoading } = useNotifications({
    page: 1,
    limit: 30,
    category: selectedCategory,
    enabled: isOpen,
  });

  const markReadMutation = useMarkNotificationRead();
  const markAllReadMutation = useMarkAllNotificationsRead();
  const deleteMutation = useDeleteNotification();
  const sendTestMutation = useSendTestNotification();

  const allItems: NotificationItem[] = React.useMemo(() => {
    if (!notifData) return [];
    if (Array.isArray(notifData)) return notifData;
    if (Array.isArray((notifData as any).items)) return (notifData as any).items;
    return [];
  }, [notifData]);

  const unreadCount = unreadData?.count ?? allItems.filter((i) => !i.isRead).length;

  const displayedItems = React.useMemo(() => {
    if (filterUnread) {
      return allItems.filter((item) => !item.isRead);
    }
    return allItems;
  }, [allItems, filterUnread]);

  // Close when clicking outside
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const handleItemClick = (item: NotificationItem) => {
    if (!item.isRead) {
      markReadMutation.mutate(item.id);
    }
    if (item.link) {
      setIsOpen(false);
      router.push(item.link);
    }
  };

  return (
    <div className="relative" ref={containerRef}>
      {/* Bell Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={cn(
          "relative flex h-9 w-9 items-center justify-center rounded-xl text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors cursor-pointer",
          isOpen && "bg-slate-100 dark:bg-slate-800"
        )}
        aria-label="Bildirimler"
      >
        <Bell size={18} />

        {/* Live WebSocket connection pulse dot */}
        <span
          className={cn(
            "absolute bottom-1 right-1 h-1.5 w-1.5 rounded-full ring-2 ring-white dark:ring-slate-900 transition-colors",
            isConnected ? "bg-emerald-500" : "bg-amber-400 animate-pulse"
          )}
          title={isConnected ? "Canlı Bildirim Bağlantısı Aktif" : "Yeniden Bağlanıyor..."}
        />

        {/* Unread Badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white shadow-sm ring-2 ring-white dark:ring-slate-900 animate-in zoom-in">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Popover Card */}
      {isOpen && (
        <div className="absolute right-0 top-11 z-50 w-[360px] sm:w-[420px] rounded-2xl border border-slate-200/80 bg-white shadow-2xl backdrop-blur-xl dark:border-slate-800 dark:bg-[#0c121e] overflow-hidden animate-in fade-in-50 zoom-in-95 duration-150">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 px-4 py-3 bg-slate-50/50 dark:bg-slate-900/30">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm text-slate-900 dark:text-slate-100">
                Bildirimler
              </span>
              {unreadCount > 0 && (
                <span className="rounded-full bg-sky-500/10 px-2 py-0.5 text-[11px] font-semibold text-sky-600 dark:text-sky-400">
                  {unreadCount} yeni
                </span>
              )}
            </div>

            <div className="flex items-center gap-1">
              {/* Sound Mute Toggle */}
              <button
                type="button"
                onClick={toggleMute}
                title={isMuted ? "Sesleri Aç" : "Sesi Kapat"}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:text-slate-200 dark:hover:bg-slate-800 transition-colors"
              >
                {isMuted ? <VolumeX size={15} /> : <Volume2 size={15} className="text-sky-500" />}
              </button>

              {/* Mark All Read */}
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={() => markAllReadMutation.mutate()}
                  disabled={markAllReadMutation.isPending}
                  title="Tümünü Okundu İşaretle"
                  className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <CheckCheck size={14} className="text-sky-500" />
                  <span>Tümünü Oku</span>
                </button>
              )}
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-2 px-4 py-2 border-b border-slate-100 dark:border-slate-800/60 text-xs">
            <button
              type="button"
              onClick={() => setFilterUnread(false)}
              className={cn(
                "px-2.5 py-1 rounded-lg font-medium transition-colors",
                !filterUnread
                  ? "bg-sky-500/10 text-sky-600 dark:bg-sky-500/20 dark:text-sky-400"
                  : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
              )}
            >
              Tümü
            </button>
            <button
              type="button"
              onClick={() => setFilterUnread(true)}
              className={cn(
                "px-2.5 py-1 rounded-lg font-medium transition-colors flex items-center gap-1.5",
                filterUnread
                  ? "bg-sky-500/10 text-sky-600 dark:bg-sky-500/20 dark:text-sky-400"
                  : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
              )}
            >
              <span>Okunmamış</span>
              {unreadCount > 0 && (
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] text-white">
                  {unreadCount}
                </span>
              )}
            </button>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 px-4 py-1.5 border-b border-slate-100 dark:border-slate-800/60 overflow-x-auto bg-slate-50/40 dark:bg-slate-900/20 text-[11px]">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.key}
                type="button"
                onClick={() => setSelectedCategory(cat.key)}
                className={cn(
                  "px-2.5 py-0.5 rounded-full font-medium shrink-0 transition-colors cursor-pointer",
                  selectedCategory === cat.key
                    ? "bg-sky-500 text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                )}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Notifications List */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
            {isLoading && allItems.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">
                <div className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-sky-500 border-t-transparent mb-2" />
                <p>Bildirimler yükleniyor...</p>
              </div>
            ) : displayedItems.length === 0 ? (
              <div className="py-12 text-center px-4">
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 mb-2">
                  <Bell size={18} />
                </div>
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {filterUnread ? "Okunmamış bildiriminiz yok" : "Yeni bildiriminiz yok"}
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {filterUnread
                    ? "Tüm bildirimler okunmuş durumda."
                    : "Atölye hareketleri burada anlık olarak görünecektir."}
                </p>
              </div>
            ) : (
              displayedItems.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleItemClick(item)}
                  className={cn(
                    "group flex items-start gap-3 p-3.5 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors cursor-pointer text-left relative",
                    !item.isRead && "bg-sky-50/30 dark:bg-sky-950/10"
                  )}
                >
                  {/* Category / Type Icon */}
                  <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-slate-200/80 bg-white dark:border-slate-700 dark:bg-slate-800 shadow-sm">
                    {getCategoryIcon(item.category)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                        {item.title}
                      </p>
                      <span className="text-[10px] text-slate-400 shrink-0">
                        {formatRelativeTime(item.createdAt)}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-snug line-clamp-2">
                      {item.message}
                    </p>

                    <div className="mt-1.5 flex items-center gap-2">
                      <span
                        className={cn(
                          "inline-block rounded px-1.5 py-0.5 text-[9px] font-semibold border",
                          getTypeBadgeStyles(item.type)
                        )}
                      >
                        {item.type}
                      </span>
                      {item.link && (
                        <span className="text-[10px] text-sky-500 dark:text-sky-400 flex items-center gap-0.5 hover:underline font-medium">
                          <span>Detay</span>
                          <ExternalLink size={10} />
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Action & Status */}
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteMutation.mutate(item.id);
                      }}
                      title="Bildirimi Sil"
                      className="opacity-0 group-hover:opacity-100 p-1 rounded-md text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-all cursor-pointer"
                    >
                      <Trash2 size={13} />
                    </button>
                    {!item.isRead && (
                      <span className="h-2 w-2 rounded-full bg-sky-500 shadow-sm" />
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer Status Bar */}
          <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800/80 px-4 py-2 bg-slate-50/50 dark:bg-slate-900/30 text-[11px] text-slate-400">
            <div className="flex items-center gap-1.5">
              <span
                className={cn(
                  "h-1.5 w-1.5 rounded-full",
                  isConnected ? "bg-emerald-500" : "bg-amber-400"
                )}
              />
              <span>
                {isConnected ? "Canlı Bildirim Bağlantısı Aktif" : "Bağlantı kuruluyor..."}
              </span>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => sendTestMutation.mutate()}
                disabled={sendTestMutation.isPending}
                className="text-[10px] text-emerald-500 hover:text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer font-medium disabled:opacity-50"
                title="Canlı WebSocket bildirimi ve çan sesini test et"
              >
                <Sparkles size={11} />
                <span>{sendTestMutation.isPending ? "Gönderiliyor..." : "Test Bildirimi Fırlat"}</span>
              </button>
              <button
                type="button"
                onClick={playChime}
                className="text-[10px] text-sky-500 hover:text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1 cursor-pointer font-medium"
                title="Atölye çan sesini dinle"
              >
                <Volume2 size={11} />
                <span>Sesi Dene</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
