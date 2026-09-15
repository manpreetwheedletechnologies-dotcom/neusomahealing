"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BellRing, UserRound } from "lucide-react";

import { useUserAuth } from "@/components/UserAuthProvider";
import { getNotifications } from "@/lib/user-api";

/*
 * Signed-out: a plain "Sign in" link.
 * Signed-in: notification bell with unread badge
 * plus a link through to the account dashboard.
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

  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) {
      setUnreadCount(0);
      return;
    }

    let active = true;

    getNotifications()
      .then((data) => {
        if (active)
          setUnreadCount(data.unreadCount);
      })
      .catch(() => {
        // Badge is cosmetic — a failure here should
        // never surface to the visitor.
      });

    return () => {
      active = false;
    };
  }, [user]);

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
      <Link
        href="/account"
        aria-label={
          unreadCount > 0
            ? `Notifications, ${unreadCount} unread`
            : "Notifications"
        }
        className={[
          "relative transition-colors",
          isLight
            ? "text-cream hover:text-gold"
            : "text-ink hover:text-gold",
        ].join(" ")}
      >
        <BellRing size={17} />

        {unreadCount > 0 && (
          <span className="absolute -right-1.5 -top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-[#c0392b] px-1 text-[9px] font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </Link>

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
