"use client";

import { FormEvent, useState } from "react";
import { Eye, EyeOff, Lock, Mail, UserRound, X } from "lucide-react";

import { useUserAuth } from "@/components/UserAuthProvider";

type Mode = "signin" | "signup";

/*
 * Shown right on the booking page when an
 * unauthenticated visitor tries to confirm a
 * booking — keeps every field they've already
 * filled in intact (this is just an overlay, the
 * wizard underneath never unmounts) and resumes
 * the booking automatically the moment they're
 * signed in.
 */
export function BookingAuthModal({
  defaultEmail,
  onClose,
  onAuthenticated,
}: {
  defaultEmail?: string;
  onClose: () => void;
  onAuthenticated: () => void;
}) {
  const { signIn, signUp } = useUserAuth();

  const [mode, setMode] = useState<Mode>("signin");

  const [name, setName] = useState("");
  const [email, setEmail] = useState(
    defaultEmail || "",
  );
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] =
    useState(false);

  const [error, setError] = useState("");
  const [submitting, setSubmitting] =
    useState(false);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setSubmitting(true);
    setError("");

    try {
      if (mode === "signin") {
        await signIn({
          email: email.trim().toLowerCase(),
          password,
        });
      } else {
        if (password.length < 8) {
          setError(
            "Password must be at least 8 characters long.",
          );

          setSubmitting(false);
          return;
        }

        await signUp({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password,
          phone: phone.trim() || undefined,
        });
      }

      onAuthenticated();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  const inputClass =
    "w-full rounded-xl border border-ink/15 bg-[#fbfaf6] py-3 pl-10 pr-4 text-sm outline-none transition focus:border-gold";

  return (
    <div
      className="fixed inset-0 z-[24000] grid place-items-center bg-ink/50 px-5 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        onClick={(event) => event.stopPropagation()}
        className="relative w-full max-w-[420px] overflow-hidden rounded-[26px] border border-ink/10 bg-cream shadow-[0_30px_80px_rgba(20,25,22,.35)] max-[480px]:max-h-[90vh] max-[480px]:overflow-y-auto"
      >
        {/* HEADER */}
        <div className="relative overflow-hidden bg-gradient-to-br from-[#0b3a37] via-[#0d4a44] to-[#123f3a] px-7 pb-7 pt-6 text-white">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-[#c28b4d]/25 blur-3xl"
          />

          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-full text-white/70 transition hover:bg-white/10 hover:text-white"
          >
            <X size={16} />
          </button>

          <p className="relative text-[10px] uppercase tracking-[.22em] text-[#d2a873]">
            One last step
          </p>

          <h2 className="relative mt-2 max-w-[280px] font-serif text-2xl leading-tight">
            {mode === "signin"
              ? "Sign in to confirm your session"
              : "Create your account to continue"}
          </h2>

          <p className="relative mt-2 text-xs leading-5 text-[#afc2bc]">
            Your session details are saved — this
            just takes a moment.
          </p>
        </div>

        {/* FORM */}
        <form
          onSubmit={handleSubmit}
          className="px-7 py-6"
        >
          <div className="mb-5 flex rounded-full border border-ink/10 bg-white p-1">
            {(
              [
                ["signin", "Sign in"],
                ["signup", "Create account"],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => {
                  setMode(key);
                  setError("");
                }}
                className={`flex-1 rounded-full py-2 text-xs font-semibold transition ${
                  mode === key
                    ? "bg-[#0b3b38] text-white"
                    : "text-ink/55 hover:text-ink"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="space-y-3.5">
            {mode === "signup" && (
              <label className="block">
                <span className="relative block">
                  <UserRound
                    size={15}
                    className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink/35"
                  />

                  <input
                    required
                    minLength={2}
                    type="text"
                    autoComplete="name"
                    value={name}
                    onChange={(event) =>
                      setName(event.target.value)
                    }
                    placeholder="Full name"
                    className={inputClass}
                  />
                </span>
              </label>
            )}

            <label className="block">
              <span className="relative block">
                <Mail
                  size={15}
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink/35"
                />

                <input
                  required
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) =>
                    setEmail(event.target.value)
                  }
                  placeholder="you@example.com"
                  className={inputClass}
                />
              </span>
            </label>

            {mode === "signup" && (
              <label className="block">
                <span className="relative block">
                  <input
                    type="tel"
                    autoComplete="tel"
                    value={phone}
                    onChange={(event) =>
                      setPhone(event.target.value)
                    }
                    placeholder="Phone (optional)"
                    className="w-full rounded-xl border border-ink/15 bg-[#fbfaf6] px-4 py-3 text-sm outline-none transition focus:border-gold"
                  />
                </span>
              </label>
            )}

            <label className="block">
              <span className="relative block">
                <Lock
                  size={15}
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink/35"
                />

                <input
                  required
                  minLength={8}
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  autoComplete={
                    mode === "signin"
                      ? "current-password"
                      : "new-password"
                  }
                  value={password}
                  onChange={(event) =>
                    setPassword(event.target.value)
                  }
                  placeholder={
                    mode === "signup"
                      ? "At least 8 characters"
                      : "Password"
                  }
                  className={`${inputClass} pr-11`}
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPassword(!showPassword)
                  }
                  aria-label={
                    showPassword
                      ? "Hide password"
                      : "Show password"
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ink/35 hover:text-ink/60"
                >
                  {showPassword ? (
                    <EyeOff size={15} />
                  ) : (
                    <Eye size={15} />
                  )}
                </button>
              </span>
            </label>
          </div>

          {error && (
            <p className="mt-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-xs text-red-700">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="mt-5 w-full rounded-full bg-[#0b3b38] py-3.5 text-xs font-bold text-white transition hover:bg-[#124c47] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting
              ? mode === "signin"
                ? "Signing in…"
                : "Creating account…"
              : mode === "signin"
                ? "Sign in & confirm booking"
                : "Create account & confirm booking"}
          </button>

          <p className="mt-4 text-center text-[11px] text-ink/45">
            {mode === "signin"
              ? "New here? "
              : "Already have an account? "}

            <button
              type="button"
              onClick={() => {
                setMode(
                  mode === "signin"
                    ? "signup"
                    : "signin",
                );
                setError("");
              }}
              className="font-semibold text-[#a87843] hover:underline"
            >
              {mode === "signin"
                ? "Create an account"
                : "Sign in"}
            </button>
          </p>
        </form>
      </div>
    </div>
  );
}
