import { appendConversationMessage, createConversation, getConversationMessages, listConversations } from "@/services/conversations/store";
import { json } from "./response";

const ROLES = new Set(["user", "assistant", "system"]);

export async function handleConversations(request: Request, path: string) {
  if (request.method === "GET" && path === "/api/conversations") return json({ conversations: listConversations() });

  if (request.method === "POST" && path === "/api/conversations") {
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const title = typeof body.title === "string" ? body.title : undefined;
    return json({ conversation: createConversation(title) }, 201);
  }

  const m = path.match(/^\/api\/conversations\/([^/]+)\/messages$/);
  if (!m) return null;
  const conversationId = m[1];

  if (request.method === "GET") return json({ messages: getConversationMessages(conversationId) });

  if (request.method === "POST") {
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const role = typeof body.role === "string" ? body.role : "";
    const content = typeof body.content === "string" ? body.content.trim() : "";
    if (!ROLES.has(role) || !content) return json({ error: "valid role and content are required" }, 400);
    return json({ message: appendConversationMessage(conversationId, role as "user"|"assistant"|"system", content) }, 201);
  }
  return null;
}
