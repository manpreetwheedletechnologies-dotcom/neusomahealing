export type SessionTypeOption = {
  title: string;
  duration: string;
  isActive?: boolean;
};

export type BookingConfig = {
  sessionTypes: SessionTypeOption[];
  timeSlots: string[];
  timezone: string;
  maxMonthsAhead: number;
  activeWeekdays: number[];
};

export type CreateBookingPayload = {
  name: string;
  email: string;
  phone?: string;
  sessionType: string;
  bookingDate: string;
  timeSlot: string;
  message?: string;
};

export type CreatedBooking = {
  id: string;
  sessionType: string;
  bookingDate: string;
  timeSlot: string;
  status: string;
};

const API_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ||
  "http://localhost:4000";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  let response: Response;

  try {
    response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(options?.headers || {}),
      },
      cache: "no-store",
    });
  } catch {
    throw new Error(
      "Unable to connect to the booking service. Please check your connection and try again.",
    );
  }

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const rawMessage = payload?.message;
    const message = Array.isArray(rawMessage)
      ? rawMessage.join(" ")
      : rawMessage || "Something went wrong. Please try again.";

    const error = new Error(message) as Error & { status?: number };
    error.status = response.status;
    throw error;
  }

  return payload as T;
}

export async function getBookingConfig() {
  return request<{
    success: true;
    data: BookingConfig;
  }>("/bookings/config");
}

export async function getBookingAvailability(date: string) {
  return request<{
    success: true;
    data: {
      date: string;
      availableTimes: string[];
      timezone: string;
    };
  }>(`/bookings/availability?date=${encodeURIComponent(date)}`);
}

export async function createBooking(payload: CreateBookingPayload) {
  return request<{
    success: true;
    message: string;
    data: CreatedBooking;
  }>("/bookings", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
