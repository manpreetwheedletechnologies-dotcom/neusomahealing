"use client";

import { FormEvent, useState } from "react";
import { subscribeToNewsletter, SubscribeApiError } from "@/lib/subscribe-api";

export function NewsletterSignup() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">(
    "idle",
  );
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    if (!email.trim()) {
      setError("Please enter your email address.");
      setStatus("error");
      return;
    }

    setStatus("loading");
    setError("");

    try {
      await subscribeToNewsletter({ email: email.trim() });
      setStatus("success");
      setEmail("");
    } catch (err) {
      setStatus("error");
      setError(
        err instanceof SubscribeApiError
          ? err.message
          : "Something went wrong. Please try again.",
      );
    }
  }

  return (
    <div>
      <form
        onSubmit={handleSubmit}
        className="mt-6 rounded-[18px] border border-white/[0.10] bg-white/[0.035] p-2 backdrop-blur-sm"
      >
        <div className="flex items-center">
          <input
            type="email"
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
              if (status !== "idle") {
                setStatus("idle");
                setError("");
              }
            }}
            placeholder="Your email address"
            disabled={status === "loading"}
            className="min-w-0 flex-1 bg-transparent px-4 py-3 text-[11px] text-white outline-none placeholder:text-[#7f9690] disabled:opacity-60"
          />

          <button
            type="submit"
            aria-label="Subscribe"
            disabled={status === "loading"}
            className="group flex h-11 w-11 shrink-0 items-center justify-center rounded-[13px] bg-[#b27a39] text-white shadow-[0_8px_25px_rgba(178,122,57,0.18)] transition-all duration-300 hover:bg-[#c48b48] hover:shadow-[0_10px_30px_rgba(178,122,57,0.3)] disabled:opacity-60"
          >
            <span className="text-lg transition-transform duration-300 group-hover:translate-x-0.5">
              {status === "loading" ? "…" : "→"}
            </span>
          </button>
        </div>
      </form>

      {status === "success" ? (
        <p className="mt-3 px-1 text-[9px] leading-relaxed text-[#8fd8c3]">
          You&apos;re subscribed. Thank you for joining.
        </p>
      ) : status === "error" ? (
        <p className="mt-3 px-1 text-[9px] leading-relaxed text-[#e6a9a9]">
          {error}
        </p>
      ) : (
        <p className="mt-3 px-1 text-[9px] leading-relaxed text-[#718781]">
          No noise. Just meaningful resources. Unsubscribe anytime.
        </p>
      )}
    </div>
  );
}
