import { createFileRoute } from "@tanstack/react-router";
import { GlassPanel, SectionHeader, StatusDot, NeonButton, MetricTile } from "@/components/nexus/primitives";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Search, Globe, FileSearch, Database, Newspaper, Scale, Building2, Telescope, Sparkles, ExternalLink } from "lucide-react";

export const Route = createFileRoute("/investigate")({
  head: () => ({ meta: [{ title: "Investigation Center — NEXUS" }, { name: "description", content: "Multi-source OSINT and deep research console" }] }),
  component: Page,
});

const SOURCES = [
  { key: "web", label: "Web", icon: Globe, count: "billions" },
  { key: "news", label: "News + RSS", icon: Newspaper, count: "live" },
  { key: "papers", label: "arXiv / PubMed / SSRN", icon: FileSearch, count: "12M" },
  { key: "datasets", label: "Open datasets", icon: Database, count: "2.4M" },
  { key: "filings", label: "SEC / EDGAR / EU", icon: Scale, count: "all" },
  { key: "companies", label: "OpenCorporates", icon: Building2, count: "220M" },
  { key: "space", label: "NASA / ESA / Sky", icon: Telescope, count: "open" },
  { key: "archive", label: "Internet Archive", icon: Database, count: "835B pages" },
] as const;

const TOOLKITS = [
  "Wikipedia API", "Wikidata SPARQL", "Common Crawl", "GDELT", "Google Scholar", "Semantic Scholar",
  "OpenAlex", "CORE.ac.uk", "DOAJ", "USGS", "OECD Stats", "World Bank", "UN Data",
  "IMF Data", "FRED", "BLS", "Eurostat", "Open Street Map", "Overpass API",
  "DNS / WHOIS", "Shodan (free tier)", "Censys", "VirusTotal (free)", "Have I Been Pwned",
  "GitHub search", "Hacker News API", "Reddit Pushshift", "Twitter/X public", "Mastodon",
  "YouTube Data API", "Wayback Machine", "Trove", "Europeana", "DPLA",
];

type Hit = { id: string; source: string; title: string; snippet: string; url: string; score: number; date: string };

const SAMPLE_HITS: Hit[] = [
  { id: "h1", source: "arXiv", title: "Scaling laws for multi-agent reasoning systems", snippet: "We derive empirical scaling for cooperative reasoning in agent swarms, finding sublinear gains beyond ~12 specialists…", url: "#", score: 0.94, date: "2026-04-22" },
  { id: "h2", source: "SEC EDGAR", title: "NVIDIA 10-Q · Q1 FY27 · risk factors", snippet: "Discusses datacenter GPU demand elasticity, China export licensing, and HBM supply concentration…", url: "#", score: 0.91, date: "2026-05-08" },
  { id: "h3", source: "OpenAlex", title: "Vector retrieval over episodic memories: a survey", snippet: "Comparison of HNSW, IVF-PQ, and learned indices for personal AI agents with bounded recall windows…", url: "#", score: 0.87, date: "2026-03-04" },
  { id: "h4", source: "GDELT", title: "News cluster · AI regulation · EU AI Act phase 2", snippet: "92 articles across 14 outlets in last 24h converge on enforcement timeline shift to Q4 2026…", url: "#", score: 0.82, date: "2026-05-15" },
  { id: "h5", source: "Wikidata", title: "Entity graph · adenosine receptor A2A (Q414042)", snippet: "Cross-references PDB structures, ligands, pathways, and 412 linked publications…", url: "#", score: 0.78, date: "live" },
];

function Page() {
  const [q, setQ] = useState("");
  const [active, setActive] = useState<Set<string>>(new Set(SOURCES.map(s => s.key)));
  const [results, setResults] = useState<Hit[]>([]);
  const [running, setRunning] = useState(false);

  const toggle = (k: string) => {
    setActive(prev => {
      const n = new Set(prev);
      if (n.has(k)) n.delete(k); else n.add(k);
      return n;
    });
  };

  const investigate = () => {
    if (!q.trim()) return;
    setRunning(true); setResults([]);
    SAMPLE_HITS.forEach((h, i) => {
      setTimeout(() => setResults(r => [...r, h]), 200 + i * 250);
    });
    setTimeout(() => setRunning(false), 200 + SAMPLE_HITS.length * 250);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <MetricTile label="Sources online" value={`${active.size}/${SOURCES.length}`} tone="cyan" />
        <MetricTile label="Toolkits" value={String(TOOLKITS.length)} tone="violet" />
        <MetricTile label="Avg latency" value="312" unit="ms" tone="amber" spark={[400,360,340,320,310,312]} />
        <MetricTile label="Hits today" value="1,284" tone="lime" delta="↑ 22%" />
      </div>

      <GlassPanel scanline className="p-5">
        <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-neon-cyan">Investigation Center</div>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight md:text-3xl">Ask anything. Cross every open source.</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">Free archives, real-time feeds, deep public data, and OSINT toolkits — fused by NEXUS for citation-grade answers.</p>
        <div className="mt-4 flex gap-2">
          <div className="glass flex flex-1 items-center gap-2 rounded-lg p-2">
            <Search className="h-4 w-4 text-neon-cyan" />
            <input value={q} onChange={e => setQ(e.target.value)} onKeyDown={e => e.key === "Enter" && investigate()}
              placeholder="e.g. trace the supply chain for HBM3e memory · or · who funds adenosine receptor research?"
              className="flex-1 bg-transparent px-1 py-1 text-sm outline-none placeholder:text-muted-foreground/60" />
          </div>
          <NeonButton onClick={investigate} disabled={running || !q.trim()}>
            <Sparkles className="h-3 w-3" /> {running ? "Investigating…" : "Investigate"}
          </NeonButton>
        </div>
      </GlassPanel>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <GlassPanel className="lg:col-span-3">
          <SectionHeader eyebrow="Sources" title="Channels" subtitle="Toggle to scope the search" />
          <div className="space-y-1 p-3">
            {SOURCES.map(s => {
              const Icon = s.icon; const on = active.has(s.key);
              return (
                <button key={s.key} onClick={() => toggle(s.key)}
                  className={cn("flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-xs",
                    on ? "bg-[color-mix(in_oklab,var(--neon-cyan)_10%,transparent)] text-foreground" : "text-muted-foreground hover:text-foreground")}>
                  <span className="flex items-center gap-2"><Icon className={cn("h-3.5 w-3.5", on && "text-neon-cyan")} /> {s.label}</span>
                  <span className="flex items-center gap-1.5 font-mono text-[9px] text-muted-foreground"><StatusDot tone={on ? "online" : "idle"} pulse={on} /> {s.count}</span>
                </button>
              );
            })}
          </div>
        </GlassPanel>

        <GlassPanel className="lg:col-span-6">
          <SectionHeader eyebrow="Findings" title="Cross-source hits"
            right={<div className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">{results.length} results</div>} />
          <div className="max-h-[32rem] space-y-2 overflow-y-auto p-4">
            <AnimatePresence>
              {results.map((h, i) => (
                <motion.a key={h.id} href={h.url} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                  className="block rounded border border-border/50 p-3 transition-colors hover:border-neon-cyan/40">
                  <div className="flex items-center justify-between">
                    <span className="rounded border border-border/60 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.16em] text-neon-cyan">{h.source}</span>
                    <span className="font-mono text-[10px] text-muted-foreground">{h.date} · {(h.score * 100).toFixed(0)}%</span>
                  </div>
                  <div className="mt-1 flex items-center gap-1 text-sm font-medium">{h.title} <ExternalLink className="h-3 w-3 text-muted-foreground" /></div>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">{h.snippet}</p>
                </motion.a>
              ))}
            </AnimatePresence>
            {!running && results.length === 0 && (
              <div className="py-12 text-center text-xs text-muted-foreground">Type a query and hit Investigate to fan out across {active.size} sources.</div>
            )}
            {running && <div className="py-2 text-center font-mono text-[10px] uppercase tracking-[0.18em] text-neon-cyan">▌ scanning sources…</div>}
          </div>
        </GlassPanel>

        <GlassPanel className="lg:col-span-3">
          <SectionHeader eyebrow="Toolkit" title="Free OSINT tools" subtitle="NEXUS will compose any of these" />
          <div className="flex flex-wrap gap-1.5 p-4">
            {TOOLKITS.map(t => (
              <span key={t} className="rounded border border-border/50 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground hover:border-neon-cyan/40 hover:text-neon-cyan">{t}</span>
            ))}
          </div>
        </GlassPanel>
      </div>
    </div>
  );
}