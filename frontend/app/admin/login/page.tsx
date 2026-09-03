'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, LockKeyhole, Mail } from 'lucide-react';
import { adminLogin, getCurrentAdmin } from '@/lib/admin-api';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);

  useEffect(() => {
    let mounted = true;

    getCurrentAdmin()
      .then(() => {
        if (mounted) {
          router.replace('/admin');
        }
      })
      .catch(() => {
        if (mounted) {
          setIsCheckingSession(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, [router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail || !password) {
      setError('Email and password are required.');
      return;
    }

    if (!/^\S+@\S+\.\S+$/.test(normalizedEmail)) {
      setError('Please enter a valid email address.');
      return;
    }

    try {
      setError('');
      setIsSubmitting(true);
      await adminLogin(normalizedEmail, password);
      router.replace('/admin');
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to login. Please try again.',
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isCheckingSession) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f4ef] px-4">
        <p className="text-sm text-[#665f57]">Checking admin session...</p>
      </main>
    );
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#f7f4ef] px-4 py-10">
      <div className="pointer-events-none absolute -left-28 -top-24 h-80 w-80 rounded-full bg-[#dce8df]/70 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -right-24 h-96 w-96 rounded-full bg-[#eadfd5]/80 blur-3xl" />

      <section className="relative w-full max-w-md rounded-[28px] border border-black/5 bg-white/90 p-7 shadow-[0_24px_80px_rgba(48,42,36,0.12)] backdrop-blur sm:p-9">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#253a32] text-white shadow-lg">
            <LockKeyhole size={25} strokeWidth={1.8} />
          </div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.24em] text-[#7a7269]">
            NeusomaHealing
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-[#28231f]">
            Admin Login
          </h1>
          <p className="mt-2 text-sm leading-6 text-[#756e66]">
            Sign in with your administrator credentials to continue.
          </p>
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-5">
          <div>
            <label
              htmlFor="admin-email"
              className="mb-2 block text-sm font-medium text-[#3e3934]"
            >
              Email address
            </label>
            <div className="relative">
              <Mail
                size={18}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#8c857d]"
              />
              <input
                id="admin-email"
                type="email"
                autoComplete="username"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="admin@example.com"
                disabled={isSubmitting}
                className="h-12 w-full rounded-xl border border-[#ded8d1] bg-white pl-11 pr-4 text-sm text-[#28231f] outline-none transition placeholder:text-[#aaa39b] focus:border-[#526e61] focus:ring-4 focus:ring-[#526e61]/10 disabled:cursor-not-allowed disabled:opacity-60"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="admin-password"
              className="mb-2 block text-sm font-medium text-[#3e3934]"
            >
              Password
            </label>
            <div className="relative">
              <LockKeyhole
                size={18}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#8c857d]"
              />
              <input
                id="admin-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter your password"
                disabled={isSubmitting}
                className="h-12 w-full rounded-xl border border-[#ded8d1] bg-white pl-11 pr-12 text-sm text-[#28231f] outline-none transition placeholder:text-[#aaa39b] focus:border-[#526e61] focus:ring-4 focus:ring-[#526e61]/10 disabled:cursor-not-allowed disabled:opacity-60"
              />
              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[#8c857d] transition hover:text-[#3f5149]"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {error ? (
            <div
              role="alert"
              className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-5 text-red-700"
            >
              {error}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex h-12 w-full items-center justify-center rounded-xl bg-[#253a32] px-4 text-sm font-semibold text-white shadow-lg shadow-[#253a32]/15 transition hover:bg-[#1d3029] focus:outline-none focus:ring-4 focus:ring-[#526e61]/20 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? 'Signing in...' : 'Sign in to dashboard'}
          </button>
        </form>
      </section>
    </main>
  );
}