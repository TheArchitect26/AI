import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { basename, extname, join, normalize, resolve } from "node:path";
import { getPersistence } from "@/services/persistence";
import type { StoredFile } from "./types";

const uploadsDir = resolve(process.cwd(), "uploads");
const allowed = new Set(["txt", "md", "json", "csv"]);

const now = () => new Date().toISOString();
const id = () => (typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`);

function sanitizeName(name: string) {
  return basename(name).replace(/[^a-zA-Z0-9._-]/g, "_");
}

function toRow(file: StoredFile) {
  return [file.id, file.originalName, file.storedName, file.path, file.mimeType, file.size, file.kind, file.status, file.summary, file.createdAt, file.updatedAt];
}

function mapRow(row: Record<string, unknown>): StoredFile {
  return {
    id: String(row.id), originalName: String(row.original_name), storedName: String(row.stored_name), path: String(row.path), mimeType: String(row.mime_type),
    size: Number(row.size), kind: String(row.kind), status: String(row.status), summary: row.summary ? String(row.summary) : null,
    createdAt: String(row.created_at), updatedAt: String(row.updated_at),
  };
}

export function ensureUploadsDir() { mkdirSync(uploadsDir, { recursive: true }); }

export function maxUploadBytes() {
  const mb = Number(process.env.MAX_UPLOAD_MB || "10");
  return Math.max(1, mb) * 1024 * 1024;
}

export function createStoredFile(name: string, mimeType: string, content: string): StoredFile {
  ensureUploadsDir();
  const clean = sanitizeName(name || "file.txt");
  const extension = extname(clean).replace(".", "").toLowerCase();
  if (!allowed.has(extension)) throw new Error("Unsupported file type");

  const bytes = Buffer.byteLength(content, "utf8");
  if (bytes > maxUploadBytes()) throw new Error("File too large");

  const storedName = `${id()}.${extension}`;
  const safePath = normalize(join(uploadsDir, storedName));
  if (!safePath.startsWith(uploadsDir)) throw new Error("Invalid path");

  writeFileSync(safePath, content, "utf8");
  const file: StoredFile = { id: id(), originalName: clean, storedName, path: safePath, mimeType: mimeType || "text/plain", size: bytes, kind: extension, status: "uploaded", summary: null, createdAt: now(), updatedAt: now() };
  getPersistence().execute("INSERT INTO files(id,original_name,stored_name,path,mime_type,size,kind,status,summary,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)", toRow(file));
  return file;
}

export function listStoredFiles(): StoredFile[] { return getPersistence().query("SELECT * FROM files ORDER BY created_at DESC").rows.map((r) => mapRow(r as Record<string, unknown>)); }

export function getStoredFile(fileId: string): StoredFile | null {
  const rows = getPersistence().query("SELECT * FROM files WHERE id = ?", [fileId]).rows;
  return rows[0] ? mapRow(rows[0] as Record<string, unknown>) : null;
}

export function readStoredFileContent(fileId: string): string {
  const file = getStoredFile(fileId);
  if (!file) throw new Error("File not found");
  if (!allowed.has(file.kind)) throw new Error("Unsupported file type");
  const safePath = normalize(file.path);
  if (!safePath.startsWith(uploadsDir)) throw new Error("Invalid file path");
  return readFileSync(safePath, "utf8");
}

export function updateFileSummary(fileId: string, summary: string): StoredFile {
  const file = getStoredFile(fileId);
  if (!file) throw new Error("File not found");
  const updatedAt = now();
  getPersistence().execute("UPDATE files SET summary = ?, status = ?, updated_at = ? WHERE id = ?", [summary, "analyzed", updatedAt, fileId]);
  return { ...file, summary, status: "analyzed", updatedAt };
}

export function deleteStoredFile(fileId: string): boolean {
  const file = getStoredFile(fileId);
  if (!file) return false;
  rmSync(file.path, { force: true });
  getPersistence().execute("DELETE FROM files WHERE id = ?", [fileId]);
  return true;
}
