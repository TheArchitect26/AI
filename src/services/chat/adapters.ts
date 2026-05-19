import type { ChatResponse } from "./types";

export function assistantFromAiBrainReply(payload: unknown): ChatResponse {
  const data = payload && typeof payload === "object" ? (payload as Record<string, unknown>) : {};
  const content =
    (typeof data.reply === "string" && data.reply) ||
    (typeof data.content === "string" && data.content) ||
    (typeof data.message === "string" && data.message) ||
    "No response.";

  return {
    id: typeof data.id === "string" ? data.id : crypto.randomUUID(),
    role: "assistant",
    content,
    parts: [{ type: "text", text: content }],
    createdAt: typeof data.createdAt === "string" ? data.createdAt : new Date().toISOString(),
  };
}
