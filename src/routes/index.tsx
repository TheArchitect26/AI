import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowUpRight, Cpu, Send, TrendingUp, TrendingDown, Sparkles, Workflow as WfIcon, AlertTriangle } from "lucide-react";
import { GlassPanel, MetricTile, SectionHeader, StatusDot, PulseRing, NeonButton, Sparkline } from "@/components/nexus/primitives";
import { AGENTS, ACTIVITY, MARKET, SYSTEM_METRICS, SPARK } from "@/lib/mock/data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Command Center — NEXUS" },
      { name: "description", content: "Live overview of agents, infrastructure, market intelligence, and automation." },
    ],
  }),
  component: CommandCenter,
});

function CommandCenter() {
  return (
    <div className="space-y-6">
      <Hero />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {SYSTEM_METRICS.map((m, i) => (
          <MetricTile
            key={m.label}
            label={m.label}
            value={m.value}
            unit={m.unit}
            tone={m.tone}
            delta={`${((m.value / m.max) * 100).toFixed(0)}% / ${m.max}${m.unit}`}
            spark={SPARK(28, 0.3 + i * 0.2)}
          />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <AgentSwarm />
        <ActivityFeed />
        <MarketPulse />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Workflows />
        <Memory />
        <Alerts />
      </div>
    </div>
  );
}

function Hero() {
  return (
    <GlassPanel className="relative overflow-hidden p-6">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,color-mix(in_oklab,var(--neon-violet)_20%,transparent),transparent_60%)]" />
      <div className="relative grid gap-6 md:grid-cols-[1fr_auto] md:items-center">
        <div>
          <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-neon-cyan">
            <StatusDot pulse /> Kernel online · 7 agents · 12 workflows
          </div>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight md:text-3xl">
            Welcome back, <span className="gradient-text">Operator</span>.
          </h1>
          <p className="mt-1.5 max-w-xl text-sm text-muted-foreground">
            Strategos has drafted 3 plans · Quant flagged 2 setups on the 4H · Mnemo recalled 14 vectors for your active research thread.
          </p>
          <form className="mt-4 flex max-w-2xl items-center gap-2 rounded-md border border-border-strong bg-background/60 px-3 py-2 focus-within:border-neon-cyan/60 focus-within:glow-cyan">
            <Sparkles className="h-3.5 w-3.5 text-neon-cyan" />
            <input
              placeholder="Issue a command, ask a question, or invoke an agent…"
              className="flex-1 bg-transparent font-mono text-sm placeholder:text-muted-foreground/60 focus:outline-none"
            />
            <kbd className="font-mono text-[10px] text-muted-foreground">⌘ ⏎</kbd>
            <button type="submit" className="rounded bg-neon-cyan/90 p-1.5 text-[color:var(--background)] glow-cyan">
              <Send className="h-3 w-3" />
            </button>
          </form>
        </div>
        <div className="hidden md:block">
          <PulseRing size={140} label="Cognitive load · 64%" />
        </div>
      </div>
    </GlassPanel>
  );
}

function AgentSwarm() {
  return (
    <GlassPanel>
      <SectionHeader
        eyebrow="Agents · 9"
        title="Agent swarm"
        subtitle="Active processes across the kernel"
        right={<NeonButton variant="ghost">Manage</NeonButton>}
      />
      <div className="divide-y divide-border/60">
        {AGENTS.slice(0, 6).map((a) => {
          const tone = a.status === "online" ? "online" : a.status === "thinking" ? "warn" : a.status === "error" ? "error" : "idle";
          return (
            <motion.div
              key={a.id}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-3 px-5 py-3"
            >
              <StatusDot tone={tone as any} pulse={a.status === "thinking"} />
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-2">
                  <span className="text-sm font-medium">{a.name}</span>
                  <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">{a.role}</span>
                </div>
                <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[color:var(--neon-cyan)] to-[color:var(--neon-violet)]"
                    style={{ width: `${a.load}%` }}
                  />
                </div>
              </div>
              <div className="text-right">
                <div className="font-mono text-xs text-foreground tabular-nums">{a.load}%</div>
                <div className="font-mono text-[10px] text-muted-foreground">{a.tasks} tasks</div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </GlassPanel>
  );
}

function ActivityFeed() {
  const dot = { ok: "online", warn: "warn", error: "error", info: "idle" } as const;
  return (
    <GlassPanel>
      <SectionHeader
        eyebrow="Stream · live"
        title="Intelligence feed"
        subtitle="Reasoning, signals, recalls, and alerts"
        right={<div className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-neon-cyan"><StatusDot pulse /> live</div>}
      />
      <div className="max-h-[420px] divide-y divide-border/60 overflow-y-auto">
        {ACTIVITY.map((e) => (
          <div key={e.id} className="flex items-start gap-3 px-5 py-3">
            <div className="pt-1.5"><StatusDot tone={dot[e.tone] as any} /></div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                <span className="text-neon-cyan">{e.ts}</span>
                <span>·</span>
                <span>{e.agent}</span>
                <span>·</span>
                <span>{e.type}</span>
              </div>
              <div className="mt-0.5 text-sm">{e.message}</div>
            </div>
          </div>
        ))}
      </div>
    </GlassPanel>
  );
}

function MarketPulse() {
  return (
    <GlassPanel>
      <SectionHeader
        eyebrow="Markets · realtime"
        title="Market pulse"
        subtitle="Quant agent feed"
        right={<NeonButton variant="ghost"><ArrowUpRight className="h-3 w-3" /> Open</NeonButton>}
      />
      <div className="divide-y divide-border/60">
        {MARKET.map((t, i) => {
          const up = t.chg >= 0;
          return (
            <div key={t.sym} className="flex items-center gap-3 px-5 py-2.5">
              <div className="flex-1">
                <div className="font-mono text-xs font-semibold tracking-wider">{t.sym}</div>
                <div className="font-mono text-[10px] text-muted-foreground tabular-nums">{t.price.toLocaleString()}</div>
              </div>
              <Sparkline data={SPARK(20, 0.4 + i * 0.3)} tone={up ? "lime" : "amber"} className="h-7 w-24 opacity-80" />
              <div className={cn("flex items-center gap-1 font-mono text-xs tabular-nums", up ? "text-[color:var(--neon-lime)]" : "text-[color:var(--neon-red)]")}>
                {up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {up ? "+" : ""}{t.chg.toFixed(2)}%
              </div>
            </div>
          );
        })}
      </div>
    </GlassPanel>
  );
}

function Workflows() {
  const flows = [
    { name: "Daily macro briefing", status: "running", step: "4/7", agent: "Research" },
    { name: "BTC regime monitor", status: "running", step: "loop", agent: "Quant" },
    { name: "Inbox triage", status: "queued", step: "0/3", agent: "Automaton" },
    { name: "Code review · ingest", status: "complete", step: "done", agent: "Codex" },
  ];
  const tone = { running: "online", queued: "warn", complete: "idle" } as const;
  return (
    <GlassPanel>
      <SectionHeader eyebrow="Automation" title="Active workflows" right={<WfIcon className="h-4 w-4 text-neon-violet" />} />
      <div className="divide-y divide-border/60">
        {flows.map((f) => (
          <div key={f.name} className="flex items-center gap-3 px-5 py-3">
            <StatusDot tone={tone[f.status as keyof typeof tone] as any} pulse={f.status === "running"} />
            <div className="flex-1">
              <div className="text-sm">{f.name}</div>
              <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">{f.agent} · {f.status}</div>
            </div>
            <div className="font-mono text-xs text-neon-cyan">{f.step}</div>
          </div>
        ))}
      </div>
    </GlassPanel>
  );
}

function Memory() {
  return (
    <GlassPanel>
      <SectionHeader eyebrow="Mnemo" title="Memory retrieval" />
      <div className="space-y-3 px-5 py-4">
        <div className="grid grid-cols-3 gap-3 text-center">
          {[
            { k: "Vectors", v: "184k", t: "cyan" },
            { k: "Episodic", v: "2,148", t: "violet" },
            { k: "Recall p95", v: "42ms", t: "lime" },
          ].map((s) => (
            <div key={s.k} className="rounded border border-border/60 p-2">
              <div className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground">{s.k}</div>
              <div className={cn("font-mono text-base font-semibold tabular-nums", s.t === "cyan" ? "text-neon-cyan" : s.t === "violet" ? "text-neon-violet" : "text-[color:var(--neon-lime)]")}>{s.v}</div>
            </div>
          ))}
        </div>
        <div className="space-y-1.5">
          {["macro outlook q4", "renaissance medallion notes", "vector indexing strategy"].map((q, i) => (
            <div key={q} className="flex items-center gap-2 rounded border border-border/40 px-2 py-1.5">
              <Cpu className="h-3 w-3 text-neon-violet" />
              <span className="font-mono text-xs">{q}</span>
              <span className="ml-auto font-mono text-[10px] text-muted-foreground">{(0.96 - i * 0.04).toFixed(2)}</span>
            </div>
          ))}
        </div>
      </div>
    </GlassPanel>
  );
}

function Alerts() {
  const alerts = [
    { t: "Inference latency", d: "llama3-70b p95 · 480ms", tone: "warn" },
    { t: "API quota", d: "binance-spot · 78% of window", tone: "warn" },
    { t: "Model drift", d: "signal-v3 confidence ↓ 6%", tone: "error" },
  ];
  return (
    <GlassPanel>
      <SectionHeader eyebrow="Sentinel" title="Alerts" right={<AlertTriangle className="h-4 w-4 text-[color:var(--neon-amber)]" />} />
      <div className="divide-y divide-border/60">
        {alerts.map((a) => (
          <div key={a.t} className="flex items-start gap-3 px-5 py-3">
            <StatusDot tone={a.tone as any} pulse />
            <div>
              <div className="text-sm">{a.t}</div>
              <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">{a.d}</div>
            </div>
          </div>
        ))}
      </div>
    </GlassPanel>
  );
}
