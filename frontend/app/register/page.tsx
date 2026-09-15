"use client";

import {
  FormEvent,
  Suspense,
  useEffect,
  useState,
} from "react";

import Link from "next/link";
import {
  useRouter,
  useSearchParams,
} from "next/navigation";

import {
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  Phone,
  UserRound,
} from "lucide-react";

import { useUserAuth } from "@/components/UserAuthProvider";

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const { user, loading, signUp } = useUserAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] =
    useState(false);

  const [error, setError] = useState("");
  const [submitting, setSubmitting] =
    useState(false);

  const nextPath =
    searchParams.get("next") || "/account";

  useEffect(() => {
    if (!loading && user) {
      router.replace(nextPath);
    }
  }, [loading, user, router, nextPath]);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (password.length < 8) {
      setError(
        "Password must be at least 8 characters long.",
      );

      return;
    }

    setSubmitting(true);
    setError("");

    try {
      await signUp({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        phone: phone.trim() || undefined,
      });

      router.replace(nextPath);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to create your account right now.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-[#f6f7f4] px-5 py-16">
      <div className="w-full max-w-[430px]">
        <div className="rounded-[26px] border border-[#e2e6e2] bg-white p-8 shadow-[0_18px_50px_rgba(37,56,49,.07)] max-[480px]:p-6">
          <p className="text-[10px] font-semibold uppercase tracking-[.2em] text-[#a87843]">
            Get started
          </p>

          <h1 className="mt-3 font-serif text-[30px] leading-tight text-[#12241f]">
            Create your account
          </h1>

          <p className="mt-2 text-xs leading-6 text-[#76817c]">
            You&apos;ll need an account to book
            sessions and get notified when new
            webinars open.
          </p>

          <form
            onSubmit={handleSubmit}
            className="mt-7 space-y-4"
          >
            <label className="block">
              <span className="mb-1.5 block text-[11px] font-semibold text-[#46534e]">
                Full name
              </span>

              <span className="relative block">
                <UserRound
                  size={15}
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9aa39d]"
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
                  placeholder="Your name"
                  className="w-full rounded-xl border border-[#d9dfda] bg-[#fbfcfa] py-3 pl-10 pr-4 text-sm outline-none focus:border-[#a87843]"
                />
              </span>
            </label>

            <label className="block">
              <span className="mb-1.5 block text-[11px] font-semibold text-[#46534e]">
                Email
              </span>

              <span className="relative block">
                <Mail
                  size={15}
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9aa39d]"
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
                  className="w-full rounded-xl border border-[#d9dfda] bg-[#fbfcfa] py-3 pl-10 pr-4 text-sm outline-none focus:border-[#a87843]"
                />
              </span>
            </label>

            <label className="block">
              <span className="mb-1.5 block text-[11px] font-semibold text-[#46534e]">
                Phone{" "}
                <span className="font-normal text-[#9aa39d]">
                  (optional)
                </span>
              </span>

              <span className="relative block">
                <Phone
                  size={15}
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9aa39d]"
                />

                <input
                  type="tel"
                  autoComplete="tel"
                  value={phone}
                  onChange={(event) =>
                    setPhone(event.target.value)
                  }
                  placeholder="+91 98765 43210"
                  className="w-full rounded-xl border border-[#d9dfda] bg-[#fbfcfa] py-3 pl-10 pr-4 text-sm outline-none focus:border-[#a87843]"
                />
              </span>
            </label>

            <label className="block">
              <span className="mb-1.5 block text-[11px] font-semibold text-[#46534e]">
                Password
              </span>

              <span className="relative block">
                <LockKeyhole
                  size={15}
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9aa39d]"
                />

                <input
                  required
                  minLength={8}
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  autoComplete="new-password"
                  value={password}
                  onChange={(event) =>
                    setPassword(event.target.value)
                  }
                  placeholder="At least 8 characters"
                  className="w-full rounded-xl border border-[#d9dfda] bg-[#fbfcfa] py-3 pl-10 pr-11 text-sm outline-none focus:border-[#a87843]"
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
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9aa39d] hover:text-[#5e6b65]"
                >
                  {showPassword ? (
                    <EyeOff size={15} />
                  ) : (
                    <Eye size={15} />
                  )}
                </button>
              </span>
            </label>

            {error && (
              <p className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-xs text-red-700">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-xl bg-[#0b3b38] py-3.5 text-xs font-bold text-white transition hover:bg-[#124c47] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting
                ? "Creating account…"
                : "Create account"}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-[#76817c]">
            Already have an account?{" "}
            <Link
              href={`/login${
                nextPath !== "/account"
                  ? `?next=${encodeURIComponent(nextPath)}`
                  : ""
              }`}
              className="font-semibold text-[#a87843] hover:underline"
            >
              Sign in
            </Link>
          </p>
        </div>

        <p className="mt-5 text-center text-[11px] text-[#9aa39d]">
          <Link
            href="/"
            className="hover:text-[#5e6b65]"
          >
            ← Back to website
          </Link>
        </p>
      </div>
    </main>
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <main className="grid min-h-screen place-items-center bg-[#f6f7f4] text-xs text-[#76817c]">
          Loading…
        </main>
      }
    >
      <RegisterForm />
    </Suspense>
  );
}
