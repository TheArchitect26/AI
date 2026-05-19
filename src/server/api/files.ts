import { getAiBrainBaseUrl } from "@/services/api/server-config";
import { createMemory } from "@/services/memory/store";
import { createFileRecord, deleteFile, getFile, listFiles, readFilePreview, updateFileSummary } from "@/services/files/store";
import { json } from "./response";

function ext(name: string) {
  const m = name.toLowerCase().match(/\.([a-z0-9]+)$/);
  return m ? m[1] : "txt";
}

export async function handleFiles(request: Request, path: string) {
  if (request.method === "GET" && path === "/api/files") return json({ files: listFiles() });

  if (request.method === "POST" && path === "/api/files") {
    const body = (await request.json().catch(() => ({}))) as { filename?: unknown; contentBase64?: unknown };
    if (typeof body.filename !== "string" || typeof body.contentBase64 !== "string") {
      return json({ error: "filename and contentBase64 are required" }, 400);
    }
    try {
      return json({ file: createFileRecord({ filename: body.filename, contentBase64: body.contentBase64 }) }, 201);
    } catch (error) {
      return json({ error: error instanceof Error ? error.message : "Upload failed" }, 400);
    }
  }

  const contentMatch = path.match(/^\/api\/files\/([^/]+)\/content$/);
  if (request.method === "GET" && contentMatch) {
    try {
      return json({ content: readFilePreview(contentMatch[1]) });
    } catch (error) {
      return json({ error: error instanceof Error ? error.message : "Failed to read file" }, 404);
    }
  }

  const analyzeMatch = path.match(/^\/api\/files\/([^/]+)\/analyze$/);
  if (request.method === "POST" && analyzeMatch) {
    const fileId = analyzeMatch[1];
    const file = getFile(fileId);
    if (!file) return json({ error: "File not found" }, 404);

    const content = readFilePreview(fileId);
    const prompt = `Summarize this ${file.kind} file for a personal AI knowledge base.\n\n${content}`;
    const upstream = await fetch(`${getAiBrainBaseUrl()}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ message: prompt }),
      signal: request.signal,
    });
    const text = await upstream.text();
    let summary = text;
    try {
      const parsed = JSON.parse(text) as { reply?: unknown; error?: unknown };
      if (typeof parsed.reply === "string") summary = parsed.reply;
      else if (typeof parsed.error === "string") summary = parsed.error;
    } catch {}
    if (!upstream.ok) return json({ error: summary || "AI Brain analyze failed" }, upstream.status);

    const updated = updateFileSummary(fileId, summary);
    return json({ file: updated, summary });
  }

  const saveMatch = path.match(/^\/api\/files\/([^/]+)\/save-summary-to-memory$/);
  if (request.method === "POST" && saveMatch) {
    const file = getFile(saveMatch[1]);
    if (!file) return json({ error: "File not found" }, 404);
    if (!file.summary) return json({ error: "File summary not available" }, 400);

    const memory = createMemory({
      title: `File Summary: ${file.originalName}`,
      content: file.summary,
      category: "file-summary",
      tags: ["file", ext(file.originalName)],
      importance: 3,
    });
    return json({ memory, file });
  }

  const deleteMatch = path.match(/^\/api\/files\/([^/]+)$/);
  if (request.method === "DELETE" && deleteMatch) {
    if (!deleteFile(deleteMatch[1])) return json({ error: "File not found" }, 404);
    return json({ ok: true });
  }

  return null;
}
