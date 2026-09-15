"use client";

import { useMemo, useState } from "react";
import {
  CheckCircle2,
  Mail,
  MessageCircle,
  MessagesSquare,
  Search,
  User,
  X,
} from "lucide-react";

/* =========================================================
   TYPES
========================================================= */

export type ChatMessage = {
  role: "user" | "bot";
  text: string;
  at?: string;
};

export type ChatConversation = {
  _id: string;
  sessionId: string;
  name?: string;
  email?: string;
  messages: ChatMessage[];
  status: "new" | "read";
  createdAt?: string;
  updatedAt?: string;
};

type Props = {
  items: ChatConversation[];
  search: string;
  setSearch: (value: string) => void;
  updateStatus: (id: string, status: string) => Promise<void>;
  updatingStatusId: string | null;
};

/* =========================================================
   HELPERS
========================================================= */

function formatDate(value?: string) {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}

function lastMessagePreview(conversation: ChatConversation) {
  const messages = conversation.messages ?? [];
  const last = messages[messages.length - 1];
  if (!last?.text) return "No messages yet.";
  return last.text.length > 90 ? `${last.text.slice(0, 90)}…` : last.text;
}

/* =========================================================
   COMPONENT
========================================================= */

export function ChatsSection({
  items,
  search,
  setSearch,
  updateStatus,
  updatingStatusId,
}: Props) {
  const [selected, setSelected] = useState<ChatConversation | null>(null);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return items;

    return items.filter((conversation) => {
      const haystack = [
        conversation.name,
        conversation.email,
        conversation.sessionId,
        ...(conversation.messages ?? []).map((m) => m.text),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(query);
    });
  }, [items, search]);

  return (
    <>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-serif text-2xl font-medium text-[#182420]">
            Chat Queries
          </h2>
          <p className="mt-1 text-xs text-[#6b7772]">
            Conversations visitors have had with the website chatbot.
          </p>
        </div>

        <div className="relative">
          <Search
            size={14}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#9aa39d]"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search conversations…"
            className="w-64 rounded-xl border border-[#dce1dc] bg-white py-2 pl-8 pr-3 text-xs outline-none focus:border-[#0b3b38]/40"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#dce1dc] bg-white py-16 text-center">
          <MessagesSquare size={28} className="mb-3 text-[#9aa39d]" />
          <p className="text-sm font-medium text-[#3c4a44]">
            No chat queries yet.
          </p>
          <p className="mt-1 text-xs text-[#8a938d]">
            Conversations started from the website chat widget will show up here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-[1.1fr_1fr] gap-4 max-[900px]:grid-cols-1">
          <div className="overflow-hidden rounded-2xl border border-[#dce1dc] bg-white">
            <div className="max-h-[640px] divide-y divide-[#eef1ee] overflow-y-auto">
              {filtered.map((conversation) => (
                <button
                  key={conversation._id}
                  type="button"
                  onClick={() => setSelected(conversation)}
                  className={`flex w-full items-start gap-3 px-4 py-3.5 text-left transition hover:bg-[#f7faf8] ${
                    selected?._id === conversation._id ? "bg-[#f2f7f4]" : ""
                  }`}
                >
                  <div className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#eef5f1] text-[#0d4a44]">
                    <User size={15} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-[12.5px] font-semibold text-[#22302a]">
                        {conversation.name || conversation.email || "Anonymous visitor"}
                      </p>

                      {conversation.status === "new" && (
                        <span className="shrink-0 rounded-full bg-[#0b3b38] px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white">
                          New
                        </span>
                      )}
                    </div>

                    <p className="mt-0.5 truncate text-[11px] text-[#7c8882]">
                      {lastMessagePreview(conversation)}
                    </p>

                    <p className="mt-1 text-[10px] text-[#9aa39d]">
                      {formatDate(conversation.updatedAt)} ·{" "}
                      {(conversation.messages ?? []).length} message
                      {(conversation.messages ?? []).length === 1 ? "" : "s"}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* DETAIL PANEL */}
          <div className="rounded-2xl border border-[#dce1dc] bg-white">
            {!selected ? (
              <div className="flex h-full flex-col items-center justify-center gap-2 py-20 text-center">
                <MessageCircle size={24} className="text-[#c3cbc6]" />
                <p className="text-xs text-[#8a938d]">
                  Select a conversation to view the full thread.
                </p>
              </div>
            ) : (
              <div className="flex h-full flex-col">
                <div className="flex items-start justify-between gap-3 border-b border-[#eef1ee] px-5 py-4">
                  <div>
                    <p className="text-sm font-semibold text-[#22302a]">
                      {selected.name || "Anonymous visitor"}
                    </p>

                    {selected.email && (
                      <p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-[#7c8882]">
                        <Mail size={11} />
                        {selected.email}
                      </p>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelected(null)}
                    className="rounded-full p-1.5 text-[#9aa39d] transition hover:bg-[#f2f7f4]"
                    aria-label="Close"
                  >
                    <X size={16} />
                  </button>
                </div>

                <div className="flex max-h-[440px] flex-1 flex-col gap-3 overflow-y-auto px-5 py-4">
                  {(selected.messages ?? []).map((message, i) => (
                    <div
                      key={i}
                      className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-[12.5px] leading-relaxed ${
                        message.role === "user"
                          ? "self-end rounded-br-sm bg-[#0b3b38] text-white"
                          : "self-start rounded-bl-sm bg-[#f0ebe0] text-[#3a4a45]"
                      }`}
                    >
                      {message.text}
                    </div>
                  ))}
                </div>

                <div className="border-t border-[#eef1ee] px-5 py-3.5">
                  <button
                    type="button"
                    disabled={
                      selected.status === "read" ||
                      updatingStatusId === selected._id
                    }
                    onClick={async () => {
                      await updateStatus(selected._id, "read");
                      setSelected((current) =>
                        current ? { ...current, status: "read" } : current,
                      );
                    }}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-[#0b3b38] px-4 py-2.5 text-[11px] font-semibold text-white transition hover:bg-[#0e4a45] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <CheckCircle2 size={13} />
                    {selected.status === "read"
                      ? "Marked as read"
                      : updatingStatusId === selected._id
                        ? "Saving…"
                        : "Mark as read"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
