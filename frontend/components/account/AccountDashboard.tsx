"use client";

import {
  FormEvent,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import Link from "next/link";
import {
  useRouter,
  useSearchParams,
} from "next/navigation";

import {
  BellRing,
  CalendarClock,
  CalendarDays,
  CheckCircle2,
  Clock3,
  CreditCard,
  Hourglass,
  LogOut,
  ReceiptText,
  ShieldCheck,
  Sparkles,
  UserRound,
  Video,
  Wallet,
} from "lucide-react";

import { useUserAuth } from "@/components/UserAuthProvider";

import {
  changePassword,
  getAccountOverview,
  getNotifications,
  markAllNotificationsRead,
  updateProfile,
  type AccountOverview,
  type MyBooking,
  type UserNotification,
} from "@/lib/user-api";

type Tab =
  | "overview"
  | "sessions"
  | "payments"
  | "notifications"
  | "profile";

const TABS: { key: Tab; label: string; icon: any }[] =
  [
    {
      key: "overview",
      label: "Overview",
      icon: CalendarClock,
    },
    {
      key: "sessions",
      label: "My Sessions",
      icon: CalendarDays,
    },
    {
      key: "payments",
      label: "Payments",
      icon: CreditCard,
    },
    {
      key: "notifications",
      label: "Notifications",
      icon: BellRing,
    },
    {
      key: "profile",
      label: "Profile",
      icon: UserRound,
    },
  ];

function formatDate(value?: string) {
  if (!value) return "—";

  const [year, month, day] = value
    .split("-")
    .map(Number);

  const date = new Date(
    Date.UTC(year, month - 1, day),
  );

  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

function formatDateTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function statusTone(status: MyBooking["status"]) {
  switch (status) {
    case "confirmed":
      return "bg-[#e9f6ef] text-[#2f7a51]";
    case "completed":
      return "bg-[#eef2f7] text-[#4a5b74]";
    case "cancelled":
      return "bg-[#fdeeee] text-[#a8443f]";
    default:
      return "bg-[#fdf4e7] text-[#9a6d31]";
  }
}

function statusBar(status: MyBooking["status"]) {
  switch (status) {
    case "confirmed":
      return "bg-[#3b7a4f]";
    case "completed":
      return "bg-[#5f7392]";
    case "cancelled":
      return "bg-[#a8443f]";
    default:
      return "bg-[#c28b4d]";
  }
}

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) return "?";
  if (parts.length === 1)
    return parts[0].slice(0, 2).toUpperCase();

  return (
    parts[0][0] + parts[parts.length - 1][0]
  ).toUpperCase();
}

function formatMemberSince(value: string | null) {
  if (!value) return null;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  return new Intl.DateTimeFormat("en-IN", {
    month: "short",
    year: "numeric",
  }).format(date);
}

export function AccountDashboard() {
  return (
    <Suspense
      fallback={
        <main className="grid min-h-screen place-items-center bg-[#f6f7f4] px-4 text-center text-xs text-[#76817c]">
          Loading your account…
        </main>
      }
    >
      <AccountDashboardInner />
    </Suspense>
  );
}

function AccountDashboardInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const { user, loading, signOut, setUser } =
    useUserAuth();

  const initialTab = useMemo<Tab>(() => {
    const requested = searchParams.get("tab");
    return TABS.some((item) => item.key === requested)
      ? (requested as Tab)
      : "overview";
  }, [searchParams]);

  const [tab, setTab] = useState<Tab>(initialTab);

  const [overview, setOverview] =
    useState<AccountOverview | null>(null);

  const [notifications, setNotifications] =
    useState<UserNotification[]>([]);

  const [unreadCount, setUnreadCount] = useState(0);

  const [dataLoading, setDataLoading] =
    useState(true);

  const [error, setError] = useState("");

  /*
   * Anyone who isn't signed in has no account to
   * show — bounce them to sign-in and come back
   * here afterwards.
   */
  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login?next=/account");
    }
  }, [loading, user, router]);

  const loadData = useCallback(async () => {
    setDataLoading(true);
    setError("");

    try {
      const [overviewData, notificationData] =
        await Promise.all([
          getAccountOverview(),
          getNotifications(),
        ]);

      setOverview(overviewData);
      setNotifications(
        notificationData.notifications,
      );
      setUnreadCount(
        notificationData.unreadCount,
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load your account right now.",
      );
    } finally {
      setDataLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) void loadData();
  }, [user, loadData]);

  async function handleMarkAllRead() {
    try {
      await markAllNotificationsRead();

      setNotifications((current) =>
        current.map((item) => ({
          ...item,
          isRead: true,
        })),
      );

      setUnreadCount(0);
    } catch {
      // Non-critical — the badge simply stays until
      // the next load.
    }
  }

  if (loading || !user) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#f6f7f4] px-4 text-center text-xs text-[#76817c]">
        Loading your account…
      </main>
    );
  }

  const memberSince = formatMemberSince(
    user.createdAt || null,
  );

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#fbfaf6,#f2f4f0_60%)] px-4 py-8 sm:px-5 sm:py-12">
      <div className="mx-auto mt-[25%] w-full max-w-[1080px] sm:mt-16 lg:mt-16">
        {/* HERO */}

        <section className="relative overflow-hidden rounded-[22px] bg-gradient-to-br from-[#0b3a37] via-[#0d4a44] to-[#123f3a] p-5 text-white shadow-[0_30px_70px_-20px_rgba(11,58,55,.45)] sm:rounded-[28px] sm:p-7 md:p-9">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-24 -top-28 h-80 w-80 rounded-full bg-[#c28b4d]/25 blur-[90px]"
          />

          <div
            aria-hidden
            className="pointer-events-none absolute -bottom-32 left-1/4 h-72 w-72 rounded-full bg-white/[0.06] blur-[90px]"
          />

          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-[0.04] [background-image:radial-gradient(#fff_1px,transparent_1px)] [background-size:22px_22px]"
          />

          <div className="relative flex flex-col items-start gap-6 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-white/15 bg-white/10 font-serif text-lg backdrop-blur-sm sm:h-16 sm:w-16 sm:text-2xl">
                {getInitials(user.name)}
              </div>

              <div className="min-w-0">
                <p className="flex items-center gap-1.5 text-[10px] uppercase tracking-[.22em] text-[#d2a873]">
                  <Sparkles size={11} />
                  My Account
                </p>

                <h1 className="mt-2 break-words font-serif text-[clamp(22px,6vw,36px)] leading-[1.1]">
                  Hi, {user.name.split(" ")[0]}
                </h1>

                <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-[#afc2bc]">
                  <span className="break-all">{user.email}</span>

                  {memberSince && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/5 px-2.5 py-1 text-[10px] font-semibold text-[#cfe0d8]">
                      <ShieldCheck size={11} />
                      Member since {memberSince}
                    </span>
                  )}
                </p>
              </div>
            </div>

            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center sm:gap-2.5">
              <Link
                href="/book-session"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-4 py-2.5 text-xs font-bold text-[#0b3b38] shadow-[0_8px_20px_rgba(0,0,0,.15)] transition hover:-translate-y-0.5 hover:bg-[#eef5f1]"
              >
                <CalendarDays size={14} />
                Book a session
              </Link>

              <button
                type="button"
                onClick={async () => {
                  await signOut();
                  router.replace("/");
                }}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-white/20 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-white/10"
              >
                <LogOut size={14} />
                Sign out
              </button>
            </div>
          </div>
        </section>

        {/* TABS */}

        <nav className="sticky top-0 z-20 mt-5 -mx-4 flex gap-1.5 overflow-x-auto border-b border-[#e2e6e2] bg-white/95 px-4 py-2.5 shadow-[0_10px_30px_rgba(37,56,49,.06)] backdrop-blur-md [scrollbar-width:none] sm:mx-0 sm:mt-6 sm:flex-wrap sm:overflow-visible sm:rounded-full sm:border sm:border-[#e2e6e2] sm:p-1.5 sm:[scrollbar-width:auto] [&::-webkit-scrollbar]:hidden">
          {TABS.map((item) => {
            const active = tab === item.key;

            return (
              <button
                key={item.key}
                type="button"
                onClick={() => setTab(item.key)}
                className={`relative inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-full px-3.5 py-2.5 text-xs font-semibold transition-all duration-200 sm:flex-1 sm:px-4 ${
                  active
                    ? "bg-[#0b3b38] text-white shadow-[0_6px_16px_rgba(11,59,56,.28)]"
                    : "text-[#52605a] hover:bg-[#f2f5f2]"
                }`}
              >
                <item.icon size={14} />
                <span className="hidden xs:inline sm:inline">
                  {item.label}
                </span>

                {item.key === "notifications" &&
                  unreadCount > 0 && (
                    <span
                      className={`grid h-4 min-w-4 place-items-center rounded-full px-1 text-[9px] font-bold ${
                        active
                          ? "bg-white text-[#0b3b38]"
                          : "bg-[#c0392b] text-white"
                      }`}
                    >
                      {unreadCount}
                    </span>
                  )}
              </button>
            );
          })}
        </nav>

        {error && (
          <p className="mt-5 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-xs text-red-700">
            {error}
          </p>
        )}

        {dataLoading ? (
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-[100px] animate-pulse rounded-2xl border border-[#e7ebe6] bg-white/70 sm:h-[118px]"
              />
            ))}
          </div>
        ) : (
          <div className="mt-6">
            {tab === "overview" && (
              <OverviewTab
                overview={overview}
                onSeeAll={() =>
                  setTab("sessions")
                }
              />
            )}

            {tab === "sessions" && (
              <SessionsTab overview={overview} />
            )}

            {tab === "payments" && (
              <PaymentsTab overview={overview} />
            )}

            {tab === "notifications" && (
              <NotificationsTab
                notifications={notifications}
                unreadCount={unreadCount}
                onMarkAllRead={handleMarkAllRead}
              />
            )}

            {tab === "profile" && (
              <ProfileTab
                onUpdated={(updated) =>
                  setUser(updated)
                }
              />
            )}
          </div>
        )}
      </div>
    </main>
  );
}

/* =========================================================
   OVERVIEW
========================================================= */

function OverviewTab({
  overview,
  onSeeAll,
}: {
  overview: AccountOverview | null;
  onSeeAll: () => void;
}) {
  if (!overview) return null;

  const cards = [
    {
      label: "Total bookings",
      value: overview.stats.totalBookings,
      icon: CalendarDays,
      accent: "bg-[#eef5f1] text-[#0d4a44]",
    },
    {
      label: "Upcoming",
      value: overview.stats.upcoming,
      icon: CalendarClock,
      accent: "bg-[#eaf1fb] text-[#2d5e94]",
    },
    {
      label: "Completed",
      value: overview.stats.completed,
      icon: CheckCircle2,
      accent: "bg-[#eef5ee] text-[#3b7a4f]",
    },
    {
      label: "Total paid",
      value: `₹${overview.stats.totalPaid}`,
      icon: Wallet,
      accent: "bg-[#fdf6e6] text-[#9a752b]",
    },
  ];

  const nextUp = overview.upcoming[0];

  return (
    <>
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
        {cards.map((card) => (
          <article
            key={card.label}
            className="group rounded-2xl border border-[#dce1dc] bg-white p-4 shadow-[0_8px_24px_rgba(37,56,49,.04)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_16px_36px_rgba(37,56,49,.1)] sm:p-5"
          >
            <div
              className={`grid h-10 w-10 place-items-center rounded-xl transition-transform duration-200 group-hover:scale-105 sm:h-11 sm:w-11 ${card.accent}`}
            >
              <card.icon size={18} />
            </div>

            <p className="mt-3 font-serif text-2xl text-[#172420] sm:mt-4 sm:text-3xl">
              {card.value}
            </p>

            <p className="mt-1 text-[11px] font-semibold text-[#5e6b65] sm:text-xs">
              {card.label}
            </p>
          </article>
        ))}
      </section>

      <section className="mt-6 rounded-2xl border border-[#dce1dc] bg-white p-4 shadow-[0_8px_24px_rgba(37,56,49,.04)] sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-semibold uppercase tracking-[.1em] text-[#5e6b65]">
            Next session
          </p>

          <button
            type="button"
            onClick={onSeeAll}
            className="text-[11px] font-semibold text-[#a87843] hover:underline"
          >
            See all
          </button>
        </div>

        {nextUp ? (
          <div className="mt-4">
            <BookingCard booking={nextUp} />
          </div>
        ) : (
          <p className="mt-4 text-xs text-[#87908c]">
            You have no upcoming sessions.{" "}
            <Link
              href="/book-session"
              className="font-semibold text-[#a87843] hover:underline"
            >
              Book one now
            </Link>
            .
          </p>
        )}
      </section>

      {overview.awaitingSchedule.length > 0 && (
        <section className="mt-6 rounded-2xl border border-[#e4cfaa] bg-[#fffaf1] p-4 shadow-[0_8px_24px_rgba(154,109,49,.06)] sm:p-6">
          <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[.1em] text-[#9a6d31]">
            <Hourglass size={13} />
            Awaiting a date
          </p>

          <p className="mt-2 text-[11px] leading-5 text-[#9d8462]">
            You&apos;ve requested these sessions.
            We&apos;ll confirm a date and time with
            you shortly.
          </p>

          <div className="mt-4 space-y-3">
            {overview.awaitingSchedule.map(
              (booking) => (
                <BookingCard
                  key={booking._id}
                  booking={booking}
                />
              ),
            )}
          </div>
        </section>
      )}
    </>
  );
}

/* =========================================================
   SESSIONS
========================================================= */

function SessionsTab({
  overview,
}: {
  overview: AccountOverview | null;
}) {
  if (!overview) return null;

  const groups = [
    {
      title: "Upcoming",
      items: overview.upcoming,
      empty: "No upcoming sessions.",
    },
    {
      title: "Awaiting a date",
      items: overview.awaitingSchedule,
      empty: "Nothing awaiting scheduling.",
    },
    {
      title: "Past sessions",
      items: overview.past,
      empty: "No past sessions yet.",
    },
  ];

  return (
    <div className="space-y-6">
      {groups.map((group) => (
        <section
          key={group.title}
          className="rounded-2xl border border-[#dce1dc] bg-white p-4 shadow-[0_8px_24px_rgba(37,56,49,.04)] sm:p-6"
        >
          <p className="text-xs font-semibold uppercase tracking-[.1em] text-[#5e6b65]">
            {group.title}
            <span className="ml-2 font-normal text-[#9aa39d]">
              ({group.items.length})
            </span>
          </p>

          {group.items.length === 0 ? (
            <p className="mt-3 text-xs text-[#87908c]">
              {group.empty}
            </p>
          ) : (
            <div className="mt-4 space-y-3">
              {group.items.map((booking) => (
                <BookingCard
                  key={booking._id}
                  booking={booking}
                />
              ))}
            </div>
          )}
        </section>
      ))}
    </div>
  );
}

function BookingCard({
  booking,
}: {
  booking: MyBooking;
}) {
  const hasDate = !!booking.bookingDate;

  return (
    <article className="group relative overflow-hidden rounded-xl border border-[#e7ebe6] bg-[#fbfcfa] p-4 pl-5 transition-shadow hover:shadow-[0_6px_20px_rgba(37,56,49,.06)]">
      <span
        className={`absolute left-0 top-0 h-full w-1 ${statusBar(
          booking.status,
        )}`}
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="font-serif text-base text-[#172420]">
            {booking.sessionType}
          </p>

          <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-[#76817c]">
            <span className="inline-flex items-center gap-1">
              <CalendarDays size={11} />
              {hasDate
                ? formatDate(booking.bookingDate)
                : booking.preferredDate
                  ? `Requested: ${formatDate(booking.preferredDate)}`
                  : "Date to be confirmed"}
            </span>

            {(booking.timeSlot ||
              booking.preferredTimeSlot) && (
              <span className="inline-flex items-center gap-1">
                <Clock3 size={11} />
                {booking.timeSlot ||
                  booking.preferredTimeSlot}
              </span>
            )}

            {booking.bookingMode && (
              <span className="capitalize">
                {booking.bookingMode}
              </span>
            )}
          </p>
        </div>

        <span
          className={`inline-flex w-fit shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold capitalize ${statusTone(
            booking.status,
          )}`}
        >
          {booking.status}
        </span>
      </div>

      {(booking.zoomJoinUrl ||
        booking.paymentStatus === "paid") && (
        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-[#e7ebe6] pt-3">
          {booking.zoomJoinUrl && (
            <a
              href={booking.zoomJoinUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#0b3b38] px-3 py-2 text-[10px] font-bold text-white transition hover:bg-[#124c47]"
            >
              <Video size={12} />
              Join session
            </a>
          )}

          {booking.paymentStatus === "paid" && (
            <span className="inline-flex items-center gap-1 rounded-lg bg-[#eef5f1] px-2.5 py-2 text-[10px] font-semibold text-[#0d4a44]">
              <CheckCircle2 size={11} />
              Paid ₹{booking.amountPaid || 0}
            </span>
          )}
        </div>
      )}
    </article>
  );
}

/* =========================================================
   PAYMENTS
========================================================= */

function PaymentsTab({
  overview,
}: {
  overview: AccountOverview | null;
}) {
  if (!overview) return null;

  if (overview.payments.length === 0) {
    return (
      <section className="rounded-2xl border border-[#dce1dc] bg-white p-8 text-center shadow-[0_8px_24px_rgba(37,56,49,.04)] sm:p-10">
        <ReceiptText
          size={22}
          className="mx-auto text-[#c7cec9]"
        />

        <p className="mt-3 text-xs text-[#87908c]">
          No payments yet. Free sessions won&apos;t
          appear here.
        </p>
      </section>
    );
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-[#dce1dc] bg-white shadow-[0_8px_24px_rgba(37,56,49,.04)]">
      <div className="flex flex-col gap-1.5 border-b border-[#e7ebe6] bg-[#fbfcfa] px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-3 sm:px-6">
        <p className="text-xs font-semibold uppercase tracking-[.1em] text-[#5e6b65]">
          Payment history
        </p>

        <p className="text-xs font-semibold text-[#172420]">
          Total paid: ₹
          {overview.stats.totalPaid}
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[620px] text-left">
          <thead className="bg-[#fbfcfa] text-[10px] uppercase tracking-[.1em] text-[#8b948e]">
            <tr>
              <th className="px-4 py-3 font-semibold sm:px-6">
                Session
              </th>
              <th className="px-4 py-3 font-semibold sm:px-6">
                Date
              </th>
              <th className="px-4 py-3 font-semibold sm:px-6">
                Amount
              </th>
              <th className="px-4 py-3 font-semibold sm:px-6">
                Status
              </th>
              <th className="px-4 py-3 font-semibold sm:px-6">
                Reference
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-[#eef1ee] text-xs">
            {overview.payments.map((payment) => (
              <tr key={payment._id}>
                <td className="px-4 py-4 font-semibold text-[#172420] sm:px-6">
                  {payment.sessionType}
                </td>

                <td className="px-4 py-4 text-[#65716b] sm:px-6">
                  {formatDate(
                    payment.bookingDate,
                  )}
                </td>

                <td className="px-4 py-4 font-semibold text-[#172420] sm:px-6">
                  ₹{payment.amountPaid}
                </td>

                <td className="px-4 py-4 sm:px-6">
                  <span
                    className={`rounded-full px-2.5 py-1 text-[10px] font-bold capitalize ${
                      payment.paymentStatus ===
                      "paid"
                        ? "bg-[#e9f6ef] text-[#2f7a51]"
                        : "bg-[#fdeeee] text-[#a8443f]"
                    }`}
                  >
                    {payment.paymentStatus}
                  </span>
                </td>

                <td className="px-4 py-4 text-[10px] text-[#9aa39d] sm:px-6">
                  {payment.razorpayPaymentId ||
                    "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

/* =========================================================
   NOTIFICATIONS
========================================================= */

function NotificationsTab({
  notifications,
  unreadCount,
  onMarkAllRead,
}: {
  notifications: UserNotification[];
  unreadCount: number;
  onMarkAllRead: () => void;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-[#dce1dc] bg-white shadow-[0_8px_24px_rgba(37,56,49,.04)]">
      <div className="flex items-center justify-between gap-3 border-b border-[#e7ebe6] bg-[#fbfcfa] px-4 py-4 sm:px-6">
        <p className="text-xs font-semibold uppercase tracking-[.1em] text-[#5e6b65]">
          Notifications
        </p>

        {unreadCount > 0 && (
          <button
            type="button"
            onClick={onMarkAllRead}
            className="text-[11px] font-semibold text-[#a87843] hover:underline"
          >
            Mark all as read
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <p className="p-8 text-center text-xs text-[#87908c] sm:p-10">
          Nothing here yet. We&apos;ll let you know
          when a new session opens.
        </p>
      ) : (
        <ul className="divide-y divide-[#eef1ee]">
          {notifications.map((item) => (
            <li
              key={item._id}
              className={`flex flex-col gap-2 px-4 py-4 sm:flex-row sm:gap-3 sm:px-6 ${
                item.isRead
                  ? ""
                  : "bg-[#fbfaf5]"
              }`}
            >
              <div className="flex gap-3">
                <span
                  className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                    item.isRead
                      ? "bg-transparent"
                      : "bg-[#c28b4d]"
                  }`}
                />

                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-[#172420]">
                    {item.title}
                  </p>

                  {item.body && (
                    <p className="mt-1 text-[11px] leading-5 text-[#76817c]">
                      {item.body}
                    </p>
                  )}

                  <p className="mt-1.5 text-[10px] text-[#9aa39d]">
                    {formatDateTime(item.createdAt)}
                  </p>
                </div>
              </div>

              {item.link && (
                <Link
                  href={item.link}
                  className="w-fit shrink-0 self-start rounded-lg border border-[#dce1dc] px-3 py-1.5 text-[10px] font-semibold text-[#0b3b38] hover:bg-[#f2f5f2] sm:self-center"
                >
                  View
                </Link>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/* =========================================================
   PROFILE
========================================================= */

function ProfileTab({
  onUpdated,
}: {
  onUpdated: (user: any) => void;
}) {
  const { user } = useUserAuth();

  const [name, setName] = useState(
    user?.name || "",
  );

  const [phone, setPhone] = useState(
    user?.phone || "",
  );

  const [notify, setNotify] = useState(
    user?.notifyNewSessions ?? true,
  );

  const [profileMessage, setProfileMessage] =
    useState("");

  const [profileError, setProfileError] =
    useState("");

  const [savingProfile, setSavingProfile] =
    useState(false);

  const [currentPassword, setCurrentPassword] =
    useState("");

  const [newPassword, setNewPassword] =
    useState("");

  const [passwordMessage, setPasswordMessage] =
    useState("");

  const [passwordError, setPasswordError] =
    useState("");

  const [savingPassword, setSavingPassword] =
    useState(false);

  async function handleProfileSubmit(
    event: FormEvent,
  ) {
    event.preventDefault();

    setSavingProfile(true);
    setProfileMessage("");
    setProfileError("");

    try {
      const updated = await updateProfile({
        name: name.trim(),
        phone: phone.trim() || undefined,
        notifyNewSessions: notify,
      });

      onUpdated(updated);
      setProfileMessage("Profile updated.");
    } catch (err) {
      setProfileError(
        err instanceof Error
          ? err.message
          : "Unable to update your profile.",
      );
    } finally {
      setSavingProfile(false);
    }
  }

  async function handlePasswordSubmit(
    event: FormEvent,
  ) {
    event.preventDefault();

    setSavingPassword(true);
    setPasswordMessage("");
    setPasswordError("");

    try {
      await changePassword({
        currentPassword,
        newPassword,
      });

      setPasswordMessage(
        "Password updated. Other devices have been signed out.",
      );

      setCurrentPassword("");
      setNewPassword("");
    } catch (err) {
      setPasswordError(
        err instanceof Error
          ? err.message
          : "Unable to update your password.",
      );
    } finally {
      setSavingPassword(false);
    }
  }

  const inputClass =
    "w-full rounded-xl border border-[#d9dfda] bg-[#fbfcfa] px-4 py-3 text-sm outline-none focus:border-[#a87843]";

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <form
        onSubmit={handleProfileSubmit}
        className="rounded-2xl border border-[#dce1dc] bg-white p-4 shadow-[0_8px_24px_rgba(37,56,49,.04)] sm:p-6"
      >
        <p className="text-xs font-semibold uppercase tracking-[.1em] text-[#5e6b65]">
          Your details
        </p>

        <div className="mt-5 space-y-4">
          <label className="block">
            <span className="mb-1.5 block text-[11px] font-semibold text-[#46534e]">
              Full name
            </span>

            <input
              required
              minLength={2}
              value={name}
              onChange={(event) =>
                setName(event.target.value)
              }
              className={inputClass}
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-[11px] font-semibold text-[#46534e]">
              Email
            </span>

            <input
              disabled
              value={user?.email || ""}
              className={`${inputClass} cursor-not-allowed opacity-60`}
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-[11px] font-semibold text-[#46534e]">
              Phone
            </span>

            <input
              value={phone}
              onChange={(event) =>
                setPhone(event.target.value)
              }
              placeholder="+91 98765 43210"
              className={inputClass}
            />
          </label>

          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-[#e7ebe6] bg-[#fbfcfa] px-4 py-3.5">
            <input
              type="checkbox"
              checked={notify}
              onChange={(event) =>
                setNotify(event.target.checked)
              }
              className="mt-0.5 h-4 w-4 accent-[#0d4a44]"
            />

            <span>
              <span className="block text-xs font-semibold text-[#46534e]">
                Email me about new sessions
              </span>

              <span className="mt-0.5 block text-[10px] leading-4 text-[#87908c]">
                In-app notifications stay on
                either way.
              </span>
            </span>
          </label>
        </div>

        {profileError && (
          <p className="mt-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-xs text-red-700">
            {profileError}
          </p>
        )}

        {profileMessage && (
          <p className="mt-4 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-xs text-emerald-700">
            {profileMessage}
          </p>
        )}

        <button
          type="submit"
          disabled={savingProfile}
          className="mt-5 w-full rounded-xl bg-[#0b3b38] py-3.5 text-xs font-bold text-white transition hover:bg-[#124c47] disabled:opacity-60"
        >
          {savingProfile
            ? "Saving…"
            : "Save changes"}
        </button>
      </form>

      <form
        onSubmit={handlePasswordSubmit}
        className="h-fit rounded-2xl border border-[#dce1dc] bg-white p-4 shadow-[0_8px_24px_rgba(37,56,49,.04)] sm:p-6"
      >
        <p className="text-xs font-semibold uppercase tracking-[.1em] text-[#5e6b65]">
          Change password
        </p>

        <div className="mt-5 space-y-4">
          <label className="block">
            <span className="mb-1.5 block text-[11px] font-semibold text-[#46534e]">
              Current password
            </span>

            <input
              required
              type="password"
              autoComplete="current-password"
              value={currentPassword}
              onChange={(event) =>
                setCurrentPassword(
                  event.target.value,
                )
              }
              className={inputClass}
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-[11px] font-semibold text-[#46534e]">
              New password
            </span>

            <input
              required
              minLength={8}
              type="password"
              autoComplete="new-password"
              value={newPassword}
              onChange={(event) =>
                setNewPassword(event.target.value)
              }
              placeholder="At least 8 characters"
              className={inputClass}
            />
          </label>
        </div>

        {passwordError && (
          <p className="mt-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-xs text-red-700">
            {passwordError}
          </p>
        )}

        {passwordMessage && (
          <p className="mt-4 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-xs text-emerald-700">
            {passwordMessage}
          </p>
        )}

        <button
          type="submit"
          disabled={savingPassword}
          className="mt-5 w-full rounded-xl border border-[#0b3b38] py-3.5 text-xs font-bold text-[#0b3b38] transition hover:bg-[#f2f5f2] disabled:opacity-60"
        >
          {savingPassword
            ? "Updating…"
            : "Update password"}
        </button>
      </form>
    </div>
  );
}