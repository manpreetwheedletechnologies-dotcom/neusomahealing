"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { X, Send } from "lucide-react";
import { getOrCreateChatSessionId, sendChatMessage } from "@/lib/chat-api";
import { ChatBookingCard } from "@/components/ChatBookingCard";

type Message = { role: "user" | "bot"; text: string };

const initialMessage: Message = {
  role: "bot",
  text: "Hi, I'm here to help. Ask me anything about coaching, sessions or the H.R.T. framework.",
};

const quickReplies = ["Book a session", "What's H.R.T.?", "Pricing & plans"];

// Simple heuristic: if the person types something booking-intent-ish,
// open the in-chat booking flow instead of sending it to the bot.
function looksLikeBookingIntent(text: string) {
  const t = text.toLowerCase();
  return (
    /\bbook\b/.test(t) ||
    /\bappointment\b/.test(t) ||
    /\bschedule\b/.test(t) ||
    /\bsession\b.*\b(book|slot|available)\b/.test(t)
  );
}

// Reveals bot replies word-by-word, like a live response being
// typed out, instead of popping in all at once. Runs once per
// message instance (state persists once the words finish).
function TypedBotText({ text, onTick }: { text: string; onTick?: () => void }) {
  const [shownCount, setShownCount] = useState(0);
  const words = useRef(text.split(" ")).current;

  useEffect(() => {
    setShownCount(0);
    let i = 0;
    const timer = setInterval(() => {
      i += 1;
      setShownCount(i);
      onTick?.();
      if (i >= words.length) clearInterval(timer);
    }, 28);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [words]);

  const isTyping = shownCount < words.length;

  return (
    <span className="whitespace-pre-line">
      {words.slice(0, shownCount).join(" ")}
      {isTyping && <span className="ml-0.5 inline-block h-3.5 w-[2px] animate-pulse bg-[#8a8478] align-middle" />}
    </span>
  );
}

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [everOpened, setEverOpened] = useState(false);
  const [mode, setMode] = useState<"chat" | "booking">("chat");
  const [messages, setMessages] = useState<Message[]>([initialMessage]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const sessionIdRef = useRef("");

  useEffect(() => {
    sessionIdRef.current = getOrCreateChatSessionId();
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, open, isSending]);

  function handleToggle() {
    setOpen((v) => !v);
    setEverOpened(true);
  }

  function startBooking(userText: string) {
    setMessages((prev) => [...prev, { role: "user", text: userText }]);
    setInput("");
    setMode("booking");
  }

  function handleBookingComplete(booking: {
    sessionType: string;
    dateLabel: string;
    time: string;
    amountPaid: number;
    message: string;
  }) {
    setMode("chat");
    setMessages((prev) => [
      ...prev,
      {
        role: "bot",
        text: `${booking.message} (${booking.sessionType} · ${booking.dateLabel} · ${booking.time}${
          booking.amountPaid > 0 ? ` · ₹${booking.amountPaid} paid` : ""
        })`,
      },
    ]);
  }

  function handleBookingCancel() {
    setMode("chat");
    setMessages((prev) => [
      ...prev,
      { role: "bot", text: "No worries, we can pick this up anytime. What else can I help with?" },
    ]);
  }

  async function handleSend(overrideText?: string) {
    const text = (overrideText ?? input).trim();
    if (!text || isSending) return;

    if (looksLikeBookingIntent(text)) {
      startBooking(text);
      return;
    }

    setMessages((prev) => [...prev, { role: "user", text }]);
    setInput("");
    setIsSending(true);

    try {
      const response = await sendChatMessage({
        sessionId: sessionIdRef.current || getOrCreateChatSessionId(),
        message: text,
      });

      setMessages((prev) => [...prev, { role: "bot", text: response.reply }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "bot",
          text: "Sorry, I couldn't send that just now. Please try again in a moment, or reach us through the contact form.",
        },
      ]);
    } finally {
      setIsSending(false);
    }
  }

  const showQuickReplies = messages.length === 1 && !isSending;

  return (
    <div className="pointer-events-none fixed bottom-6 right-6 z-[999999] flex flex-col items-end max-[500px]:bottom-4 max-[500px]:right-4">
      <style>{`
        @keyframes neusoma-pulse-ring {
          0% { box-shadow: 0 0 0 0 rgba(192,138,69,0.55); }
          70% { box-shadow: 0 0 0 14px rgba(192,138,69,0); }
          100% { box-shadow: 0 0 0 0 rgba(192,138,69,0); }
        }
        .neusoma-notify {
          animation: neusoma-pulse-ring 2.2s ease-out 3;
        }

        /* --- New: floating action button animations --- */
        @keyframes neusoma-fab-float {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-7px) scale(1.015); }
        }
        @keyframes neusoma-fab-pop-in {
          0% { transform: scale(0) rotate(-20deg); opacity: 0; }
          60% { transform: scale(1.12) rotate(6deg); opacity: 1; }
          100% { transform: scale(1) rotate(0deg); opacity: 1; }
        }
        @keyframes neusoma-fab-icon-wiggle {
          0%, 100% { transform: rotate(0deg) scale(1); }
          20% { transform: rotate(-8deg) scale(1.05); }
          40% { transform: rotate(7deg) scale(1.05); }
          60% { transform: rotate(-4deg) scale(1.02); }
          80% { transform: rotate(2deg) scale(1.01); }
        }

        .neusoma-fab {
          animation: neusoma-fab-pop-in 0.55s cubic-bezier(0.34, 1.56, 0.64, 1) both,
            neusoma-fab-float 3.2s ease-in-out 0.55s infinite;
        }
        .neusoma-fab:hover {
          animation-play-state: paused;
        }
        .neusoma-fab-icon-idle {
          animation: neusoma-fab-icon-wiggle 4.5s ease-in-out infinite;
        }

        .neusoma-scroll::-webkit-scrollbar { width: 6px; }
        .neusoma-scroll::-webkit-scrollbar-track { background: transparent; }
        .neusoma-scroll::-webkit-scrollbar-thumb {
          background-color: #d9cfbe;
          border-radius: 999px;
        }
        .neusoma-scroll { scrollbar-width: thin; scrollbar-color: #d9cfbe transparent; }
      `}</style>

      {/* Chat panel */}
      <div
        className={`mb-4 w-[368px] origin-bottom-right overflow-hidden rounded-[22px] border border-[#e7ded0] bg-[#fdfbf6] shadow-[0_28px_70px_-18px_rgba(47,63,56,0.4)] transition-all duration-300 ease-out max-[500px]:w-[calc(100vw-32px)] ${
          open
            ? "pointer-events-auto scale-100 opacity-100"
            : "pointer-events-none scale-95 opacity-0"
        }`}
      >
        {/* Header */}
        <div className="relative overflow-hidden bg-[linear-gradient(135deg,#2F3F38_0%,#37493f_55%,#41544a_100%)] px-5 py-4">
          <div
            className="pointer-events-none absolute -right-8 -top-10 h-32 w-32 rounded-full bg-[radial-gradient(circle,rgba(192,138,69,0.35)_0%,rgba(192,138,69,0)_70%)]"
            aria-hidden
          />
          <div className="relative flex items-center gap-3">
            {/* Header icon (PNG) */}
            <div className="relative grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-full">
              <Image
                src="images/bot.png"
                alt="Neusoma Healing logo"
                fill
                className="object-cover"
              />
            </div>
            <div className="flex-1">
              <p className="font-serif text-[15px] font-medium text-white">Neusoma Healing</p>
              <p className="flex items-center gap-1.5 text-xs text-[#c9d1cb]">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#8fd6a8] opacity-60" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#8fd6a8]" />
                </span>
                Usually replies within a few hours
              </p>
            </div>
            <button
              onClick={() => setOpen(false)}
              aria-label="Close chat"
              className="rounded-full p-1.5 text-[#c9d1cb] transition-colors hover:bg-white/10 hover:text-white"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div
          ref={scrollRef}
          className="neusoma-scroll flex h-[360px] flex-col gap-3 overflow-y-auto px-4 py-4"
        >
          {messages.map((m, i) => (
            <div
              key={i}
              className={`max-w-[80%] whitespace-pre-line px-4 py-2.5 text-sm leading-relaxed shadow-[0_1px_2px_rgba(47,63,56,0.06)] ${
                m.role === "user"
                  ? "self-end rounded-2xl rounded-br-[4px] bg-[#2F3F38] text-white"
                  : "self-start rounded-2xl rounded-bl-[4px] bg-[#f0ebe0] text-[#3a4a45]"
              }`}
            >
              {m.role === "bot" ? (
                <TypedBotText
                  text={m.text}
                  onTick={() =>
                    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "auto" })
                  }
                />
              ) : (
                m.text
              )}
            </div>
          ))}

          {isSending && (
            <div className="self-start rounded-2xl rounded-bl-[4px] bg-[#f0ebe0] px-4 py-2.5 text-sm text-[#8a8478]">
              <span className="inline-flex gap-1">
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#C08A45] [animation-delay:-0.2s]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#C08A45] [animation-delay:-0.1s]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#C08A45]" />
              </span>
            </div>
          )}

          {showQuickReplies && mode === "chat" && (
            <div className="mt-1 flex flex-wrap gap-2 self-start">
              {quickReplies.map((q) => (
                <button
                  key={q}
                  onClick={() => (q === "Book a session" ? startBooking(q) : handleSend(q))}
                  className="rounded-full border border-[#dcd2bf] bg-white px-3 py-1.5 text-xs text-[#2F3F38] transition-colors hover:border-[#C08A45] hover:text-[#C08A45]"
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {mode === "booking" && (
            <div className="self-stretch">
              <ChatBookingCard onCancel={handleBookingCancel} onComplete={handleBookingComplete} />
            </div>
          )}
        </div>

        {/* Input */}
        {mode === "chat" && (
          <div className="flex items-center gap-2 border-t border-[#e7ded0] px-3 py-3">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="Type a message..."
              disabled={isSending}
              className="flex-1 rounded-full bg-[#f0ebe0] px-4 py-2.5 text-sm text-[#2F3F38] outline-none ring-[#C08A45]/40 transition-shadow placeholder:text-[#8a8478] focus:ring-2 disabled:opacity-60"
            />
            <button
              onClick={() => handleSend()}
              disabled={isSending || !input.trim()}
              aria-label="Send message"
              className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#C08A45] text-white transition-transform duration-200 hover:scale-105 hover:rotate-6 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:rotate-0"
            >
              <Send size={16} />
            </button>
          </div>
        )}
      </div>

      {/* Floating action button — just the icon, no circle/bg behind it */}
      <button
        onClick={handleToggle}
        aria-label={open ? "Close chat" : "Open chat"}
        className="neusoma-fab pointer-events-auto relative grid h-[92px] w-[92px] place-items-center bg-transparent transition-transform duration-200 hover:scale-110 active:scale-95 max-[500px]:h-20 max-[500px]:w-20"
      >
        {!everOpened && (
          <span className="absolute right-1 top-1 h-3.5 w-3.5 rounded-full border-2 border-[#fdfbf6] bg-[#C08A45] shadow-[0_0_0_3px_rgba(192,138,69,0.25)]" />
        )}

        {/* Chat icon (PNG) */}
        <span
          className={`absolute grid place-items-center transition-all duration-300 ${
            open ? "rotate-90 scale-0 opacity-0" : "rotate-0 scale-100 opacity-100"
          }`}
        >
          <span className={!open ? "neusoma-fab-icon-idle inline-block drop-shadow-[0_10px_18px_rgba(47,63,56,0.35)]" : "inline-block"}>
            <Image src="images/bot.png" alt="Chat" width={92} height={92} className="object-contain" />
          </span>
        </span>
        {/* Close icon (kept as lucide X) */}
        <span
          className={`absolute grid place-items-center transition-all duration-300 ${
            open ? "rotate-0 scale-100 opacity-100" : "-rotate-90 scale-0 opacity-0"
          }`}
        >
          <X size={30} strokeWidth={1.75} className="text-[#2F3F38] drop-shadow-[0_6px_12px_rgba(47,63,56,0.35)]" />
        </span>
      </button>
    </div>
  );
}