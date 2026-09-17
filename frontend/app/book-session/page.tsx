"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Reveal } from "@/components/Reveal";
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
import { buttonDark, eyebrow, sectionPadTop } from "@/lib/ui";
import { useUserAuth } from "@/components/UserAuthProvider";
import { BookingAuthModal } from "@/components/BookingAuthModal";

/* =========================================
   RAZORPAY — global type + script loader
   NOTE: add NEXT_PUBLIC_RAZORPAY_KEY_ID to your .env
========================================= */
declare global {
  interface Window {
    Razorpay: any;
  }
}

const RAZORPAY_KEY_ID = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "";

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") {
      resolve(false);
      return;
    }
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

const highlights = ["Safe & Confidential", "Personalised Guidance", "Online Sessions"];
const weekDays = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

const inputClass =
  "w-full rounded-xl border border-line bg-white px-4 py-3 text-base text-ink outline-none transition focus:border-gold focus:ring-2 focus:ring-[#cda968]/15 sm:text-sm";

type StepId = "service" | "schedule" | "payment" | "confirm";

const steps: { id: StepId; label: string }[] = [
  { id: "service", label: "Service" },
  { id: "schedule", label: "Schedule" },
  { id: "payment", label: "Payment" },
  { id: "confirm", label: "Confirm" },
];

/* =========================================
   DATE HELPERS
========================================= */
function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function addMonths(date: Date, amount: number) {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1);
}

function formatDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatMonthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function getMaximumDate(today: Date, monthsAhead: number) {
  const value = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  value.setMonth(value.getMonth() + monthsAhead);
  return value;
}

function formatSelectedDate(dateKey: string) {
  if (!dateKey) return "";
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(year, month - 1, day));
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong. Please try again.";
}

function formatRupees(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function BookSessionPage() {
  const { user } = useUserAuth();

  const [showAuthModal, setShowAuthModal] =
    useState(false);

  const today = useMemo(() => new Date(), []);
  const todayKey = useMemo(() => formatDateKey(today), [today]);

  const [config, setConfig] = useState<BookingConfig | null>(null);
  const [isConfigLoading, setIsConfigLoading] = useState(true);
  const [configError, setConfigError] = useState("");

  const [sessionType, setSessionType] = useState("");
  const [displayMonth, setDisplayMonth] = useState(() => startOfMonth(new Date()));
  const [enabledDates, setEnabledDates] = useState<string[]>([]);
  const [isCalendarLoading, setIsCalendarLoading] = useState(false);
  const [calendarError, setCalendarError] = useState("");

  const [selectedDate, setSelectedDate] = useState("");
  const [availableSlots, setAvailableSlots] = useState<BookingSlot[]>([]);
  const [time, setTime] = useState("");
  const [selectedSlot, setSelectedSlot] = useState<BookingSlot | null>(null);
  const [isAvailabilityLoading, setIsAvailabilityLoading] = useState(false);
  const [availabilityError, setAvailabilityError] = useState("");

  /* =========================================
     WIZARD STEP STATE
  ========================================= */
  const [step, setStep] = useState<StepId>("service");
  const [maxReachedIndex, setMaxReachedIndex] = useState(0);

  const goToStep = (target: StepId) => {
    const targetIndex = steps.findIndex((s) => s.id === target);
    if (targetIndex > maxReachedIndex) return; // can't skip ahead
    setStep(target);
  };

  const advanceTo = (target: StepId) => {
    const targetIndex = steps.findIndex((s) => s.id === target);
    setMaxReachedIndex((current) => Math.max(current, targetIndex));
    setStep(target);
  };

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  });
  const [formError, setFormError] = useState("");

  const [isPaying, setIsPaying] = useState(false);
  const [paymentError, setPaymentError] = useState("");
  const [receipt, setReceipt] = useState<{ paymentId: string; amount: number } | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  /*
   * Prefill contact details from the signed-in
   * account so the visitor doesn't retype what we
   * already know. Only fills blanks — never
   * overwrites something they've edited.
   */
  useEffect(() => {
    if (!user) return;

    setForm((current) => ({
      ...current,
      name: current.name || user.name,
      email: current.email || user.email,
      phone: current.phone || user.phone || "",
    }));
  }, [user]);

  const loadConfig = async () => {
    setIsConfigLoading(true);
    setConfigError("");

    try {
      const response = await getBookingConfig();
      setConfig(response.data);
      setSessionType((current) => current || response.data.sessionTypes[0]?.title || "");
    } catch (error) {
      setConfigError(getErrorMessage(error));
    } finally {
      setIsConfigLoading(false);
    }
  };

  /* =========================================
     LOAD BOOKING CONFIG
  ========================================= */
  useEffect(() => {
    void loadConfig();
  }, []);

  useEffect(() => {
    let cancelled = false;

    setSelectedDate("");
    setTime("");
    setSelectedSlot(null);
    setAvailableSlots([]);
    setAvailabilityError("");
    setCalendarError("");

    const currentSession = config?.sessionTypes.find((s) => s.title === sessionType);
    const isWebinarSession = currentSession?.bookingMode === "webinar";

    if (!sessionType || !isWebinarSession) {
      /*
       * Non-webinar sessions (Discovery Call, 1:1 Coaching,
       * Deep Transformation) don't use admin pre-set slots —
       * no calendar lookup needed.
       */
      setEnabledDates([]);
      setIsCalendarLoading(false);
      return () => {
        cancelled = true;
      };
    }

    async function loadCalendar() {
      setIsCalendarLoading(true);

      try {
        const response = await getBookingCalendar(formatMonthKey(displayMonth), sessionType);
        if (cancelled) return;
        setEnabledDates(response.data.enabledDates || []);
      } catch (error) {
        if (cancelled) return;
        setEnabledDates([]);
        setCalendarError(getErrorMessage(error));
      } finally {
        if (!cancelled) setIsCalendarLoading(false);
      }
    }

    void loadCalendar();

    return () => {
      cancelled = true;
    };
  }, [sessionType, displayMonth, config]);

  const monthLabel = useMemo(
    () =>
      new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(displayMonth),
    [displayMonth],
  );

  const calendarDays = useMemo(() => {
    const year = displayMonth.getFullYear();
    const month = displayMonth.getMonth();
    const firstWeekday = new Date(year, month, 1).getDay();
    const numberOfDays = new Date(year, month + 1, 0).getDate();

    return {
      firstWeekday,
      days: Array.from({ length: numberOfDays }, (_, index) => index + 1),
    };
  }, [displayMonth]);

  const bookingMonthsAhead = useMemo(() => {
    const value = Number(config?.maxMonthsAhead);
    if (!Number.isFinite(value) || value < 1) return 6;
    return Math.min(Math.floor(value), 12);
  }, [config?.maxMonthsAhead]);

  const maxDate = useMemo(() => getMaximumDate(today, bookingMonthsAhead), [today, bookingMonthsAhead]);
  const maxDateKey = useMemo(() => formatDateKey(maxDate), [maxDate]);
  const minimumMonth = useMemo(() => startOfMonth(today), [today]);
  const maximumMonth = useMemo(() => startOfMonth(maxDate), [maxDate]);

  const canGoPrevious = displayMonth.getTime() > minimumMonth.getTime();
  const canGoNext = displayMonth.getTime() < maximumMonth.getTime();

  const enabledDateSet = useMemo(() => new Set(enabledDates), [enabledDates]);

  const isDateDisabled = (date: Date) => {
    const dateKey = formatDateKey(date);
    if (dateKey < todayKey) return true;
    if (dateKey > maxDateKey) return true;
    if (!sessionType) return true;
    /*
     * Request-flow sessions (Discovery Call, 1:1 Coaching,
     * Deep Transformation) aren't restricted to admin
     * pre-set slot dates — any future date is a valid
     * preferred date.
     */
    if (isRequestFlow) return false;
    return !enabledDateSet.has(dateKey);
  };

  const handlePreviousMonth = () => {
    if (!canGoPrevious) return;
    setDisplayMonth((currentMonth) => addMonths(currentMonth, -1));
    setSelectedDate("");
    setTime("");
    setSelectedSlot(null);
    setAvailableSlots([]);
    setAvailabilityError("");
  };

  const handleNextMonth = () => {
    if (!canGoNext) return;
    setDisplayMonth((currentMonth) => addMonths(currentMonth, 1));
    setSelectedDate("");
    setTime("");
    setSelectedSlot(null);
    setAvailableSlots([]);
    setAvailabilityError("");
  };

  const handleDateSelect = async (date: Date) => {
    if (isDateDisabled(date)) return;

    const dateKey = formatDateKey(date);
    setSelectedDate(dateKey);
    setTime("");
    setSelectedSlot(null);
    setAvailableSlots([]);
    setAvailabilityError("");

    /*
     * Request-flow sessions: no BookingSlot exists yet,
     * so there's nothing to look up — just let the user
     * pick a preferred time from the general time list.
     */
    if (isRequestFlow) return;

    setIsAvailabilityLoading(true);

    try {
      const response = await getBookingAvailability(dateKey, sessionType);
      setAvailableSlots(
        (response.data.slots || []).filter((slot) => slot.status === "available"),
      );
    } catch (error) {
      setAvailableSlots([]);
      setAvailabilityError(getErrorMessage(error));
    } finally {
      setIsAvailabilityLoading(false);
    }
  };

  const selectedSession = config?.sessionTypes.find((s) => s.title === sessionType);

  /*
   * Discovery Call / 1:1 Coaching / Deep Transformation:
   * no pre-set admin slots — user just picks a preferred
   * date/time, admin assigns the real one afterwards.
   * Only Webinar keeps the slot-based calendar flow.
   */
  const isRequestFlow = Boolean(selectedSession) && selectedSession?.bookingMode !== "webinar";

  /*
   * Prefer the exact slot's own price (may be a
   * per-slot override set by admin). Fall back to
   * the session type's default price only before a
   * specific slot has been picked yet.
   */
  const sessionPrice = selectedSlot ? selectedSlot.price : selectedSession?.price || 0;
  const requiresPayment = sessionPrice > 0;

  /* =========================================
     STEP VALIDATION / NAVIGATION
  ========================================= */
  const continueFromService = () => {
    if (!sessionType) {
      setConfigError((current) => current || "Please select a session type.");
      return;
    }
    advanceTo("schedule");
  };

  const continueFromSchedule = () => {
    setAvailabilityError("");
    if (!selectedDate) {
      setAvailabilityError("Please select a date.");
      return;
    }
    if (!time) {
      setAvailabilityError("Please select an available time.");
      return;
    }
    advanceTo("payment");
  };

  /* =========================================
     CONFIRM BOOKING (shared by free + paid path)
  ========================================= */
  const finalizeBooking = async (paymentProof?: {
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
  }) => {
    const name = form.name.trim();
    const email = form.email.trim().toLowerCase();
    const phone = form.phone.trim();
    const message = form.message.trim();

    setIsSubmitting(true);

    try {
      const bookingResponse = isRequestFlow
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
            ...(paymentProof
              ? {
                  razorpayOrderId: paymentProof.razorpayOrderId,
                  razorpayPaymentId: paymentProof.razorpayPaymentId,
                  razorpaySignature: paymentProof.razorpaySignature,
                }
              : {}),
          });

      setReceipt(
        paymentProof
          ? { paymentId: paymentProof.razorpayPaymentId, amount: sessionPrice }
          : null,
      );
      setSuccessMessage(bookingResponse.message);
      advanceTo("confirm");
    } catch (error) {
      const messageText = getErrorMessage(error);

      if (paymentProof) {
        setPaymentError(
          `Payment succeeded but we couldn't confirm your booking: ${messageText} Please contact us with payment ID ${paymentProof.razorpayPaymentId}.`,
        );
      } else {
        setFormError(messageText);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  /* =========================================
     PAYMENT / CONFIRM SUBMIT
  ========================================= */
  const handlePaymentSubmit = (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    /*
     * Everything up to this point (service, schedule,
     * contact details) works anonymously — nothing is
     * lost here. Only the actual booking call needs a
     * signed-in account, so that's the one place we
     * gate, via an inline modal rather than bouncing
     * the visitor off the page.
     */
    if (!user) {
      setShowAuthModal(true);
      return;
    }

    void proceedWithBooking();
  };

  const proceedWithBooking = async () => {
    setFormError("");
    setPaymentError("");

    const name = form.name.trim();
    const email = form.email.trim().toLowerCase();
    const phone = form.phone.trim();

    if (name.length < 2) {
      setFormError("Please enter your full name.");
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setFormError("Please enter a valid email address.");
      return;
    }
    if (phone && !/^[0-9+()\-\s]{7,24}$/.test(phone)) {
      setFormError("Please enter a valid phone number.");
      return;
    }

    /*
     * Free session — skip Razorpay entirely.
     */
    if (!requiresPayment) {
      await finalizeBooking();
      return;
    }

    setIsPaying(true);

    try {
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        setPaymentError("Couldn't load the payment gateway. Please check your connection and try again.");
        setIsPaying(false);
        return;
      }

      // Amount is computed server-side from the slot's stored price.
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
        description: `${sessionType} — ${formatSelectedDate(selectedDate)} at ${time}`,
        order_id: order.data.orderId,
        prefill: { name, email, contact: phone || undefined },
        theme: { color: "#0a3d39" },
        /*
         * Deliberately NOT passing a custom
         * `config.display.blocks` here. Razorpay only
         * shows methods you explicitly list once you
         * define custom blocks — everything else
         * (UPI, EMI, Pay Later, whatever's enabled on
         * the account) gets hidden, which is worse than
         * doing nothing. Leaving this out means Checkout
         * shows every payment method actually enabled on
         * the Razorpay account, exactly as configured
         * there — including UPI, once it's turned on in
         * the Razorpay Dashboard (Settings → Payment
         * Methods). That toggle lives on Razorpay's side,
         * not in this code.
         */
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
          setIsPaying(false);
        },
        modal: {
          ondismiss: () => {
            setIsPaying(false);
          },
        },
      });

      razorpay.on("payment.failed", (response: { error?: { description?: string } }) => {
        setPaymentError(response.error?.description || "Payment failed. Please try again.");
        setIsPaying(false);
      });

      razorpay.open();
    } catch (error) {
      setPaymentError(getErrorMessage(error));
      setIsPaying(false);
    }
  };

  const resetBooking = () => {
    setSelectedDate("");
    setAvailableSlots([]);
    setTime("");
    setSelectedSlot(null);
    setAvailabilityError("");
    setFormError("");
    setPaymentError("");
    setSuccessMessage("");
    setReceipt(null);
    setForm({ name: "", email: "", phone: "", message: "" });
    setDisplayMonth(startOfMonth(new Date()));
    setMaxReachedIndex(0);
    setStep("service");
  };

  /*
   * No upfront gate here on purpose — anonymous
   * visitors fill the whole wizard normally.
   * Sign-in is only requested right at the final
   * "Confirm Booking" step (see handlePaymentSubmit),
   * via an inline modal, so nothing they've typed is
   * ever lost.
   */

  return (
    <main className="bg-paper font-sans text-ink">

      <section className={`bg-cream px-[max(5vw,20px)] ${sectionPadTop}`}>
        <div className="grid grid-cols-[0.8fr_1.2fr] gap-[60px] max-[900px]:grid-cols-1 max-[900px]:gap-10">
          <Reveal>
            <p className={eyebrow}>BOOK A SESSION</p>
            <h1 className="m-0 mb-5 font-serif text-[clamp(34px,4vw,50px)] font-medium leading-[1.05]">
              Book Your Transformation Session
            </h1>
            <p className="mb-8 max-w-[380px] text-sm leading-[1.8] text-[#59645e]">
              Take the first step toward healing, regulation and transformation.
            </p>
            <ul className="space-y-3">
              {highlights.map((highlight) => (
                <li key={highlight} className="flex items-center gap-3 text-sm text-ink">
                  <span className="grid h-5 w-5 place-items-center rounded-full border border-gold text-[10px] text-gold">
                    ✓
                  </span>
                  {highlight}
                </li>
              ))}
            </ul>
          </Reveal>

          <div className="relative z-[10000] isolate w-full pointer-events-auto">
            <div className="grid grid-cols-[180px_1fr] gap-6 max-[700px]:grid-cols-1 max-[700px]:gap-4">
              {/* =========================================
                   STEP SIDEBAR
              ========================================= */}
              <nav aria-label="Booking steps" className="max-[700px]:mb-2">
                <p className="mb-3 text-[10px] font-semibold tracking-[0.12em] text-muted">STEPS</p>
                <ol className="space-y-2 max-[700px]:flex max-[700px]:snap-x max-[700px]:gap-2 max-[700px]:space-y-0 max-[700px]:overflow-x-auto max-[700px]:pb-1">
                  {steps.map((s, index) => {
                    const isActive = s.id === step;
                    const isReachable = index <= maxReachedIndex;

                    return (
                      <li key={s.id} className="max-[700px]:flex-shrink-0 max-[700px]:snap-start">
                        <button
                          type="button"
                          disabled={!isReachable}
                          onClick={() => goToStep(s.id)}
                          className={`flex w-full items-center gap-2.5 rounded-full px-3 py-2.5 text-left text-sm font-medium transition max-[700px]:whitespace-nowrap ${
                            isActive
                              ? "bg-deep text-white"
                              : isReachable
                                ? "text-ink hover:bg-[#eee2cd]"
                                : "cursor-not-allowed text-[#c9c1b3]"
                          }`}
                        >
                          <span
                            className={`grid h-5 w-5 shrink-0 place-items-center rounded-full border text-[10px] ${
                              isActive
                                ? "border-white/60 text-white"
                                : isReachable
                                  ? "border-gold text-gold"
                                  : "border-[#e1d9c8] text-[#c9c1b3]"
                            }`}
                          >
                            {index + 1}
                          </span>
                          {s.label}
                        </button>
                      </li>
                    );
                  })}
                </ol>
              </nav>

              {/* =========================================
                   STEP CONTENT
              ========================================= */}
              <div className="min-w-0">
                {step === "service" && (
                  <>
                    <h2 className="mb-4 font-serif text-xl font-medium">Choose a Service</h2>

                    {isConfigLoading && (
                      <p className="text-xs leading-5 text-muted">Loading session options...</p>
                    )}

                    {configError && !isConfigLoading && (
                      <div className="rounded-xl border border-[#e4b8a9] bg-[#fff5f1] p-3">
                        <p className="text-xs leading-5 text-[#8b4636]">{configError}</p>
                        <button
                          type="button"
                          onClick={() => void loadConfig()}
                          className="mt-2 text-xs font-semibold text-deep underline underline-offset-2"
                        >
                          Try again
                        </button>
                      </div>
                    )}

                    {!isConfigLoading && !configError && config?.sessionTypes.length === 0 && (
                      <p className="rounded-xl border border-line bg-white px-4 py-6 text-center text-sm italic text-muted">
                        No services available
                      </p>
                    )}

                    {!isConfigLoading && !configError && (config?.sessionTypes.length ?? 0) > 0 && (
                      <div className="mb-6 space-y-3">
                        {config?.sessionTypes.map((session) => (
                          <button
                            type="button"
                            key={session.title}
                            onClick={() => {
                              if (sessionType === session.title) return;
                              setSessionType(session.title);
                              setSelectedDate("");
                              setTime("");
                              setSelectedSlot(null);
                              setAvailableSlots([]);
                              setAvailabilityError("");
                              setCalendarError("");
                            }}
                            className={`block w-full rounded-xl border px-4 py-3 text-left transition-colors ${
                              sessionType === session.title
                                ? "border-gold bg-[#fbeedb]"
                                : "border-line bg-white"
                            }`}
                          >
                            <span className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1 text-sm font-medium">
                              <span className="flex items-center gap-2">
                                <span
                                  className={`h-3 w-3 shrink-0 rounded-full border ${
                                    sessionType === session.title
                                      ? "border-gold bg-gold"
                                      : "border-[#c9bda6]"
                                  }`}
                                />
                                {session.title}
                              </span>
                              <span className="shrink-0 text-xs font-semibold text-deep">
                                {session.price > 0 ? formatRupees(session.price) : "Free"}
                              </span>
                            </span>
                            <span className="mt-1 block pl-5 text-[11px] text-muted">
                              {session.duration}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}

                    <button
                      type="button"
                      disabled={isConfigLoading || Boolean(configError) || !sessionType}
                      onClick={continueFromService}
                      className={`${buttonDark} w-full justify-center py-4 disabled:cursor-not-allowed disabled:opacity-50`}
                    >
                      Next: Select Date &amp; Time
                    </button>
                  </>
                )}

                {step === "schedule" && (
                  <>
                    <h2 className="mb-4 font-serif text-xl font-medium">
                      {isRequestFlow ? "Preferred Date & Time" : "Select Date & Time"}
                    </h2>

                    {isRequestFlow && (
                      <p className="mb-4 rounded-xl border border-line bg-white px-4 py-3 text-[11px] leading-5 text-muted">
                        Pick a date and time that works for you. Our team will confirm the exact
                        session time and share it over email.
                      </p>
                    )}

                    <div className="relative pointer-events-auto grid grid-cols-[1.3fr_1fr] gap-5 rounded-[18px] border border-line bg-[#fffaf3] p-5 max-[640px]:grid-cols-1 max-[640px]:gap-4 max-[420px]:p-4">
                      <div>
                        <div className="mb-3 flex items-center justify-between text-sm font-semibold">
                          <button
                            type="button"
                            aria-label="Previous month"
                            disabled={!canGoPrevious}
                            onClick={handlePreviousMonth}
                            className="relative z-20 grid h-8 w-8 cursor-pointer place-items-center rounded-full transition hover:bg-[#eee2cd] disabled:cursor-not-allowed disabled:opacity-30"
                          >
                            ‹
                          </button>
                          <span>{monthLabel}</span>
                          <button
                            type="button"
                            aria-label="Next month"
                            disabled={!canGoNext}
                            onClick={handleNextMonth}
                            className="relative z-20 grid h-8 w-8 cursor-pointer place-items-center rounded-full transition hover:bg-[#eee2cd] disabled:cursor-not-allowed disabled:opacity-30"
                          >
                            ›
                          </button>
                        </div>

                        <div className="grid grid-cols-7 gap-1 text-center text-[11px] text-muted sm:gap-1.5">
                          {weekDays.map((weekday) => (
                            <span key={weekday}>{weekday}</span>
                          ))}

                          {Array.from({ length: calendarDays.firstWeekday }, (_, index) => (
                            <span key={`blank-${index}`} aria-hidden="true" />
                          ))}

                          {calendarDays.days.map((dayNumber) => {
                            const date = new Date(
                              displayMonth.getFullYear(),
                              displayMonth.getMonth(),
                              dayNumber,
                            );
                            const dateKey = formatDateKey(date);
                            const disabled = isDateDisabled(date);
                            const isSelected = selectedDate === dateKey;
                            const isAvailable = isRequestFlow ? !disabled : enabledDateSet.has(dateKey);

                            return (
                              <button
                                type="button"
                                key={dateKey}
                                disabled={disabled}
                                onClick={() => void handleDateSelect(date)}
                                className={`relative z-20 aspect-square min-h-[32px] rounded-full text-[11px] transition ${
                                  isSelected
                                    ? "bg-deep text-white shadow-[0_5px_16px_rgba(10,61,57,.20)]"
                                    : isAvailable && !disabled
                                      ? "cursor-pointer border border-gold bg-[#fbeedb] font-semibold text-[#8b6337] shadow-[0_4px_14px_rgba(190,139,70,.12)] hover:bg-[#f7e3c5]"
                                      : "cursor-not-allowed text-[#c9c1b3] opacity-45"
                                }`}
                              >
                                {dayNumber}
                                {isAvailable && !isSelected && !disabled && (
                                  <span className="absolute bottom-[3px] left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-gold" />
                                )}
                              </button>
                            );
                          })}
                        </div>

                        {!isRequestFlow && isCalendarLoading && (
                          <div className="mt-4 rounded-xl border border-line bg-white px-4 py-3 text-center">
                            <p className="text-[11px] text-muted">Checking available dates...</p>
                          </div>
                        )}

                        {!isRequestFlow &&
                          !isCalendarLoading &&
                          sessionType &&
                          !calendarError &&
                          enabledDates.length === 0 && (
                            <div className="mt-4 rounded-xl border border-[#ead8bd] bg-[#fff8ed] px-4 py-3 text-center">
                              <p className="text-[11px] font-semibold text-[#8c6438]">
                                No slot available in this month.
                              </p>
                              <p className="mt-1 text-[10px] leading-4 text-[#94816d]">
                                No {sessionType} sessions are currently available in {monthLabel}.
                              </p>
                            </div>
                          )}

                        {!isRequestFlow && calendarError && (
                          <div className="mt-4 rounded-xl border border-[#e4b8a9] bg-[#fff5f1] px-4 py-3 text-center">
                            <p className="text-[11px] text-[#8b4636]">{calendarError}</p>
                          </div>
                        )}
                      </div>

                      <div>
                        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted">
                          {isRequestFlow ? "Preferred Time (IST)" : "Available Times (IST)"}
                        </h3>

                        {isRequestFlow && !selectedDate && (
                          <p className="rounded-xl border border-line bg-white px-3 py-3 text-center text-[11px] leading-5 text-muted">
                            Select a date to choose a preferred time.
                          </p>
                        )}

                        {isRequestFlow && selectedDate && (
                          <div className="space-y-2">
                            {(config?.timeSlots || []).map((slotTime) => (
                              <button
                                type="button"
                                key={slotTime}
                                onClick={() => {
                                  setTime(slotTime);
                                  setAvailabilityError("");
                                }}
                                className={`flex w-full items-center justify-center rounded-full border px-3 py-2 text-[11px] transition ${
                                  time === slotTime
                                    ? "border-gold bg-[#fbeedb] font-semibold"
                                    : "border-line bg-white hover:border-gold/60"
                                }`}
                              >
                                {slotTime}
                              </button>
                            ))}

                            {(config?.timeSlots || []).length === 0 && (
                              <p className="rounded-xl border border-line bg-white px-3 py-3 text-center text-[11px] leading-5 text-muted">
                                No preferred times configured. Please share your preference in
                                the message field on the next step.
                              </p>
                            )}
                          </div>
                        )}

                        {!isRequestFlow && !selectedDate && !isCalendarLoading && enabledDates.length > 0 && (
                          <p className="rounded-xl border border-line bg-white px-3 py-3 text-center text-[11px] leading-5 text-muted">
                            Select a highlighted date to view available {sessionType} times.
                          </p>
                        )}

                        {!isRequestFlow &&
                          !selectedDate &&
                          !isCalendarLoading &&
                          sessionType &&
                          enabledDates.length === 0 && (
                            <p className="rounded-xl border border-line bg-white px-3 py-3 text-center text-[11px] leading-5 text-muted">
                              No available {sessionType} slots in {monthLabel}.
                            </p>
                          )}

                        {!isRequestFlow && isAvailabilityLoading && (
                          <p className="rounded-xl border border-line bg-white px-3 py-3 text-center text-[11px] text-muted">
                            Checking availability...
                          </p>
                        )}

                        {!isRequestFlow && !isAvailabilityLoading && selectedDate && availableSlots.length > 0 && (
                          <div className="space-y-2">
                            {availableSlots.map((slot) => (
                              <button
                                type="button"
                                key={slot.slotId}
                                onClick={() => {
                                  setTime(slot.timeSlot);
                                  setSelectedSlot(slot);
                                  setAvailabilityError("");
                                }}
                                className={`flex w-full items-center justify-between gap-2 rounded-full border px-3 py-2 text-[11px] transition ${
                                  time === slot.timeSlot
                                    ? "border-gold bg-[#fbeedb] font-semibold"
                                    : "border-line bg-white hover:border-gold/60"
                                }`}
                              >
                                <span>{slot.timeSlot}</span>
                                <span className="text-[10px] font-semibold text-deep">
                                  {slot.isPaid ? formatRupees(slot.price) : "Free"}
                                </span>
                              </button>
                            ))}
                          </div>
                        )}

                        {!isRequestFlow &&
                          !isAvailabilityLoading &&
                          selectedDate &&
                          !availabilityError &&
                          availableSlots.length === 0 && (
                            <p className="rounded-xl border border-line bg-white px-3 py-3 text-center text-[11px] leading-5 text-muted">
                              No times are available on this date. Please choose another day.
                            </p>
                          )}
                      </div>
                    </div>

                    {availabilityError && (
                      <p className="mt-4 rounded-xl border border-[#e4b8a9] bg-[#fff5f1] px-4 py-3 text-xs text-[#8b4636]">
                        {availabilityError}
                      </p>
                    )}

                    <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                      <button
                        type="button"
                        onClick={() => goToStep("service")}
                        className="rounded-full border border-line px-6 py-4 text-sm font-semibold text-ink transition hover:bg-white"
                      >
                        Back
                      </button>
                      <button
                        type="button"
                        disabled={!selectedDate || !time}
                        onClick={continueFromSchedule}
                        className={`${buttonDark} flex-1 justify-center py-4 disabled:cursor-not-allowed disabled:opacity-50`}
                      >
                        {isRequestFlow ? "Next: Your Details" : "Next: Payment"}
                      </button>
                    </div>
                  </>
                )}

                {step === "payment" && (
                  <form onSubmit={handlePaymentSubmit} noValidate>
                    <h2 className="mb-4 font-serif text-xl font-medium">Your Details &amp; Payment</h2>

                    <div className="grid grid-cols-[1fr_1.1fr] gap-6 max-[700px]:grid-cols-1 max-[700px]:gap-4">
                      <div className="rounded-[18px] border border-line bg-[#fffaf3] p-5 max-[380px]:p-4">
                        <h3 className="mb-4 text-sm font-semibold">Your Session</h3>
                        <div className="space-y-4 text-sm">
                          <div>
                            <p className="text-[11px] uppercase tracking-wide text-muted">Session</p>
                            <p className="mt-1 font-medium text-ink">{sessionType}</p>
                          </div>
                          <div>
                            <p className="text-[11px] uppercase tracking-wide text-muted">
                              {isRequestFlow ? "Preferred Date" : "Date"}
                            </p>
                            <p className="mt-1 font-medium text-ink">{formatSelectedDate(selectedDate)}</p>
                          </div>
                          <div>
                            <p className="text-[11px] uppercase tracking-wide text-muted">
                              {isRequestFlow ? "Preferred Time" : "Time"}
                            </p>
                            <p className="mt-1 font-medium text-ink">{time} IST</p>
                          </div>
                          <div className="border-t border-line pt-4">
                            <p className="text-[11px] uppercase tracking-wide text-muted">Amount</p>
                            <p className="mt-1 font-serif text-lg font-medium text-deep">
                              {requiresPayment ? formatRupees(sessionPrice) : "Free"}
                            </p>
                          </div>
                        </div>

                        {isRequestFlow && (
                          <p className="mt-4 rounded-xl border border-line bg-white px-3 py-2 text-[10px] leading-4 text-muted">
                            This is your preferred date/time. Our team will confirm the final
                            session time by email.
                          </p>
                        )}

                        <button
                          type="button"
                          onClick={() => goToStep("schedule")}
                          className="mt-6 text-xs font-semibold text-deep underline underline-offset-4"
                        >
                          ← Change session details
                        </button>
                      </div>

                      <div className="rounded-[18px] border border-line bg-[#fffaf3] p-5 max-[380px]:p-4">
                        <h3 className="mb-4 text-sm font-semibold">Contact Information</h3>

                        <div className="grid gap-4">
                          <div>
                            <label htmlFor="booking-name" className="mb-1.5 block text-xs font-medium text-ink">
                              Full Name <span className="text-[#9b4e3d]">*</span>
                            </label>
                            <input
                              id="booking-name"
                              type="text"
                              autoComplete="name"
                              maxLength={80}
                              value={form.name}
                              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                              className={inputClass}
                              placeholder="Your full name"
                            />
                          </div>

                          <div>
                            <label htmlFor="booking-email" className="mb-1.5 block text-xs font-medium text-ink">
                              Email Address <span className="text-[#9b4e3d]">*</span>
                            </label>
                            <input
                              id="booking-email"
                              type="email"
                              autoComplete="email"
                              maxLength={160}
                              value={form.email}
                              onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                              className={inputClass}
                              placeholder="you@example.com"
                            />
                          </div>

                          <div>
                            <label htmlFor="booking-phone" className="mb-1.5 block text-xs font-medium text-ink">
                              Phone Number <span className="text-muted">(optional)</span>
                            </label>
                            <input
                              id="booking-phone"
                              type="tel"
                              autoComplete="tel"
                              maxLength={24}
                              value={form.phone}
                              onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
                              className={inputClass}
                              placeholder="+91 98765 43210"
                            />
                          </div>

                          <div>
                            <label htmlFor="booking-message" className="mb-1.5 block text-xs font-medium text-ink">
                              Anything you&apos;d like to share? <span className="text-muted">(optional)</span>
                            </label>
                            <textarea
                              id="booking-message"
                              rows={3}
                              maxLength={1000}
                              value={form.message}
                              onChange={(event) => setForm((current) => ({ ...current, message: event.target.value }))}
                              className={`${inputClass} resize-none`}
                              placeholder="Share any context that may help us prepare for your session."
                            />
                            <p className="mt-1 text-right text-[10px] text-muted">{form.message.length}/1000</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {formError && (
                      <p className="mt-4 rounded-xl border border-[#e4b8a9] bg-[#fff5f1] px-4 py-3 text-xs text-[#8b4636]">
                        {formError}
                      </p>
                    )}

                    {paymentError && (
                      <p className="mt-4 rounded-xl border border-[#e4b8a9] bg-[#fff5f1] px-4 py-3 text-xs text-[#8b4636]">
                        {paymentError}
                      </p>
                    )}

                    <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                      <button
                        type="button"
                        onClick={() => goToStep("schedule")}
                        className="rounded-full border border-line px-6 py-4 text-sm font-semibold text-ink transition hover:bg-white"
                      >
                        Back
                      </button>
                      <button
                        type="submit"
                        disabled={isPaying || isSubmitting}
                        className={`${buttonDark} flex-1 justify-center py-4 disabled:cursor-not-allowed disabled:opacity-60`}
                      >
                        {isPaying || isSubmitting
                          ? "Processing..."
                          : requiresPayment
                            ? `Pay ${formatRupees(sessionPrice)} & Book Session`
                            : "Confirm Booking"}
                      </button>
                    </div>

                    {requiresPayment && (
                      <p className="mt-3 text-center text-[10px] text-muted">
                        Payments are processed securely via Razorpay.
                      </p>
                    )}
                  </form>
                )}

                {step === "confirm" && (
                  <div className="rounded-[18px] border border-line bg-[#fffaf3] p-8 text-center max-[500px]:p-5">
                    <span className="mx-auto mb-5 grid h-12 w-12 place-items-center rounded-full border border-gold bg-[#fbeedb] text-lg text-gold">
                      ✓
                    </span>
                    <p className={eyebrow}>REQUEST RECEIVED</p>
                    <h2 className="mx-auto mt-3 max-w-[520px] font-serif text-[clamp(28px,3vw,38px)] font-medium leading-tight">
                      {receipt
                        ? "Your session is booked and paid for."
                        : isRequestFlow
                          ? "Your request has been received."
                          : "Your session request has been received."}
                    </h2>
                    <p className="mx-auto mt-4 max-w-[560px] text-sm leading-7 text-[#59645e]">
                      {successMessage}
                    </p>

                    <div className="mx-auto mt-6 max-w-[560px] rounded-2xl border border-line bg-white p-5 text-left text-sm">
                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                        <div>
                          <p className="text-[10px] uppercase tracking-wide text-muted">Session</p>
                          <p className="mt-1 font-medium">{sessionType}</p>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase tracking-wide text-muted">
                            {isRequestFlow ? "Preferred Date" : "Date"}
                          </p>
                          <p className="mt-1 font-medium">{formatSelectedDate(selectedDate)}</p>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase tracking-wide text-muted">
                            {isRequestFlow ? "Preferred Time" : "Time"}
                          </p>
                          <p className="mt-1 font-medium">{time} IST</p>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase tracking-wide text-muted">Amount Paid</p>
                          <p className="mt-1 font-medium">
                            {receipt ? formatRupees(receipt.amount) : "Free"}
                          </p>
                        </div>
                      </div>
                      {receipt && (
                        <p className="mt-4 border-t border-line pt-3 text-[10px] text-muted">
                          Payment ID: {receipt.paymentId}
                        </p>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={resetBooking}
                      className={`${buttonDark} mt-7 w-full justify-center px-8 py-3 sm:w-auto`}
                    >
                      Book Another Session
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {showAuthModal && (
        <BookingAuthModal
          defaultEmail={form.email}
          onClose={() => setShowAuthModal(false)}
          onAuthenticated={() => {
            setShowAuthModal(false);
            void proceedWithBooking();
          }}
        />
      )}

    </main>
  );
}