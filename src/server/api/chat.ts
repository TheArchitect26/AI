import { getAiBrainBaseUrl } from "@/services/api/server-config";
import { appendConversationMessage, createConversation } from "@/services/conversations/store";
import { topMemories } from "@/services/memory/store";
import { json } from "./response";

export async function handleChat(request: Request) {
  const body = (await request.json().catch(() => ({}))) as { message?: unknown; conversationId?: unknown };
  const message = typeof body.message === "string" ? body.message.trim() : "";
  if (!message) return json({ error: "message is required" }, 400);

  const conversation =
    typeof body.conversationId === "string" && body.conversationId.trim()
      ? { id: body.conversationId }
      : createConversation();

  appendConversationMessage(conversation.id, "user", message);

  let contextualMessage = message;
  try {
    const memories = topMemories(3);
    if (memories.length > 0) {
      const memoryContext = memories
        .map((m, i) => `${i + 1}. [${m.category}] ${m.title}: ${m.content}`)
        .join("\n");
      contextualMessage = `Context memories:\n${memoryContext}\n\nUser request:\n${message}`;
    }
  } catch {
    // memory context optional
  }

  const upstream = await fetch(`${getAiBrainBaseUrl()}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ message: contextualMessage }),
    signal: request.signal,
  });

  const text = await upstream.text();
  let reply = text;
  try {
    const payload = JSON.parse(text) as { reply?: unknown; error?: unknown };
    if (typeof payload.reply === "string") reply = payload.reply;
    else if (typeof payload.error === "string") reply = payload.error;
  } catch {
    // keep text
  }

  if (!upstream.ok) return json({ error: reply || "AI Brain backend failed" }, upstream.status);

  const assistantMessage = appendConversationMessage(conversation.id, "assistant", reply);
  return json({ reply, conversationId: conversation.id, assistantMessage });
}
