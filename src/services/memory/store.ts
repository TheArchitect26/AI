import { getPersistence } from "@/services/persistence";
import type { CreateMemoryInput, MemoryRecord } from "./types";

function id() { return typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`; }
const now = () => new Date().toISOString();
const clamp = (v: number) => Math.max(0, Math.min(10, v));

function mapRow(row: Record<string, unknown>): MemoryRecord {
  return {
    id: String(row.id),
    title: String(row.title),
    content: String(row.content),
    category: String(row.category),
    tags: JSON.parse(String(row.tags || "[]")),
    importance: Number(row.importance),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

export function createMemory(input: CreateMemoryInput): MemoryRecord {
  const db = getPersistence();
  const record: MemoryRecord = {
    id: id(),
    title: input.title.trim(),
    content: input.content.trim(),
    category: (input.category?.trim() || "general").toLowerCase(),
    tags: (input.tags || []).map((t) => t.trim()).filter(Boolean),
    importance: clamp(input.importance ?? 0.5),
    createdAt: now(),
    updatedAt: now(),
  };

  db.execute(
    "INSERT INTO memories(id,title,content,category,tags,importance,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?)",
    [record.id, record.title, record.content, record.category, JSON.stringify(record.tags), record.importance, record.createdAt, record.updatedAt],
  );
  return record;
}

export function listMemories(): MemoryRecord[] {
  const db = getPersistence();
  return db.query("SELECT * FROM memories ORDER BY updated_at DESC").rows.map((r) => mapRow(r as Record<string, unknown>));
}

export function deleteMemory(memoryId: string): boolean {
  const db = getPersistence();
  const existing = db.query("SELECT id FROM memories WHERE id = ?", [memoryId]).rows;
  if (existing.length === 0) return false;
  db.execute("DELETE FROM memories WHERE id = ?", [memoryId]);
  return true;
}

export function searchMemories(q: string): MemoryRecord[] {
  const db = getPersistence();
  const term = `%${q.toLowerCase()}%`;
  return db
    .query("SELECT * FROM memories WHERE lower(title) LIKE ? OR lower(content) LIKE ? OR lower(category) LIKE ? ORDER BY importance DESC, updated_at DESC", [term, term, term])
    .rows.map((r) => mapRow(r as Record<string, unknown>));
}

export function topMemories(limit = 3): MemoryRecord[] {
  const db = getPersistence();
  return db
    .query("SELECT * FROM memories ORDER BY importance DESC, updated_at DESC LIMIT ?", [limit])
    .rows.map((r) => mapRow(r as Record<string, unknown>));
}
