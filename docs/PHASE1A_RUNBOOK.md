# Phase 1A Runbook (Core Local Backend Foundation)

## What this phase adds

- Local `/api/*` backend routing handled by server entry before UI SSR.
- SQLite-first persistence adapter (single-user local mode).
- Base schema bootstrap (`system_meta`) under `data/nexus.db` by default.
- Health endpoint: `GET /api/health`.

## Environment variables

- `NEXUS_DB_PATH` (optional): filesystem path to sqlite DB file.
  - default: `data/nexus.db`

## Local run

```bash
npm install
npm run dev
```

## Verify

```bash
curl -s http://localhost:5173/api/health
```

Expected shape:

```json
{
  "ok": true,
  "service": "nexus-local-api",
  "storage": {
    "engine": "sqlite",
    "schemaVersion": "phase1a"
  },
  "timestamp": "..."
}
```

## Notes

- This foundation is intentionally personal-only/local-first.
- Memory, conversations, files, tasks, tools, and sandbox endpoints are added in later phases.
