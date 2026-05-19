import { getAiBrainBaseUrl } from "@/services/api/server-config";
import { createMemory } from "@/services/memory/store";
import { createStoredFile, deleteStoredFile, getStoredFile, listStoredFiles, readStoredFileContent, updateFileSummary } from "@/services/files/store";
import { json } from "./response";

export async function handleFiles(request: Request, path: string) {
  if (request.method === "GET" && path === "/api/files") return json({ files: listStoredFiles() });

  if (request.method === "POST" && path === "/api/files") {
    const body = (await request.json().catch(() => ({}))) as { name?: unknown; mimeType?: unknown; content?: unknown };
    const name = typeof body.name === "string" ? body.name : "";
    const content = typeof body.content === "string" ? body.content : "";
    const mimeType = typeof body.mimeType === "string" ? body.mimeType : "text/plain";
    if (!name || !content) return json({ error: "name and content are required" }, 400);
    try {
      return json({ file: createStoredFile(name, mimeType, content) }, 201);
    } catch (error) {
      return json({ error: error instanceof Error ? error.message : "File upload failed" }, 400);
    }
  }

  const contentMatch = path.match(/^\/api\/files\/([^/]+)\/content$/);
  if (request.method === "GET" && contentMatch) {
    try {
      const file = getStoredFile(contentMatch[1]);
      if (!file) return json({ error: "File not found" }, 404);
      return json({ file, content: readStoredFileContent(contentMatch[1]) });
    } catch (error) {
      return json({ error: error instanceof Error ? error.message : "Preview failed" }, 400);
    }
  }

  const analyzeMatch = path.match(/^\/api\/files\/([^/]+)\/analyze$/);
  if (request.method === "POST" && analyzeMatch) {
    const fileId = analyzeMatch[1];
    const file = getStoredFile(fileId);
    if (!file) return json({ error: "File not found" }, 404);

    let content = "";
    try { content = readStoredFileContent(fileId); } catch (error) { return json({ error: error instanceof Error ? error.message : "Unable to read file" }, 400); }

    const prompt = `Summarize this ${file.kind.toUpperCase()} file for a personal AI memory system. Include key facts and action items.\n\n${content.slice(0, 15000)}`;
    const upstream = await fetch(`${getAiBrainBaseUrl()}/api/chat`, { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify({ message: prompt }), signal: request.signal });
    const raw = await upstream.text();
    let summary = raw;
    try { const parsed = JSON.parse(raw) as { reply?: string; error?: string }; if (parsed.reply) summary = parsed.reply; else if (parsed.error) summary = parsed.error; } catch {}

    if (!upstream.ok) return json({ error: summary || "AI Brain analysis failed" }, upstream.status);

    const updated = updateFileSummary(fileId, summary);
    return json({ file: updated, summary });
  }

  const saveMatch = path.match(/^\/api\/files\/([^/]+)\/save-summary-to-memory$/);
  if (request.method === "POST" && saveMatch) {
    const file = getStoredFile(saveMatch[1]);
    if (!file) return json({ error: "File not found" }, 404);
    if (!file.summary) return json({ error: "File has no summary yet" }, 400);
    const memory = createMemory({ title: `File Summary: ${file.originalName}`, content: file.summary, category: "file-summary", tags: ["file", file.kind], importance: 3 });
    return json({ memory, file });
  }

  const delMatch = path.match(/^\/api\/files\/([^/]+)$/);
  if (request.method === "DELETE" && delMatch) {
    if (!deleteStoredFile(delMatch[1])) return json({ error: "File not found" }, 404);
    return json({ ok: true });
  }

  return null;
}
