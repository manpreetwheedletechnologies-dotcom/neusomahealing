"use client";

import {
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";

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

export function AccountDashboard() {
  const router = useRouter();

  const { user, loading, signOut, setUser } =
    useUserAuth();

  const [tab, setTab] = useState<Tab>("overview");

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
      <main className="grid min-h-screen place-items-center bg-[#f6f7f4] text-xs text-[#76817c]">
        Loading your account…
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f6f7f4] px-5 py-12 max-[600px]:px-4">
      <div className="mx-auto w-full max-w-[1080px]">
        {/* HERO */}

        <section className="relative overflow-hidden rounded-[26px] bg-gradient-to-br from-[#0b3a37] via-[#0d4a44] to-[#123f3a] p-8 text-white max-[600px]:p-6">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[#c28b4d]/20 blur-3xl"
          />

          <div className="relative flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-[10px] uppercase tracking-[.22em] text-[#d2a873]">
                My Account
              </p>

              <h1 className="mt-3 font-serif text-[clamp(26px,4vw,40px)] leading-[1.1]">
                Hi, {user.name.split(" ")[0]}
              </h1>

              <p className="mt-2 text-xs text-[#afc2bc]">
                {user.email}
              </p>
            </div>

            <div className="flex items-center gap-2.5">
              <Link
                href="/book-session"
                className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2.5 text-xs font-bold text-[#0b3b38] transition hover:bg-[#eef5f1]"
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
                className="inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-white/10"
              >
                <LogOut size={14} />
                Sign out
              </button>
            </div>
          </div>
        </section>

        {/* TABS */}

        <nav className="mt-6 flex flex-wrap gap-2">
          {TABS.map((item) => {
            const active = tab === item.key;

            return (
              <button
                key={item.key}
                type="button"
                onClick={() => setTab(item.key)}
                className={`inline-flex items-center gap-2 rounded-full border px-4 py-2.5 text-xs font-semibold transition ${
                  active
                    ? "border-[#0b3b38] bg-[#0b3b38] text-white"
                    : "border-[#dce1dc] bg-white text-[#52605a] hover:bg-[#f2f5f2]"
                }`}
              >
                <item.icon size={14} />
                {item.label}

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
          <p className="mt-5 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-xs text-red-700">
            {error}
          </p>
        )}

        {dataLoading ? (
          <p className="mt-8 rounded-2xl border border-[#dce1dc] bg-white p-10 text-center text-xs text-[#7a8580]">
            Loading…
          </p>
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
      <section className="grid grid-cols-4 gap-4 max-[900px]:grid-cols-2 max-[440px]:grid-cols-1">
        {cards.map((card) => (
          <article
            key={card.label}
            className="rounded-2xl border border-[#dce1dc] bg-white p-5"
          >
            <div
              className={`grid h-10 w-10 place-items-center rounded-xl ${card.accent}`}
            >
              <card.icon size={18} />
            </div>

            <p className="mt-4 font-serif text-3xl text-[#172420]">
              {card.value}
            </p>

            <p className="mt-1 text-xs font-semibold text-[#5e6b65]">
              {card.label}
            </p>
          </article>
        ))}
      </section>

      <section className="mt-6 rounded-2xl border border-[#dce1dc] bg-white p-6">
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
        <section className="mt-6 rounded-2xl border border-[#e4cfaa] bg-[#fffaf1] p-6">
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
          className="rounded-2xl border border-[#dce1dc] bg-white p-6"
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
    <article className="rounded-xl border border-[#e7ebe6] bg-[#fbfcfa] p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
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
          className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold capitalize ${statusTone(
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
      <section className="rounded-2xl border border-[#dce1dc] bg-white p-10 text-center">
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
    <section className="overflow-hidden rounded-2xl border border-[#dce1dc] bg-white">
      <div className="flex items-center justify-between gap-3 border-b border-[#e7ebe6] px-6 py-4">
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
              <th className="px-6 py-3 font-semibold">
                Session
              </th>
              <th className="px-6 py-3 font-semibold">
                Date
              </th>
              <th className="px-6 py-3 font-semibold">
                Amount
              </th>
              <th className="px-6 py-3 font-semibold">
                Status
              </th>
              <th className="px-6 py-3 font-semibold">
                Reference
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-[#eef1ee] text-xs">
            {overview.payments.map((payment) => (
              <tr key={payment._id}>
                <td className="px-6 py-4 font-semibold text-[#172420]">
                  {payment.sessionType}
                </td>

                <td className="px-6 py-4 text-[#65716b]">
                  {formatDate(
                    payment.bookingDate,
                  )}
                </td>

                <td className="px-6 py-4 font-semibold text-[#172420]">
                  ₹{payment.amountPaid}
                </td>

                <td className="px-6 py-4">
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

                <td className="px-6 py-4 text-[10px] text-[#9aa39d]">
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
    <section className="rounded-2xl border border-[#dce1dc] bg-white">
      <div className="flex items-center justify-between gap-3 border-b border-[#e7ebe6] px-6 py-4">
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
        <p className="p-10 text-center text-xs text-[#87908c]">
          Nothing here yet. We&apos;ll let you know
          when a new session opens.
        </p>
      ) : (
        <ul className="divide-y divide-[#eef1ee]">
          {notifications.map((item) => (
            <li
              key={item._id}
              className={`flex gap-3 px-6 py-4 ${
                item.isRead
                  ? ""
                  : "bg-[#fbfaf5]"
              }`}
            >
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

              {item.link && (
                <Link
                  href={item.link}
                  className="shrink-0 self-center rounded-lg border border-[#dce1dc] px-3 py-1.5 text-[10px] font-semibold text-[#0b3b38] hover:bg-[#f2f5f2]"
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
    <div className="grid grid-cols-2 gap-6 max-[820px]:grid-cols-1">
      <form
        onSubmit={handleProfileSubmit}
        className="rounded-2xl border border-[#dce1dc] bg-white p-6"
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
        className="h-fit rounded-2xl border border-[#dce1dc] bg-white p-6"
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
