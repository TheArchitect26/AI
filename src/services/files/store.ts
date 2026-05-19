import { mkdirSync, readFileSync, unlinkSync, writeFileSync, existsSync } from "node:fs";
import { basename, extname, join, resolve } from "node:path";
import { getPersistence } from "@/services/persistence";
import type { NexusFile } from "./types";

const ALLOWED = new Set(["txt", "md", "json", "csv"]);
const MIME: Record<string, NexusFile["mimeType"]> = { txt: "text/plain", md: "text/markdown", json: "application/json", csv: "text/csv" };
const uploadsDir = resolve(process.cwd(), "uploads");
mkdirSync(uploadsDir, { recursive: true });
const now = () => new Date().toISOString();
const genId = () => (typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`);
const maxBytes = () => (Number(process.env.MAX_UPLOAD_MB || "10") || 10) * 1024 * 1024;

function sanitizeName(name: string) { return basename(name).replace(/[^a-zA-Z0-9._-]/g, "_") || "upload.txt"; }
function mapRow(row: Record<string, unknown>): NexusFile { return { id: String(row.id), originalName: String(row.original_name), storedName: String(row.stored_name), path: String(row.path), mimeType: String(row.mime_type), size: Number(row.size), kind: String(row.kind) as NexusFile["kind"], status: String(row.status) as NexusFile["status"], summary: row.summary ? String(row.summary) : null, createdAt: String(row.created_at), updatedAt: String(row.updated_at) }; }

export function createFileRecord(input: { filename: string; contentBase64: string }) {
  const original = sanitizeName(input.filename);
  const ext = extname(original).replace(".", "").toLowerCase();
  if (!ALLOWED.has(ext)) throw new Error("Unsupported file type");
  const bytes = Buffer.from(input.contentBase64, "base64");
  if (bytes.length > maxBytes()) throw new Error("File too large");
  const id = genId();
  const storedName = `${id}.${ext}`;
  const fullPath = join(uploadsDir, storedName);
  writeFileSync(fullPath, bytes);
  const record: NexusFile = { id, originalName: original, storedName, path: fullPath, mimeType: MIME[ext], size: bytes.length, kind: ext as NexusFile["kind"], status: "uploaded", summary: null, createdAt: now(), updatedAt: now() };
  getPersistence().execute("INSERT INTO files(id,original_name,stored_name,path,mime_type,size,kind,status,summary,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)", [record.id, record.originalName, record.storedName, record.path, record.mimeType, record.size, record.kind, record.status, record.summary, record.createdAt, record.updatedAt]);
  return record;
}
export function listFiles(): NexusFile[] { return getPersistence().query("SELECT * FROM files ORDER BY updated_at DESC").rows.map((r) => mapRow(r as Record<string, unknown>)); }
export function getFile(fileId: string): NexusFile | null { const rows = getPersistence().query("SELECT * FROM files WHERE id = ?", [fileId]).rows; return rows[0] ? mapRow(rows[0] as Record<string, unknown>) : null; }
export function deleteFile(fileId: string): boolean { const file = getFile(fileId); if (!file) return false; if (existsSync(file.path)) unlinkSync(file.path); getPersistence().execute("DELETE FROM files WHERE id = ?", [fileId]); return true; }
export function readFilePreview(fileId: string): string { const file = getFile(fileId); if (!file) throw new Error("File not found"); const safePath = resolve(file.path); if (!safePath.startsWith(uploadsDir)) throw new Error("Unsafe path"); return readFileSync(safePath, "utf8").slice(0, 20000); }
export function updateFileSummary(fileId: string, summary: string) { const file = getFile(fileId); if (!file) throw new Error("File not found"); const updatedAt = now(); getPersistence().execute("UPDATE files SET summary = ?, status = 'analyzed', updated_at = ? WHERE id = ?", [summary, updatedAt, fileId]); return getFile(fileId)!; }
