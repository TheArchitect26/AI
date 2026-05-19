import type { ChatResponse } from "./types";

function safeId(prefix = "msg") {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return safeId();
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}


export function assistantFromAiBrainReply(payload: unknown): ChatResponse {
  const data = payload && typeof payload === "object" ? (payload as Record<string, unknown>) : {};
  const content =
    (typeof data.reply === "string" && data.reply) ||
    (typeof data.content === "string" && data.content) ||
    (typeof data.message === "string" && data.message) ||
    "No response.";

  return {
    id: typeof data.id === "string" ? data.id : safeId(),
    role: "assistant",
    content,
    parts: [{ type: "text", text: content }],
    createdAt: typeof data.createdAt === "string" ? data.createdAt : new Date().toISOString(),
  };
}
