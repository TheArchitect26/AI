import { createMemory, deleteMemory, listMemories, searchMemories } from "@/services/memory/store";
import { json } from "./response";

export async function handleMemory(request: Request, path: string) {
  const url = new URL(request.url);

  if (request.method === "GET" && path === "/api/memory") return json({ memories: listMemories() });
  if (request.method === "GET" && path === "/api/memory/search") {
    const q = (url.searchParams.get("q") || "").trim();
    return json({ memories: q ? searchMemories(q) : [] });
  }

  if (request.method === "POST" && path === "/api/memory") {
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const title = typeof body.title === "string" ? body.title.trim() : "";
    const content = typeof body.content === "string" ? body.content.trim() : "";
    if (!title || !content) return json({ error: "title and content are required" }, 400);
    const importance = typeof body.importance === "number" ? body.importance : undefined;
    const category = typeof body.category === "string" ? body.category : undefined;
    const tags = Array.isArray(body.tags) ? body.tags.filter((t): t is string => typeof t === "string") : undefined;
    return json({ memory: createMemory({ title, content, category, tags, importance }) }, 201);
  }

  if (request.method === "DELETE" && path.startsWith("/api/memory/")) {
    const id = path.replace("/api/memory/", "").trim();
    if (!id) return json({ error: "memory id is required" }, 400);
    if (!deleteMemory(id)) return json({ error: "memory not found" }, 404);
    return json({ ok: true });
  }

  return null;
}
