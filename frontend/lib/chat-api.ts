import { apiRequest } from "@/lib/api";

export type SendChatMessagePayload = {
  sessionId: string;
  message: string;
  name?: string;
  email?: string;
};

export async function sendChatMessage(payload: SendChatMessagePayload) {
  return apiRequest<{
    success: true;
    reply: string;
    data: { id: string; sessionId: string };
  }>("/chat/message", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

const SESSION_STORAGE_KEY = "nh_chat_session_id";

/*
 * One id per browser, kept in localStorage, so a visitor's
 * messages across page loads thread into the same conversation
 * and show up together on the admin dashboard.
 */
export function getOrCreateChatSessionId(): string {
  if (typeof window === "undefined") return "";

  try {
    const existing = window.localStorage.getItem(SESSION_STORAGE_KEY);
    if (existing) return existing;

    const id =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `chat-${Date.now()}-${Math.random().toString(36).slice(2)}`;

    window.localStorage.setItem(SESSION_STORAGE_KEY, id);
    return id;
  } catch {
    // localStorage unavailable (e.g. private browsing) — fall back
    // to an in-memory id for this page load only.
    return `chat-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }
}
