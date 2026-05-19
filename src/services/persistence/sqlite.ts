import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";
import type { PersistenceAdapter, QueryResult, Row, SqlValue } from "./types";

const DEFAULT_DB_PATH = "data/nexus.db";

function getDbPath() {
  return resolve(process.cwd(), process.env.NEXUS_DB_PATH || DEFAULT_DB_PATH);
}

function ensureDataDir(filePath: string) {
  mkdirSync(dirname(filePath), { recursive: true });
}

function coerceRows<T extends Row>(rows: unknown): T[] {
  if (!Array.isArray(rows)) return [];
  return rows as T[];
}

export class SqliteAdapter implements PersistenceAdapter {
  private db: DatabaseSync;

  constructor() {
    const dbPath = getDbPath();
    ensureDataDir(dbPath);
    this.db = new DatabaseSync(dbPath);
  }

  init() {
    this.db.exec(`
      PRAGMA journal_mode = WAL;
      PRAGMA foreign_keys = ON;

      CREATE TABLE IF NOT EXISTS system_meta (
        key TEXT PRIMARY KEY,
        value TEXT,
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS memories (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        category TEXT NOT NULL DEFAULT 'general',
        tags TEXT NOT NULL DEFAULT '[]',
        importance REAL NOT NULL DEFAULT 0.5,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );


      CREATE TABLE IF NOT EXISTS files (
        id TEXT PRIMARY KEY,
        original_name TEXT NOT NULL,
        stored_name TEXT NOT NULL,
        path TEXT NOT NULL,
        mime_type TEXT NOT NULL,
        size INTEGER NOT NULL,
        kind TEXT NOT NULL,
        status TEXT NOT NULL,
        summary TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS conversations (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS conversation_messages (
        id TEXT PRIMARY KEY,
        conversation_id TEXT NOT NULL,
        role TEXT NOT NULL CHECK (role IN ('user','assistant','system')),
        content TEXT NOT NULL,
        created_at TEXT NOT NULL,
        FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_memories_created_at ON memories(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_memories_importance ON memories(importance DESC);
      CREATE INDEX IF NOT EXISTS idx_conversations_updated_at ON conversations(updated_at DESC);
      CREATE INDEX IF NOT EXISTS idx_conversation_messages_conversation ON conversation_messages(conversation_id, created_at ASC);

      INSERT OR IGNORE INTO system_meta(key, value) VALUES ('schema_version', 'phase1c');
      UPDATE system_meta SET value='phase1c', updated_at=datetime('now') WHERE key='schema_version';
    `);
  }

  query<T extends Row = Row>(sql: string, params: SqlValue[] = []): QueryResult<T> {
    const statement = this.db.prepare(sql);
    const rows = statement.all(...params);
    return { rows: coerceRows<T>(rows) };
  }

  execute(sql: string, params: SqlValue[] = []) {
    const statement = this.db.prepare(sql);
    statement.run(...params);
  }

  close() {
    this.db.close();
  }
}
