import type { PersistenceAdapter } from "./types";
import { SqliteAdapter } from "./sqlite";

let adapter: PersistenceAdapter | null = null;

export function getPersistence(): PersistenceAdapter {
  if (!adapter) {
    adapter = new SqliteAdapter();
    adapter.init();
  }

  return adapter;
}
