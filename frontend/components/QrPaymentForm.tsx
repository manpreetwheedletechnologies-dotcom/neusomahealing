"use client";

import { useState, type FormEvent } from "react";
import { apiRequest } from "@/lib/api";

type Props = {
  slotId: string;
  amount: number;
  name: string;
  email: string;
  phone?: string;
  qrImageUrl: string;
};

export default function QrPaymentForm(props: Props) {
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [qrLoadFailed, setQrLoadFailed] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;

    const data = new FormData(event.currentTarget);
    const file = data.get("proof");
    if (!(file instanceof File) || !file.size || file.size > 2 * 1024 * 1024) {
      setError("Choose a PNG or JPG screenshot under 2 MB.");
      return;
    }

    data.set("slotId", props.slotId);
    data.set("name", props.name.trim());
    data.set("email", props.email.trim());
    data.set("phone", props.phone?.trim() || "");
    setBusy(true);
    setError("");

    try {
      await apiRequest("/bookings/qr/submit", { method: "POST", body: data });
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to submit proof.");
    } finally {
      setBusy(false);
    }
  }

 if (sent) {
  return (
    <section
      role="status"
      aria-live="polite"
      className="rounded-2xl border border-[#d7e3dd] bg-white px-6 py-7 sm:px-8"
    >
      <div className="flex items-start gap-4">
        <span
          aria-hidden="true"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#e9f3ed] text-[#185442]"
        >
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m5 12 4 4L19 6" />
          </svg>
        </span>

        <div className="min-w-0">
          <h3 className="font-serif text-3xl leading-tight text-[#103d35]">
            Thank you!
          </h3>
          <p className="mt-2 text-sm leading-6 text-[#465e52]">
            We’ve received your payment details. Our team will now review
            your screenshot and UPI reference number.
          </p>
        </div>
      </div>

      <p className="mt-5 border-t border-[#e4ebe6] pt-4 text-sm leading-6 text-[#465e52]">
        Once we verify your payment, we’ll send your booking confirmation,
        session details and joining link to{" "}
        <strong className="break-all font-semibold text-[#103d35]">
          {props.email}
        </strong>.
      </p>
    </section>
  );
}

  return (
    <form onSubmit={submit} className="space-y-4 rounded-xl border p-4">
      <p className="font-semibold">Scan to pay ₹{props.amount} via UPI</p>
     {qrLoadFailed ? (
  <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
    The payment QR for this session could not be loaded.
    Please refresh before making a payment.
  </p>
) : (
  <img
    src={props.qrImageUrl}
    alt="Scan to pay for this session"
    width={220}
    height={220}
    className="rounded-xl border bg-white object-contain p-2"
    onError={() => setQrLoadFailed(true)}
  />
)}
      <label className="block">
        UPI reference number (12 digits)
        <input name="utr" required inputMode="numeric" pattern="[0-9]{12}"
          maxLength={12} className="mt-1 block w-full rounded-lg border p-2" />
      </label>
      <label className="block">
        Payment screenshot (PNG or JPG, up to 2 MB)
        <input name="proof" type="file" required accept="image/png,image/jpeg"
          className="mt-1 block w-full" />
      </label>
      {error && <p role="alert">{error}</p>}
      <button type="submit" disabled={busy}
        className="rounded-lg bg-[#0b3b38] px-4 py-2 text-white">
        {busy ? "Submitting…" : "Submit payment for review"}
      </button>
    </form>
  );
}