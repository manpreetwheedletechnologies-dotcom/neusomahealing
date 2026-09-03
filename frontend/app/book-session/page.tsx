"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Header } from "@/components/Header";
import { SiteFooter } from "@/components/SiteFooter";
import { Reveal } from "@/components/Reveal";
import {
  BookingConfig,
  createBooking,
  getBookingAvailability,
  getBookingConfig,
} from "@/lib/booking-api";
import { buttonDark, eyebrow, sectionPadTop } from "@/lib/ui";

const highlights = ["Safe & Confidential", "Personalised Guidance", "Online Sessions"];
const weekDays = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

const inputClass =
  "w-full rounded-xl border border-line bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-gold focus:ring-2 focus:ring-[#cda968]/15";

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
  return error instanceof Error
    ? error.message
    : "Something went wrong. Please try again.";
}

export default function BookSessionPage() {
  const today = useMemo(() => new Date(), []);
  const todayKey = useMemo(() => formatDateKey(today), [today]);

  const [config, setConfig] = useState<BookingConfig | null>(null);
  const [isConfigLoading, setIsConfigLoading] = useState(true);
  const [configError, setConfigError] = useState("");

  const [sessionType, setSessionType] = useState("");
  const [displayMonth, setDisplayMonth] = useState(() => startOfMonth(new Date()));
  const [selectedDate, setSelectedDate] = useState("");
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);
  const [time, setTime] = useState("");
  const [isAvailabilityLoading, setIsAvailabilityLoading] = useState(false);
  const [availabilityError, setAvailabilityError] = useState("");

  const [step, setStep] = useState<1 | 2 | "success">(1);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

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

  useEffect(() => {
    void loadConfig();
  }, []);

  const monthLabel = useMemo(
    () =>
      new Intl.DateTimeFormat("en-US", {
        month: "long",
        year: "numeric",
      }).format(displayMonth),
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

    // Backend/old DB record me 0, null, NaN etc. ho
    // to calendar ko disable mat hone do.
    if (!Number.isFinite(value) || value < 1) {
      return 6;
    }

    // Extra protection
    return Math.min(Math.floor(value), 12);
  }, [config?.maxMonthsAhead]);

  const maxDate = useMemo(() => {
    return getMaximumDate(today, bookingMonthsAhead);
  }, [today, bookingMonthsAhead]);

  const maxDateKey = useMemo(() => {
    return formatDateKey(maxDate);
  }, [maxDate]);

  const minimumMonth = useMemo(() => {
    return startOfMonth(today);
  }, [today]);

  const maximumMonth = useMemo(() => {
    return startOfMonth(maxDate);
  }, [maxDate]);

  const canGoPrevious =
    displayMonth.getTime() >
    minimumMonth.getTime();

  const canGoNext =
    displayMonth.getTime() <
    maximumMonth.getTime();

  const activeWeekdays = useMemo(() => {
    const rawDays =
      config?.activeWeekdays ?? [];

    const days = rawDays
      .map((day) => Number(day))
      .filter(
        (day) =>
          Number.isInteger(day) &&
          day >= 0 &&
          day <= 6,
      );

    // Invalid/empty backend config ki wajah se
    // dates disable nahi hongi.
    if (days.length === 0) {
      return [0, 1, 2, 3, 4, 5, 6];
    }

    return days;
  }, [config?.activeWeekdays]);

  const isDateDisabled = (date: Date) => {
    const dateKey = formatDateKey(date);

    // Past date
    if (dateKey < todayKey) {
      return true;
    }

    // Maximum booking range
    if (dateKey > maxDateKey) {
      return true;
    }

    // Allowed weekdays
    if (
      !activeWeekdays.includes(
        date.getDay(),
      )
    ) {
      return true;
    }

    return false;
  };

  const handlePreviousMonth = () => {
    if (!canGoPrevious) {
      return;
    }

    setDisplayMonth(
      (currentMonth) =>
        addMonths(currentMonth, -1),
    );

    setSelectedDate("");
    setTime("");
    setAvailableTimes([]);
    setAvailabilityError("");
  };

  const handleNextMonth = () => {
    if (!canGoNext) {
      return;
    }

    setDisplayMonth(
      (currentMonth) =>
        addMonths(currentMonth, 1),
    );

    setSelectedDate("");
    setTime("");
    setAvailableTimes([]);
    setAvailabilityError("");
  };

  const handleDateSelect = async (
    date: Date,
  ) => {
    if (isDateDisabled(date)) {
      return;
    }

    const dateKey =
      formatDateKey(date);

    setSelectedDate(dateKey);
    setTime("");
    setAvailableTimes([]);
    setAvailabilityError("");
    setIsAvailabilityLoading(true);

    try {
      const response =
        await getBookingAvailability(
          dateKey,
        );

      setAvailableTimes(
        response.data.availableTimes,
      );
    } catch (error) {
      setAvailableTimes([]);

      setAvailabilityError(
        getErrorMessage(error),
      );
    } finally {
      setIsAvailabilityLoading(false);
    }
  };

  const continueToDetails = () => {
    setSubmitError("");

    if (!sessionType) {
      setAvailabilityError("Please select a session type.");
      return;
    }

    if (!selectedDate) {
      setAvailabilityError("Please select a date.");
      return;
    }

    if (!time) {
      setAvailabilityError("Please select an available time.");
      return;
    }

    setStep(2);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitError("");

    const name = form.name.trim();
    const email = form.email.trim().toLowerCase();
    const phone = form.phone.trim();
    const message = form.message.trim();

    if (name.length < 2) {
      setSubmitError("Please enter your full name.");
      return;
    }

    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setSubmitError("Please enter a valid email address.");
      return;
    }

    if (phone && !/^[0-9+()\-\s]{7,24}$/.test(phone)) {
      setSubmitError("Please enter a valid phone number.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await createBooking({
        name,
        email,
        phone: phone || undefined,
        sessionType,
        bookingDate: selectedDate,
        timeSlot: time,
        message: message || undefined,
      });

      setSuccessMessage(response.message);
      setStep("success");
    } catch (error) {
      const messageText = getErrorMessage(error);
      setSubmitError(messageText);

      const status =
        typeof error === "object" && error !== null && "status" in error
          ? (error as { status?: number }).status
          : undefined;

      if (status === 409) {
        try {
          const response = await getBookingAvailability(selectedDate);
          setAvailableTimes(response.data.availableTimes);
          setTime("");
        } catch {
          setAvailableTimes([]);
        }
        setStep(1);
        setAvailabilityError(messageText);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetBooking = () => {
    setSelectedDate("");
    setAvailableTimes([]);
    setTime("");
    setAvailabilityError("");
    setSubmitError("");
    setSuccessMessage("");
    setForm({ name: "", email: "", phone: "", message: "" });
    setDisplayMonth(startOfMonth(new Date()));
    setStep(1);
  };

  const selectionLabel =
    selectedDate && time
      ? `${sessionType}, ${formatSelectedDate(selectedDate)} at ${time}`
      : "Select a date and time";

  return (
    <main className="bg-paper font-sans text-ink">
      <Header />

      <section className={`bg-cream ${sectionPadTop}`}>
        <div className="grid grid-cols-[0.8fr_1.2fr] gap-[60px] max-[900px]:grid-cols-1">
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

          <div className="relative z-[10000] isolate pointer-events-auto">
            {step === 1 && (
              <>
                <div className="grid grid-cols-[1fr_1.3fr] gap-6 max-[700px]:grid-cols-1">
                  <div className="rounded-[18px] border border-line bg-[#fffaf3] p-5">
                    <h3 className="mb-4 text-sm font-semibold">Select a Session Type</h3>

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

                    {!isConfigLoading && !configError && (
                      <div className="space-y-3">
                        {config?.sessionTypes.map((session) => (
                          <button
                            type="button"
                            key={session.title}
                            onClick={() => setSessionType(session.title)}
                            className={`block w-full rounded-xl border px-4 py-3 text-left transition-colors ${sessionType === session.title
                              ? "border-gold bg-[#fbeedb]"
                              : "border-line bg-white"
                              }`}
                          >
                            <span className="flex items-center gap-2 text-sm font-medium">
                              <span
                                className={`h-3 w-3 rounded-full border ${sessionType === session.title
                                  ? "border-gold bg-gold"
                                  : "border-[#c9bda6]"
                                  }`}
                              />
                              {session.title}
                            </span>
                            <span className="mt-1 block pl-5 text-[11px] text-muted">
                              {session.duration}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

               <div className="relative pointer-events-auto grid grid-cols-[1.3fr_1fr] gap-5 rounded-[18px] border border-line bg-[#fffaf3] p-5 max-[500px]:grid-cols-1">
                    <div>
                      <div className="mb-3 flex items-center justify-between text-sm font-semibold">
                        <button
                          type="button"
                          aria-label="Previous month"
                          disabled={!canGoPrevious}
                          onClick={handlePreviousMonth}
                          className="
    relative z-20
    grid h-7 w-7
    cursor-pointer
    place-items-center
    rounded-full
    transition
    hover:bg-[#eee2cd]
    disabled:cursor-not-allowed
    disabled:opacity-30
  "
                        >
                          ‹
                        </button>
                        <span>{monthLabel}</span>
                        <button
                          type="button"
                          aria-label="Next month"
                          disabled={!canGoNext}
                          onClick={handleNextMonth}
                          className="
    relative z-20
    grid h-7 w-7
    cursor-pointer
    place-items-center
    rounded-full
    transition
    hover:bg-[#eee2cd]
    disabled:cursor-not-allowed
    disabled:opacity-30
  "
                        >
                          ›
                        </button>
                      </div>

                      <div className="grid grid-cols-7 gap-1 text-center text-[11px] text-muted">
                        {weekDays.map((weekday) => (
                          <span key={weekday}>{weekday}</span>
                        ))}

                        {Array.from({ length: calendarDays.firstWeekday }, (_, index) => (
                          <span key={`blank-${index}`} aria-hidden="true" />
                        ))}

                        {calendarDays.days.map(
                          (dayNumber) => {
                            const date = new Date(
                              displayMonth.getFullYear(),
                              displayMonth.getMonth(),
                              dayNumber,
                            );

                            const dateKey =
                              formatDateKey(date);

                            const disabled =
                              isDateDisabled(date);

                            const isSelected =
                              selectedDate === dateKey;

                            return (
                              <button
                                type="button"
                                key={dateKey}
                                disabled={disabled}
                                onClick={() => {
                                  void handleDateSelect(date);
                                }}
                                className={`
    relative z-20
    aspect-square
    rounded-full
    text-[11px]
    transition

    ${isSelected
                                    ? "bg-deep text-white"
                                    : disabled
                                      ? "cursor-not-allowed text-[#c9c1b3] opacity-55"
                                      : "cursor-pointer text-ink hover:bg-[#eee2cd]"
                                  }
  `}
                              >
                                {dayNumber}
                              </button>
                            );
                          },
                        )}
                      </div>
                    </div>

                    <div>
                      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted">
                        Available Times (IST)
                      </h3>

                      {!selectedDate && (
                        <p className="rounded-xl border border-line bg-white px-3 py-3 text-center text-[11px] leading-5 text-muted">
                          Select a date to view available times.
                        </p>
                      )}

                      {isAvailabilityLoading && (
                        <p className="rounded-xl border border-line bg-white px-3 py-3 text-center text-[11px] text-muted">
                          Checking availability...
                        </p>
                      )}

                      {!isAvailabilityLoading && selectedDate && availableTimes.length > 0 && (
                        <div className="space-y-2">
                          {availableTimes.map((timeSlot) => (
                            <button
                              type="button"
                              key={timeSlot}
                              onClick={() => {
                                setTime(timeSlot);
                                setAvailabilityError("");
                              }}
                              className={`block w-full rounded-full border px-3 py-2 text-[11px] transition ${time === timeSlot
                                ? "border-gold bg-[#fbeedb] font-semibold"
                                : "border-line bg-white hover:border-gold/60"
                                }`}
                            >
                              {timeSlot}
                            </button>
                          ))}
                        </div>
                      )}

                      {!isAvailabilityLoading &&
                        selectedDate &&
                        !availabilityError &&
                        availableTimes.length === 0 && (
                          <p className="rounded-xl border border-line bg-white px-3 py-3 text-center text-[11px] leading-5 text-muted">
                            No times are available on this date. Please choose another day.
                          </p>
                        )}
                    </div>
                  </div>
                </div>

                {availabilityError && (
                  <p className="mt-4 rounded-xl border border-[#e4b8a9] bg-[#fff5f1] px-4 py-3 text-xs text-[#8b4636]">
                    {availabilityError}
                  </p>
                )}

                <button
                  type="button"
                  disabled={
                    isConfigLoading ||
                    Boolean(configError) ||
                    !sessionType ||
                    !selectedDate ||
                    !time
                  }
                  onClick={continueToDetails}
                  className={`${buttonDark} mt-6 w-full justify-center py-4 disabled:cursor-not-allowed disabled:opacity-50`}
                >
                  Continue — {selectionLabel}
                </button>
              </>
            )}

            {step === 2 && (
              <form onSubmit={handleSubmit} noValidate>
                <div className="grid grid-cols-[1fr_1.3fr] gap-6 max-[700px]:grid-cols-1">
                  <div className="rounded-[18px] border border-line bg-[#fffaf3] p-5">
                    <h3 className="mb-4 text-sm font-semibold">Your Session</h3>
                    <div className="space-y-4 text-sm">
                      <div>
                        <p className="text-[11px] uppercase tracking-wide text-muted">Session</p>
                        <p className="mt-1 font-medium text-ink">{sessionType}</p>
                      </div>
                      <div>
                        <p className="text-[11px] uppercase tracking-wide text-muted">Date</p>
                        <p className="mt-1 font-medium text-ink">{formatSelectedDate(selectedDate)}</p>
                      </div>
                      <div>
                        <p className="text-[11px] uppercase tracking-wide text-muted">Time</p>
                        <p className="mt-1 font-medium text-ink">{time} IST</p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setSubmitError("");
                        setStep(1);
                      }}
                      className="mt-6 text-xs font-semibold text-deep underline underline-offset-4"
                    >
                      ← Change session details
                    </button>
                  </div>

                  <div className="rounded-[18px] border border-line bg-[#fffaf3] p-5">
                    <h3 className="mb-4 text-sm font-semibold">Your Details</h3>

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
                          rows={4}
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

                {submitError && (
                  <p className="mt-4 rounded-xl border border-[#e4b8a9] bg-[#fff5f1] px-4 py-3 text-xs text-[#8b4636]">
                    {submitError}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`${buttonDark} mt-6 w-full justify-center py-4 disabled:cursor-not-allowed disabled:opacity-60`}
                >
                  {isSubmitting ? "Submitting your request..." : "Request This Session"}
                </button>
              </form>
            )}

            {step === "success" && (
              <div className="rounded-[18px] border border-line bg-[#fffaf3] p-8 text-center">
                <span className="mx-auto mb-5 grid h-12 w-12 place-items-center rounded-full border border-gold bg-[#fbeedb] text-lg text-gold">
                  ✓
                </span>
                <p className={eyebrow}>REQUEST RECEIVED</p>
                <h2 className="mx-auto mt-3 max-w-[520px] font-serif text-[clamp(28px,3vw,38px)] font-medium leading-tight">
                  Your session request has been received.
                </h2>
                <p className="mx-auto mt-4 max-w-[560px] text-sm leading-7 text-[#59645e]">
                  {successMessage}
                </p>

                <div className="mx-auto mt-6 max-w-[520px] rounded-2xl border border-line bg-white p-5 text-left text-sm">
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div>
                      <p className="text-[10px] uppercase tracking-wide text-muted">Session</p>
                      <p className="mt-1 font-medium">{sessionType}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wide text-muted">Date</p>
                      <p className="mt-1 font-medium">{formatSelectedDate(selectedDate)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wide text-muted">Time</p>
                      <p className="mt-1 font-medium">{time} IST</p>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={resetBooking}
                  className={`${buttonDark} mt-7 justify-center px-8 py-3`}
                >
                  Book Another Session
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}





// "use client";

// import { useState } from "react";
// import { Header } from "@/components/Header";
// import { SiteFooter } from "@/components/SiteFooter";
// import { Reveal } from "@/components/Reveal";
// import { sessionTypes } from "@/lib/site-data";
// import { buttonDark, eyebrow, sectionPadTop } from "@/lib/ui";

// const days = Array.from({ length: 31 }, (_, i) => i + 1);
// const times = ["11:00 AM", "12:00 PM", "02:00 PM", "04:00 PM", "06:00 PM"];
// const highlights = ["Safe & Confidential", "Personalised Guidance", "Online Sessions"];

// export default function BookSessionPage() {
//   const [sessionType, setSessionType] = useState<string>(sessionTypes[0].title);
//   const [day, setDay] = useState(14);
//   const [time, setTime] = useState(times[2]);

//   return (
//     <main className="bg-paper font-sans text-ink">
//       <Header />

//       <section className={`bg-cream ${sectionPadTop}`}>
//         <div className="grid grid-cols-[0.8fr_1.2fr] gap-[60px] max-[900px]:grid-cols-1">
//           <Reveal>
//             <p className={eyebrow}>BOOK A SESSION</p>
//             <h1 className="m-0 mb-5 font-serif text-[clamp(34px,4vw,50px)] font-medium leading-[1.05]">
//               Book Your Transformation Session
//             </h1>
//             <p className="mb-8 max-w-[380px] text-sm leading-[1.8] text-[#59645e]">
//               Take the first step toward healing, regulation and transformation.
//             </p>
//             <ul className="space-y-3">
//               {highlights.map((h) => (
//                 <li key={h} className="flex items-center gap-3 text-sm text-ink">
//                   <span className="grid h-5 w-5 place-items-center rounded-full border border-gold text-[10px] text-gold">✓</span>
//                   {h}
//                 </li>
//               ))}
//             </ul>
//           </Reveal>

//           <Reveal>
//             <div className="grid grid-cols-[1fr_1.3fr] gap-6 max-[700px]:grid-cols-1">
//               <div className="rounded-[18px] border border-line bg-[#fffaf3] p-5">
//                 <h3 className="mb-4 text-sm font-semibold">Select a Session Type</h3>
//                 <div className="space-y-3">
//                   {sessionTypes.map((s) => (
//                     <button
//                       key={s.title}
//                       onClick={() => setSessionType(s.title)}
//                       className={`block w-full rounded-xl border px-4 py-3 text-left transition-colors ${
//                         sessionType === s.title ? "border-gold bg-[#fbeedb]" : "border-line bg-white"
//                       }`}
//                     >
//                       <span className="flex items-center gap-2 text-sm font-medium">
//                         <span
//                           className={`h-3 w-3 rounded-full border ${
//                             sessionType === s.title ? "border-gold bg-gold" : "border-[#c9bda6]"
//                           }`}
//                         />
//                         {s.title}
//                       </span>
//                       <span className="mt-1 block pl-5 text-[11px] text-muted">{s.duration}</span>
//                     </button>
//                   ))}
//                 </div>
//               </div>

//               <div className="grid grid-cols-[1.3fr_1fr] gap-5 rounded-[18px] border border-line bg-[#fffaf3] p-5 max-[500px]:grid-cols-1">
//                 <div>
//                   <div className="mb-3 flex items-center justify-between text-sm font-semibold">
//                     <span>‹</span>
//                     <span>May 2026</span>
//                     <span>›</span>
//                   </div>
//                   <div className="grid grid-cols-7 gap-1 text-center text-[11px] text-muted">
//                     {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
//                       <span key={d}>{d}</span>
//                     ))}
//                     {days.map((d) => (
//                       <button
//                         key={d}
//                         onClick={() => setDay(d)}
//                         className={`aspect-square rounded-full text-[11px] ${
//                           d === day ? "bg-deep text-white" : "text-ink hover:bg-[#eee2cd]"
//                         }`}
//                       >
//                         {d}
//                       </button>
//                     ))}
//                   </div>
//                 </div>
//                 <div>
//                   <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted">Available Times (IST)</h3>
//                   <div className="space-y-2">
//                     {times.map((t) => (
//                       <button
//                         key={t}
//                         onClick={() => setTime(t)}
//                         className={`block w-full rounded-full border px-3 py-2 text-[11px] ${
//                           time === t ? "border-gold bg-[#fbeedb] font-semibold" : "border-line bg-white"
//                         }`}
//                       >
//                         {t}
//                       </button>
//                     ))}
//                   </div>
//                 </div>
//               </div>
//             </div>

//             <button className={`${buttonDark} mt-6 w-full justify-center py-4`}>
//               Continue — {sessionType}, May {day} at {time}
//             </button>
//           </Reveal>
//         </div>
//       </section>

//       <SiteFooter />
//     </main>
//   );
// }
