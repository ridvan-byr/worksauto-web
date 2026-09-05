export type NotificationType = 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR' | 'CRITICAL';

export type NotificationCategory =
  | 'APPOINTMENT'
  | 'WORK_ORDER'
  | 'INVENTORY'
  | 'FINANCE'
  | 'SECURITY'
  | 'SYSTEM';

export interface NotificationItem {
  id: string;
  tenantId?: string;
  userId?: string;
  type: NotificationType;
  category: NotificationCategory | string;
  title: string;
  message: string;
  link?: string;
  isRead: boolean;
  readAt?: string;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationsResponse {
  items: NotificationItem[];
  total: number;
  unreadCount: number;
  page: number;
  limit: number;
}
