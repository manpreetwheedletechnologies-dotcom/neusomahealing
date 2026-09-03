"use client";

import { useEffect, useMemo, useState, type ElementType } from "react";
import {
  CalendarCheck2,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Eye,
  Mail,
  Phone,
  Plus,
  Save,
  Search,
  Settings2,
  UserRound,
  X,
  XCircle,
} from "lucide-react";

import { apiRequest } from "@/lib/api";

export type BookingStatus =
  | "pending"
  | "confirmed"
  | "completed"
  | "cancelled";

export type Booking = {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  sessionType: string;
  bookingDate: string;
  timeSlot: string;
  message?: string;
  status: BookingStatus;
  createdAt?: string;
  updatedAt?: string;
};

type BookingConfig = {
  timeSlots: string[];
  timezone: string;
  maxMonthsAhead: number;
};

type AdminDateSlot = {
  bookingDate: string;
  timeSlots: string[];
  isActive: boolean;
};

type Props = {
  items: Booking[];
  search: string;
  setSearch: (value: string) => void;
  updateStatus: (
    id: string,
    status: BookingStatus,
  ) => Promise<void>;
  updatingStatusId: string | null;
};

const STATUS_OPTIONS: {
  value: BookingStatus;
  label: string;
}[] = [
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

const WEEK_DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

/* =========================================================
   HELPERS
========================================================= */

function dateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(
    date.getMonth() + 1,
  ).padStart(2, "0")}`;
}

function parseDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function formatDate(value?: string) {
  if (!value) return "—";

  const date = parseDate(value);

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatCreatedAt(value?: string) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}

function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

function time24To12(value: string) {
  if (!value) return "";

  const [hourString, minute] = value.split(":");
  const hour24 = Number(hourString);

  if (
    !Number.isInteger(hour24) ||
    hour24 < 0 ||
    hour24 > 23
  ) {
    return "";
  }

  const period = hour24 >= 12 ? "PM" : "AM";
  const hour12 = hour24 % 12 || 12;

  return `${String(hour12).padStart(
    2,
    "0",
  )}:${minute} ${period}`;
}

function timeToMinutes(value: string) {
  const match =
    /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i.exec(value.trim());

  if (!match) return Number.MAX_SAFE_INTEGER;

  let hour = Number(match[1]);
  const minute = Number(match[2]);

  if (hour === 12) hour = 0;
  if (match[3].toUpperCase() === "PM") hour += 12;

  return hour * 60 + minute;
}

function sortTimes(values: string[]) {
  return [...new Set(values)].sort(
    (a, b) => timeToMinutes(a) - timeToMinutes(b),
  );
}

function statusClass(status: BookingStatus) {
  const classes = {
    pending:
      "border-[#eadfcf] bg-[#fff8ed] text-[#9a6b32]",
    confirmed:
      "border-[#d8e8e3] bg-[#edf7f4] text-[#176b5d]",
    completed:
      "border-[#dce4ef] bg-[#f0f5fb] text-[#426985]",
    cancelled:
      "border-[#eddada] bg-[#fff1f1] text-[#a45050]",
  };

  return classes[status];
}

/* =========================================================
   MAIN
========================================================= */

export function BookingsSection({
  items,
  search,
  setSearch,
  updateStatus,
  updatingStatusId,
}: Props) {
  const [view, setView] =
    useState<"bookings" | "availability">("bookings");

  const [statusFilter, setStatusFilter] =
    useState<"all" | BookingStatus>("all");

  const [selectedBooking, setSelectedBooking] =
    useState<Booking | null>(null);

  /* =========================
     SLOT MANAGEMENT STATE
  ========================= */

  const [config, setConfig] =
    useState<BookingConfig | null>(null);

  const [selectedMonth, setSelectedMonth] =
    useState(() => monthKey(new Date()));

  const [configuredDates, setConfiguredDates] =
    useState<AdminDateSlot[]>([]);

  const [selectedDate, setSelectedDate] =
    useState("");

  const [selectedTimes, setSelectedTimes] =
    useState<string[]>([]);

  const [customTime, setCustomTime] =
    useState("");

  const [slotLoading, setSlotLoading] =
    useState(false);

  const [slotSaving, setSlotSaving] =
    useState(false);

  const [slotError, setSlotError] =
    useState("");

  const [slotMessage, setSlotMessage] =
    useState("");

  /* =========================
     BOOKING STATS
  ========================= */

  const stats = useMemo(
    () => ({
      total: items.length,
      pending: items.filter((x) => x.status === "pending").length,
      confirmed: items.filter((x) => x.status === "confirmed").length,
      completed: items.filter((x) => x.status === "completed").length,
      cancelled: items.filter((x) => x.status === "cancelled").length,
    }),
    [items],
  );

  /* =========================
     BOOKING SEARCH/FILTER
  ========================= */

  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase();

    return [...items]
      .filter((item) => {
        if (
          statusFilter !== "all" &&
          item.status !== statusFilter
        ) {
          return false;
        }

        if (!query) return true;

        return [
          item.name,
          item.email,
          item.phone,
          item.sessionType,
          item.bookingDate,
          item.timeSlot,
          item.message,
          item.status,
        ].some((value) =>
          String(value || "")
            .toLowerCase()
            .includes(query),
        );
      })
      .sort((a, b) => {
        const dateCompare =
          a.bookingDate.localeCompare(b.bookingDate);

        if (dateCompare !== 0) return dateCompare;

        return (
          timeToMinutes(a.timeSlot) -
          timeToMinutes(b.timeSlot)
        );
      });
  }, [items, search, statusFilter]);

  /* =========================================================
     LOAD BOOKING CONFIG
  ========================================================= */

  useEffect(() => {
    if (view !== "availability") return;

    async function loadConfig() {
      try {
        const response = await apiRequest<{
          success: boolean;
          data: BookingConfig;
        }>("/bookings/config");

        setConfig(response.data);
      } catch (error) {
        setSlotError(
          error instanceof Error
            ? error.message
            : "Unable to load booking settings.",
        );
      }
    }

    void loadConfig();
  }, [view]);

  /* =========================================================
     LOAD MONTH SLOTS
  ========================================================= */

  useEffect(() => {
    if (view !== "availability") return;

    async function loadMonth() {
      setSlotLoading(true);
      setSlotError("");
      setSlotMessage("");

      try {
        const response = await apiRequest<{
          success: boolean;
          data: {
            month: string;
            dates: AdminDateSlot[];
            timezone: string;
          };
        }>(
          `/bookings/admin/slots?month=${encodeURIComponent(
            selectedMonth,
          )}`,
        );

        setConfiguredDates(response.data.dates || []);

        setSelectedDate("");
        setSelectedTimes([]);
      } catch (error) {
        setConfiguredDates([]);

        setSlotError(
          error instanceof Error
            ? error.message
            : "Unable to load availability.",
        );
      } finally {
        setSlotLoading(false);
      }
    }

    void loadMonth();
  }, [selectedMonth, view]);

  /* =========================================================
     CALENDAR
  ========================================================= */

  const calendar = useMemo(() => {
    const [year, month] = selectedMonth
      .split("-")
      .map(Number);

    const firstWeekday =
      new Date(year, month - 1, 1).getDay();

    const days =
      new Date(year, month, 0).getDate();

    return {
      year,
      month,
      firstWeekday,
      days: Array.from({ length: days }, (_, i) => i + 1),
    };
  }, [selectedMonth]);

  const todayKey = dateKey(new Date());

  const openDateMap = useMemo(
    () =>
      new Map(
        configuredDates.map((item) => [
          item.bookingDate,
          item,
        ]),
      ),
    [configuredDates],
  );

  /*
   * Pending / confirmed / completed bookings occupy a slot.
   */
  const reservedTimes = useMemo(() => {
    if (!selectedDate) return new Set<string>();

    return new Set(
      items
        .filter(
          (item) =>
            item.bookingDate === selectedDate &&
            item.status !== "cancelled",
        )
        .map((item) => item.timeSlot),
    );
  }, [items, selectedDate]);

  function selectCalendarDate(value: string) {
    if (value < todayKey) return;

    const existing = openDateMap.get(value);

    setSelectedDate(value);
    setSelectedTimes(
      existing ? sortTimes(existing.timeSlots) : [],
    );

    setCustomTime("");
    setSlotError("");
    setSlotMessage("");
  }

  function toggleTime(time: string) {
    /*
     * Existing active booking cannot be removed
     * from availability configuration.
     */
    if (reservedTimes.has(time)) return;

    setSelectedTimes((current) =>
      current.includes(time)
        ? current.filter((item) => item !== time)
        : sortTimes([...current, time]),
    );

    setSlotMessage("");
  }

  function addCustomTime() {
    const converted = time24To12(customTime);

    if (!converted) return;

    setSelectedTimes((current) =>
      sortTimes([...current, converted]),
    );

    setCustomTime("");
    setSlotError("");
  }

  /* =========================================================
     SAVE DATE
  ========================================================= */

  async function saveSlots() {
    if (!selectedDate) {
      setSlotError("Please select a date first.");
      return;
    }

    if (selectedTimes.length === 0) {
      setSlotError(
        "Please select or add at least one time slot.",
      );
      return;
    }

    setSlotSaving(true);
    setSlotError("");
    setSlotMessage("");

    try {
      const response = await apiRequest<{
        success: boolean;
        message: string;
        data: AdminDateSlot;
      }>(
        `/bookings/admin/slots/${selectedDate}`,
        {
          method: "PUT",
          body: JSON.stringify({
            timeSlots: selectedTimes,
          }),
        },
      );

      setConfiguredDates((current) => {
        const withoutDate = current.filter(
          (item) => item.bookingDate !== selectedDate,
        );

        return [...withoutDate, response.data].sort((a, b) =>
          a.bookingDate.localeCompare(b.bookingDate),
        );
      });

      setSelectedTimes(response.data.timeSlots);

      setSlotMessage(response.message);
    } catch (error) {
      setSlotError(
        error instanceof Error
          ? error.message
          : "Unable to save slots.",
      );
    } finally {
      setSlotSaving(false);
    }
  }

  /* =========================================================
     CLOSE DATE
  ========================================================= */

  async function closeDate() {
    if (!selectedDate) return;

    if (reservedTimes.size > 0) {
      setSlotError(
        "This date has active bookings. Cancel them before closing this date.",
      );
      return;
    }

    if (
      !window.confirm(
        `Close all booking slots for ${formatDate(
          selectedDate,
        )}?`,
      )
    ) {
      return;
    }

    setSlotSaving(true);
    setSlotError("");

    try {
      const response = await apiRequest<{
        success: boolean;
        message: string;
      }>(
        `/bookings/admin/slots/${selectedDate}`,
        {
          method: "DELETE",
        },
      );

      setConfiguredDates((current) =>
        current.filter(
          (item) => item.bookingDate !== selectedDate,
        ),
      );

      setSelectedTimes([]);
      setSlotMessage(response.message);
    } catch (error) {
      setSlotError(
        error instanceof Error
          ? error.message
          : "Unable to close this date.",
      );
    } finally {
      setSlotSaving(false);
    }
  }

  /* =========================================================
     STATUS
  ========================================================= */

  async function changeStatus(
    booking: Booking,
    status: BookingStatus,
  ) {
    try {
      await updateStatus(booking._id, status);

      setSelectedBooking((current) =>
        current?._id === booking._id
          ? { ...current, status }
          : current,
      );
    } catch (error) {
      console.error("Booking status update failed:", error);
    }
  }

  return (
    <>
      <section className="relative z-[10000] pointer-events-auto">
        {/* =================================================
            TOP SWITCH
        ================================================= */}

        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[.2em] text-[#a87943]">
              Session Management
            </p>

            <h2 className="mt-2 font-serif text-[clamp(30px,3vw,42px)] text-[#172420]">
              Bookings
            </h2>

            <p className="mt-2 text-sm text-[#74807a]">
              Manage session requests and control exactly when
              clients can book.
            </p>
          </div>

          <div className="flex rounded-xl border border-[#d7ded9] bg-white p-1">
            <button
              type="button"
              onClick={() => setView("bookings")}
              className={`rounded-lg px-4 py-2.5 text-xs font-semibold transition ${
                view === "bookings"
                  ? "bg-[#0b3b38] text-white"
                  : "text-[#66736d] hover:bg-[#f3f6f3]"
              }`}
            >
              Booking Requests
            </button>

            <button
              type="button"
              onClick={() => setView("availability")}
              className={`rounded-lg px-4 py-2.5 text-xs font-semibold transition ${
                view === "availability"
                  ? "bg-[#0b3b38] text-white"
                  : "text-[#66736d] hover:bg-[#f3f6f3]"
              }`}
            >
              Manage Availability
            </button>
          </div>
        </div>

        {view === "bookings" ? (
          <>
            {/* =============================================
                STATS
            ============================================= */}

            <div className="mt-7 grid grid-cols-5 gap-4 max-[1150px]:grid-cols-3 max-[760px]:grid-cols-2 max-[460px]:grid-cols-1">
              <StatCard
                label="Total bookings"
                value={stats.total}
                icon={CalendarDays}
              />

              <StatCard
                label="Pending"
                value={stats.pending}
                icon={Clock3}
              />

              <StatCard
                label="Confirmed"
                value={stats.confirmed}
                icon={CalendarCheck2}
              />

              <StatCard
                label="Completed"
                value={stats.completed}
                icon={CheckCircle2}
              />

              <StatCard
                label="Cancelled"
                value={stats.cancelled}
                icon={XCircle}
              />
            </div>

            {/* =============================================
                SEARCH
            ============================================= */}

            <div className="mt-7 flex gap-4 rounded-2xl border border-[#dce1dc] bg-white p-4 max-[700px]:flex-col">
              <div className="flex flex-1 items-center gap-3 rounded-xl border border-[#d9dfda] bg-[#f8faf8] px-4">
                <Search size={17} className="text-[#89948f]" />

                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search customer, session, date or time..."
                  className="w-full bg-transparent py-3 text-sm outline-none"
                />

                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                  >
                    <X size={15} />
                  </button>
                )}
              </div>

              <select
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(
                    e.target.value as "all" | BookingStatus,
                  )
                }
                className="min-w-[165px] cursor-pointer rounded-xl border border-[#d9dfda] bg-[#f8faf8] px-4 py-3 text-xs font-semibold outline-none"
              >
                <option value="all">All statuses</option>

                {STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* =============================================
                TABLE
            ============================================= */}

            <div className="mt-5 overflow-hidden rounded-[22px] border border-[#dce1dc] bg-white">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1050px] text-left">
                  <thead className="bg-[#f5f7f4] text-[10px] uppercase tracking-[.13em] text-[#7b8781]">
                    <tr>
                      <th className="px-5 py-4">Client</th>
                      <th className="px-5 py-4">Session</th>
                      <th className="px-5 py-4">Date</th>
                      <th className="px-5 py-4">Time</th>
                      <th className="px-5 py-4">Status</th>
                      <th className="px-5 py-4 text-right">
                        Details
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-[#edf0ed]">
                    {filteredItems.map((booking) => (
                      <tr
                        key={booking._id}
                        className="transition hover:bg-[#fbfcfa]"
                      >
                        <td className="px-5 py-5">
                          <div className="flex items-start gap-3">
                            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#edf4f1] text-xs font-bold text-[#0c5149]">
                              {initials(booking.name)}
                            </div>

                            <div>
                              <p className="text-sm font-semibold">
                                {booking.name}
                              </p>

                              <p className="mt-1 text-[11px] text-[#78837e]">
                                {booking.email}
                              </p>

                              {booking.phone && (
                                <p className="mt-1 text-[11px] text-[#78837e]">
                                  {booking.phone}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-5 text-xs font-semibold text-[#46554f]">
                          {booking.sessionType}
                        </td>

                        <td className="px-5 py-5 text-xs text-[#65716b]">
                          {formatDate(booking.bookingDate)}
                        </td>

                        <td className="px-5 py-5 text-xs font-semibold text-[#46554f]">
                          {booking.timeSlot}
                        </td>

                        <td className="px-5 py-5">
                          <select
                            value={booking.status}
                            disabled={
                              updatingStatusId === booking._id
                            }
                            onChange={(e) =>
                              void changeStatus(
                                booking,
                                e.target.value as BookingStatus,
                              )
                            }
                            className={`cursor-pointer rounded-full border px-3 py-2 text-[10px] font-semibold capitalize outline-none disabled:cursor-wait disabled:opacity-60 ${statusClass(
                              booking.status,
                            )}`}
                          >
                            {STATUS_OPTIONS.map((option) => (
                              <option
                                key={option.value}
                                value={option.value}
                              >
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </td>

                        <td className="px-5 py-5 text-right">
                          <button
                            type="button"
                            onClick={() =>
                              setSelectedBooking(booking)
                            }
                            className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-[#d6ddd8] px-3.5 py-2.5 text-[11px] font-semibold transition hover:border-[#b78a57] hover:bg-[#fbf6ef]"
                          >
                            <Eye size={14} />
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {filteredItems.length === 0 && (
                <div className="p-10 text-center text-sm text-[#7a8580]">
                  No booking requests found.
                </div>
              )}
            </div>
          </>
        ) : (
          /* =================================================
             MANAGE AVAILABILITY
          ================================================= */
          <div className="mt-7 grid grid-cols-[1fr_1fr] gap-5 max-[900px]:grid-cols-1">
            {/* CALENDAR */}

            <div className="rounded-[22px] border border-[#dce1dc] bg-white p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[.16em] text-[#a87943]">
                    Availability Calendar
                  </p>

                  <h3 className="mt-1 font-serif text-2xl">
                    Select a date
                  </h3>
                </div>

                <input
                  type="month"
                  value={selectedMonth}
                  min={monthKey(new Date())}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="rounded-xl border border-[#d9dfda] bg-[#f8faf8] px-3 py-2 text-xs outline-none"
                />
              </div>

              {slotLoading ? (
                <div className="grid min-h-[330px] place-items-center">
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#0d413d] border-t-transparent" />
                </div>
              ) : (
                <>
                  <div className="mt-7 grid grid-cols-7 gap-2 text-center">
                    {WEEK_DAYS.map((day) => (
                      <span
                        key={day}
                        className="text-[10px] font-semibold uppercase text-[#8c9792]"
                      >
                        {day}
                      </span>
                    ))}

                    {Array.from({
                      length: calendar.firstWeekday,
                    }).map((_, index) => (
                      <span
                        key={`blank-${index}`}
                        aria-hidden="true"
                      />
                    ))}

                    {calendar.days.map((day) => {
                      const key = `${calendar.year}-${String(
                        calendar.month,
                      ).padStart(2, "0")}-${String(day).padStart(
                        2,
                        "0",
                      )}`;

                      const isPast = key < todayKey;
                      const isOpen = openDateMap.has(key);
                      const isSelected = selectedDate === key;

                      return (
                        <button
                          type="button"
                          key={key}
                          disabled={isPast}
                          onClick={() => selectCalendarDate(key)}
                          className={`relative aspect-square rounded-xl text-xs font-semibold transition ${
                            isSelected
                              ? "bg-[#0b3b38] text-white"
                              : isOpen
                                ? "border border-[#d5ad73] bg-[#fbf1e2] text-[#8d6335] hover:bg-[#f6e5cb]"
                                : isPast
                                  ? "cursor-not-allowed text-[#c4cbc7] opacity-50"
                                  : "border border-transparent text-[#53615b] hover:bg-[#eef3ef]"
                          }`}
                        >
                          {day}

                          {isOpen && !isSelected && (
                            <span className="absolute bottom-1.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-[#b57c3e]" />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  <div className="mt-6 flex gap-5 text-[10px] text-[#7c8882]">
                    <span className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-[#b57c3e]" />
                      Open for booking
                    </span>

                    <span className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-[#d4dbd7]" />
                      Not configured
                    </span>
                  </div>
                </>
              )}
            </div>

            {/* TIME CONFIG */}

            <div className="rounded-[22px] border border-[#dce1dc] bg-white p-6">
              {!selectedDate ? (
                <div className="grid min-h-[360px] place-items-center text-center">
                  <div>
                    <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-[#eef5f1] text-[#19554d]">
                      <Settings2 size={20} />
                    </div>

                    <p className="mt-4 text-sm font-semibold">
                      Choose a date
                    </p>

                    <p className="mt-1 max-w-[300px] text-xs leading-5 text-[#83908a]">
                      Select any future date from the calendar to
                      open booking slots.
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-[.16em] text-[#a87943]">
                        Available Times
                      </p>

                      <h3 className="mt-1 font-serif text-2xl">
                        {formatDate(selectedDate)}
                      </h3>

                      <p className="mt-1 text-xs text-[#7b8781]">
                        {config?.timezone || "Asia/Kolkata"}
                      </p>
                    </div>

                    {openDateMap.has(selectedDate) && (
                      <button
                        type="button"
                        disabled={slotSaving}
                        onClick={() => void closeDate()}
                        className="rounded-xl border border-red-100 px-3 py-2 text-[10px] font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                      >
                        Close date
                      </button>
                    )}
                  </div>

                  {/* DEFAULT TIMES */}

                  {config?.timeSlots?.length ? (
                    <div className="mt-6">
                      <p className="mb-3 text-[10px] font-semibold uppercase tracking-[.13em] text-[#89948f]">
                        Quick slots
                      </p>

                      <div className="flex flex-wrap gap-2">
                        {config.timeSlots.map((time) => {
                          const selected =
                            selectedTimes.includes(time);

                          const reserved =
                            reservedTimes.has(time);

                          return (
                            <button
                              type="button"
                              key={time}
                              onClick={() => toggleTime(time)}
                              className={`rounded-full border px-3.5 py-2 text-[11px] font-semibold transition ${
                                reserved
                                  ? "cursor-not-allowed border-[#e4d6c0] bg-[#f8eee0] text-[#9b7041]"
                                  : selected
                                    ? "border-[#0b5149] bg-[#edf7f4] text-[#176b5d]"
                                    : "border-[#d9dfda] bg-[#f8faf8] text-[#617069] hover:border-[#b58a58]"
                              }`}
                            >
                              {time}
                              {reserved ? " · Booked" : ""}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ) : null}

                  {/* CURRENT SELECTED TIMES */}

                  <div className="mt-6">
                    <p className="mb-3 text-[10px] font-semibold uppercase tracking-[.13em] text-[#89948f]">
                      Slots for this date
                    </p>

                    <div className="flex min-h-[45px] flex-wrap gap-2">
                      {selectedTimes.length === 0 ? (
                        <p className="text-xs text-[#8a9590]">
                          No time slots selected.
                        </p>
                      ) : (
                        selectedTimes.map((time) => (
                          <button
                            type="button"
                            key={time}
                            disabled={reservedTimes.has(time)}
                            onClick={() => toggleTime(time)}
                            className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-[11px] ${
                              reservedTimes.has(time)
                                ? "cursor-not-allowed border-[#eadcc7] bg-[#fbf3e8] text-[#966b3b]"
                                : "border-[#cddbd6] bg-[#eef6f3] text-[#315c52]"
                            }`}
                          >
                            {time}

                            {reservedTimes.has(time) ? (
                              <span className="text-[9px]">
                                Booked
                              </span>
                            ) : (
                              <X size={12} />
                            )}
                          </button>
                        ))
                      )}
                    </div>
                  </div>

                  {/* CUSTOM TIME */}

                  <div className="mt-6">
                    <p className="mb-2 text-[10px] font-semibold uppercase tracking-[.13em] text-[#89948f]">
                      Add custom time
                    </p>

                    <div className="flex gap-2">
                      <input
                        type="time"
                        value={customTime}
                        onChange={(e) => setCustomTime(e.target.value)}
                        className="flex-1 rounded-xl border border-[#d9dfda] bg-[#f8faf8] px-4 py-3 text-xs outline-none focus:border-[#a87943]"
                      />

                      <button
                        type="button"
                        disabled={!customTime}
                        onClick={addCustomTime}
                        className="inline-flex items-center gap-2 rounded-xl border border-[#cad5cf] px-4 py-3 text-xs font-semibold text-[#40534c] transition hover:bg-[#eef4f1] disabled:opacity-40"
                      >
                        <Plus size={14} />
                        Add
                      </button>
                    </div>
                  </div>

                  {slotError && (
                    <p className="mt-5 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-xs text-red-700">
                      {slotError}
                    </p>
                  )}

                  {slotMessage && (
                    <p className="mt-5 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-xs text-emerald-700">
                      {slotMessage}
                    </p>
                  )}

                  <button
                    type="button"
                    disabled={
                      slotSaving ||
                      selectedTimes.length === 0
                    }
                    onClick={() => void saveSlots()}
                    className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#0b3b38] px-5 py-3.5 text-xs font-semibold text-white transition hover:bg-[#124c47] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Save size={15} />

                    {slotSaving
                      ? "Saving availability..."
                      : "Save Availability"}
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </section>

      {/* ===================================================
          BOOKING DETAILS MODAL
      =================================================== */}

      {selectedBooking && (
        <div
          className="fixed inset-0 z-[2147483646] grid place-items-center bg-[#071c1a]/70 p-5 backdrop-blur-sm"
          onClick={() => setSelectedBooking(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
            className="max-h-[90vh] w-full max-w-[680px] overflow-y-auto rounded-[26px] bg-[#f8f7f3] shadow-[0_30px_100px_rgba(2,20,17,.35)]"
          >
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#dfe3df] bg-[#f8f7f3]/95 px-6 py-5 backdrop-blur-xl">
              <div>
                <p className="text-[9px] font-semibold uppercase tracking-[.2em] text-[#a87943]">
                  Booking Details
                </p>

                <h3 className="mt-1 font-serif text-2xl">
                  {selectedBooking.name}
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setSelectedBooking(null)}
                className="grid h-9 w-9 place-items-center rounded-xl border border-[#d6ddd8] bg-white"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-2 gap-4 max-[560px]:grid-cols-1">
                <DetailCard
                  icon={Mail}
                  label="Email"
                  value={selectedBooking.email}
                />

                <DetailCard
                  icon={Phone}
                  label="Phone"
                  value={selectedBooking.phone || "Not provided"}
                />

                <DetailCard
                  icon={CalendarDays}
                  label="Session Date"
                  value={formatDate(selectedBooking.bookingDate)}
                />

                <DetailCard
                  icon={Clock3}
                  label="Time"
                  value={`${selectedBooking.timeSlot} IST`}
                />
              </div>

              <div className="mt-4 rounded-2xl border border-[#dde2de] bg-white p-5">
                <p className="text-[9px] uppercase tracking-[.15em] text-[#8c9792]">
                  Session Type
                </p>

                <p className="mt-2 text-sm font-semibold">
                  {selectedBooking.sessionType}
                </p>
              </div>

              <div className="mt-4 rounded-2xl border border-[#dde2de] bg-white p-5">
                <p className="text-[9px] uppercase tracking-[.15em] text-[#8c9792]">
                  Client Message
                </p>

                <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-7 text-[#5d6b65]">
                  {selectedBooking.message ||
                    "No additional message provided."}
                </p>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-4 max-[560px]:grid-cols-1">
                <div className="rounded-2xl border border-[#dde2de] bg-white p-4">
                  <p className="text-[9px] uppercase tracking-[.15em] text-[#8c9792]">
                    Request Received
                  </p>

                  <p className="mt-2 text-xs font-semibold">
                    {formatCreatedAt(selectedBooking.createdAt)}
                  </p>
                </div>

                <div className="rounded-2xl border border-[#dde2de] bg-white p-4">
                  <p className="text-[9px] uppercase tracking-[.15em] text-[#8c9792]">
                    Status
                  </p>

                  <select
                    value={selectedBooking.status}
                    disabled={
                      updatingStatusId === selectedBooking._id
                    }
                    onChange={(e) =>
                      void changeStatus(
                        selectedBooking,
                        e.target.value as BookingStatus,
                      )
                    }
                    className={`mt-2 cursor-pointer rounded-full border px-3 py-2 text-[10px] font-semibold capitalize outline-none ${statusClass(
                      selectedBooking.status,
                    )}`}
                  >
                    {STATUS_OPTIONS.map((option) => (
                      <option
                        key={option.value}
                        value={option.value}
                      >
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap justify-end gap-3">
                {selectedBooking.phone && (
                  <a
                    href={`tel:${selectedBooking.phone}`}
                    className="inline-flex items-center gap-2 rounded-xl border border-[#d5dcd7] bg-white px-4 py-3 text-xs font-semibold"
                  >
                    <Phone size={14} />
                    Call
                  </a>
                )}

                <a
                  href={`mailto:${selectedBooking.email}?subject=${encodeURIComponent(
                    `Regarding your ${selectedBooking.sessionType} booking`,
                  )}`}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#0b3b38] px-5 py-3 text-xs font-semibold text-white"
                >
                  <Mail size={14} />
                  Send Email
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/* =========================================================
   SMALL COMPONENTS
========================================================= */

function StatCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number;
  icon: ElementType;
}) {
  return (
    <article className="rounded-2xl border border-[#dce1dc] bg-white p-5 shadow-[0_8px_30px_rgba(37,56,49,.035)]">
      <div className="flex items-center justify-between">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#eef5f1] text-[#0d5149]">
          <Icon size={18} />
        </div>

        <span className="font-serif text-3xl text-[#20362f]">
          {value}
        </span>
      </div>

      <p className="mt-5 text-xs font-semibold text-[#47564f]">
        {label}
      </p>
    </article>
  );
}

function DetailCard({
  icon: Icon,
  label,
  value,
}: {
  icon: ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-[#dde2de] bg-white p-4">
      <div className="flex items-start gap-3">
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#eef5f1] text-[#17554c]">
          <Icon size={15} />
        </div>

        <div className="min-w-0">
          <p className="text-[9px] uppercase tracking-[.14em] text-[#8d9893]">
            {label}
          </p>

          <p className="mt-1 break-all text-xs font-semibold leading-5 text-[#41514b]">
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}