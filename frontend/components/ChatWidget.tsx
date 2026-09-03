"use client";

import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send } from "lucide-react";

type Message = { role: "user" | "bot"; text: string };

const initialMessage: Message = {
  role: "bot",
  text: "Hi, I'm here to help. Ask me anything about coaching, sessions or the H.R.T. framework.",
};

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([initialMessage]);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, open]);

  function handleSend() {
    const text = input.trim();
    if (!text) return;

    setMessages((prev) => [...prev, { role: "user", text }]);
    setInput("");

    // TODO: replace with a real API call, e.g.
    // const res = await fetch("/api/chat", { method: "POST", body: JSON.stringify({ text }) });
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        { role: "bot", text: "Thanks for reaching out — a member of the team will follow up shortly." },
      ]);
    }, 700);
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end max-[500px]:bottom-4 max-[500px]:right-4">
      {/* Chat panel */}
      <div
        className={`mb-4 w-[360px] origin-bottom-right overflow-hidden rounded-[20px] border border-[#e7ded0] bg-[#fdfbf6] shadow-[0_24px_60px_-16px_rgba(47,63,56,0.35)] transition-all duration-300 ease-out max-[500px]:w-[calc(100vw-32px)] ${
          open ? "scale-100 opacity-100" : "pointer-events-none scale-95 opacity-0"
        }`}
      >
        {/* Header */}
        <div className="flex items-center gap-3 bg-[#2F3F38] px-5 py-4">
          <div className="grid h-9 w-9 place-items-center rounded-full bg-[#C08A45] font-serif text-sm text-white">
            N
          </div>
          <div>
            <p className="font-serif text-sm font-medium text-white">Neusoma Healing</p>
            <p className="text-xs text-[#c9d1cb]">Usually replies within a few hours</p>
          </div>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex h-[340px] flex-col gap-3 overflow-y-auto px-4 py-4">
          {messages.map((m, i) => (
            <div
              key={i}
              className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                m.role === "user"
                  ? "self-end rounded-br-sm bg-[#2F3F38] text-white"
                  : "self-start rounded-bl-sm bg-[#f0ebe0] text-[#3a4a45]"
              }`}
            >
              {m.text}
            </div>
          ))}
        </div>

        {/* Input */}
        <div className="flex items-center gap-2 border-t border-[#e7ded0] px-3 py-3">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Type a message..."
            className="flex-1 rounded-full bg-[#f0ebe0] px-4 py-2.5 text-sm text-[#2F3F38] outline-none placeholder:text-[#8a8478]"
          />
          <button
            onClick={handleSend}
            aria-label="Send message"
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#C08A45] text-white transition-transform duration-200 hover:scale-105 active:scale-95"
          >
            <Send size={16} />
          </button>
        </div>
      </div>

      {/* Floating action button */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Close chat" : "Open chat"}
        className="grid h-16 w-16 place-items-center rounded-full bg-[#2F3F38] text-[#C08A45] shadow-[0_16px_40px_-10px_rgba(47,63,56,0.5)] transition-transform duration-300 hover:scale-105 active:scale-95"
      >
        <span className={`absolute transition-all duration-300 ${open ? "rotate-90 scale-0 opacity-0" : "rotate-0 scale-100 opacity-100"}`}>
          <MessageCircle size={26} strokeWidth={1.5} />
        </span>
        <span className={`absolute transition-all duration-300 ${open ? "rotate-0 scale-100 opacity-100" : "-rotate-90 scale-0 opacity-0"}`}>
          <X size={26} strokeWidth={1.5} />
        </span>
      </button>
    </div>
  );
}