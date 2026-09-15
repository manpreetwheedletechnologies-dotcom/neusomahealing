"use client";

import { useCallback, useEffect, useMemo, useState, type ElementType } from "react";
import {
  CalendarCheck2,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Copy,
  ExternalLink,
  Eye,
  Filter,
  Flower2,
  Leaf,
  Mail,
  PlaySquare,
  Phone,
  Plus,
  RefreshCcw,
  Save,
  Search,
  Settings2,
  Sparkles,
  Trash2,
  UserRound,
  Users,
  Video,
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
  sessionType?: string;
  bookingDate?: string;
  timeSlot?: string;
  message?: string;

  /*
   * User-suggested date/time captured at request
   * time (Discovery Call / 1:1 Coaching / Deep
   * Transformation). Informational only — admin's
   * assigned bookingDate/timeSlot is the real one.
   */
  preferredDate?: string;
  preferredTimeSlot?: string;

  /*
   * false => this is a request/lead still waiting
   * on admin to assign a real date/time. Undefined
   * is treated as true (legacy slot-based bookings).
   */
  isAssigned?: boolean;

  zoomMeetingId?: string;
  zoomJoinUrl?: string;

  emailStatus?:
    | "pending"
    | "sent"
    | "failed";

  emailLastError?: string;

  paymentStatus?:
    | "not_required"
    | "paid"
    | "failed";

  amountPaid?: number;

  status: BookingStatus;
  createdAt?: string;
  updatedAt?: string;
};

type SessionTypeOption = {
  title: string;
  duration: string;
  bookingMode: "individual" | "webinar";
  defaultCapacity: number;
  price?: number;
  isActive?: boolean;
};

type BookingConfig = {
  sessionTypes: SessionTypeOption[];
  timeSlots: string[];
  timezone: string;
  maxMonthsAhead: number;
};

/* =========================
   SESSION-WISE OVERVIEW
   (Bookings grouped by
   session type -> slot ->
   registrants)
========================= */

type OverviewRegistration = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  status: BookingStatus;
  paymentStatus?: "not_required" | "paid" | "failed";
  amountPaid?: number;
  message?: string;
  createdAt?: string;
};

type OverviewSlot = {
  id: string;
  bookingDate: string;
  timeSlot: string;
  capacity: number;
  bookedCount: number;
  remainingSeats: number;
  isActive: boolean;
  price: number;
  isPaid: boolean;
  zoomJoinUrl?: string;
  zoomMeetingId?: string;
  zoomStatus?: string;
  registrations: OverviewRegistration[];
  registrationCount: number;
};

type OverviewSessionType = {
  title: string;
  bookingMode: "individual" | "webinar";
  duration: string;
  slots: OverviewSlot[];
  totalSlots: number;
  totalBookings: number;
};

type AdminSlot = {
  _id: string;
  id?: string;

  bookingDate: string;
  timeSlot: string;

  sessionType: string;
  duration: string;

  bookingMode: "individual" | "webinar";

  capacity: number;
  bookedCount: number;
  remainingSeats: number;

  isActive: boolean;

  /*
   * Effective price for THIS slot (own
   * override, else the session type's
   * default price). 0 = free.
   */
  price?: number;
  isPaid?: boolean;
  hasCustomPrice?: boolean;

  /*
   * Zoom meeting for this slot — same
   * link every attendee who books it
   * receives. Populated eagerly for
   * webinars at creation time, or
   * lazily on first booking otherwise.
   */
  zoomStatus?:
    | "not_created"
    | "creating"
    | "scheduled"
    | "failed";
  zoomJoinUrl?: string;
  zoomMeetingId?: string;
  zoomLastError?: string;
};

type AdminDateSlot = {
  bookingDate: string;

  /*
   * Backend temporarily returns this too
   * for compatibility.
   */
  timeSlots: string[];

  slots: AdminSlot[];

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
  onRefresh?: () => void;
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

function initials(name?: string | null) {
  if (!name || !name.trim()) return "?";

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


function time12To24(value: string) {
  const match =
    /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i.exec(
      value.trim(),
    );

  if (!match) return "";

  let hour = Number(match[1]);

  const minute = match[2];

  const period =
    match[3].toUpperCase();

  if (hour === 12) {
    hour = 0;
  }

  if (period === "PM") {
    hour += 12;
  }

  return `${String(hour).padStart(
    2,
    "0",
  )}:${minute}`;
}

function timeToMinutes(
  value?: string,
) {
  if (
    typeof value !== "string" ||
    !value.trim()
  ) {
    return Number.MAX_SAFE_INTEGER;
  }

  const match =
    /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i.exec(
      value.trim(),
    );

  if (!match) {
    return Number.MAX_SAFE_INTEGER;
  }

  let hour =
    Number(match[1]);

  const minute =
    Number(match[2]);

  if (hour === 12) {
    hour = 0;
  }

  if (
    match[3].toUpperCase() ===
    "PM"
  ) {
    hour += 12;
  }

  return (
    hour * 60 +
    minute
  );
}

function sortTimes(values: string[]) {
  return [...new Set(values)].sort(
    (a, b) => timeToMinutes(a) - timeToMinutes(b),
  );
}

/*
 * Discovery Call is a pure lead — admin never
 * assigns it a date/time, just follows up by call.
 */
function isLeadOnlySession(sessionType?: string | null) {
  return (sessionType || "").trim().toLowerCase() === "discovery call";
}

/*
 * Small status widget shown on each webinar slot card —
 * shows whether the Zoom meeting for that slot has been
 * created yet, and lets the admin copy/open the link that
 * will be reused for every attendee who books it.
 */
function ZoomSlotStatus({
  slot,
  onCopied,
  onZoomUpdated,
}: {
  slot: AdminSlot;
  onCopied: () => void;
  onZoomUpdated: () => void;
}) {
  const [copied, setCopied] = useState(false);

  async function copyLink() {
    if (!slot.zoomJoinUrl) return;

    try {
      await navigator.clipboard.writeText(
        slot.zoomJoinUrl,
      );
      setCopied(true);
      onCopied();
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard access can be denied by the browser —
      // the "Open" link below still works as a fallback.
    }
  }

  if (
    slot.zoomStatus === "scheduled" &&
    slot.zoomJoinUrl
  ) {
    return (
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#cde4db] bg-[#edf8f4] px-3.5 py-2.5">
        <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#176d5c]">
          <Video size={13} />
          Zoom link ready
        </span>

        <span className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => void copyLink()}
            className="inline-flex items-center gap-1 rounded-lg border border-[#bcdccf] bg-white px-2.5 py-1.5 text-[10px] font-semibold text-[#176d5c] hover:bg-[#f4faf7]"
          >
            {copied ? (
              <CheckCircle2 size={12} />
            ) : (
              <Copy size={12} />
            )}
            {copied ? "Copied" : "Copy link"}
          </button>

          <a
            href={slot.zoomJoinUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 rounded-lg border border-[#bcdccf] bg-white px-2.5 py-1.5 text-[10px] font-semibold text-[#176d5c] hover:bg-[#f4faf7]"
          >
            <ExternalLink size={12} />
            Open
          </a>
        </span>
      </div>
    );
  }

  if (slot.zoomStatus === "creating") {
    return (
      <div className="mt-3 flex items-center gap-1.5 rounded-xl border border-[#e4cfaa] bg-[#fff7e9] px-3.5 py-2.5 text-[11px] font-semibold text-[#9a6d31]">
        <RefreshCcw size={13} className="animate-spin" />
        Zoom link is being created…
      </div>
    );
  }

  if (slot.zoomStatus === "failed") {
    return (
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-red-100 bg-red-50 px-3.5 py-2.5">
        <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-red-600">
          <XCircle size={13} />
          Zoom link couldn&apos;t be created
          {slot.zoomLastError
            ? ` — ${slot.zoomLastError}`
            : ""}
        </span>

        <CreateZoomLinkButton
          slotId={slot._id}
          onDone={onZoomUpdated}
        />
      </div>
    );
  }

  return (
    <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-dashed border-[#d9dfda] bg-[#fafbf9] px-3.5 py-2.5">
      <span className="text-[11px] text-[#84908a]">
        No Zoom link created yet.
      </span>

      <CreateZoomLinkButton
        slotId={slot._id}
        onDone={onZoomUpdated}
      />
    </div>
  );
}

/*
 * Small button that calls the manual Zoom-creation
 * endpoint, used both on the slot list and the
 * "next open slot" side panel. Covers slots created
 * before eager Zoom creation existed, and doubles as
 * a retry after a failure.
 */
function CreateZoomLinkButton({
  slotId,
  onDone,
}: {
  slotId: string;
  onDone: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function createLink() {
    setLoading(true);
    setError("");

    try {
      await apiRequest(
        `/bookings/admin/slots/${slotId}/zoom`,
        { method: "POST" },
      );
      onDone();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Couldn't create the Zoom link.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <span className="inline-flex flex-col items-end gap-1">
      <button
        type="button"
        disabled={loading}
        onClick={() => void createLink()}
        className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-[#0b3b38]/20 bg-white px-2.5 py-1.5 text-[10px] font-semibold text-[#0b3b38] hover:bg-[#f4faf7] disabled:opacity-60"
      >
        <RefreshCcw
          size={12}
          className={
            loading ? "animate-spin" : ""
          }
        />
        {loading
          ? "Creating…"
          : "Create Zoom link"}
      </button>

      {error && (
        <span className="text-[9px] text-red-600">
          {error}
        </span>
      )}
    </span>
  );
}

/*
 * Whether this booking still needs admin to assign
 * a real date/time. Legacy bookings (isAssigned
 * undefined) are always treated as already assigned.
 */
function needsAssignment(booking: Booking) {
  return (
    booking.isAssigned === false &&
    !isLeadOnlySession(booking.sessionType)
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

function getSafeZoomUrl(
  value?: string,
): string | null {
  if (
    typeof value !== "string" ||
    !value.trim()
  ) {
    return null;
  }

  try {
    const url =
      new URL(value.trim());

    if (
      url.protocol !==
      "https:"
    ) {
      return null;
    }

    const hostname =
      url.hostname.toLowerCase();

    const isZoomDomain =
      hostname ===
        "zoom.us" ||
      hostname.endsWith(
        ".zoom.us",
      );

    if (!isZoomDomain) {
      return null;
    }

    return url.toString();
  } catch {
    return null;
  }
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
  onRefresh,
}: Props) {
  const [view, setView] =
    useState<"bookings" | "availability" | "sessions">("bookings");

  /* =========================
     ASSIGN SESSION STATE
     (Discovery Call is excluded — it's a lead only)
  ========================= */

  const [assigningBookingId, setAssigningBookingId] =
    useState<string | null>(null);

  const [assignDate, setAssignDate] = useState("");
  const [assignTime, setAssignTime] = useState("");
  const [assignSaving, setAssignSaving] = useState(false);
  const [assignError, setAssignError] = useState("");

  /* =========================
     SESSION-WISE OVERVIEW STATE
  ========================= */

  const [overview, setOverview] =
    useState<OverviewSessionType[]>([]);

  const [overviewLoading, setOverviewLoading] =
    useState(false);

  const [overviewError, setOverviewError] =
    useState("");

  const [activeSessionTitle, setActiveSessionTitle] =
    useState<string | null>(null);

  const [activeOverviewSlot, setActiveOverviewSlot] =
    useState<OverviewSlot | null>(null);

  const [statusFilter, setStatusFilter] =
    useState<"all" | BookingStatus>("all");

  const [sessionTypeFilter, setSessionTypeFilter] =
    useState<string>("all");

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

  const [showCreateModal, setShowCreateModal] =
    useState(false);

  const [createForm, setCreateForm] = useState({
    name: "",
    email: "",
    phone: "",
    sessionType: "",
    bookingDate: "",
    timeSlot: "",
    message: "",
  });

  const [createSaving, setCreateSaving] =
    useState(false);

  const [createError, setCreateError] =
    useState("");

 

 

const [
  selectedSessionType,
  setSelectedSessionType,
] = useState("");

const [customTime, setCustomTime] =
  useState("");

const [capacity, setCapacity] =
  useState("1");

/* =========================
   PRICING (per-slot)
========================= */

const [priceMode, setPriceMode] =
  useState<"free" | "paid">("free");

const [priceAmount, setPriceAmount] =
  useState("");

const [slotLoading, setSlotLoading] =
  useState(false);

const [slotSaving, setSlotSaving] =
  useState(false);

const [slotError, setSlotError] =
  useState("");

const [slotMessage, setSlotMessage] =
  useState("");

/*
 * The slot returned right after a successful
 * "Add Session Slot" — used to show its Zoom
 * link immediately in this same panel, no
 * button/reload needed, since the backend
 * eagerly creates it for webinar slots.
 */
const [lastCreatedSlot, setLastCreatedSlot] =
  useState<AdminSlot | null>(null);

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
     SESSION TYPE FILTER CHIPS
  ========================= */

  const sessionTypeOptions = useMemo(() => {
    const counts = new Map<string, number>();

    items.forEach((item) => {
      const label =
        typeof item.sessionType === "string" && item.sessionType.trim()
          ? item.sessionType.trim()
          : "Other";

      counts.set(label, (counts.get(label) || 0) + 1);
    });

    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([label, count]) => ({ label, count }));
  }, [items]);

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

        if (
          sessionTypeFilter !== "all" &&
          (item.sessionType || "Other") !== sessionTypeFilter
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
          item.zoomMeetingId,
item.emailStatus,
          item.status,
        ].some((value) =>
          String(value || "")
            .toLowerCase()
            .includes(query),
        );
      })
     .sort((a, b) => {
  /*
   * Runtime API data may contain
   * legacy/incomplete booking records.
   *
   * Never call localeCompare directly
   * on a possibly undefined value.
   */
  const dateA =
    typeof a.bookingDate === "string"
      ? a.bookingDate
      : "";

  const dateB =
    typeof b.bookingDate === "string"
      ? b.bookingDate
      : "";

  /*
   * Valid booking dates first.
   * Legacy/incomplete records go last.
   */
  if (!dateA && !dateB) {
    return 0;
  }

  if (!dateA) {
    return 1;
  }

  if (!dateB) {
    return -1;
  }

  const dateCompare =
    dateA.localeCompare(dateB);

  if (dateCompare !== 0) {
    return dateCompare;
  }

  /*
   * Protect timeToMinutes() too,
   * because it calls .trim().
   */
  const timeA =
    typeof a.timeSlot === "string"
      ? a.timeSlot
      : "";

  const timeB =
    typeof b.timeSlot === "string"
      ? b.timeSlot
      : "";

  return (
    timeToMinutes(timeA) -
    timeToMinutes(timeB)
  );
});
  }, [items, search, statusFilter, sessionTypeFilter]);

  /* =========================================================
     LOAD SESSION-WISE OVERVIEW
  ========================================================= */

  useEffect(() => {
    if (view !== "sessions") return;

    let cancelled = false;

    async function loadOverview() {
      setOverviewLoading(true);
      setOverviewError("");

      try {
        const response = await apiRequest<{
          success: boolean;
          data: { sessionTypes: OverviewSessionType[] };
        }>("/bookings/admin/overview");

        if (!cancelled) {
          setOverview(response.data.sessionTypes || []);
        }
      } catch (error) {
        if (!cancelled) {
          setOverviewError(
            error instanceof Error
              ? error.message
              : "Failed to load bookings overview.",
          );
        }
      } finally {
        if (!cancelled) {
          setOverviewLoading(false);
        }
      }
    }

    void loadOverview();

    return () => {
      cancelled = true;
    };
  }, [view]);

  /* =========================================================
     LOAD BOOKING CONFIG
  ========================================================= */

  useEffect(() => {
    async function loadConfig() {
      try {
        const response = await apiRequest<{
          success: boolean;
          data: BookingConfig;
        }>("/bookings/config");

        setConfig(response.data);

        setSelectedSessionType((current) => {
  if (current) {
    return current;
  }

  return (
    response.data.sessionTypes?.[0]?.title ||
    ""
  );
});

const firstSession =
  response.data.sessionTypes?.[0];

if (firstSession) {
  setCapacity(
    firstSession.bookingMode === "webinar"
      ? String(
          firstSession.defaultCapacity || 100,
        )
      : "1",
  );
}
      } catch (error) {
        setSlotError(
          error instanceof Error
            ? error.message
            : "Unable to load booking settings.",
        );
      }
    }

    void loadConfig();
  }, []);

  /* =========================================================
     LOAD MONTH SLOTS
  ========================================================= */

  const refreshSlots = useCallback(
    async (resetSelection: boolean) => {
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

        if (resetSelection) {
          setSelectedDate("");
          setCustomTime("");
        }
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
    },
    [selectedMonth],
  );

  useEffect(() => {
    void refreshSlots(true);
  }, [refreshSlots]);

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


  const selectedSession =
  useMemo(() => {
    return (
      config?.sessionTypes.find(
        (item) =>
          item.title ===
          selectedSessionType,
      ) || null
    );
  }, [
    config,
    selectedSessionType,
  ]);

const selectedDateConfig =
  selectedDate
    ? openDateMap.get(
        selectedDate,
      )
    : undefined;

const selectedDateSlots =
  selectedDateConfig?.slots || [];

  /*
   * Pending / confirmed / completed bookings occupy a slot.
   */

function selectCalendarDate(
  value: string,
) {
  if (value < todayKey) {
    return;
  }

  setSelectedDate(value);

  setCustomTime("");

  setSlotError("");
  setSlotMessage("");
  setLastCreatedSlot(null);
}

//   function toggleTime(time: string) {
//     /*
//      * Existing active booking cannot be removed
//      * from availability configuration.
//      */
//     if (reservedTimes.has(time)) return;

//     setSelectedTimes((current) =>
//       current.includes(time)
//         ? current.filter((item) => item !== time)
//         : sortTimes([...current, time]),
//     );

//     setSlotMessage("");
//   }

//   function addCustomTime() {
//     const converted = time24To12(customTime);

//     if (!converted) return;

//     setSelectedTimes((current) =>
//       sortTimes([...current, converted]),
//     );

//     setCustomTime("");
//     setSlotError("");
//   }

  /* =========================================================
     SAVE DATE
  ========================================================= */

async function createSlot() {
  if (!selectedDate) {
    setSlotError(
      "Please select a date first.",
    );

    return;
  }

  if (!selectedSessionType) {
    setSlotError(
      "Please select a session type.",
    );

    return;
  }

  if (!customTime) {
    setSlotError(
      "Please select a time.",
    );

    return;
  }

  const timeSlot =
    time24To12(customTime);

  if (!timeSlot) {
    setSlotError(
      "Please select a valid time.",
    );

    return;
  }

  let slotCapacity = 1;

  if (
    selectedSession?.bookingMode ===
    "webinar"
  ) {
    slotCapacity =
      Number(capacity);

    if (
      !Number.isInteger(
        slotCapacity,
      ) ||
      slotCapacity < 1
    ) {
      setSlotError(
        "Please enter a valid webinar capacity.",
      );

      return;
    }
  }

  let slotPrice = 0;

  if (priceMode === "paid") {
    slotPrice = Number(priceAmount);

    if (
      !Number.isFinite(slotPrice) ||
      slotPrice <= 0
    ) {
      setSlotError(
        "Please enter a valid amount for this paid session.",
      );

      return;
    }
  }

  setSlotSaving(true);

  setSlotError("");
  setSlotMessage("");
  setLastCreatedSlot(null);

  try {
    const response =
      await apiRequest<{
        success: boolean;
        message: string;
        data: AdminSlot;
      }>(
        "/bookings/admin/slots",
        {
          method: "POST",

          body:
            JSON.stringify({
              bookingDate:
                selectedDate,

              timeSlot,

              sessionType:
                selectedSessionType,

              capacity:
                slotCapacity,

              price:
                slotPrice,
            }),
        },
      );

    const created =
      response.data;

    /*
     * Update calendar + selected date
     * without another API request.
     */
    setConfiguredDates(
      (current) => {
        const existing =
          current.find(
            (item) =>
              item.bookingDate ===
              created.bookingDate,
          );

        if (!existing) {
          return [
            ...current,

            {
              bookingDate:
                created.bookingDate,

              timeSlots: [
                created.timeSlot,
              ],

              slots: [
                created,
              ],

              isActive:
                true,
            },
          ].sort(
            (a, b) =>
              a.bookingDate.localeCompare(
                b.bookingDate,
              ),
          );
        }

        const updatedSlots = [
          ...existing.slots,
          created,
        ].sort(
          (a, b) =>
            timeToMinutes(
              a.timeSlot,
            ) -
            timeToMinutes(
              b.timeSlot,
            ),
        );

        return current.map(
          (item) =>
            item.bookingDate ===
            created.bookingDate
              ? {
                  ...item,

                  slots:
                    updatedSlots,

                  timeSlots:
                    updatedSlots.map(
                      (slot) =>
                        slot.timeSlot,
                    ),

                  isActive:
                    true,
                }
              : item,
        );
      },
    );

    setCustomTime("");

    setSlotMessage(
      response.message,
    );

    setLastCreatedSlot(
      created,
    );
  } catch (error) {
    setSlotError(
      error instanceof Error
        ? error.message
        : "Unable to create session slot.",
    );
  } finally {
    setSlotSaving(false);
  }
}

async function removeSlot(
  slot: AdminSlot,
) {
  if (
    slot.bookedCount >
    0
  ) {
    setSlotError(
      "This session already has active bookings. Cancel them before deleting the slot.",
    );

    return;
  }

  if (
    !window.confirm(
      `Remove ${slot.sessionType} at ${slot.timeSlot}?`,
    )
  ) {
    return;
  }

  setSlotSaving(true);

  setSlotError("");
  setSlotMessage("");

  try {
    const response =
      await apiRequest<{
        success: boolean;
        message: string;
      }>(
        `/bookings/admin/slots/${slot._id}`,
        {
          method:
            "DELETE",
        },
      );

    setConfiguredDates(
      (current) =>
        current
          .map((item) => {
            if (
              item.bookingDate !==
              slot.bookingDate
            ) {
              return item;
            }

            const remaining =
              item.slots.filter(
                (itemSlot) =>
                  itemSlot._id !==
                  slot._id,
              );

            return {
              ...item,

              slots:
                remaining,

              timeSlots:
                remaining.map(
                  (itemSlot) =>
                    itemSlot.timeSlot,
                ),

              isActive:
                remaining.length >
                0,
            };
          })
          .filter(
            (item) =>
              item.slots.length >
              0,
          ),
    );

    setSlotMessage(
      response.message,
    );
  } catch (error) {
    setSlotError(
      error instanceof Error
        ? error.message
        : "Unable to remove session slot.",
    );
  } finally {
    setSlotSaving(false);
  }
}

  /* =========================================================
     CLOSE DATE
  ========================================================= */

 async function closeDate() {
  if (!selectedDate) {
    return;
  }

  const hasActiveBookings =
    selectedDateSlots.some(
      (slot) =>
        slot.bookedCount >
        0,
    );

  if (hasActiveBookings) {
    setSlotError(
      "This date has active bookings. Cancel them before closing this date.",
    );

    return;
  }

  if (
    !window.confirm(
      `Close all booking sessions for ${formatDate(
        selectedDate,
      )}?`,
    )
  ) {
    return;
  }

  setSlotSaving(true);

  setSlotError("");
  setSlotMessage("");

  try {
    const response =
      await apiRequest<{
        success: boolean;
        message: string;
      }>(
        `/bookings/admin/date/${selectedDate}`,
        {
          method:
            "DELETE",
        },
      );

    setConfiguredDates(
      (current) =>
        current.filter(
          (item) =>
            item.bookingDate !==
            selectedDate,
        ),
    );

    setSlotMessage(
      response.message,
    );
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

  /* =========================================================
     ASSIGN SESSION DATE/TIME
     (Coaching / Deep Transformation requests)
  ========================================================= */

  function openAssignForm(booking: Booking) {
    setAssigningBookingId(booking._id);
    setAssignDate(booking.preferredDate || "");
    setAssignTime(booking.preferredTimeSlot || "");
    setAssignError("");
  }

  function closeAssignForm() {
    setAssigningBookingId(null);
    setAssignDate("");
    setAssignTime("");
    setAssignError("");
  }

  async function submitAssignSession(booking: Booking) {
    if (!assignDate || !assignTime) {
      setAssignError("Please select both a date and a time.");
      return;
    }

    setAssignSaving(true);
    setAssignError("");

    try {
      const response = await apiRequest<{
        success: true;
        data: Booking;
      }>(`/bookings/${booking._id}/assign`, {
        method: "PATCH",
        body: JSON.stringify({
          bookingDate: assignDate,
          timeSlot: assignTime,
        }),
      });

      const updated = response.data;

      setSelectedBooking((current) =>
        current?._id === booking._id ? { ...current, ...updated } : current,
      );

      closeAssignForm();
      onRefresh?.();
    } catch (error) {
      setAssignError(
        error instanceof Error
          ? error.message
          : "Unable to assign this session.",
      );
    } finally {
      setAssignSaving(false);
    }
  }

  /* =========================================================
     CREATE BOOKING (admin-created, same public endpoint)
  ========================================================= */

  async function submitCreateBooking() {
    if (
      !createForm.name.trim() ||
      !createForm.email.trim() ||
      !createForm.sessionType ||
      !createForm.bookingDate ||
      !createForm.timeSlot
    ) {
      setCreateError(
        "Name, email, session, date and time are required.",
      );
      return;
    }

    setCreateSaving(true);
    setCreateError("");

    try {
      await apiRequest("/bookings", {
        method: "POST",
        body: JSON.stringify({
          name: createForm.name.trim(),
          email: createForm.email.trim(),
          phone: createForm.phone.trim() || undefined,
          sessionType: createForm.sessionType,
          bookingDate: createForm.bookingDate,
          timeSlot: createForm.timeSlot,
          message: createForm.message.trim() || undefined,
        }),
      });

      setShowCreateModal(false);

      setCreateForm({
        name: "",
        email: "",
        phone: "",
        sessionType: "",
        bookingDate: "",
        timeSlot: "",
        message: "",
      });

      onRefresh?.();
    } catch (error) {
      setCreateError(
        error instanceof Error
          ? error.message
          : "Unable to create booking.",
      );
    } finally {
      setCreateSaving(false);
    }
  }

  /* =========================================================
     SERVICE ICON PER SESSION TYPE (visual only)
  ========================================================= */

  const SERVICE_ICONS: ElementType[] = [
    Leaf,
    UserRound,
    Flower2,
    PlaySquare,
  ];

  const SERVICE_TONES = [
    { bg: "#e6efe7", fg: "#2f6b46" },
    { bg: "#ece6f5", fg: "#6a4f9e" },
    { bg: "#fbe9dc", fg: "#b16a2f" },
    { bg: "#e2ecf5", fg: "#2f5f9e" },
  ];

  /* =========================================================
     CALENDAR MONTH LABEL + PREV/NEXT
  ========================================================= */

  const weekRangeLabel = useMemo(() => {
    const start = new Date();
    const end = new Date();
    end.setDate(end.getDate() + 6);

    const fmt = (d: Date) =>
      d.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });

    return `${fmt(start)} – ${fmt(end)}`;
  }, []);

  const monthLabel = new Date(
    calendar.year,
    calendar.month - 1,
    1,
  ).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  function shiftMonth(delta: number) {
    const [year, month] = selectedMonth.split("-").map(Number);
    const next = new Date(year, month - 1 + delta, 1);
    setSelectedMonth(monthKey(next));
  }

  /* =========================================================
     DATE-FILTERED UPCOMING LIST (calendar click filters table)
  ========================================================= */

  const dayFilteredItems = useMemo(() => {
    if (view === "availability" || !selectedDate)
      return filteredItems;
    return filteredItems.filter(
      (item) => item.bookingDate === selectedDate,
    );
  }, [filteredItems, selectedDate, view]);

  const upcomingPreview = useMemo(() => {
    if (selectedBooking) return selectedBooking;

    const today = dateKey(new Date());

    return (
      [...dayFilteredItems]
        .filter(
          (item) =>
            !!item.bookingDate &&
            item.bookingDate >= today &&
            item.status !== "cancelled",
        )
        .sort((a, b) =>
          (
            (a.bookingDate || "") + (a.timeSlot || "")
          ).localeCompare(
            (b.bookingDate || "") + (b.timeSlot || ""),
          ),
        )[0] || null
    );
  }, [dayFilteredItems, selectedBooking]);

  /*
   * Fallback for the side panel when there's no upcoming
   * BOOKING yet — a slot the admin has created (webinar or
   * individual), so its Zoom link is visible even before
   * anyone books it. Only used when upcomingPreview is empty,
   * so a real booking always takes priority.
   *
   * Respects the "Our Services" filter (sessionTypeFilter) so
   * picking e.g. Discovery Call doesn't show a Webinar slot.
   * If a calendar date is selected, prefers a slot on exactly
   * that date over the next upcoming one anywhere.
   */
  const upcomingSlotPreview = useMemo(() => {
    if (upcomingPreview) return null;

    const today = dateKey(new Date());
    const nowMinutes =
      new Date().getHours() * 60 +
      new Date().getMinutes();

    const relevantSlots = configuredDates
      .flatMap((date) => date.slots || [])
      .filter((slot) => slot.isActive)
      .filter(
        (slot) =>
          sessionTypeFilter === "all" ||
          slot.sessionType === sessionTypeFilter,
      );

    if (selectedDate) {
      return (
        relevantSlots
          .filter(
            (slot) => slot.bookingDate === selectedDate,
          )
          .sort(
            (a, b) =>
              timeToMinutes(a.timeSlot) -
              timeToMinutes(b.timeSlot),
          )[0] || null
      );
    }

    return (
      relevantSlots
        .filter((slot) => {
          if (slot.bookingDate < today) return false;
          if (slot.bookingDate === today) {
            return (
              timeToMinutes(
                slot.timeSlot,
              ) > nowMinutes
            );
          }
          return true;
        })
        .sort((a, b) =>
          (a.bookingDate + a.timeSlot).localeCompare(
            b.bookingDate + b.timeSlot,
          ),
        )[0] || null
    );
  }, [
    configuredDates,
    upcomingPreview,
    sessionTypeFilter,
    selectedDate,
  ]);

  return (
    <>
      <section className="relative z-0 pointer-events-auto">
        {/* =================================================
            HEADER
        ================================================= */}

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[.2em] text-[#a87943]">
              Bookings
            </p>

            <h2 className="mt-2 font-serif text-[clamp(30px,3vw,42px)] text-[#172420]">
              Booking Sessions
            </h2>

            <p className="mt-2 text-sm text-[#74807a]">
              Manage and track all client sessions, view
              details, and handle Zoom links.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 rounded-full bg-[#0b3b38] px-5 py-3 text-xs font-semibold text-white shadow-[0_8px_20px_rgba(11,59,56,.25)] transition hover:bg-[#124c47]"
            >
              <Plus size={15} />
              Create Booking
            </button>

            <div className="inline-flex items-center gap-2 rounded-full border border-[#d7ded9] bg-white px-4 py-3 text-xs font-semibold text-[#3c4a44]">
              <CalendarDays size={14} />
              {weekRangeLabel}
            </div>
          </div>
        </div>

        {/* =================================================
            OUR SERVICES
        ================================================= */}

        <div className="mt-8">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <h3 className="font-serif text-2xl text-[#172420]">
              Our Services
            </h3>

            <p className="text-xs text-[#8a948f]">
              {config?.sessionTypes?.length || 0} types of
              sessions available for booking
            </p>
          </div>

          <div className="mt-4 grid grid-cols-4 gap-4 max-[1150px]:grid-cols-2 max-[560px]:grid-cols-1">
            {(config?.sessionTypes || []).map((session, index) => {
              const Icon =
                SERVICE_ICONS[index % SERVICE_ICONS.length];

              const tone =
                SERVICE_TONES[index % SERVICE_TONES.length];

              const count =
                sessionTypeOptions.find(
                  (option) => option.label === session.title,
                )?.count || 0;

              const active = sessionTypeFilter === session.title;

              return (
                <button
                  key={session.title}
                  type="button"
                  onClick={() => {
                    setSessionTypeFilter(
                      active ? "all" : session.title,
                    );
                    setSelectedBooking(null);
                  }}
                  className={`rounded-[22px] border p-5 text-left transition ${
                    active
                      ? "border-[#0b3b38] shadow-[0_10px_26px_rgba(11,59,56,.14)]"
                      : "border-[#dce1dc] bg-white hover:border-[#b9c4bd]"
                  }`}
                >
                  <div
                    className="grid h-11 w-11 place-items-center rounded-full"
                    style={{
                      backgroundColor: tone.bg,
                      color: tone.fg,
                    }}
                  >
                    <Icon size={20} />
                  </div>

                  <p className="mt-4 font-serif text-lg text-[#172420]">
                    {session.title}
                  </p>

                  <p className="mt-1 text-[11px] text-[#8a948f]">
                    {session.duration} ·{" "}
                    {session.price ? `₹${session.price}` : "Free"}
                  </p>

                  <span
                    className={`mt-4 inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[10px] font-bold ${
                      active
                        ? "bg-[#0b3b38] text-white"
                        : "bg-[#f3f6f3] text-[#3c4a44]"
                    }`}
                  >
                    View Bookings
                    <span
                      className={`rounded-full px-2 py-0.5 ${
                        active
                          ? "bg-white/15"
                          : "bg-white text-[#3c4a44]"
                      }`}
                    >
                      {count}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {view === "bookings" ? (
          <div className="mt-8 grid grid-cols-[300px_minmax(0,1fr)_300px] gap-5 max-[1250px]:grid-cols-1">
            {/* =============================================
                CALENDAR
            ============================================= */}

            <div className="h-fit rounded-[22px] border border-[#dce1dc] bg-white p-5">
              <div className="flex items-center justify-between">
                <p className="font-serif text-lg text-[#172420]">
                  Calendar
                </p>

                <button
                  type="button"
                  onClick={() => setView("availability")}
                  aria-label="Manage availability"
                  className="rounded-lg border border-[#d9dfda] p-1.5 text-[#5c6a63] transition hover:border-[#0b3b38]/40 hover:text-[#0b3b38]"
                  title="Manage availability"
                >
                  <Settings2 size={15} />
                </button>
              </div>

              <div className="mt-3 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => shiftMonth(-1)}
                  className="rounded-lg p-1 text-[#5c6a63] transition hover:bg-[#f3f6f3]"
                >
                  <ChevronLeft size={16} />
                </button>

                <p className="text-xs font-semibold text-[#46554f]">
                  {monthLabel}
                </p>

                <button
                  type="button"
                  onClick={() => shiftMonth(1)}
                  className="rounded-lg p-1 text-[#5c6a63] transition hover:bg-[#f3f6f3]"
                >
                  <ChevronRight size={16} />
                </button>
              </div>

              <div className="mt-4 grid grid-cols-7 gap-y-2 text-center">
                {WEEK_DAYS.map((day) => (
                  <span
                    key={day}
                    className="text-[9px] font-semibold uppercase text-[#8c9792]"
                  >
                    {day.slice(0, 3)}
                  </span>
                ))}

                {Array.from({
                  length: calendar.firstWeekday,
                }).map((_, index) => (
                  <span key={`blank-${index}`} aria-hidden="true" />
                ))}

                {calendar.days.map((day) => {
                  const key = `${calendar.year}-${String(
                    calendar.month,
                  ).padStart(2, "0")}-${String(day).padStart(
                    2,
                    "0",
                  )}`;

                  const hasBookings = items.some(
                    (item) =>
                      item.bookingDate === key &&
                      (sessionTypeFilter === "all" ||
                        (item.sessionType || "Other") ===
                          sessionTypeFilter),
                  );

                  const hasSlot = (
                    openDateMap.get(key)?.slots || []
                  ).some(
                    (slot) =>
                      sessionTypeFilter === "all" ||
                      slot.sessionType === sessionTypeFilter,
                  );

                  const isSelected = selectedDate === key;
                  const isToday = key === todayKey;

                  return (
                    <button
                      type="button"
                      key={key}
                      onClick={() => {
                        setSelectedDate(isSelected ? "" : key);
                        setSelectedBooking(null);
                      }}
                      className={`relative mx-auto grid aspect-square w-8 place-items-center rounded-lg text-xs font-semibold transition ${
                        isSelected
                          ? "bg-[#0b3b38] text-white"
                          : isToday
                            ? "bg-[#eef5f1] text-[#0b3b38]"
                            : "text-[#53615b] hover:bg-[#eef3ef]"
                      }`}
                    >
                      {day}

                      {/*
                       * Gold dot: a session slot exists on
                       * this date (created by admin), whether
                       * or not anyone has booked it yet.
                       * Green dot: at least one actual booking
                       * exists on this date.
                       */}
                      {hasSlot && !isSelected && (
                        <span className="absolute bottom-0.5 h-1 w-1 rounded-full bg-[#c28b4d]" />
                      )}

                      {hasBookings &&
                        !isSelected && (
                          <span
                            className={`absolute bottom-0.5 h-1 w-1 rounded-full bg-[#3b7a4f] ${
                              hasSlot
                                ? "left-[calc(50%+4px)]"
                                : ""
                            }`}
                          />
                        )}
                    </button>
                  );
                })}
              </div>

              {selectedDate && (
                <button
                  type="button"
                  onClick={() => setSelectedDate("")}
                  className="mt-4 text-[11px] font-semibold text-[#a87943] hover:underline"
                >
                  Clear date filter
                </button>
              )}

              <div className="mt-4 flex items-center gap-4 text-[10px] text-[#7c8882]">
                <span className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#c28b4d]" />
                  Slot created
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#3b7a4f]" />
                  Has booking
                </span>
              </div>

              <div className="mt-3 space-y-2 text-[10px] text-[#7c8882]">
                {sessionTypeOptions.slice(0, 4).map(({ label }, i) => (
                  <span key={label} className="flex items-center gap-2">
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{
                        backgroundColor:
                          SERVICE_TONES[i % SERVICE_TONES.length].fg,
                      }}
                    />
                    {label}
                  </span>
                ))}
              </div>
            </div>

            {/* =============================================
                UPCOMING SESSIONS
            ============================================= */}

            <div className="rounded-[22px] border border-[#dce1dc] bg-white p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-serif text-lg text-[#172420]">
                    Upcoming Sessions
                  </p>
                  <p className="mt-0.5 text-[11px] text-[#8a948f]">
                    {dayFilteredItems.length} bookings found
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2 rounded-full border border-[#d9dfda] bg-[#f8faf8] px-3 py-2">
                    <Search size={14} className="text-[#89948f]" />
                    <input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search by name, email or session..."
                      className="w-44 bg-transparent text-xs outline-none max-[500px]:w-24"
                    />
                  </div>

                  <select
                    value={statusFilter}
                    onChange={(e) =>
                      setStatusFilter(
                        e.target.value as "all" | BookingStatus,
                      )
                    }
                    className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-[#d9dfda] bg-white px-3 py-2 text-[11px] font-semibold outline-none"
                  >
                    <option value="all">Filter</option>
                    {STATUS_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mt-4 overflow-hidden rounded-2xl border border-[#edf0ed]">
                <div className="max-h-[560px] overflow-auto">
                  <table className="w-full min-w-[640px] text-left">
                    <thead className="sticky top-0 bg-[#f5f7f4] text-[9px] uppercase tracking-[.1em] text-[#7b8781]">
                      <tr>
                        <th className="px-4 py-3">Client</th>
                        <th className="px-4 py-3">Service</th>
                        <th className="px-4 py-3">Date &amp; Time</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3 text-right">
                          Actions
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-[#edf0ed]">
                      {dayFilteredItems.map((booking) => (
                        <tr
                          key={booking._id}
                          onClick={() => setSelectedBooking(booking)}
                          className={`cursor-pointer transition hover:bg-[#fbfcfa] ${
                            selectedBooking?._id === booking._id
                              ? "bg-[#f3f6f3]"
                              : ""
                          }`}
                        >
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-2.5">
                              <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#edf4f1] text-[10px] font-bold text-[#0c5149]">
                                {initials(booking.name)}
                              </div>
                              <div>
                                <p className="text-xs font-semibold">
                                  {booking.name || "Unnamed guest"}
                                </p>
                                <p className="mt-0.5 text-[10px] text-[#78837e]">
                                  {booking.email}
                                </p>
                              </div>
                            </div>
                          </td>

                          <td className="px-4 py-4">
                            <span className="rounded-full bg-[#f3f6f3] px-2.5 py-1 text-[10px] font-semibold text-[#3c4a44]">
                              {booking.sessionType}
                            </span>
                          </td>

                          <td className="px-4 py-4 text-[11px] text-[#65716b]">
                            {isLeadOnlySession(booking.sessionType) ? (
                              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#e6dcc7] bg-[#fbf6ea] px-2.5 py-1 text-[9px] font-bold uppercase tracking-[.08em] text-[#a1782f]">
                                Lead
                              </span>
                            ) : needsAssignment(booking) ? (
                              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#e6dcc7] bg-[#fbf6ea] px-2.5 py-1 text-[9px] font-bold uppercase tracking-[.08em] text-[#a1782f]">
                                Awaiting Assignment
                              </span>
                            ) : (
                              <>
                                {formatDate(booking.bookingDate)}
                                <br />
                                {booking.timeSlot}
                              </>
                            )}
                          </td>

                          <td className="px-4 py-4">
                            <span
                              className={`rounded-full border px-2.5 py-1 text-[9px] font-semibold capitalize ${statusClass(
                                booking.status,
                              )}`}
                            >
                              {booking.status}
                            </span>
                          </td>

                          <td className="px-4 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {needsAssignment(booking) && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedBooking(booking);
                                    openAssignForm(booking);
                                  }}
                                  className="inline-flex items-center gap-1.5 rounded-lg border border-[#0b3b38] bg-[#0b3b38] px-2.5 py-1.5 text-[10px] font-semibold text-white transition hover:bg-[#124c47]"
                                >
                                  <CalendarCheck2 size={12} />
                                  Assign
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedBooking(booking);
                                }}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-[#d6ddd8] px-2.5 py-1.5 text-[10px] font-semibold transition hover:border-[#b78a57] hover:bg-[#fbf6ef]"
                              >
                                <Eye size={12} />
                                View
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {dayFilteredItems.length === 0 && (
                  <div className="p-10 text-center text-sm text-[#7a8580]">
                    No booking requests found.
                  </div>
                )}
              </div>
            </div>

            {/* =============================================
                SESSION DETAIL PANEL
            ============================================= */}

            <div className="h-fit rounded-[22px] bg-[#0b3b38] p-5 text-white">
              {!upcomingPreview && !upcomingSlotPreview ? (
                <div className="py-10 text-center text-xs text-[#9fc2b9]">
                  No upcoming sessions yet.
                </div>
              ) : !upcomingPreview && upcomingSlotPreview ? (
                <>
                  <span className="inline-flex rounded-full bg-white/10 px-3 py-1 text-[9px] font-bold uppercase tracking-[.1em] text-[#bfe3d6]">
                    {selectedDate
                      ? "Slot on selected date"
                      : "Next open slot"}
                  </span>

                  <p className="mt-4 font-serif text-xl">
                    {upcomingSlotPreview.sessionType}
                  </p>

                  <p className="mt-1 flex items-center gap-1.5 text-[11px] text-[#a9c8bf]">
                    <Clock3 size={12} />
                    {upcomingSlotPreview.timeSlot}
                  </p>

                  <div className="mt-5 space-y-4 border-t border-white/10 pt-4">
                    <p className="text-[9px] font-semibold uppercase tracking-[.14em] text-[#8fb3a8]">
                      Session Details
                    </p>

                    <div>
                      <p className="flex items-center gap-1.5 text-[10px] text-[#8fb3a8]">
                        <CalendarDays size={12} />
                        Date &amp; Time
                      </p>
                      <p className="mt-1 text-xs font-semibold">
                        {formatDate(upcomingSlotPreview.bookingDate)},{" "}
                        {upcomingSlotPreview.timeSlot}
                      </p>
                    </div>

                    <div>
                      <p className="flex items-center gap-1.5 text-[10px] text-[#8fb3a8]">
                        <Users size={12} />
                        Seats
                      </p>
                      <p className="mt-1 text-xs font-semibold">
                        {upcomingSlotPreview.remainingSeats}/
                        {upcomingSlotPreview.capacity} remaining · No
                        bookings yet
                      </p>
                    </div>

                    {upcomingSlotPreview.bookingMode ===
                    "webinar" ? (
                      getSafeZoomUrl(
                        upcomingSlotPreview.zoomJoinUrl,
                      ) ? (
                        <div>
                          <p className="flex items-center gap-1.5 text-[10px] text-[#8fb3a8]">
                            <Video size={12} />
                            Zoom Link
                          </p>
                          <a
                            href={
                              getSafeZoomUrl(
                                upcomingSlotPreview.zoomJoinUrl,
                              )!
                            }
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-1 block break-all text-xs font-semibold text-[#8fe0c6] hover:underline"
                          >
                            {upcomingSlotPreview.zoomJoinUrl}
                          </a>
                        </div>
                      ) : (
                        <div>
                          <p className="flex items-center gap-1.5 text-[10px] text-[#8fb3a8]">
                            <Video size={12} />
                            Zoom Link
                          </p>
                          <p className="mt-1 text-xs font-semibold text-[#cfe0d8]">
                            {upcomingSlotPreview.zoomStatus ===
                            "creating"
                              ? "Being created…"
                              : upcomingSlotPreview.zoomStatus ===
                                  "failed"
                                ? "Couldn't be created"
                                : "Not created yet"}
                          </p>

                          <CreateZoomLinkButton
                            slotId={
                              upcomingSlotPreview._id
                            }
                            onDone={() =>
                              void refreshSlots(
                                false,
                              )
                            }
                          />
                        </div>
                      )
                    ) : (
                      <div>
                        <p className="flex items-center gap-1.5 text-[10px] text-[#8fb3a8]">
                          <Video size={12} />
                          Zoom Link
                        </p>
                        <p className="mt-1 text-xs font-semibold text-[#cfe0d8]">
                          Created once this slot is
                          booked
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="mt-6 space-y-2.5">
                    {getSafeZoomUrl(upcomingSlotPreview.zoomJoinUrl) && (
                      <a
                        href={
                          getSafeZoomUrl(
                            upcomingSlotPreview.zoomJoinUrl,
                          )!
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-white py-3 text-xs font-bold text-[#0b3b38] transition hover:bg-[#eef5f1]"
                      >
                        <Video size={13} />
                        Join Session
                      </a>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        setView("availability");
                        setSelectedDate(
                          upcomingSlotPreview.bookingDate,
                        );
                      }}
                      className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/25 py-3 text-xs font-bold transition hover:bg-white/10"
                    >
                      <Eye size={13} />
                      View in Availability
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <span className="inline-flex rounded-full bg-white/10 px-3 py-1 text-[9px] font-bold uppercase tracking-[.1em] text-[#bfe3d6]">
                    {selectedBooking ? "Selected" : "Upcoming"}
                  </span>

                  <p className="mt-4 font-serif text-xl">
                    {upcomingPreview.sessionType}
                  </p>

                  <p className="mt-1 flex items-center gap-1.5 text-[11px] text-[#a9c8bf]">
                    <Clock3 size={12} />
                    {upcomingPreview.timeSlot}
                  </p>

                  <div className="mt-5 space-y-4 border-t border-white/10 pt-4">
                    <p className="text-[9px] font-semibold uppercase tracking-[.14em] text-[#8fb3a8]">
                      Session Details
                    </p>

                    <div>
                      <p className="flex items-center gap-1.5 text-[10px] text-[#8fb3a8]">
                        <CalendarDays size={12} />
                        Date &amp; Time
                      </p>
                      <p className="mt-1 text-xs font-semibold">
                        {formatDate(upcomingPreview.bookingDate)},{" "}
                        {upcomingPreview.timeSlot}
                      </p>
                    </div>

                    {getSafeZoomUrl(upcomingPreview.zoomJoinUrl) ? (
                      <div>
                        <p className="flex items-center gap-1.5 text-[10px] text-[#8fb3a8]">
                          <Video size={12} />
                          Zoom Link
                        </p>
                        <a
                          href={
                            getSafeZoomUrl(
                              upcomingPreview.zoomJoinUrl,
                            )!
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-1 block break-all text-xs font-semibold text-[#8fe0c6] hover:underline"
                        >
                          {upcomingPreview.zoomJoinUrl}
                        </a>
                      </div>
                    ) : (
                      <div>
                        <p className="flex items-center gap-1.5 text-[10px] text-[#8fb3a8]">
                          <Phone size={12} />
                          Handled By Call
                        </p>
                        <p className="mt-1 text-xs font-semibold">
                          {upcomingPreview.phone || "No phone on file"}
                        </p>
                      </div>
                    )}

                    <div>
                      <p className="flex items-center gap-1.5 text-[10px] text-[#8fb3a8]">
                        <UserRound size={12} />
                        Booked By
                      </p>
                      <p className="mt-1 text-xs font-semibold">
                        {upcomingPreview.name}
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 space-y-2.5">
                    {getSafeZoomUrl(upcomingPreview.zoomJoinUrl) ? (
                      <a
                        href={
                          getSafeZoomUrl(
                            upcomingPreview.zoomJoinUrl,
                          )!
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-white py-3 text-xs font-bold text-[#0b3b38] transition hover:bg-[#eef5f1]"
                      >
                        <Video size={13} />
                        Join Session
                      </a>
                    ) : upcomingPreview.phone ? (
                      <a
                        href={`tel:${upcomingPreview.phone}`}
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-white py-3 text-xs font-bold text-[#0b3b38] transition hover:bg-[#eef5f1]"
                      >
                        <Phone size={13} />
                        Call {upcomingPreview.name.split(" ")[0]}
                      </a>
                    ) : null}

                    <button
                      type="button"
                      onClick={() => setSelectedBooking(upcomingPreview)}
                      className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/25 py-3 text-xs font-bold transition hover:bg-white/10"
                    >
                      <Eye size={13} />
                      View Details
                    </button>

                    <button
                      type="button"
                      disabled={updatingStatusId === upcomingPreview._id}
                      onClick={() =>
                        void changeStatus(upcomingPreview, "cancelled")
                      }
                      className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#e08b7d]/40 py-3 text-xs font-bold text-[#f3b5a9] transition hover:bg-[#e08b7d]/10 disabled:opacity-50"
                    >
                      <XCircle size={13} />
                      Cancel Booking
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        ) : view === "availability" ? (
          /* =================================================
             MANAGE AVAILABILITY
          ================================================= */
          <div className="mt-7">
            <button
              type="button"
              onClick={() => setView("bookings")}
              className="mb-5 inline-flex items-center gap-2 text-xs font-semibold text-[#0b3b38] hover:underline"
            >
              <ChevronLeft size={14} />
              Back to Bookings
            </button>

            <div className="grid grid-cols-[1fr_1fr] gap-5 max-[900px]:grid-cols-1">
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
  Configure Sessions
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
{/* =============================================
    SESSION TYPE
============================================= */}

<div className="mt-6">
  <label className="mb-2 block text-[10px] font-semibold uppercase tracking-[.13em] text-[#89948f]">
    Session Type
  </label>

  <select
    value={
      selectedSessionType
    }
    onChange={(e) => {
      const value =
        e.target.value;

      setSelectedSessionType(
        value,
      );

      const session =
        config?.sessionTypes.find(
          (item) =>
            item.title ===
            value,
        );

      setCapacity(
        session?.bookingMode ===
          "webinar"
          ? String(
              session.defaultCapacity ||
                100,
            )
          : "1",
      );

      const defaultPrice =
        Number(
          session?.price || 0,
        );

      setPriceMode(
        defaultPrice > 0
          ? "paid"
          : "free",
      );

      setPriceAmount(
        defaultPrice > 0
          ? String(defaultPrice)
          : "",
      );

      setSlotError("");
      setSlotMessage("");
      setLastCreatedSlot(null);
    }}
    className="w-full rounded-xl border border-[#d9dfda] bg-[#f8faf8] px-4 py-3 text-xs font-semibold outline-none focus:border-[#a87943]"
  >
    <option value="">
      Select session
    </option>

    {config?.sessionTypes.map(
      (session) => (
        <option
          key={session.title}
          value={session.title}
        >
          {session.title} ·{" "}
          {session.duration}
        </option>
      ),
    )}
  </select>
</div>

{/* =============================================
    QUICK TIMES
============================================= */}

{config?.timeSlots?.length ? (
  <div className="mt-6">
    <p className="mb-3 text-[10px] font-semibold uppercase tracking-[.13em] text-[#89948f]">
      Quick Times
    </p>

    <div className="flex flex-wrap gap-2">
      {config.timeSlots.map(
        (time) => {
          const selected =
            customTime ===
            time12To24(
              time,
            );

          return (
            <button
              type="button"
              key={time}
              onClick={() => {
                setCustomTime(
                  time12To24(
                    time,
                  ),
                );

                setSlotError("");
                setSlotMessage("");
              }}
              className={`rounded-full border px-3.5 py-2 text-[11px] font-semibold transition ${
                selected
                  ? "border-[#0b5149] bg-[#edf7f4] text-[#176b5d]"
                  : "border-[#d9dfda] bg-[#f8faf8] text-[#617069] hover:border-[#b58a58]"
              }`}
            >
              {time}
            </button>
          );
        },
      )}
    </div>
  </div>
) : null}

{/* =============================================
    TIME
============================================= */}

<div className="mt-6">
  <label className="mb-2 block text-[10px] font-semibold uppercase tracking-[.13em] text-[#89948f]">
    Session Time
  </label>

  <input
    type="time"
    value={customTime}
    onChange={(e) => {
      setCustomTime(
        e.target.value,
      );

      setSlotError("");
      setSlotMessage("");
    }}
    className="w-full rounded-xl border border-[#d9dfda] bg-[#f8faf8] px-4 py-3 text-xs outline-none focus:border-[#a87943]"
  />
</div>

{/* =============================================
    CAPACITY
============================================= */}

<div className="mt-6">
  <p className="mb-2 text-[10px] font-semibold uppercase tracking-[.13em] text-[#89948f]">
    Capacity
  </p>

  {selectedSession?.bookingMode ===
  "webinar" ? (
    <>
      <input
        type="number"
        min={1}
        max={10000}
        value={capacity}
        onChange={(e) =>
          setCapacity(
            e.target.value,
          )
        }
        className="w-full rounded-xl border border-[#d9dfda] bg-[#f8faf8] px-4 py-3 text-xs outline-none focus:border-[#a87943]"
      />

      <p className="mt-2 text-[10px] leading-4 text-[#85908b]">
        Webinar allows multiple
        registrations. Final Zoom
        participant limit will later be
        validated against your Zoom plan.
      </p>
    </>
  ) : (
    <div className="rounded-xl border border-[#d9dfda] bg-[#f8faf8] px-4 py-3">
      <p className="text-xs font-semibold text-[#47564f]">
        1 participant
      </p>

      <p className="mt-1 text-[10px] text-[#89948f]">
        Individual sessions can only
        be booked by one client.
      </p>
    </div>
  )}
</div>

{/* =============================================
    PRICING (FREE / PAID)
============================================= */}

<div className="mt-6">
  <p className="mb-2 text-[10px] font-semibold uppercase tracking-[.13em] text-[#89948f]">
    Pricing
  </p>

  <div className="grid grid-cols-2 gap-2">
    <button
      type="button"
      onClick={() => {
        setPriceMode("free");
        setSlotError("");
        setSlotMessage("");
      }}
      className={`rounded-xl border px-3.5 py-2.5 text-xs font-semibold transition ${
        priceMode === "free"
          ? "border-[#0b5149] bg-[#edf7f4] text-[#176b5d]"
          : "border-[#d9dfda] bg-[#f8faf8] text-[#617069] hover:border-[#b58a58]"
      }`}
    >
      Free
    </button>

    <button
      type="button"
      onClick={() => {
        setPriceMode("paid");
        setSlotError("");
        setSlotMessage("");
      }}
      className={`rounded-xl border px-3.5 py-2.5 text-xs font-semibold transition ${
        priceMode === "paid"
          ? "border-[#a87943] bg-[#fff7e9] text-[#8c6438]"
          : "border-[#d9dfda] bg-[#f8faf8] text-[#617069] hover:border-[#b58a58]"
      }`}
    >
      Paid
    </button>
  </div>

  {priceMode === "paid" && (
    <div className="mt-3">
      <label
        htmlFor="slot-price"
        className="mb-1.5 block text-[10px] font-medium text-[#89948f]"
      >
        Amount (₹)
      </label>

      <input
        id="slot-price"
        type="number"
        min={1}
        step="1"
        inputMode="numeric"
        value={priceAmount}
        onChange={(e) => {
          setPriceAmount(e.target.value);
          setSlotError("");
          setSlotMessage("");
        }}
        placeholder="e.g. 2500"
        className="w-full rounded-xl border border-[#d9dfda] bg-[#f8faf8] px-4 py-3 text-xs outline-none focus:border-[#a87943]"
      />

      <p className="mt-2 text-[10px] leading-4 text-[#85908b]">
        This exact session slot will require this
        payment via Razorpay before the booking is
        confirmed.
      </p>
    </div>
  )}

  {priceMode === "free" && (
    <p className="mt-2 text-[10px] leading-4 text-[#85908b]">
      This session slot will not require any payment,
      regardless of the session type&apos;s default price.
    </p>
  )}
</div>

{/* =============================================
    ERRORS / SUCCESS
============================================= */}

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

{lastCreatedSlot &&
  lastCreatedSlot.bookingMode === "webinar" && (
    <div className="mt-3 rounded-xl border border-[#cde4db] bg-[#edf8f4] px-4 py-3.5">
      <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[.1em] text-[#176d5c]">
        <Video size={12} />
        Zoom Link
      </p>

      {getSafeZoomUrl(lastCreatedSlot.zoomJoinUrl) ? (
        <a
          href={
            getSafeZoomUrl(
              lastCreatedSlot.zoomJoinUrl,
            )!
          }
          target="_blank"
          rel="noopener noreferrer"
          className="mt-1.5 block break-all text-xs font-semibold text-[#0b6b56] hover:underline"
        >
          {lastCreatedSlot.zoomJoinUrl}
        </a>
      ) : (
        <p className="mt-1.5 text-xs font-semibold text-[#5b7f76]">
          {lastCreatedSlot.zoomStatus === "creating"
            ? "Being created…"
            : "Couldn't be created for this slot."}
        </p>
      )}
    </div>
  )}

{/* =============================================
    CREATE SESSION
============================================= */}

<button
  type="button"
  disabled={
    slotSaving ||
    !selectedSessionType ||
    !customTime
  }
  onClick={() =>
    void createSlot()
  }
  className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#0b3b38] px-5 py-3.5 text-xs font-semibold text-white transition hover:bg-[#124c47] disabled:cursor-not-allowed disabled:opacity-50"
>
  <Plus size={15} />

  {slotSaving
    ? "Creating session..."
    : "Add Session Slot"}
</button>

{/* =============================================
    CONFIGURED SESSIONS
============================================= */}

<div className="mt-8 border-t border-[#e2e6e2] pt-6">
  <div className="flex items-center justify-between gap-3">
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-[.13em] text-[#89948f]">
        Configured Sessions
      </p>

      <p className="mt-1 text-[11px] text-[#89948f]">
        {selectedDateSlots.length}{" "}
        session
        {selectedDateSlots.length ===
        1
          ? ""
          : "s"}{" "}
        configured
      </p>
    </div>
  </div>

  <div className="mt-4 space-y-3">
    {selectedDateSlots.length ===
    0 ? (
      <div className="rounded-2xl border border-dashed border-[#d9dfda] bg-[#fafbf9] p-5 text-center">
        <p className="text-xs text-[#84908a]">
          No sessions configured
          for this date yet.
        </p>
      </div>
    ) : (
      selectedDateSlots.map(
        (slot) => (
          <div
            key={slot._id}
            className="rounded-2xl border border-[#dce1dc] bg-[#fbfcfa] p-4"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold text-[#31433c]">
                    {
                      slot.sessionType
                    }
                  </p>

                  {slot.bookingMode ===
                    "webinar" && (
                    <span className="rounded-full border border-[#e4cfaa] bg-[#fff7e9] px-2 py-1 text-[9px] font-bold uppercase tracking-wide text-[#9a6d31]">
                      Webinar
                    </span>
                  )}

                  {slot.isPaid ? (
                    <span className="rounded-full border border-[#cde4db] bg-[#edf8f4] px-2 py-1 text-[9px] font-bold uppercase tracking-wide text-[#176d5c]">
                      Paid
                    </span>
                  ) : (
                    <span className="rounded-full border border-[#e1e5e2] bg-[#f7f8f7] px-2 py-1 text-[9px] font-bold uppercase tracking-wide text-[#8a948f]">
                      Free
                    </span>
                  )}
                </div>

                <div className="mt-2 flex flex-wrap gap-x-5 gap-y-2 text-[11px] text-[#74817b]">
                  <span className="inline-flex items-center gap-1.5">
                    <Clock3
                      size={12}
                    />
                    {
                      slot.timeSlot
                    }
                  </span>

                  {slot.duration && (
                    <span>
                      {
                        slot.duration
                      }
                    </span>
                  )}
                </div>
              </div>

              <button
                type="button"
                disabled={
                  slotSaving ||
                  slot.bookedCount >
                    0
                }
                title={
                  slot.bookedCount >
                  0
                    ? "Cancel active bookings before removing this slot."
                    : "Remove session"
                }
                onClick={() =>
                  void removeSlot(
                    slot,
                  )
                }
                className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-red-100 bg-white text-red-500 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <X size={13} />
              </button>
            </div>

            <div className="mt-4 grid grid-cols-4 gap-2">
              <div className="rounded-xl bg-white p-3">
                <p className="text-[8px] font-semibold uppercase tracking-wide text-[#919b96]">
                  Price
                </p>

                <p className="mt-1 text-xs font-bold text-[#40534c]">
                  {slot.isPaid
                    ? `₹${slot.price}`
                    : "Free"}
                </p>
              </div>

              <div className="rounded-xl bg-white p-3">
                <p className="text-[8px] font-semibold uppercase tracking-wide text-[#919b96]">
                  Capacity
                </p>

                <p className="mt-1 text-xs font-bold text-[#40534c]">
                  {
                    slot.capacity
                  }
                </p>
              </div>

              <div className="rounded-xl bg-white p-3">
                <p className="text-[8px] font-semibold uppercase tracking-wide text-[#919b96]">
                  Booked
                </p>

                <p className="mt-1 text-xs font-bold text-[#40534c]">
                  {
                    slot.bookedCount
                  }
                </p>
              </div>

              <div className="rounded-xl bg-white p-3">
                <p className="text-[8px] font-semibold uppercase tracking-wide text-[#919b96]">
                  Remaining
                </p>

                <p className="mt-1 text-xs font-bold text-[#40534c]">
                  {
                    slot.remainingSeats
                  }
                </p>
              </div>
            </div>

            {slot.bookingMode ===
              "webinar" && (
              <ZoomSlotStatus
                slot={
                  slot
                }
                onCopied={() => {
                  setSlotMessage(
                    "Zoom link copied to clipboard.",
                  );
                }}
                onZoomUpdated={() =>
                  void refreshSlots(false)
                }
              />
            )}
          </div>
        ),
      )
    )}
  </div>
</div>
                </>
              )}
            </div>
          </div>
          </div>
        ) : (
          /* =================================================
             BY SESSION (drill-down: session type -> slot ->
             registrant details, with Join Meeting)
          ================================================= */
          <div className="mt-7">
            {overviewError && (
              <div className="mb-5 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-xs text-red-600">
                {overviewError}
              </div>
            )}

            {overviewLoading && (
              <div className="rounded-2xl border border-[#dce1dc] bg-white p-10 text-center text-sm text-[#7a8580]">
                Loading sessions...
              </div>
            )}

            {!overviewLoading && !activeSessionTitle && (
              <>
                {overview.length === 0 && !overviewError && (
                  <div className="rounded-2xl border border-[#dce1dc] bg-white p-10 text-center text-sm text-[#7a8580]">
                    No sessions have been created yet.
                  </div>
                )}

                <div className="grid grid-cols-3 gap-4 max-[900px]:grid-cols-2 max-[600px]:grid-cols-1">
                  {overview.map((group) => (
                    <button
                      type="button"
                      key={group.title}
                      onClick={() => setActiveSessionTitle(group.title)}
                      className="rounded-2xl border border-[#dce1dc] bg-white p-5 text-left transition hover:border-[#b78a57] hover:shadow-sm"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <h3 className="font-serif text-lg text-[#172420]">
                          {group.title}
                        </h3>

                        {group.bookingMode === "webinar" ? (
                          <span className="rounded-full border border-[#e4cfaa] bg-[#fff7e9] px-2 py-1 text-[9px] font-bold uppercase tracking-wide text-[#9a6d31]">
                            Webinar
                          </span>
                        ) : (
                          <span className="rounded-full border border-[#cfd7e4] bg-[#f0f3fa] px-2 py-1 text-[9px] font-bold uppercase tracking-wide text-[#39507d]">
                            1:1
                          </span>
                        )}
                      </div>

                      {group.duration && (
                        <p className="mt-1 text-[11px] text-[#85908b]">
                          {group.duration}
                        </p>
                      )}

                      <div className="mt-4 flex items-center gap-5">
                        <div className="flex items-center gap-1.5 text-[#40534c]">
                          <CalendarDays size={14} />
                          <span className="text-xs font-semibold">
                            {group.totalSlots} slot
                            {group.totalSlots === 1 ? "" : "s"}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 text-[#40534c]">
                          <Users size={14} />
                          <span className="text-xs font-semibold">
                            {group.totalBookings} booking
                            {group.totalBookings === 1 ? "" : "s"}
                          </span>
                        </div>
                      </div>

                      <div className="mt-3 flex items-center gap-1.5 text-[11px] font-semibold text-[#a87943]">
                        View time slots
                        <ChevronRight size={14} />
                      </div>
                    </button>
                  ))}
                </div>
              </>
            )}

            {!overviewLoading && activeSessionTitle && (
              <div>
                <button
                  type="button"
                  onClick={() => setActiveSessionTitle(null)}
                  className="mb-5 inline-flex items-center gap-1.5 text-xs font-semibold text-[#66736d] hover:text-[#172420]"
                >
                  <ChevronLeft size={15} />
                  Back to all sessions
                </button>

                <h3 className="font-serif text-2xl text-[#172420]">
                  {activeSessionTitle}
                </h3>

                <p className="mt-1 text-xs text-[#85908b]">
                  Every time slot for this session, and who has booked it.
                </p>

                <div className="mt-5 space-y-3">
                  {overview
                    .find((group) => group.title === activeSessionTitle)
                    ?.slots.map((slot) => (
                      <button
                        type="button"
                        key={slot.id}
                        onClick={() => setActiveOverviewSlot(slot)}
                        className="flex w-full flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#dce1dc] bg-white p-4 text-left transition hover:border-[#b78a57]"
                      >
                        <div className="flex items-center gap-3">
                          <div className="grid h-11 w-11 place-items-center rounded-xl bg-[#f2f5f2] text-[#40534c]">
                            <Clock3 size={16} />
                          </div>

                          <div>
                            <p className="text-sm font-semibold text-[#172420]">
                              {formatDate(slot.bookingDate)}
                            </p>
                            <p className="text-xs text-[#85908b]">
                              {slot.timeSlot}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-xs font-semibold text-[#172420]">
                              {slot.registrationCount}/{slot.capacity} booked
                            </p>
                            <p className="text-[10px] text-[#85908b]">
                              {slot.isPaid ? `₹${slot.price}` : "Free"}
                            </p>
                          </div>

                          {getSafeZoomUrl(slot.zoomJoinUrl) && (
                            <span className="inline-flex items-center gap-1 rounded-full border border-[#cfe5dd] bg-[#edf8f4] px-2.5 py-1 text-[9px] font-bold uppercase tracking-wide text-[#19705f]">
                              <Video size={11} />
                              Zoom ready
                            </span>
                          )}

                          <ChevronRight size={15} className="text-[#85908b]" />
                        </div>
                      </button>
                    ))}

                  {overview.find((group) => group.title === activeSessionTitle)
                    ?.slots.length === 0 && (
                    <div className="rounded-2xl border border-[#dce1dc] bg-white p-8 text-center text-sm text-[#7a8580]">
                      No time slots for this session yet.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </section>

      {/* ===================================================
          CREATE BOOKING MODAL
      =================================================== */}

      {showCreateModal && (
        <div
          className="fixed inset-0 z-[2147483646] grid place-items-center bg-[#071c1a]/70 p-5 backdrop-blur-sm"
          onClick={() => setShowCreateModal(false)}
        >
          <div
            role="dialog"
            onClick={(e) => e.stopPropagation()}
            className="max-h-[90vh] w-full max-w-[520px] overflow-y-auto rounded-[24px] bg-white p-7"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[.16em] text-[#a87943]">
                  New Booking
                </p>
                <h3 className="mt-1 font-serif text-2xl text-[#172420]">
                  Create Booking
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="rounded-full border border-[#e1e5e2] p-2 text-[#5c6a63] hover:bg-[#f3f6f3]"
              >
                <X size={16} />
              </button>
            </div>

            {createError && (
              <div className="mt-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-xs text-red-600">
                {createError}
              </div>
            )}

            <div className="mt-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[.1em] text-[#89948f]">
                    Client Name
                  </label>
                  <input
                    value={createForm.name}
                    onChange={(e) =>
                      setCreateForm((f) => ({
                        ...f,
                        name: e.target.value,
                      }))
                    }
                    className="w-full rounded-xl border border-[#d9dfda] bg-[#f8faf8] px-3.5 py-2.5 text-sm outline-none focus:border-[#0b3b38]/40"
                    placeholder="Full name"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[.1em] text-[#89948f]">
                    Phone
                  </label>
                  <input
                    value={createForm.phone}
                    onChange={(e) =>
                      setCreateForm((f) => ({
                        ...f,
                        phone: e.target.value,
                      }))
                    }
                    className="w-full rounded-xl border border-[#d9dfda] bg-[#f8faf8] px-3.5 py-2.5 text-sm outline-none focus:border-[#0b3b38]/40"
                    placeholder="Optional"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[.1em] text-[#89948f]">
                  Email
                </label>
                <input
                  type="email"
                  value={createForm.email}
                  onChange={(e) =>
                    setCreateForm((f) => ({
                      ...f,
                      email: e.target.value,
                    }))
                  }
                  className="w-full rounded-xl border border-[#d9dfda] bg-[#f8faf8] px-3.5 py-2.5 text-sm outline-none focus:border-[#0b3b38]/40"
                  placeholder="client@email.com"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[.1em] text-[#89948f]">
                  Session Type
                </label>
                <select
                  value={createForm.sessionType}
                  onChange={(e) =>
                    setCreateForm((f) => ({
                      ...f,
                      sessionType: e.target.value,
                    }))
                  }
                  className="w-full cursor-pointer rounded-xl border border-[#d9dfda] bg-[#f8faf8] px-3.5 py-2.5 text-sm outline-none focus:border-[#0b3b38]/40"
                >
                  <option value="">Select session</option>
                  {config?.sessionTypes.map((session) => (
                    <option key={session.title} value={session.title}>
                      {session.title} · {session.duration}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[.1em] text-[#89948f]">
                    Date
                  </label>
                  <input
                    type="date"
                    min={todayKey}
                    value={createForm.bookingDate}
                    onChange={(e) =>
                      setCreateForm((f) => ({
                        ...f,
                        bookingDate: e.target.value,
                      }))
                    }
                    className="w-full rounded-xl border border-[#d9dfda] bg-[#f8faf8] px-3.5 py-2.5 text-sm outline-none focus:border-[#0b3b38]/40"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[.1em] text-[#89948f]">
                    Time
                  </label>
                  <select
                    value={createForm.timeSlot}
                    onChange={(e) =>
                      setCreateForm((f) => ({
                        ...f,
                        timeSlot: e.target.value,
                      }))
                    }
                    className="w-full cursor-pointer rounded-xl border border-[#d9dfda] bg-[#f8faf8] px-3.5 py-2.5 text-sm outline-none focus:border-[#0b3b38]/40"
                  >
                    <option value="">Select time</option>
                    {(config?.timeSlots || []).map((time) => (
                      <option key={time} value={time12To24(time)}>
                        {time}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[.1em] text-[#89948f]">
                  Note (optional)
                </label>
                <textarea
                  value={createForm.message}
                  onChange={(e) =>
                    setCreateForm((f) => ({
                      ...f,
                      message: e.target.value,
                    }))
                  }
                  rows={3}
                  className="w-full resize-none rounded-xl border border-[#d9dfda] bg-[#f8faf8] px-3.5 py-2.5 text-sm outline-none focus:border-[#0b3b38]/40"
                  placeholder="Anything the coach should know"
                />
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="flex-1 rounded-xl border border-[#d9dfda] py-3 text-xs font-semibold text-[#4b5a53] transition hover:bg-[#f3f6f3]"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={createSaving}
                onClick={() => void submitCreateBooking()}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#0b3b38] py-3 text-xs font-bold text-white transition hover:bg-[#124c47] disabled:opacity-60"
              >
                <Save size={14} />
                {createSaving ? "Saving..." : "Create Booking"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================
          SLOT REGISTRANTS MODAL (By Session drill-down)
      =================================================== */}

      {activeOverviewSlot && (
        <div
          className="fixed inset-0 z-[2147483646] grid place-items-center bg-[#071c1a]/70 p-5 backdrop-blur-sm"
          onClick={() => setActiveOverviewSlot(null)}
        >
          <div
            role="dialog"
            onClick={(e) => e.stopPropagation()}
            className="max-h-[85vh] w-full max-w-[640px] overflow-y-auto rounded-[24px] bg-[#f8faf8] p-7"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[.16em] text-[#a87943]">
                  {activeSessionTitle}
                </p>

                <h3 className="mt-1 font-serif text-2xl text-[#172420]">
                  {formatDate(activeOverviewSlot.bookingDate)} ·{" "}
                  {activeOverviewSlot.timeSlot}
                </h3>

                <p className="mt-1 text-xs text-[#85908b]">
                  {activeOverviewSlot.registrationCount}/
                  {activeOverviewSlot.capacity} booked ·{" "}
                  {activeOverviewSlot.isPaid
                    ? `₹${activeOverviewSlot.price}`
                    : "Free"}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setActiveOverviewSlot(null)}
                className="rounded-full p-1.5 text-[#66736d] hover:bg-white"
              >
                <X size={18} />
              </button>
            </div>

            {getSafeZoomUrl(activeOverviewSlot.zoomJoinUrl) ? (
              <a
                href={getSafeZoomUrl(activeOverviewSlot.zoomJoinUrl)!}
                target="_blank"
                rel="noreferrer"
                className="mt-5 flex items-center justify-center gap-2 rounded-xl bg-[#0b3b38] px-4 py-3 text-xs font-semibold text-white transition hover:bg-[#0e4a45]"
              >
                <Video size={15} />
                Join Zoom Meeting
                <ExternalLink size={13} />
              </a>
            ) : (
              <div className="mt-5 rounded-xl border border-[#e1e5e2] bg-white px-4 py-3 text-center text-[11px] text-[#85908b]">
                {activeOverviewSlot.zoomStatus === "creating"
                  ? "Zoom meeting is still being created for this slot."
                  : activeOverviewSlot.zoomStatus === "failed"
                    ? "Zoom meeting creation failed for this slot."
                    : "No Zoom meeting has been generated for this slot yet."}
              </div>
            )}

            <p className="mt-6 text-[10px] font-semibold uppercase tracking-[.15em] text-[#8c9792]">
              Registered ({activeOverviewSlot.registrations.length})
            </p>

            <div className="mt-3 space-y-3">
              {activeOverviewSlot.registrations.map((registration) => (
                <div
                  key={registration.id}
                  className="rounded-2xl border border-[#dde2de] bg-white p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="grid h-9 w-9 place-items-center rounded-full bg-[#eef2ee] text-[#40534c]">
                        <UserRound size={15} />
                      </div>

                      <div>
                        <p className="text-sm font-semibold text-[#172420]">
                          {registration.name}
                        </p>
                        <p className="text-[11px] text-[#85908b]">
                          {registration.email}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`rounded-full border px-2.5 py-1 text-[9px] font-bold uppercase tracking-wide ${statusClass(
                        registration.status,
                      )}`}
                    >
                      {registration.status}
                    </span>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-4 text-[11px] text-[#65716b]">
                    {registration.phone && (
                      <span className="inline-flex items-center gap-1.5">
                        <Phone size={12} />
                        {registration.phone}
                      </span>
                    )}

                    <span className="inline-flex items-center gap-1.5">
                      <Mail size={12} />
                      {registration.email}
                    </span>

                    {registration.paymentStatus === "paid" ? (
                      <span className="font-semibold text-[#19705f]">
                        Paid ₹{registration.amountPaid}
                      </span>
                    ) : registration.paymentStatus === "failed" ? (
                      <span className="font-semibold text-red-600">
                        Payment failed
                      </span>
                    ) : (
                      <span className="text-[#8a948f]">Free</span>
                    )}
                  </div>

                  {registration.message && (
                    <p className="mt-2 rounded-lg bg-[#f7f8f7] p-2.5 text-[11px] text-[#65716b]">
                      {registration.message}
                    </p>
                  )}
                </div>
              ))}

              {activeOverviewSlot.registrations.length === 0 && (
                <div className="rounded-2xl border border-[#dde2de] bg-white p-6 text-center text-xs text-[#85908b]">
                  No one has booked this slot yet.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

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
              {isLeadOnlySession(selectedBooking.sessionType) && (
                <div className="mb-4 flex items-center gap-2 rounded-2xl border border-[#e6dcc7] bg-[#fbf6ea] px-4 py-3">
                  <Phone size={14} className="text-[#a1782f]" />
                  <p className="text-[11px] font-semibold text-[#8c6438]">
                    This is a Discovery Call lead — no session is scheduled.
                    Follow up using the contact details below.
                  </p>
                </div>
              )}

              {needsAssignment(selectedBooking) && (
                <div className="mb-4 rounded-2xl border border-[#e6dcc7] bg-[#fffaf0] p-5">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-[#e6dcc7] bg-[#fbf6ea] px-2.5 py-1 text-[9px] font-bold uppercase tracking-[.08em] text-[#a1782f]">
                      Awaiting Assignment
                    </span>
                  </div>

                  <p className="mt-2 text-[11px] leading-5 text-[#7c8882]">
                    User&apos;s preferred date/time:{" "}
                    <strong className="text-[#31433c]">
                      {selectedBooking.preferredDate
                        ? formatDate(selectedBooking.preferredDate)
                        : "Not specified"}
                      {selectedBooking.preferredTimeSlot
                        ? ` · ${selectedBooking.preferredTimeSlot}`
                        : ""}
                    </strong>
                  </p>

                  {assigningBookingId === selectedBooking._id ? (
                    <div className="mt-4 space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[.1em] text-[#89948f]">
                            Date
                          </label>
                          <input
                            type="date"
                            min={todayKey}
                            value={assignDate}
                            onChange={(e) => setAssignDate(e.target.value)}
                            className="w-full rounded-xl border border-[#d9dfda] bg-white px-3.5 py-2.5 text-sm outline-none focus:border-[#0b3b38]/40"
                          />
                        </div>

                        <div>
                          <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[.1em] text-[#89948f]">
                            Time
                          </label>
                          <select
                            value={assignTime}
                            onChange={(e) => setAssignTime(e.target.value)}
                            className="w-full cursor-pointer rounded-xl border border-[#d9dfda] bg-white px-3.5 py-2.5 text-sm outline-none focus:border-[#0b3b38]/40"
                          >
                            <option value="">Select time</option>
                            {(config?.timeSlots || []).map((slotTime) => (
                              <option key={slotTime} value={slotTime}>
                                {slotTime}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {assignError && (
                        <p className="text-[11px] font-medium text-red-600">
                          {assignError}
                        </p>
                      )}

                      <div className="flex gap-2">
                        <button
                          type="button"
                          disabled={assignSaving}
                          onClick={() => void submitAssignSession(selectedBooking)}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-[#0b3b38] px-4 py-2.5 text-[11px] font-semibold text-white transition hover:bg-[#0e4a45] disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <CheckCircle2 size={13} />
                          {assignSaving ? "Confirming..." : "Confirm & Send Email"}
                        </button>

                        <button
                          type="button"
                          onClick={closeAssignForm}
                          className="rounded-xl border border-[#d9dfda] bg-white px-4 py-2.5 text-[11px] font-semibold text-[#3c4a44]"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => openAssignForm(selectedBooking)}
                      className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-[#0b3b38] px-4 py-2.5 text-[11px] font-semibold text-white transition hover:bg-[#0e4a45]"
                    >
                      <CalendarCheck2 size={13} />
                      Assign Session
                    </button>
                  )}
                </div>
              )}

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
                  value={
                    selectedBooking.bookingDate
                      ? formatDate(selectedBooking.bookingDate)
                      : "Not yet assigned"
                  }
                />

                <DetailCard
                  icon={Clock3}
                  label="Time"
                  value={
                    selectedBooking.timeSlot
                      ? `${selectedBooking.timeSlot} IST`
                      : "Not yet assigned"
                  }
                />
              </div>

              <div className="mt-4 grid grid-cols-2 gap-4 max-[560px]:grid-cols-1">
                <div className="rounded-2xl border border-[#dde2de] bg-white p-5">
                  <p className="text-[9px] uppercase tracking-[.15em] text-[#8c9792]">
                    Session Type
                  </p>

                  <p className="mt-2 text-sm font-semibold">
                    {selectedBooking.sessionType}
                  </p>
                </div>

                <div className="rounded-2xl border border-[#dde2de] bg-white p-5">
                  <p className="text-[9px] uppercase tracking-[.15em] text-[#8c9792]">
                    Payment
                  </p>

                  <div className="mt-2 flex items-center gap-2">
                    {selectedBooking.paymentStatus === "paid" ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-[#cfe5dd] bg-[#edf8f4] px-2.5 py-1 text-[9px] font-bold uppercase tracking-[.08em] text-[#19705f]">
                        Paid
                      </span>
                    ) : selectedBooking.paymentStatus === "failed" ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-red-100 bg-red-50 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[.08em] text-red-600">
                        Failed
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-[#e1e5e2] bg-[#f7f8f7] px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[.08em] text-[#8a948f]">
                        Free
                      </span>
                    )}

                    {typeof selectedBooking.amountPaid === "number" && (
                      <span className="text-sm font-semibold text-[#31433c]">
                        ₹{selectedBooking.amountPaid}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-4 overflow-hidden rounded-2xl border border-[#d7e2dd] bg-white">
  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#edf0ed] px-5 py-4">
    <div className="flex items-center gap-3">
      <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#edf6f3] text-[#17665a]">
        <Video size={17} />
      </div>

      <div>
        <p className="text-[9px] font-semibold uppercase tracking-[.15em] text-[#8c9792]">
          Online Session
        </p>

        <p className="mt-1 text-sm font-semibold text-[#31433c]">
          Zoom Meeting
        </p>
      </div>
    </div>

    {getSafeZoomUrl(
      selectedBooking.zoomJoinUrl,
    ) ? (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-[#cde4db] bg-[#edf8f4] px-3 py-1.5 text-[9px] font-bold uppercase tracking-[.08em] text-[#176d5c]">
        <span className="h-1.5 w-1.5 rounded-full bg-[#20977c]" />
        Scheduled
      </span>
    ) : selectedBooking.sessionType &&
      !/webinar/i.test(selectedBooking.sessionType) ? (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-[#e6dcc7] bg-[#fbf6ea] px-3 py-1.5 text-[9px] font-bold uppercase tracking-[.08em] text-[#a1782f]">
        <Phone size={10} />
        Handled by Call
      </span>
    ) : (
      <span className="rounded-full border border-[#e1e5e2] bg-[#f7f8f7] px-3 py-1.5 text-[9px] font-semibold uppercase tracking-[.08em] text-[#84908a]">
        Unavailable
      </span>
    )}
  </div>

  <div className="p-5">
    {selectedBooking.zoomMeetingId && (
      <div>
        <p className="text-[9px] font-semibold uppercase tracking-[.14em] text-[#919b96]">
          Meeting ID
        </p>

        <p className="mt-1.5 font-mono text-sm font-semibold text-[#354740]">
          {
            selectedBooking.zoomMeetingId
          }
        </p>
      </div>
    )}

    {getSafeZoomUrl(
      selectedBooking.zoomJoinUrl,
    ) ? (
      <>
        <div className="mt-4">
          <p className="text-[9px] font-semibold uppercase tracking-[.14em] text-[#919b96]">
            Meeting Link
          </p>

          <p className="mt-1.5 break-all text-xs leading-5 text-[#63706a]">
            {
              selectedBooking.zoomJoinUrl
            }
          </p>
        </div>

        <a
          href={
            getSafeZoomUrl(
              selectedBooking.zoomJoinUrl,
            )!
          }
          target="_blank"
          rel="noopener noreferrer"
          className="mt-5 inline-flex items-center justify-center gap-2 rounded-xl bg-[#0b3b38] px-5 py-3 text-xs font-semibold text-white transition hover:bg-[#124c47]"
        >
          <Video size={14} />

          Join Zoom Meeting

          <ExternalLink
            size={13}
          />
        </a>
      </>
    ) : selectedBooking.zoomJoinUrl ? (
      <div className="mt-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3">
        <p className="text-xs font-semibold text-red-700">
          Invalid Zoom meeting link
        </p>

        <p className="mt-1 text-[10px] leading-5 text-red-600">
          A meeting link exists in the
          booking record but could not be
          validated safely.
        </p>
      </div>
    ) : selectedBooking.sessionType &&
      !/webinar/i.test(selectedBooking.sessionType) ? (
      <div className="mt-4 rounded-xl border border-[#e1e5e2] bg-[#f8faf8] px-4 py-3">
        <p className="text-xs font-semibold text-[#68746e]">
          This session is handled over a phone call
        </p>

        <p className="mt-1 text-[10px] leading-5 text-[#8b9590]">
          Zoom is only used for Webinars. Call the
          client on{" "}
          {selectedBooking.phone || "the number on file"}{" "}
          at the scheduled time.
        </p>

        {selectedBooking.phone && (
          <a
            href={`tel:${selectedBooking.phone}`}
            className="mt-3 inline-flex items-center gap-2 rounded-xl bg-[#0b3b38] px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-[#124c47]"
          >
            <Phone size={13} />
            Call {selectedBooking.name.split(" ")[0]}
          </a>
        )}
      </div>
    ) : (
      <div className="mt-4 rounded-xl border border-[#e1e5e2] bg-[#f8faf8] px-4 py-3">
        <p className="text-xs font-semibold text-[#68746e]">
          Zoom meeting is not available
        </p>

        <p className="mt-1 text-[10px] leading-5 text-[#8b9590]">
          This may be an older booking
          created before Zoom integration.
        </p>
      </div>
    )}
  </div>
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


              <div className="mt-4 rounded-2xl border border-[#dde2de] bg-white p-5">
  <div className="flex flex-wrap items-start justify-between gap-4">
    <div>
      <p className="text-[9px] font-semibold uppercase tracking-[.15em] text-[#8c9792]">
        Confirmation Email
      </p>

      <p className="mt-2 text-sm font-semibold text-[#34463f]">
        Email delivery
      </p>
    </div>

    {selectedBooking.emailStatus ===
    "sent" ? (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-[#cde5db] bg-[#eef8f4] px-3 py-1.5 text-[9px] font-bold uppercase tracking-[.08em] text-[#1a735f]">
        <CheckCircle2 size={11} />
        Sent
      </span>
    ) : selectedBooking.emailStatus ===
      "failed" ? (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-red-100 bg-red-50 px-3 py-1.5 text-[9px] font-bold uppercase tracking-[.08em] text-red-600">
        <XCircle size={11} />
        Failed
      </span>
    ) : (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-[#eadfcf] bg-[#fff8ed] px-3 py-1.5 text-[9px] font-bold uppercase tracking-[.08em] text-[#996b35]">
        <Clock3 size={11} />
        Pending
      </span>
    )}
  </div>

  {selectedBooking.emailStatus ===
    "sent" && (
    <p className="mt-3 text-xs leading-5 text-[#718079]">
      Booking confirmation and Zoom
      meeting details were sent to{" "}
      <strong className="text-[#40534b]">
        {selectedBooking.email}
      </strong>
      .
    </p>
  )}

  {selectedBooking.emailStatus ===
    "failed" && (
    <div className="mt-3 rounded-xl border border-red-100 bg-red-50 px-4 py-3">
      <p className="text-xs font-semibold text-red-700">
        Confirmation email could not be
        delivered.
      </p>

      <p className="mt-1 text-[10px] leading-5 text-red-600">
        The booking and Zoom meeting are
        still valid. Contact the client
        manually if required.
      </p>

      {selectedBooking.emailLastError && (
        <p className="mt-2 break-words text-[10px] leading-5 text-red-500">
          {
            selectedBooking.emailLastError
          }
        </p>
      )}
    </div>
  )}

  {!selectedBooking.emailStatus && (
    <p className="mt-3 text-xs leading-5 text-[#818c87]">
      Email delivery status is not
      available for this booking.
    </p>
  )}
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