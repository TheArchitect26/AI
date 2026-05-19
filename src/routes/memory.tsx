import { createFileRoute } from "@tanstack/react-router";
import { GlassPanel, SectionHeader, NeonButton, MetricTile } from "@/components/nexus/primitives";
import { useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Database, BookOpen, MessageSquare, Lightbulb, Tag, Search, Link2 } from "lucide-react";

export const Route = createFileRoute("/memory")({
  head: () => ({ meta: [{ title: "Memory System — NEXUS" }, { name: "description", content: "Vector · episodic · project memory recall" }] }),
  component: Page,
});

const CATEGORIES = [
  { key: "all", label: "All", icon: Database, count: 12431 },
  { key: "episodic", label: "Episodic", icon: MessageSquare, count: 4820 },
  { key: "semantic", label: "Semantic", icon: BookOpen, count: 6122 },
  { key: "project", label: "Project", icon: Tag, count: 1142 },
  { key: "insight", label: "Insights", icon: Lightbulb, count: 347 },
] as const;

type MemItem = { id: string; cat: typeof CATEGORIES[number]["key"]; title: string; ts: string; score: number; preview: string; source: string; links: string[] };

const ITEMS: MemItem[] = [
  { id: "m1", cat: "episodic", title: "Conversation · BTC volatility brief", ts: "2026-05-15 11:32", score: 0.94, preview: "User asked about realized vol; agent surfaced 84th pct regime and proposed delta trim.", source: "chat://session-2419", links: ["m4","m6"] },
  { id: "m2", cat: "semantic", title: "Concept · Realized volatility (Parkinson)", ts: "2026-04-02", score: 0.91, preview: "Parkinson estimator uses high/low range to estimate variance more efficiently than close-to-close.", source: "vault://quant/vol", links: ["m1"] },
  { id: "m3", cat: "project", title: "Project · NEXUS kernel v0.1 plan", ts: "2026-05-10", score: 0.88, preview: "Phase plan: shell → core agents → trading suite → ops modules → architecture docs.", source: "project://nexus", links: [] },
  { id: "m4", cat: "insight", title: "Insight · Vol clusters precede 30%+ drawdowns 62% of the time", ts: "2026-03-18", score: 0.86, preview: "Backtest across 10y BTC data shows persistence; useful as a regime filter.", source: "lab://btc-vol-2024", links: ["m1","m2"] },
  { id: "m5", cat: "semantic", title: "Concept · LLM tool-calling protocol", ts: "2026-02-21", score: 0.79, preview: "Function-calling JSON schema with strict mode; preferred over freeform JSON.", source: "vault://ai/tools", links: [] },
  { id: "m6", cat: "episodic", title: "Conversation · Portfolio risk review", ts: "2026-05-13 09:14", score: 0.74, preview: "Reviewed VAR caps, concluded 2% daily ceiling on net delta exposure.", source: "chat://session-2401", links: ["m1"] },
];

function Page() {
  const [cat, setCat] = useState<typeof CATEGORIES[number]["key"]>("all");
  const [selected, setSelected] = useState<MemItem>(ITEMS[0]);
  const [q, setQ] = useState("");

  const filtered = ITEMS.filter(i => (cat === "all" || i.cat === cat) && (q === "" || (i.title + i.preview).toLowerCase().includes(q.toLowerCase())));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <MetricTile label="Vectors" value="12.4k" tone="cyan" spark={[8,9,10,11,12,12.4]} />
        <MetricTile label="Recall hit-rate" value="92" unit="%" tone="lime" />
        <MetricTile label="Avg latency" value="38" unit="ms" tone="violet" />
        <MetricTile label="Index size" value="284" unit="MB" tone="amber" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <GlassPanel className="lg:col-span-3">
          <SectionHeader eyebrow="Categories" title="Memory store" />
          <div className="space-y-1 p-3">
            {CATEGORIES.map(c => {
              const Icon = c.icon;
              const active = cat === c.key;
              return (
                <button key={c.key} onClick={() => setCat(c.key)}
                  className={cn("flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-xs transition-colors",
                    active ? "bg-[color-mix(in_oklab,var(--neon-cyan)_12%,transparent)] text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-sidebar-accent")}>
                  <span className="flex items-center gap-2"><Icon className={cn("h-3.5 w-3.5", active && "text-neon-cyan")} /> {c.label}</span>
                  <span className="font-mono text-[10px] text-muted-foreground">{c.count.toLocaleString()}</span>
                </button>
              );
            })}
          </div>
        </GlassPanel>

        <GlassPanel className="lg:col-span-5">
          <SectionHeader eyebrow="Timeline" title="Recall stream"
            right={<div className="relative"><Search className="absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" /><input value={q} onChange={e => setQ(e.target.value)} placeholder="search recall…" className="h-7 w-44 rounded border border-border bg-background/50 pl-6 pr-2 text-xs outline-none focus:border-neon-cyan/50" /></div>} />
          <div className="relative max-h-[30rem] overflow-y-auto p-4">
            <div className="absolute bottom-4 left-6 top-4 w-px bg-border/50" />
            <div className="space-y-2">
              {filtered.map((m, i) => (
                <motion.button key={m.id} initial={{ opacity: 0, x: -4 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}
                  onClick={() => setSelected(m)}
                  className={cn("relative w-full pl-6 text-left", selected.id === m.id && "")}>
                  <span className={cn("absolute left-[18px] top-3 h-2 w-2 -translate-x-1/2 rounded-full", selected.id === m.id ? "bg-neon-cyan glow-cyan" : "bg-border")} />
                  <div className={cn("rounded border p-2.5 transition-colors", selected.id === m.id ? "border-neon-cyan/40 bg-[color-mix(in_oklab,var(--neon-cyan)_6%,transparent)]" : "border-border/50 hover:border-border-strong")}>
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-medium">{m.title}</div>
                      <div className="font-mono text-[10px] text-neon-cyan">{(m.score * 100).toFixed(0)}%</div>
                    </div>
                    <div className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">{m.ts} · {m.cat}</div>
                    <p className="mt-1 line-clamp-2 text-[11px] text-muted-foreground">{m.preview}</p>
                  </div>
                </motion.button>
              ))}
              {filtered.length === 0 && <div className="py-8 text-center text-xs text-muted-foreground">No memories match.</div>}
            </div>
          </div>
        </GlassPanel>

        <GlassPanel className="lg:col-span-4">
          <SectionHeader eyebrow="Detail" title={selected.title} subtitle={selected.source} />
          <div className="space-y-4 p-4 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">similarity</span>
              <div className="flex items-center gap-2"><div className="h-1 w-32 overflow-hidden rounded-full bg-muted"><div className="h-full bg-gradient-to-r from-[color:var(--neon-cyan)] to-[color:var(--neon-violet)]" style={{ width: `${selected.score * 100}%` }} /></div><span className="font-mono text-neon-cyan">{(selected.score * 100).toFixed(0)}%</span></div>
            </div>
            <div className="rounded border border-border/50 bg-background/30 p-3 leading-relaxed">{selected.preview}</div>
            <div>
              <div className="mb-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">metadata</div>
              <ul className="space-y-1 font-mono text-[11px]">
                <li className="flex justify-between"><span className="text-muted-foreground">id</span><span>{selected.id}</span></li>
                <li className="flex justify-between"><span className="text-muted-foreground">category</span><span className="text-neon-cyan">{selected.cat}</span></li>
                <li className="flex justify-between"><span className="text-muted-foreground">stored</span><span>{selected.ts}</span></li>
                <li className="flex justify-between"><span className="text-muted-foreground">embedding</span><span>1536-d · cosine</span></li>
              </ul>
            </div>
            {selected.links.length > 0 && (
              <div>
                <div className="mb-1.5 flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground"><Link2 className="h-3 w-3" /> linked memories</div>
                <div className="space-y-1">
                  {selected.links.map(id => {
                    const lk = ITEMS.find(x => x.id === id); if (!lk) return null;
                    return <button key={id} onClick={() => setSelected(lk)} className="block w-full rounded border border-border/40 px-2 py-1 text-left text-[11px] hover:border-neon-cyan/40 hover:text-neon-cyan">{lk.title}</button>;
                  })}
                </div>
              </div>
            )}
            <div className="flex gap-2"><NeonButton>Inject into chat</NeonButton><NeonButton variant="ghost">Forget</NeonButton></div>
          </div>
        </GlassPanel>
      </div>
    </div>
  );
}
