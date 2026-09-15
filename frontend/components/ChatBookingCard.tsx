"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { ChevronLeft, Loader2 } from "lucide-react";
import {
  BookingConfig,
  BookingSlot,
  createBooking,
  createIndividualRequest,
  createPaymentOrder,
  getBookingAvailability,
  getBookingCalendar,
  getBookingConfig,
} from "@/lib/booking-api";

declare global {
  interface Window {
    Razorpay: any;
  }
}

const RAZORPAY_KEY_ID = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "";

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") return resolve(false);
    if (window.Razorpay) return resolve(true);
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

function formatDateKey(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatMonthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function formatChipLabel(dateKey: string) {
  const [y, m, d] = dateKey.split("-").map(Number);
  return new Intl.DateTimeFormat("en-US", { weekday: "short", month: "short", day: "numeric" }).format(
    new Date(y, m - 1, d),
  );
}

function formatRupees(amount: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(
    amount,
  );
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong. Please try again.";
}

type Step = "service" | "datetime" | "contact";

type CompletedBooking = {
  sessionType: string;
  dateLabel: string;
  time: string;
  amountPaid: number;
  message: string;
};

const inputClass =
  "w-full rounded-xl border border-[#e7ded0] bg-white px-3.5 py-2.5 text-sm text-[#2F3F38] outline-none transition focus:border-[#C08A45] focus:ring-2 focus:ring-[#C08A45]/20";

const primaryBtn =
  "w-full rounded-full bg-[#2F3F38] px-4 py-3 text-sm font-medium text-white transition hover:bg-[#26332d] disabled:cursor-not-allowed disabled:opacity-50";

const chipBtn =
  "rounded-full border px-3 py-1.5 text-xs font-medium transition disabled:cursor-not-allowed disabled:opacity-40";

export function ChatBookingCard({
  onCancel,
  onComplete,
}: {
  onCancel: () => void;
  onComplete: (booking: CompletedBooking) => void;
}) {
  const today = useMemo(() => new Date(), []);
  const todayKey = useMemo(() => formatDateKey(today), [today]);

  const [step, setStep] = useState<Step>("service");

  const [config, setConfig] = useState<BookingConfig | null>(null);
  const [isConfigLoading, setIsConfigLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [sessionType, setSessionType] = useState("");

  const [enabledDates, setEnabledDates] = useState<string[]>([]);
  const [isCalendarLoading, setIsCalendarLoading] = useState(false);

  const [selectedDate, setSelectedDate] = useState("");
  const [availableSlots, setAvailableSlots] = useState<BookingSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<BookingSlot | null>(null);
  const [time, setTime] = useState("");
  const [isAvailabilityLoading, setIsAvailabilityLoading] = useState(false);
  const [scheduleError, setScheduleError] = useState("");

  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "" });
  const [formError, setFormError] = useState("");
  const [isPaying, setIsPaying] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const response = await getBookingConfig();
        if (cancelled) return;
        setConfig(response.data);
        setSessionType(response.data.sessionTypes[0]?.title || "");
      } catch (error) {
        if (!cancelled) setLoadError(getErrorMessage(error));
      } finally {
        if (!cancelled) setIsConfigLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const selectedSession = config?.sessionTypes.find((s) => s.title === sessionType);
  const isRequestFlow = Boolean(selectedSession) && selectedSession?.bookingMode !== "webinar";

  const bookingMonthsAhead = useMemo(() => {
    const value = Number(config?.maxMonthsAhead);
    if (!Number.isFinite(value) || value < 1) return 6;
    return Math.min(Math.floor(value), 12);
  }, [config?.maxMonthsAhead]);

  const maxDateKey = useMemo(() => {
    const value = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    value.setMonth(value.getMonth() + bookingMonthsAhead);
    return formatDateKey(value);
  }, [today, bookingMonthsAhead]);

  // Load next-available dates for webinar (slot-based) sessions only.
  useEffect(() => {
    if (!sessionType || isRequestFlow) {
      setEnabledDates([]);
      return;
    }
    let cancelled = false;
    (async () => {
      setIsCalendarLoading(true);
      try {
        const now = new Date();
        const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        const [thisMonthRes, nextMonthRes] = await Promise.all([
          getBookingCalendar(formatMonthKey(now), sessionType),
          getBookingCalendar(formatMonthKey(nextMonth), sessionType),
        ]);
        if (cancelled) return;
        const merged = [
          ...(thisMonthRes.data.enabledDates || []),
          ...(nextMonthRes.data.enabledDates || []),
        ]
          .filter((d) => d >= todayKey)
          .sort();
        setEnabledDates(merged.slice(0, 14));
      } catch {
        if (!cancelled) setEnabledDates([]);
      } finally {
        if (!cancelled) setIsCalendarLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [sessionType, isRequestFlow, todayKey]);

  async function handlePickDate(dateKey: string) {
    setSelectedDate(dateKey);
    setTime("");
    setSelectedSlot(null);
    setAvailableSlots([]);
    setScheduleError("");

    if (isRequestFlow) return;

    setIsAvailabilityLoading(true);
    try {
      const response = await getBookingAvailability(dateKey, sessionType);
      setAvailableSlots((response.data.slots || []).filter((slot) => slot.status === "available"));
    } catch (error) {
      setScheduleError(getErrorMessage(error));
    } finally {
      setIsAvailabilityLoading(false);
    }
  }

  function continueFromSchedule() {
    setScheduleError("");
    if (!selectedDate) return setScheduleError("Please pick a date.");
    if (!time) return setScheduleError("Please pick a time.");
    setStep("contact");
  }

  const sessionPrice = selectedSlot ? selectedSlot.price : selectedSession?.price || 0;
  const requiresPayment = sessionPrice > 0;

  async function finalizeBooking(paymentProof?: {
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
  }) {
    const name = form.name.trim();
    const email = form.email.trim().toLowerCase();
    const phone = form.phone.trim();
    const message = form.message.trim();

    setIsSubmitting(true);
    try {
      const response = isRequestFlow
        ? await createIndividualRequest({
            name,
            email,
            phone: phone || undefined,
            sessionType,
            preferredDate: selectedDate || undefined,
            preferredTimeSlot: time || undefined,
            message: message || undefined,
          })
        : await createBooking({
            name,
            email,
            phone: phone || undefined,
            sessionType,
            bookingDate: selectedDate,
            timeSlot: time,
            slotId: selectedSlot?.slotId,
            message: message || undefined,
            ...(paymentProof || {}),
          });

      onComplete({
        sessionType,
        dateLabel: formatChipLabel(selectedDate),
        time,
        amountPaid: paymentProof ? sessionPrice : 0,
        message: response.message,
      });
    } catch (error) {
      const messageText = getErrorMessage(error);
      setFormError(
        paymentProof
          ? `Payment succeeded but we couldn't confirm your booking: ${messageText} Please contact us with payment ID ${paymentProof.razorpayPaymentId}.`
          : messageText,
      );
    } finally {
      setIsSubmitting(false);
      setIsPaying(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");

    const name = form.name.trim();
    const email = form.email.trim().toLowerCase();
    const phone = form.phone.trim();

    if (name.length < 2) return setFormError("Please enter your full name.");
    if (!/^\S+@\S+\.\S+$/.test(email)) return setFormError("Please enter a valid email address.");
    if (phone && !/^[0-9+()\-\s]{7,24}$/.test(phone)) return setFormError("Please enter a valid phone number.");

    if (!requiresPayment) {
      await finalizeBooking();
      return;
    }

    setIsPaying(true);
    try {
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        setFormError("Couldn't load the payment gateway. Please check your connection and try again.");
        setIsPaying(false);
        return;
      }

      const order = await createPaymentOrder({
        sessionType,
        bookingDate: selectedDate,
        timeSlot: time,
        slotId: selectedSlot?.slotId,
      });

      const razorpay = new window.Razorpay({
        key: RAZORPAY_KEY_ID,
        amount: order.data.amount,
        currency: order.data.currency || "INR",
        name: "Book a Session",
        description: `${sessionType} — ${formatChipLabel(selectedDate)} at ${time}`,
        order_id: order.data.orderId,
        prefill: { name, email, contact: phone || undefined },
        theme: { color: "#2F3F38" },
        handler: async (paymentResponse: {
          razorpay_payment_id: string;
          razorpay_order_id: string;
          razorpay_signature: string;
        }) => {
          await finalizeBooking({
            razorpayOrderId: paymentResponse.razorpay_order_id,
            razorpayPaymentId: paymentResponse.razorpay_payment_id,
            razorpaySignature: paymentResponse.razorpay_signature,
          });
        },
        modal: { ondismiss: () => setIsPaying(false) },
      });

      razorpay.on("payment.failed", (response: { error?: { description?: string } }) => {
        setFormError(response.error?.description || "Payment failed. Please try again.");
        setIsPaying(false);
      });

      razorpay.open();
    } catch (error) {
      setFormError(getErrorMessage(error));
      setIsPaying(false);
    }
  }

  const stepIndex = { service: 0, datetime: 1, contact: 2 }[step];

  return (
    <div className="rounded-2xl border border-[#e7ded0] bg-white p-4 text-sm text-[#2F3F38]">
      {/* Progress + back */}
      <div className="mb-3 flex items-center gap-2">
        {step !== "service" ? (
          <button
            type="button"
            onClick={() => setStep(step === "contact" ? "datetime" : "service")}
            className="grid h-6 w-6 place-items-center rounded-full text-[#8a8478] hover:bg-[#f0ebe0]"
            aria-label="Back"
          >
            <ChevronLeft size={14} />
          </button>
        ) : (
          <span className="h-6 w-6" />
        )}
        <div className="flex flex-1 gap-1.5">
          {["service", "datetime", "contact"].map((s, i) => (
            <span
              key={s}
              className={`h-1 flex-1 rounded-full ${i <= stepIndex ? "bg-[#C08A45]" : "bg-[#f0ebe0]"}`}
            />
          ))}
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="text-xs text-[#8a8478] underline underline-offset-2 hover:text-[#2F3F38]"
        >
          Cancel
        </button>
      </div>

      {isConfigLoading && (
        <div className="flex items-center gap-2 py-6 text-[#8a8478]">
          <Loader2 size={16} className="animate-spin" /> Loading available sessions...
        </div>
      )}

      {!isConfigLoading && loadError && (
        <p className="rounded-xl border border-[#e4b8a9] bg-[#fff5f1] px-3 py-2 text-xs text-[#8b4636]">
          {loadError}
        </p>
      )}

      {!isConfigLoading && !loadError && config && (
        <>
          {step === "service" && (
            <div>
              <p className="mb-3 font-serif text-[15px]">Which session would you like?</p>
              <div className="grid gap-2">
                {config.sessionTypes
                  .filter((s) => s.isActive !== false)
                  .map((s) => (
                    <button
                      key={s.title}
                      type="button"
                      onClick={() => {
                        setSessionType(s.title);
                        setStep("datetime");
                      }}
                      className={`rounded-xl border px-3.5 py-3 text-left transition ${
                        sessionType === s.title
                          ? "border-[#C08A45] bg-[#fdf6ec]"
                          : "border-[#e7ded0] hover:border-[#C08A45]/60"
                      }`}
                    >
                      <p className="text-sm font-medium">{s.title}</p>
                      <p className="mt-0.5 text-xs text-[#8a8478]">
                        {s.duration} · {s.price > 0 ? formatRupees(s.price) : "Free"}
                      </p>
                    </button>
                  ))}
              </div>
            </div>
          )}

          {step === "datetime" && (
            <div>
              <p className="mb-3 font-serif text-[15px]">Pick a date &amp; time</p>

              {isRequestFlow ? (
                <div className="mb-3">
                  <label className="mb-1.5 block text-xs font-medium text-[#59645e]">
                    Preferred date
                  </label>
                  <input
                    type="date"
                    min={todayKey}
                    max={maxDateKey}
                    value={selectedDate}
                    onChange={(e) => handlePickDate(e.target.value)}
                    className={inputClass}
                  />
                  <p className="mt-1.5 text-[11px] text-[#8a8478]">
                    Our team will confirm the exact time by email.
                  </p>
                </div>
              ) : (
                <div className="mb-3">
                  <label className="mb-1.5 block text-xs font-medium text-[#59645e]">
                    Available dates
                  </label>
                  {isCalendarLoading ? (
                    <p className="flex items-center gap-2 text-xs text-[#8a8478]">
                      <Loader2 size={13} className="animate-spin" /> Checking availability...
                    </p>
                  ) : enabledDates.length === 0 ? (
                    <p className="text-xs text-[#8a8478]">
                      No open dates in the next two months for this session.
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {enabledDates.map((d) => (
                        <button
                          key={d}
                          type="button"
                          onClick={() => handlePickDate(d)}
                          className={`${chipBtn} ${
                            selectedDate === d
                              ? "border-[#C08A45] bg-[#fdf6ec] text-[#2F3F38]"
                              : "border-[#e7ded0] text-[#59645e] hover:border-[#C08A45]/60"
                          }`}
                        >
                          {formatChipLabel(d)}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {selectedDate && (
                <div className="mb-3">
                  <label className="mb-1.5 block text-xs font-medium text-[#59645e]">
                    {isRequestFlow ? "Preferred time" : "Available times"}
                  </label>

                  {isRequestFlow ? (
                    <div className="flex flex-wrap gap-2">
                      {(config.timeSlots || []).map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setTime(t)}
                          className={`${chipBtn} ${
                            time === t
                              ? "border-[#C08A45] bg-[#fdf6ec] text-[#2F3F38]"
                              : "border-[#e7ded0] text-[#59645e] hover:border-[#C08A45]/60"
                          }`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  ) : isAvailabilityLoading ? (
                    <p className="flex items-center gap-2 text-xs text-[#8a8478]">
                      <Loader2 size={13} className="animate-spin" /> Loading times...
                    </p>
                  ) : availableSlots.length === 0 ? (
                    <p className="text-xs text-[#8a8478]">No open times on this date.</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {availableSlots.map((slot) => (
                        <button
                          key={slot.slotId}
                          type="button"
                          onClick={() => {
                            setSelectedSlot(slot);
                            setTime(slot.timeSlot);
                          }}
                          className={`${chipBtn} ${
                            time === slot.timeSlot
                              ? "border-[#C08A45] bg-[#fdf6ec] text-[#2F3F38]"
                              : "border-[#e7ded0] text-[#59645e] hover:border-[#C08A45]/60"
                          }`}
                        >
                          {slot.timeSlot}
                          {slot.price > 0 ? ` · ${formatRupees(slot.price)}` : ""}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {scheduleError && (
                <p className="mb-3 rounded-xl border border-[#e4b8a9] bg-[#fff5f1] px-3 py-2 text-xs text-[#8b4636]">
                  {scheduleError}
                </p>
              )}

              <button type="button" onClick={continueFromSchedule} className={primaryBtn}>
                Continue
              </button>
            </div>
          )}

          {step === "contact" && (
            <form onSubmit={handleSubmit}>
              <p className="mb-1 font-serif text-[15px]">Your details</p>
              <p className="mb-3 text-xs text-[#8a8478]">
                {sessionType} · {formatChipLabel(selectedDate)} · {time}
              </p>

              <div className="grid gap-2.5">
                <input
                  value={form.name}
                  onChange={(e) => setForm((c) => ({ ...c, name: e.target.value }))}
                  placeholder="Full name"
                  className={inputClass}
                />
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((c) => ({ ...c, email: e.target.value }))}
                  placeholder="Email address"
                  className={inputClass}
                />
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm((c) => ({ ...c, phone: e.target.value }))}
                  placeholder="Phone (optional)"
                  className={inputClass}
                />
                <textarea
                  rows={2}
                  value={form.message}
                  onChange={(e) => setForm((c) => ({ ...c, message: e.target.value }))}
                  placeholder="Anything you'd like to share? (optional)"
                  className={`${inputClass} resize-none`}
                />
              </div>

              {formError && (
                <p className="mt-3 rounded-xl border border-[#e4b8a9] bg-[#fff5f1] px-3 py-2 text-xs text-[#8b4636]">
                  {formError}
                </p>
              )}

              <button type="submit" disabled={isPaying || isSubmitting} className={`${primaryBtn} mt-3`}>
                {isPaying || isSubmitting
                  ? "Processing..."
                  : requiresPayment
                    ? `Pay ${formatRupees(sessionPrice)} & Book`
                    : "Confirm Booking"}
              </button>
              {requiresPayment && (
                <p className="mt-2 text-center text-[10px] text-[#8a8478]">
                  Payments are processed securely via Razorpay.
                </p>
              )}
            </form>
          )}
        </>
      )}
    </div>
  );
}