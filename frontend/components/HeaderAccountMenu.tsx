"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  BellRing,
  CalendarDays,
  CheckCheck,
  ChevronRight,
  UserRound,
} from "lucide-react";

import { useUserAuth } from "@/components/UserAuthProvider";
import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type UserNotification,
} from "@/lib/user-api";

function timeAgo(value: string) {
  const then = new Date(value).getTime();

  if (Number.isNaN(then)) return "";

  const diffMs = Date.now() - then;
  const minutes = Math.floor(diffMs / 60000);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;

  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
  }).format(then);
}

/*
 * Signed-out: a plain "Sign in" link.
 * Signed-in: a bell that opens a dropdown of recent
 * notifications right there — no page navigation
 * needed just to see what's new — plus a link to
 * the account dashboard.
 */
export function HeaderAccountMenu({
  isLight,
  onNavigate,
  variant = "desktop",
}: {
  isLight?: boolean;
  onNavigate?: () => void;
  variant?: "desktop" | "mobile";
}) {
  const { user, loading } = useUserAuth();

  const [notifications, setNotifications] = useState<
    UserNotification[]
  >([]);

  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [notifLoading, setNotifLoading] =
    useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  const loadNotifications = () => {
    if (!user) return;

    setNotifLoading(true);

    getNotifications()
      .then((data) => {
        setUnreadCount(data.unreadCount);
        setNotifications(
          data.notifications.slice(0, 6),
        );
      })
      .catch(() => {
        // Cosmetic feature — a failed fetch should
        // never surface to the visitor.
      })
      .finally(() => setNotifLoading(false));
  };

  useEffect(() => {
    if (!user) {
      setUnreadCount(0);
      setNotifications([]);
      return;
    }

    loadNotifications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Close on outside click.
  useEffect(() => {
    if (!open) return;

    function handleClick(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(
          event.target as Node,
        )
      ) {
        setOpen(false);
      }
    }

    document.addEventListener(
      "mousedown",
      handleClick,
    );

    return () =>
      document.removeEventListener(
        "mousedown",
        handleClick,
      );
  }, [open]);

  async function handleBellClick() {
    const next = !open;
    setOpen(next);

    if (next) loadNotifications();
  }

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
      // Non-critical.
    }
  }

  async function handleNotificationClick(
    item: UserNotification,
  ) {
    if (!item.isRead) {
      try {
        await markNotificationRead(item._id);

        setNotifications((current) =>
          current.map((n) =>
            n._id === item._id
              ? { ...n, isRead: true }
              : n,
          ),
        );

        setUnreadCount((count) =>
          Math.max(0, count - 1),
        );
      } catch {
        // Non-critical.
      }
    }

    setOpen(false);
  }

  // Avoid flashing "Sign in" before the session
  // check resolves.
  if (loading) {
    return null;
  }

  if (variant === "mobile") {
    return user ? (
      <Link
        href="/account"
        onClick={onNavigate}
        className="flex w-full items-center justify-center gap-2 rounded-full border border-ink/15 px-6 py-3.5 text-[15px] font-medium text-ink no-underline transition-colors hover:bg-ink/[0.04]"
      >
        <UserRound size={16} />
        My Account
        {unreadCount > 0 && (
          <span className="grid h-5 min-w-5 place-items-center rounded-full bg-[#c0392b] px-1.5 text-[10px] font-bold text-white">
            {unreadCount}
          </span>
        )}
      </Link>
    ) : (
      <Link
        href="/login"
        onClick={onNavigate}
        className="flex w-full items-center justify-center gap-2 rounded-full border border-ink/15 px-6 py-3.5 text-[15px] font-medium text-ink no-underline transition-colors hover:bg-ink/[0.04]"
      >
        <UserRound size={16} />
        Sign in
      </Link>
    );
  }

  if (!user) {
    return (
      <Link
        href="/login"
        className={[
          "hidden shrink-0 items-center gap-1.5 whitespace-nowrap text-sm no-underline transition-colors min-[901px]:inline-flex",
          isLight
            ? "text-cream hover:text-gold"
            : "text-ink hover:text-gold",
        ].join(" ")}
      >
        <UserRound size={15} />
        Sign in
      </Link>
    );
  }

  return (
    <div className="hidden shrink-0 items-center gap-3 min-[901px]:flex">
      <div
        ref={containerRef}
        className="relative"
      >
        <button
          type="button"
          onClick={handleBellClick}
          aria-label={
            unreadCount > 0
              ? `Notifications, ${unreadCount} unread`
              : "Notifications"
          }
          className={[
            "relative flex h-9 w-9 items-center justify-center rounded-full transition-colors",
            isLight
              ? "text-cream hover:bg-white/10"
              : "text-ink hover:bg-ink/[0.06]",
          ].join(" ")}
        >
          <BellRing size={17} />

          {unreadCount > 0 && (
            <span className="absolute right-1 top-1 grid h-4 min-w-4 place-items-center rounded-full bg-[#c0392b] px-1 text-[9px] font-bold text-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>

        {/* DROPDOWN */}
        <div
          className={[
            "absolute right-0 top-[calc(100%+12px)] z-[30000] w-[360px] origin-top-right rounded-[20px] border border-ink/10 bg-white shadow-[0_24px_60px_rgba(20,25,22,0.18)] transition-all duration-200",
            open
              ? "translate-y-0 opacity-100"
              : "pointer-events-none -translate-y-2 opacity-0",
          ].join(" ")}
        >
          <div className="flex items-center justify-between gap-3 border-b border-ink/[0.06] px-5 py-4">
            <p className="text-sm font-semibold text-ink">
              Notifications
            </p>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-gold hover:underline"
              >
                <CheckCheck size={12} />
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-[360px] overflow-y-auto">
            {notifLoading &&
            notifications.length === 0 ? (
              <p className="px-5 py-10 text-center text-xs text-ink/45">
                Loading…
              </p>
            ) : notifications.length === 0 ? (
              <div className="px-5 py-10 text-center">
                <BellRing
                  size={20}
                  className="mx-auto text-ink/20"
                />
                <p className="mt-3 text-xs text-ink/45">
                  You&apos;re all caught up.
                </p>
              </div>
            ) : (
              notifications.map((item) => (
                <Link
                  key={item._id}
                  href={item.link || "/account"}
                  onClick={() =>
                    void handleNotificationClick(
                      item,
                    )
                  }
                  className={[
                    "flex gap-3 border-b border-ink/[0.05] px-5 py-3.5 text-left no-underline transition-colors last:border-b-0 hover:bg-ink/[0.025]",
                    item.isRead
                      ? ""
                      : "bg-gold/[0.05]",
                  ].join(" ")}
                >
                  <span
                    className={[
                      "mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full",
                      item.isRead
                        ? "bg-transparent"
                        : "bg-gold",
                    ].join(" ")}
                  />

                  <span className="min-w-0 flex-1">
                    <span className="block text-xs font-semibold leading-5 text-ink">
                      {item.title}
                    </span>

                    {item.body && (
                      <span className="mt-0.5 block truncate text-[11px] leading-4 text-ink/55">
                        {item.body}
                      </span>
                    )}

                    <span className="mt-1 block text-[10px] text-ink/35">
                      {timeAgo(item.createdAt)}
                    </span>
                  </span>

                  <ChevronRight
                    size={13}
                    className="mt-1 shrink-0 text-ink/25"
                  />
                </Link>
              ))
            )}
          </div>

          <Link
            href="/account?tab=notifications"
            onClick={() => setOpen(false)}
            className="flex items-center justify-center gap-1.5 rounded-b-[20px] border-t border-ink/[0.06] bg-[#faf9f6] py-3 text-[11px] font-semibold text-ink/70 no-underline transition-colors hover:bg-ink/[0.04]"
          >
            <CalendarDays size={12} />
            View all in My Account
          </Link>
        </div>
      </div>

      <Link
        href="/account"
        className={[
          "inline-flex items-center gap-1.5 whitespace-nowrap text-sm no-underline transition-colors",
          isLight
            ? "text-cream hover:text-gold"
            : "text-ink hover:text-gold",
        ].join(" ")}
      >
        <UserRound size={15} />
        {user.name.split(" ")[0]}
      </Link>
    </div>
  );
}
