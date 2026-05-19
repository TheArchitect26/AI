# NEXUS — Personal AI OS: Build Plan

This is a very large scope (20 sections, full design system, architecture docs). I'll deliver it in **phases** so each ships working and reviewable, instead of one massive unstable dump. Note: the project uses **TanStack Start** (not Next.js) — same React/TS/Tailwind/Shadcn/Framer ecosystem, file-based routing under `src/routes/`. All other stack choices stand.

## Phase 1 — Foundation (this turn)
- Cyberpunk/Bloomberg dark design system in `src/styles.css` (oklch tokens: deep space bg, neon cyan/violet accents, glass surfaces, grid overlays, glow shadows, mono+sans typography).
- App shell: persistent left rail nav + top status bar (system pulse, GPU/RAM mini, time, command palette trigger, voice button) wrapping all routes via `__root.tsx`.
- Reusable primitives: `GlassPanel`, `MetricTile`, `StatusDot`, `NeonButton`, `DataGrid`, `SectionHeader`, `Sparkline`, `PulseRing`, `Waveform`, `ActivityFeed`.
- Command Center route — fully built, animated, populated with realistic mock data (agents, GPU, activity, market pulse, alerts, quick-command).
- Route stubs for all 20 sections so nav works end-to-end (each stub uses the design system header + "module online" placeholder, not lorem-ipsum).
- Mock data layer in `src/lib/mock/` (typed, ready to swap for real APIs).
- Zustand store skeleton (`src/stores/`) for system, agents, chat, voice.

## Phase 2 — Core intelligence modules
AI Chat (streaming UI, reasoning panel, tool calls), Voice Console (waveform, transcript), Agent Control Center (React Flow graph), Memory System (graph + timeline).

## Phase 3 — Trading suite
Market Scanner, Signals, Strategy Lab, Trade Journal, AI Learning Center (using lightweight-charts + recharts).

## Phase 4 — Ops modules
Infrastructure Monitoring, Model Manager, Task Orchestrator, Automation Workflows (React Flow), Research Hub, Knowledge Vault, Security Center, API Manager, System Logs, Settings.

## Phase 5 — Architecture docs
`/docs/architecture/` markdown set: system-overview, services, api-contracts, db-schemas, websocket-protocol, agent-orchestration, memory-flow, model-routing, docker-topology, security-model. Plus `openapi.yaml` skeleton and Prisma/SQL schema drafts.

## Technical notes
- Stack delta: TanStack Start replaces Next.js. Routing: `src/routes/*.tsx` with `createFileRoute`. Everything else (TS, Tailwind v4, Shadcn, Framer, Zustand, React Query, lightweight-charts, recharts, reactflow) is added as planned.
- Packages to install in Phase 1: `framer-motion`, `zustand`, `@tanstack/react-query` (already present).
- Phase 2+ adds: `reactflow`, `lightweight-charts`, `recharts`, `cmdk` (already in shadcn).
- Strict semantic tokens — no hex in components.
- Mobile: collapsible rail → bottom dock; ultrawide: max-width clamp on content, panels expand.

## What you get this turn
A running NEXUS shell with a cinematic Command Center, all 20 routes navigable, and the full design system in place. Reply "go" to proceed, or tell me to reorder/drop phases (e.g. "skip trading, prioritize agents+memory").
