export type InAppNotification = {
  id: string;
  recipientId: string;
  recipientType: "APPLICANT" | "AGENCY" | "ADMIN";
  title: string;
  message: string;
  type:
    | "BOOKING_REQUESTED"
    | "STAFF_ASSIGNED"
    | "JOB_COMPLETED"
    | "PAYOUT_PROCESSED"
    | "SYSTEM"
    | string;
  metadata?: Record<string, unknown>;
  isRead: boolean;
  createdAt: string;
};

/** Which console's inbox to read; the server takes the recipient from that session. */
export type NotificationAudience = "applicant" | "agency" | "admin";

export type NotificationResponse = {
  data: InAppNotification[];
  unreadCount: number;
};
