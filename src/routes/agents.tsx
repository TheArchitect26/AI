import { createFileRoute } from "@tanstack/react-router";
import { GlassPanel, SectionHeader, StatusDot, NeonButton, MetricTile } from "@/components/nexus/primitives";
import ReactFlow, { Background, Controls, Handle, Position, type Node, type Edge, type NodeProps } from "reactflow";
import "reactflow/dist/style.css";
import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Brain, LineChart, Radar, Wrench, Database, MessageSquare, ShieldCheck, Workflow, Wifi, WifiOff } from "lucide-react";

export const Route = createFileRoute("/agents")({
  head: () => ({ meta: [{ title: "Agent Control Center — NEXUS" }, { name: "description", content: "Live agent swarm telemetry" }] }),
  component: Page,
});

type AgentStatus = "online" | "warn" | "error" | "idle";
type AgentData = { label: string; role: string; status: AgentStatus; load: number; icon: keyof typeof ICONS; msgsPerMin: number; latencyMs: number };
const ICONS = { Brain, LineChart, Radar, Wrench, Database, MessageSquare, ShieldCheck, Workflow };

function AgentNode({ data, selected }: NodeProps<AgentData>) {
  const Icon = ICONS[data.icon];
  const tone = data.status === "online" ? "border-neon-cyan/60 shadow-[0_0_24px_-8px_var(--neon-cyan)]" :
    data.status === "warn" ? "border-[color:var(--neon-amber)]/60 shadow-[0_0_24px_-8px_var(--neon-amber)]" :
    data.status === "error" ? "border-status-error/70" : "border-border";
  return (
    <div className={cn("min-w-[180px] rounded-lg border bg-background/85 p-2.5 backdrop-blur-xl transition-all", tone, selected && "ring-1 ring-neon-cyan")}>
      <Handle type="target" position={Position.Top} className="!h-1.5 !w-1.5 !bg-neon-cyan" />
      <div className="flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded border border-border/50 bg-[color-mix(in_oklab,var(--neon-cyan)_10%,transparent)]">
          <Icon className="h-3.5 w-3.5 text-neon-cyan" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-[11px] font-semibold">{data.label}</div>
          <div className="font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground">{data.role}</div>
        </div>
        <StatusDot tone={data.status} pulse={data.status === "online"} />
      </div>
      <div className="mt-2 h-1 overflow-hidden rounded-full bg-muted">
        <div className={cn("h-full transition-all duration-700 ease-out",
          data.load > 85 ? "bg-gradient-to-r from-[color:var(--neon-amber)] to-status-error" :
          "bg-gradient-to-r from-[color:var(--neon-cyan)] to-[color:var(--neon-violet)]")}
          style={{ width: `${data.load}%` }} />
      </div>
      <div className="mt-1.5 flex justify-between font-mono text-[9px] text-muted-foreground tabular-nums">
        <span>{data.load}%</span>
        <span>{data.msgsPerMin}/m</span>
        <span>{data.latencyMs}ms</span>
      </div>
      <Handle type="source" position={Position.Bottom} className="!h-1.5 !w-1.5 !bg-neon-violet" />
    </div>
  );
}

const nodeTypes = { agent: AgentNode };

const INITIAL_NODES: Node<AgentData>[] = [
  { id: "orchestrator", type: "agent", position: { x: 360, y: 20 }, data: { label: "Orchestrator", role: "router", status: "online", load: 62, icon: "Workflow", msgsPerMin: 84, latencyMs: 12 } },
  { id: "research", type: "agent", position: { x: 40, y: 180 }, data: { label: "Research Agent", role: "deep search", status: "online", load: 78, icon: "Brain", msgsPerMin: 32, latencyMs: 142 } },
  { id: "trader", type: "agent", position: { x: 250, y: 180 }, data: { label: "Trader Agent", role: "markets", status: "online", load: 41, icon: "LineChart", msgsPerMin: 18, latencyMs: 45 } },
  { id: "scanner", type: "agent", position: { x: 460, y: 180 }, data: { label: "Scanner", role: "signals", status: "warn", load: 88, icon: "Radar", msgsPerMin: 211, latencyMs: 8 } },
  { id: "tools", type: "agent", position: { x: 680, y: 180 }, data: { label: "Tool Runner", role: "exec", status: "online", load: 33, icon: "Wrench", msgsPerMin: 24, latencyMs: 64 } },
  { id: "memory", type: "agent", position: { x: 150, y: 360 }, data: { label: "Memory", role: "vector store", status: "online", load: 24, icon: "Database", msgsPerMin: 96, latencyMs: 6 } },
  { id: "chat", type: "agent", position: { x: 360, y: 360 }, data: { label: "Dialog", role: "user io", status: "online", load: 19, icon: "MessageSquare", msgsPerMin: 14, latencyMs: 22 } },
  { id: "guard", type: "agent", position: { x: 570, y: 360 }, data: { label: "Guardrails", role: "policy", status: "idle", load: 8, icon: "ShieldCheck", msgsPerMin: 2, latencyMs: 4 } },
];

const INITIAL_EDGES: Edge[] = [
  { id: "e1", source: "orchestrator", target: "research" },
  { id: "e2", source: "orchestrator", target: "trader" },
  { id: "e3", source: "orchestrator", target: "scanner" },
  { id: "e4", source: "orchestrator", target: "tools" },
  { id: "e5", source: "research", target: "memory" },
  { id: "e6", source: "trader", target: "memory" },
  { id: "e7", source: "scanner", target: "chat" },
  { id: "e8", source: "tools", target: "guard" },
  { id: "e9", source: "chat", target: "guard" },
];

type Tick = { id: string; ts: number; agent: string; type: "load" | "status" | "msg"; detail: string };

function Page() {
  const [nodes, setNodes] = useState<Node<AgentData>[]>(INITIAL_NODES);
  const [edges, setEdges] = useState<Edge[]>(INITIAL_EDGES);
  const [selectedId, setSelectedId] = useState<string>("orchestrator");
  const [connected, setConnected] = useState(true);
  const [ticks, setTicks] = useState<Tick[]>([]);
  const tickIdx = useRef(0);

  // Live telemetry stream — wired here as a deterministic mock pump so the UI
  // behaves identically once a real WebSocket is added. Swap the interval with
  // a `new WebSocket(...)` + onmessage handler and the rendering below stays the same.
  useEffect(() => {
    if (!connected) return;
    const id = setInterval(() => {
      setNodes(ns => ns.map(n => {
        // ~40% of nodes update per tick
        if (Math.random() > 0.4) return n;
        const drift = Math.round((Math.random() - 0.5) * 18);
        const load = Math.max(4, Math.min(99, n.data.load + drift));
        const msgsPerMin = Math.max(0, Math.round(n.data.msgsPerMin + (Math.random() - 0.5) * 12));
        const latencyMs = Math.max(2, Math.round(n.data.latencyMs + (Math.random() - 0.5) * 30));
        const status: AgentStatus = load > 92 ? "error" : load > 82 ? "warn" : load < 10 ? "idle" : "online";
        if (status !== n.data.status || Math.abs(drift) > 10) {
          tickIdx.current += 1;
          const evt: Tick = {
            id: `t${tickIdx.current}`, ts: Date.now(), agent: n.data.label,
            type: status !== n.data.status ? "status" : "load",
            detail: status !== n.data.status ? `${n.data.status} → ${status}` : `load ${n.data.load}% → ${load}%`,
          };
          setTicks(t => [evt, ...t].slice(0, 40));
        }
        return { ...n, data: { ...n.data, load, msgsPerMin, latencyMs, status } };
      }));
      // animate edges from the busiest sources
      setEdges(es => es.map(e => {
        const src = nodes.find(n => n.id === e.source);
        const animated = !!src && src.data.load > 45;
        return { ...e, animated, style: { stroke: animated ? "color-mix(in oklab, var(--neon-cyan) 70%, transparent)" : "color-mix(in oklab, var(--neon-cyan) 25%, transparent)", strokeWidth: 1.2 } };
      }));
    }, 1100);
    return () => clearInterval(id);
  }, [connected, nodes]);

  const selected = useMemo(() => nodes.find(n => n.id === selectedId) ?? null, [nodes, selectedId]);
  const totals = useMemo(() => {
    const online = nodes.filter(n => n.data.status === "online").length;
    const avgLoad = Math.round(nodes.reduce((a, n) => a + n.data.load, 0) / nodes.length);
    const msgs = nodes.reduce((a, n) => a + n.data.msgsPerMin, 0);
    const warn = nodes.filter(n => n.data.status === "warn" || n.data.status === "error").length;
    return { online, avgLoad, msgs, warn };
  }, [nodes]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <MetricTile label="Active agents" value={String(totals.online)} unit={`/${nodes.length}`} tone="cyan" />
        <MetricTile label="Avg load" value={String(totals.avgLoad)} unit="%" tone="violet" />
        <MetricTile label="Msgs / min" value={String(totals.msgs)} tone="lime" />
        <MetricTile label="Alerts" value={String(totals.warn)} tone={totals.warn ? "amber" : "lime"} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <GlassPanel className="lg:col-span-2">
          <SectionHeader eyebrow="Swarm topology · live" title="Agent Control Center"
            subtitle="ws://nexus.kernel/agents · push telemetry"
            right={<div className="flex items-center gap-2">
              <button onClick={() => setConnected(c => !c)}
                className={cn("flex items-center gap-1.5 rounded border px-2 py-1 font-mono text-[10px] uppercase tracking-[0.14em]",
                  connected ? "border-neon-cyan/40 text-neon-cyan" : "border-border text-muted-foreground")}>
                {connected ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
                {connected ? "live" : "paused"}
              </button>
              <NeonButton variant="ghost" onClick={() => setNodes(INITIAL_NODES)}>Reset</NeonButton>
            </div>} />
          <div className="h-[28rem]">
            <ReactFlow nodes={nodes} edges={edges} nodeTypes={nodeTypes}
              onNodeClick={(_, n) => setSelectedId(n.id)}
              fitView proOptions={{ hideAttribution: true }} className="bg-background/40">
              <Background color="color-mix(in oklab, var(--neon-cyan) 20%, transparent)" gap={20} size={1} />
              <Controls className="!bg-background/80 !border-border" showInteractive={false} />
            </ReactFlow>
          </div>
        </GlassPanel>

        <div className="space-y-4">
          <GlassPanel>
            <SectionHeader eyebrow="Inspector" title={selected?.data.label ?? "Select a node"} subtitle={selected?.data.role} />
            {selected && (
              <div className="space-y-3 p-4 text-xs">
                <div className="flex items-center justify-between"><span className="text-muted-foreground">status</span>
                  <span className="flex items-center gap-1.5"><StatusDot tone={selected.data.status} pulse={selected.data.status === "online"} /> {selected.data.status}</span></div>
                <div className="flex items-center justify-between"><span className="text-muted-foreground">load</span>
                  <span className="font-mono text-neon-cyan tabular-nums">{selected.data.load}%</span></div>
                <div className="flex items-center justify-between"><span className="text-muted-foreground">msgs/min</span>
                  <span className="font-mono tabular-nums">{selected.data.msgsPerMin}</span></div>
                <div className="flex items-center justify-between"><span className="text-muted-foreground">latency</span>
                  <span className="font-mono tabular-nums">{selected.data.latencyMs}ms</span></div>
                <div className="flex items-center justify-between"><span className="text-muted-foreground">model</span><span className="font-mono">gemini-3-flash</span></div>
                <div className="flex gap-2"><NeonButton>Pause</NeonButton><NeonButton variant="ghost">Logs</NeonButton></div>
              </div>
            )}
          </GlassPanel>

          <GlassPanel>
            <SectionHeader eyebrow="WS stream" title="Telemetry feed"
              right={<span className="font-mono text-[10px] text-muted-foreground">{ticks.length}</span>} />
            <div className="max-h-56 space-y-1 overflow-y-auto p-3 font-mono text-[10px]">
              {ticks.length === 0 ? (
                <div className="text-muted-foreground/60">Waiting for events…</div>
              ) : ticks.map(t => (
                <div key={t.id} className="flex gap-2">
                  <span className="text-muted-foreground/70">{new Date(t.ts).toLocaleTimeString().slice(3, 8)}</span>
                  <span className={cn("uppercase", t.type === "status" ? "text-[color:var(--neon-amber)]" : "text-neon-cyan")}>{t.type}</span>
                  <span className="truncate">{t.agent}</span>
                  <span className="ml-auto truncate text-muted-foreground">{t.detail}</span>
                </div>
              ))}
            </div>
          </GlassPanel>
        </div>
      </div>
    </div>
  );
}