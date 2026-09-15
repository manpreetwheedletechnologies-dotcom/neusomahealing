export type SessionTypeOption = {
  title: string;

  duration: string;

  bookingMode:
    | "individual"
    | "webinar";

  defaultCapacity: number;

  /*
   * Price in INR (whole rupees).
   * 0 = free session, no payment step.
   */
  price: number;

  isActive?: boolean;
};

export type BookingConfig = {
  sessionTypes: SessionTypeOption[];
  timeSlots: string[];
  timezone: string;
  maxMonthsAhead: number;
  activeWeekdays: number[];
};

export type BookingSlot = {
  id: string;
  slotId: string;
  sessionType: string;
  duration: string;
  bookingMode: "individual" | "webinar";
  time: string;
  timeSlot: string;
  capacity: number;
  bookedCount: number;
  remainingSeats: number;
  status: "available" | "full" | "unavailable";

  /*
   * Effective price for THIS exact slot — may
   * differ from the session type's default price
   * if the admin set a per-slot override. Always
   * use this (not SessionTypeOption.price) once a
   * specific slot has been selected.
   */
  price: number;
  isPaid: boolean;
};

export type CreateBookingPayload = {
  name: string;
  email: string;
  phone?: string;
  sessionType: string;
  bookingDate: string;
  timeSlot: string;
  message?: string;
  /*
   * Preferred: identifies the exact slot booked,
   * including its own price override if any.
   */
  slotId?: string;
  /*
   * Only required when the slot's price > 0.
   * Verified server-side against Razorpay.
   */
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
};

export type CreateIndividualRequestPayload = {
  name: string;
  email: string;
  phone?: string;
  sessionType: string;
  /*
   * User-suggested date/time. Not a confirmed
   * slot — admin assigns the real date/time
   * from the admin panel afterwards.
   */
  preferredDate?: string;
  preferredTimeSlot?: string;
  message?: string;
};

export type CreatedIndividualRequest = {
  id: string;
  sessionType: string;
  preferredDate?: string;
  preferredTimeSlot?: string;
  status: string;
};

export type CreatedBooking = {
  id: string;
  sessionType: string;
  bookingDate: string;
  timeSlot: string;
  status: string;
  paymentStatus?: "not_required" | "paid" | "failed";
  amountPaid?: number;
};

export type PaymentOrder = {
  orderId: string;
  amount: number; // paise
  currency: string;
  priceRupees: number;
};

const API_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ||
  "http://192.168.1.16:4000";

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

export async function getBookingCalendar(
  month: string,
  sessionType: string,
) {
  const params =
    new URLSearchParams({
      month,
      sessionType,
    });

  return request<{
    success: true;

    data: {
      month: string;

      sessionType:
        string | null;

      enabledDates: string[];

      hasAvailability: boolean;

      timezone: string;
    };
  }>(
    `/bookings/calendar?${params.toString()}`,
  );
}

export async function getBookingAvailability(
  date: string,
  sessionType: string,
) {
  const params =
    new URLSearchParams({
      date,
      sessionType,
    });

  return request<{
    success: true;

    data: {
      date: string;

      slots: BookingSlot[];

      availableTimes: string[];

      availableSessionTypes: string[];

      timezone: string;
    };
  }>(
    `/bookings/availability?${params.toString()}`,
  );
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

/*
 * Discovery Call, 1:1 Coaching, Deep Transformation.
 *
 * No slot is booked here — this just records the
 * request with a preferred date/time. Admin assigns
 * the real, confirmed date/time from the admin panel,
 * and that's when the confirmation email goes out.
 */
export async function createIndividualRequest(
  payload: CreateIndividualRequestPayload,
) {
  return request<{
    success: true;
    message: string;
    data: CreatedIndividualRequest;
  }>("/bookings/request", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/*
 * Creates a Razorpay order for a paid session.
 * The backend computes the amount itself from the
 * session's stored price — this call never sends
 * an amount to trust.
 */
export async function createPaymentOrder(payload: {
  sessionType: string;
  bookingDate: string;
  timeSlot: string;
  slotId?: string;
}) {
  return request<{
    success: true;
    data: PaymentOrder;
  }>("/bookings/payment/order", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
