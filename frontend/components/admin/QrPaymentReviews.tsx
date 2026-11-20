"use client";

import { useCallback, useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";

type Row = {
  _id: string; name: string; email: string; sessionType: string;
  bookingDate: string; timeSlot: string; qrAmount: number; qrUtr: string;
};

export default function QrPaymentReviews() {
  const [rows, setRows] = useState<Row[]>([]);
  const [proof, setProof] = useState<{ id: string; src: string } | null>(null);
  const [busy, setBusy] = useState("");
  const [message, setMessage] = useState("");

  const refresh = useCallback(async () => {
    try {
      const items = await apiRequest<Row[]>("/bookings/admin/qr/pending");
      const target = new URLSearchParams(window.location.search).get("qrReview");
      setRows(target
        ? [...items.filter(r => r._id === target), ...items.filter(r => r._id !== target)]
        : items);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Unable to load requests.");
    }
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  async function action(id: string, kind: "proof" | "confirm" | "reject") {
    if (kind === "confirm" || kind === "reject") {
  const row = rows.find((item) => item._id === id);
  if (!row) return;

  const amount = `₹${row.qrAmount.toLocaleString("en-IN")}`;

  const question =
    kind === "confirm"
      ? `Confirm ${row.name}’s booking?\n\n` +
        `Amount: ${amount}\nUPI reference: ${row.qrUtr}\n\n` +
        `Confirm only after matching the payment with your bank record.`
      : `Reject ${row.name}’s payment proof?\n\n` +
        `Amount: ${amount}\nUPI reference: ${row.qrUtr}\n\n` +
        `This will cancel the pending booking and release the reserved seat.`;

  if (!window.confirm(question)) return;
}
    setBusy(id);
    setMessage("");
    try {
      const path = `/bookings/admin/qr/${id}/${kind}`;
      if (kind === "proof") {
        const result = await apiRequest<{ src: string }>(path);
        setProof({ id, src: result.src });
      } else {
        const result = await apiRequest<{ message: string }>(path, { method: "POST" });
        setMessage(result.message);
        setProof(null);
        await refresh();
      }
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Request failed.");
    } finally {
      setBusy("");
    }
  }

return (
  <section
    aria-label="QR payment reviews"
    className="my-6 overflow-hidden rounded-2xl border border-[#d9e2dc] bg-white"
  >
    {/* Panel header */}
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e4eae5] bg-[#f7f9f6] px-4 py-4 sm:px-6">
      <h3 className="flex items-center gap-2.5 text-lg font-semibold text-[#123c37]">
        QR payment reviews
        <span
          aria-label={`${rows.length} pending requests`}
          className="rounded-full bg-[#e3eee7] px-2.5 py-0.5 text-xs font-semibold tabular-nums text-[#285447]"
        >
          {rows.length}
        </span>
      </h3>

      <button
        type="button"
        onClick={() => void refresh()}
        className="rounded-lg border border-[#cdd9d1] bg-white px-3.5 py-2 text-xs font-semibold text-[#31574b] transition hover:bg-[#edf3ee] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#287562]"
      >
        Refresh
      </button>
    </div>

    {/* Existing API feedback */}
    {message && (
      <p
        role="status"
        className="mx-4 mt-4 rounded-lg border border-[#dae3dd] bg-[#f5f8f5] px-3.5 py-2.5 text-sm text-[#354e44] sm:mx-6"
      >
        {message}
      </p>
    )}

    {!rows.length && !message && (
      <div className="px-4 py-7 text-center sm:px-6">
        <p className="text-sm font-medium text-[#40574c]">
          No payments awaiting review
        </p>
        <p className="mt-1 text-xs leading-5 text-[#62736a]">
          New requests will appear here after an attendee submits payment proof.
        </p>
      </div>
    )}

    <div className="divide-y divide-[#e4eae5]">
      {rows.map((row) => {
        const isProofOpen = proof?.id === row._id;

        return (
          <article key={row._id} className="px-4 py-5 sm:px-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <h4 className="break-words font-semibold text-[#193b31]">
                  {row.name}
                </h4>
                <p className="mt-0.5 break-all text-sm text-[#5b6d63]">
                  {row.email}
                </p>
              </div>

              <div className="text-left sm:text-right">
                <p className="text-lg font-semibold tabular-nums text-[#123c37]">
                  ₹{row.qrAmount.toLocaleString("en-IN")}
                </p>
                <span className="mt-1 inline-block rounded-full bg-[#fff2d8] px-2.5 py-1 text-xs font-medium text-[#795519]">
                  Awaiting review
                </span>
              </div>
            </div>

            <dl className="mt-4 grid gap-3 rounded-xl bg-[#f6f8f5] px-4 py-3 sm:grid-cols-3">
              <div>
                <dt className="text-xs text-[#617167]">Session</dt>
                <dd className="mt-1 text-sm font-medium text-[#243e32]">
                  {row.sessionType}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-[#617167]">Date &amp; time</dt>
                <dd className="mt-1 text-sm font-medium text-[#243e32]">
                  {row.bookingDate} · {row.timeSlot}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-[#617167]">UPI reference (UTR)</dt>
                <dd className="mt-1 select-all break-all font-mono text-sm font-medium text-[#243e32]">
                  {row.qrUtr}
                </dd>
              </div>
            </dl>

            {!isProofOpen && (
              <button
                type="button"
                disabled={!!busy}
                onClick={() => void action(row._id, "proof")}
                className="mt-4 rounded-lg border border-[#bfd1c5] bg-white px-4 py-2 text-sm font-semibold text-[#18523e] transition hover:bg-[#eef5ef] disabled:opacity-50"
              >
                {busy === row._id ? "Loading screenshot…" : "Review screenshot"}
              </button>
            )}

            {proof?.id === row._id && (
              <div className="mt-4 rounded-xl border border-[#dbe5dd] p-3 sm:p-4">
                <h5 className="text-sm font-semibold text-[#243e32]">
                  Payment screenshot
                </h5>

                <div className="mt-3 flex justify-center rounded-lg bg-[#f4f6f3] p-2">
                  <img
                    src={proof.src}
                    alt={`Payment screenshot submitted by ${row.name}`}
                    className="max-h-96 max-w-full rounded-md object-contain"
                  />
                </div>

                <p className="mt-3 text-sm leading-6 text-[#526258]">
                  Match the amount and UPI reference with the credit in your
                  bank account before confirming this booking.
                </p>

                <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                  <button
                    type="button"
                    disabled={!!busy}
                    onClick={() => void action(row._id, "confirm")}
                    className="rounded-lg bg-[#0b3b38] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#15524a] disabled:opacity-50"
                  >
                    Confirm booking
                  </button>
                  <button
                    type="button"
                    disabled={!!busy}
                    onClick={() => void action(row._id, "reject")}
                    className="rounded-lg border border-[#e4c9c4] px-4 py-2.5 text-sm font-medium text-[#973d30] transition hover:bg-[#fff5f3] disabled:opacity-50"
                  >
                    Reject proof
                  </button>
                </div>
              </div>
            )}
          </article>
        );
      })}
    </div>
  </section>
);
}