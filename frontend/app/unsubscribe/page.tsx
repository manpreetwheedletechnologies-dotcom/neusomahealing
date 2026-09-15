"use client";

import {
  Suspense,
  useEffect,
  useState,
} from "react";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { CheckCircle2, XCircle } from "lucide-react";

import { apiRequest } from "@/lib/api";

function UnsubscribeInner() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [state, setState] = useState<
    "loading" | "done" | "error"
  >("loading");

  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setState("error");
      setMessage(
        "This unsubscribe link is missing its token.",
      );

      return;
    }

    let active = true;

    apiRequest<{
      success: boolean;
      message: string;
    }>(
      `/audience/unsubscribe?token=${encodeURIComponent(
        token,
      )}`,
    )
      .then((response) => {
        if (!active) return;

        setState(
          response.success ? "done" : "error",
        );

        setMessage(response.message);
      })
      .catch((error) => {
        if (!active) return;

        setState("error");

        setMessage(
          error instanceof Error
            ? error.message
            : "We couldn't process this request.",
        );
      });

    return () => {
      active = false;
    };
  }, [token]);

  return (
    <main className="grid min-h-screen place-items-center bg-[#f6f7f4] px-5 py-16">
      <div className="w-full max-w-[440px] rounded-[26px] border border-[#e2e6e2] bg-white p-9 text-center shadow-[0_18px_50px_rgba(37,56,49,.07)] max-[480px]:p-6">
        {state === "loading" && (
          <p className="text-xs text-[#76817c]">
            Updating your preferences…
          </p>
        )}

        {state === "done" && (
          <>
            <CheckCircle2
              size={26}
              className="mx-auto text-[#2f7a51]"
            />

            <h1 className="mt-4 font-serif text-[26px] leading-tight text-[#12241f]">
              You&apos;re unsubscribed
            </h1>

            <p className="mt-3 text-xs leading-6 text-[#76817c]">
              {message} You&apos;ll still receive
              booking confirmations for sessions you
              sign up for.
            </p>
          </>
        )}

        {state === "error" && (
          <>
            <XCircle
              size={26}
              className="mx-auto text-[#a8443f]"
            />

            <h1 className="mt-4 font-serif text-[26px] leading-tight text-[#12241f]">
              Something went wrong
            </h1>

            <p className="mt-3 text-xs leading-6 text-[#76817c]">
              {message}
            </p>
          </>
        )}

        <Link
          href="/"
          className="mt-7 inline-flex rounded-full border border-[#dce1dc] px-5 py-2.5 text-xs font-semibold text-[#0b3b38] transition hover:bg-[#f2f5f2]"
        >
          Back to website
        </Link>
      </div>
    </main>
  );
}

export default function UnsubscribePage() {
  return (
    <Suspense
      fallback={
        <main className="grid min-h-screen place-items-center bg-[#f6f7f4] text-xs text-[#76817c]">
          Loading…
        </main>
      }
    >
      <UnsubscribeInner />
    </Suspense>
  );
}
