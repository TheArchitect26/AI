// Typed mock data — swap with real API calls in backend phase.

export type AgentStatus = "online" | "idle" | "thinking" | "offline" | "error";
export interface Agent {
  id: string;
  name: string;
  role: string;
  status: AgentStatus;
  load: number; // 0-100
  tasks: number;
  memoryMB: number;
}

export const AGENTS: Agent[] = [
  { id: "quant", name: "Quant", role: "Market analysis & signals", status: "online", load: 72, tasks: 14, memoryMB: 1280 },
  { id: "research", name: "Research", role: "Web & doc intelligence", status: "thinking", load: 88, tasks: 6, memoryMB: 2140 },
  { id: "coding", name: "Codex", role: "Software engineering", status: "online", load: 41, tasks: 3, memoryMB: 980 },
  { id: "automation", name: "Automaton", role: "Workflow execution", status: "idle", load: 12, tasks: 1, memoryMB: 320 },
  { id: "memory", name: "Mnemo", role: "Long-term memory", status: "online", load: 28, tasks: 9, memoryMB: 1640 },
  { id: "strategy", name: "Strategos", role: "Planning & reasoning", status: "thinking", load: 64, tasks: 4, memoryMB: 1180 },
  { id: "monitoring", name: "Sentinel", role: "Infra & telemetry", status: "online", load: 18, tasks: 22, memoryMB: 240 },
  { id: "vision", name: "Iris", role: "Image & chart vision", status: "idle", load: 4, tasks: 0, memoryMB: 110 },
  { id: "security", name: "Aegis", role: "Access & audit", status: "online", load: 9, tasks: 2, memoryMB: 180 },
];

export interface SystemMetric { label: string; value: number; unit: string; max: number; tone: "cyan" | "violet" | "amber" | "lime" }
export const SYSTEM_METRICS: SystemMetric[] = [
  { label: "GPU", value: 71, unit: "%", max: 100, tone: "cyan" },
  { label: "VRAM", value: 18.4, unit: "GB", max: 24, tone: "violet" },
  { label: "CPU", value: 34, unit: "%", max: 100, tone: "lime" },
  { label: "RAM", value: 42.1, unit: "GB", max: 64, tone: "amber" },
];

export interface ActivityEvent { id: string; ts: string; agent: string; type: string; message: string; tone: "info" | "warn" | "error" | "ok" }
export const ACTIVITY: ActivityEvent[] = [
  { id: "1", ts: "12:48:22", agent: "Quant", type: "signal", message: "BTCUSD long setup — confidence 0.78 — 4H regime: trending", tone: "ok" },
  { id: "2", ts: "12:48:11", agent: "Mnemo", type: "recall", message: "Retrieved 14 vectors from episodic memory (topic: macro)", tone: "info" },
  { id: "3", ts: "12:47:55", agent: "Sentinel", type: "alert", message: "Inference latency p95 crossed 480ms on llama3-70b", tone: "warn" },
  { id: "4", ts: "12:47:30", agent: "Research", type: "ingest", message: "Indexed 47 articles into knowledge vault", tone: "info" },
  { id: "5", ts: "12:46:58", agent: "Codex", type: "task", message: "Refactored ingestion pipeline — 3 files, 218 lines", tone: "ok" },
  { id: "6", ts: "12:46:12", agent: "Strategos", type: "plan", message: "Decomposed task #482 into 7 sub-tasks", tone: "info" },
  { id: "7", ts: "12:45:40", agent: "Aegis", type: "audit", message: "API key rotation scheduled for binance-spot", tone: "info" },
  { id: "8", ts: "12:45:02", agent: "Quant", type: "signal", message: "ETHUSD volatility spike — regime shift detected", tone: "warn" },
];

export interface MarketTick { sym: string; price: number; chg: number }
export const MARKET: MarketTick[] = [
  { sym: "BTCUSD", price: 71284.40, chg: 1.82 },
  { sym: "ETHUSD", price: 3842.10, chg: -0.64 },
  { sym: "SPX", price: 5421.6, chg: 0.31 },
  { sym: "NDX", price: 19284.2, chg: 0.78 },
  { sym: "DXY", price: 104.21, chg: -0.12 },
  { sym: "GOLD", price: 2384.5, chg: 0.44 },
  { sym: "OIL", price: 78.92, chg: -1.10 },
  { sym: "VIX", price: 13.84, chg: 2.20 },
];

export const SPARK = (n = 32, seed = 1) => {
  const out: number[] = [];
  let v = 50;
  for (let i = 0; i < n; i++) { v += (Math.sin(i * seed) + Math.cos(i * 0.7) * 0.6) * 4; out.push(v); }
  return out;
};
