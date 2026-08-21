export type NotificationCategory = 'exam' | 'security' | 'grade' | 'broadcast' | 'class';

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  category: NotificationCategory;
  linkUrl?: string;
  actionLabel?: string;
}
