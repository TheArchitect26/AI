import { handleChat } from "./chat";
import { handleConversations } from "./conversations";
import { handleFiles } from "./files";
import { handleHealth } from "./health";
import { handleMemory } from "./memory";
import { json } from "./response";

export async function handleApiRequest(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const path = url.pathname.replace(/\/+$/, "") || "/";

  if (request.method === "GET" && path === "/api/health") return handleHealth();

  if (path === "/api/chat" && request.method === "POST") return handleChat(request);

  const memory = await handleMemory(request, path);
  if (memory) return memory;

  const conversations = await handleConversations(request, path);
  if (conversations) return conversations;

  const files = await handleFiles(request, path);
  if (files) return files;

  return json({ error: "Not found", path, method: request.method }, 404);
}
