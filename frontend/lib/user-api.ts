import { apiRequest } from "./api";

export type SiteUser = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  notifyNewSessions: boolean;
  lastLogin: string | null;
};

export type MyBooking = {
  _id: string;
  sessionType: string;
  bookingDate?: string;
  timeSlot?: string;
  preferredDate?: string;
  preferredTimeSlot?: string;
  bookingMode?: "individual" | "webinar";
  status:
    | "pending"
    | "confirmed"
    | "completed"
    | "cancelled";
  isAssigned?: boolean;
  message?: string;
  zoomJoinUrl?: string;
  paymentStatus?:
    | "not_required"
    | "paid"
    | "failed";
  amountPaid?: number;
  razorpayPaymentId?: string;
  createdAt: string;
};

export type MyPayment = {
  _id: string;
  sessionType: string;
  bookingDate?: string;
  timeSlot?: string;
  amountPaid: number;
  paymentStatus?: string;
  razorpayPaymentId?: string;
  createdAt: string;
};

export type AccountOverview = {
  stats: {
    totalBookings: number;
    upcoming: number;
    completed: number;
    totalPaid: number;
  };
  upcoming: MyBooking[];
  awaitingSchedule: MyBooking[];
  past: MyBooking[];
  payments: MyPayment[];
  timezone: string;
};

export type UserNotification = {
  _id: string;
  type: string;
  title: string;
  body?: string;
  link?: string;
  isRead: boolean;
  createdAt: string;
};

/* =========================================================
   AUTH
========================================================= */

export async function registerUser(input: {
  name: string;
  email: string;
  password: string;
  phone?: string;
}) {
  const response = await apiRequest<{
    data: { user: SiteUser };
  }>("/auth/user/register", {
    method: "POST",
    body: JSON.stringify(input),
  });

  return response.data.user;
}

export async function loginUser(input: {
  email: string;
  password: string;
}) {
  const response = await apiRequest<{
    data: { user: SiteUser };
  }>("/auth/user/login", {
    method: "POST",
    body: JSON.stringify(input),
  });

  return response.data.user;
}

export async function getCurrentUser() {
  const response = await apiRequest<{
    data: { user: SiteUser };
  }>("/auth/user/me");

  return response.data.user;
}

export async function logoutUser() {
  await apiRequest("/auth/user/logout", {
    method: "POST",
  });
}

/* =========================================================
   ACCOUNT
========================================================= */

export async function getAccountOverview() {
  const response = await apiRequest<{
    data: AccountOverview;
  }>("/bookings/my");

  return response.data;
}

export async function updateProfile(input: {
  name?: string;
  phone?: string;
  notifyNewSessions?: boolean;
}) {
  const response = await apiRequest<{
    data: { user: SiteUser };
  }>("/account/profile", {
    method: "PATCH",
    body: JSON.stringify(input),
  });

  return response.data.user;
}

export async function changePassword(input: {
  currentPassword: string;
  newPassword: string;
}) {
  const response = await apiRequest<{
    data: { user: SiteUser };
  }>("/account/password", {
    method: "POST",
    body: JSON.stringify(input),
  });

  return response.data.user;
}

/* =========================================================
   NOTIFICATIONS
========================================================= */

export async function getNotifications() {
  const response = await apiRequest<{
    data: {
      unreadCount: number;
      notifications: UserNotification[];
    };
  }>("/account/notifications");

  return response.data;
}

export async function markNotificationRead(
  id: string,
) {
  await apiRequest(
    `/account/notifications/${id}/read`,
    { method: "PATCH" },
  );
}

export async function markAllNotificationsRead() {
  await apiRequest(
    "/account/notifications/read-all",
    { method: "PATCH" },
  );
}
