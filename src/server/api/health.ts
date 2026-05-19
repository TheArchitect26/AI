import { getPersistence } from "@/services/persistence";
import { json } from "./response";

export async function handleHealth() {
  const db = getPersistence();
  const schema = db.query<{ value: string }>("SELECT value FROM system_meta WHERE key = ?", [
    "schema_version",
  ]);

  return json({
    ok: true,
    service: "nexus-local-api",
    storage: {
      engine: "sqlite",
      schemaVersion: schema.rows[0]?.value ?? "unknown",
    },
    timestamp: new Date().toISOString(),
  });
}
