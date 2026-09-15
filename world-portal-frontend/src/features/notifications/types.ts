export type InAppNotification = {
  id: string;
  recipientId: string;
  recipientType: "APPLICANT" | "AGENCY" | "ADMIN";
  title: string;
  message: string;
  type: "BOOKING_REQUESTED" | "STAFF_ASSIGNED" | "JOB_COMPLETED" | "PAYOUT_PROCESSED" | "SYSTEM" | string;
  metadata?: Record<string, any>;
  isRead: boolean;
  createdAt: string;
};

export type NotificationResponse = {
  data: InAppNotification[];
  unreadCount: number;
};
