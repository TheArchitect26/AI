import { createFileRoute } from "@tanstack/react-router";
import { GlassPanel, SectionHeader, StatusDot, NeonButton, MetricTile, PulseRing } from "@/components/nexus/primitives";
import { useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Sparkles, ExternalLink, Play } from "lucide-react";

export const Route = createFileRoute("/lab")({
  head: () => ({ meta: [{ title: "Science Lab — NEXUS" }, { name: "description", content: "Chemistry research lab and simulations" }] }),
  component: Page,
});

const SIMS = [
  { name: "PubChem", desc: "Compound + bioassay database", url: "https://pubchem.ncbi.nlm.nih.gov", tag: "DB" },
  { name: "RDKit", desc: "Molecular informatics toolkit", url: "https://www.rdkit.org", tag: "TOOL" },
  { name: "PySCF", desc: "Quantum chem framework", url: "https://pyscf.org", tag: "QM" },
  { name: "ChEMBL", desc: "Bioactive molecule database", url: "https://www.ebi.ac.uk/chembl/", tag: "DB" },
  { name: "MolView", desc: "3D molecule visualizer", url: "https://molview.org", tag: "SIM" },
  { name: "AlphaFold DB", desc: "Predicted protein structures", url: "https://alphafold.ebi.ac.uk", tag: "BIO" },
  { name: "NIST WebBook", desc: "Reference thermochemistry", url: "https://webbook.nist.gov/chemistry/", tag: "REF" },
  { name: "Open Babel", desc: "Chemical file conversion", url: "http://openbabel.org", tag: "TOOL" },
];

const EXPERIMENTS = [
  { id: "e1", name: "Caffeine binding affinity sweep", status: "running" as const, progress: 64, target: "adenosine A2A" },
  { id: "e2", name: "Aspirin analogues COX-2 selectivity", status: "queued" as const, progress: 0, target: "COX-2" },
  { id: "e3", name: "Glycine DFT geometry opt", status: "done" as const, progress: 100, target: "B3LYP/6-31G*" },
];

function MoleculeOrb() {
  return (
    <div className="relative grid place-items-center py-8">
      <PulseRing size={140} label="caffeine · C8H10N4O2" />
      {[0, 60, 120, 180, 240, 300].map((deg, i) => (
        <motion.span key={i}
          className="absolute h-2 w-2 rounded-full bg-neon-cyan glow-cyan"
          style={{ transform: `rotate(${deg}deg) translateY(-72px)` }}
          animate={{ rotate: deg + 360 }} transition={{ duration: 12, repeat: Infinity, ease: "linear" }} />
      ))}
    </div>
  );
}

function statusTone(s: "running" | "queued" | "done"): "online" | "idle" | "warn" {
  if (s === "running") return "online";
  if (s === "done") return "idle";
  return "warn";
}

function Page() {
  const [hypothesis, setHypothesis] = useState("Increasing methyl substitution on the xanthine core should reduce A2A binding affinity due to steric clash with His278.");

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <MetricTile label="Compounds" value="2,418" tone="cyan" />
        <MetricTile label="Sims running" value="3" tone="violet" />
        <MetricTile label="GPU hours" value="14.2" unit="h" tone="lime" spark={[2,4,6,8,11,14]} />
        <MetricTile label="Hypotheses" value="9" tone="amber" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <GlassPanel className="lg:col-span-4" scanline>
          <SectionHeader eyebrow="Visualizer" title="Active molecule"
            right={<NeonButton variant="ghost"><ExternalLink className="h-3 w-3" /> 3D</NeonButton>} />
          <MoleculeOrb />
          <div className="grid grid-cols-3 gap-2 px-4 pb-4 text-[11px]">
            <div><div className="font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground">MW</div><div className="font-mono text-neon-cyan">194.19</div></div>
            <div><div className="font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground">LogP</div><div className="font-mono text-neon-cyan">-0.07</div></div>
            <div><div className="font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground">HBA/HBD</div><div className="font-mono text-neon-cyan">3 / 0</div></div>
          </div>
        </GlassPanel>

        <GlassPanel className="lg:col-span-5">
          <SectionHeader eyebrow="Hypothesis" title="Design experiment"
            right={<NeonButton><Play className="h-3 w-3" /> Run</NeonButton>} />
          <div className="space-y-3 p-4 text-xs">
            <div>
              <div className="mb-1 font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">hypothesis</div>
              <textarea value={hypothesis} onChange={e => setHypothesis(e.target.value)} rows={3}
                className="w-full resize-none rounded border border-border bg-background/40 p-2 text-xs outline-none focus:border-neon-cyan/50" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <label className="block">
                <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">target</div>
                <select className="mt-1 w-full rounded border border-border bg-background/40 p-1.5 text-xs outline-none">
                  <option>adenosine A2A</option><option>COX-2</option><option>EGFR</option>
                </select>
              </label>
              <label className="block">
                <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">method</div>
                <select className="mt-1 w-full rounded border border-border bg-background/40 p-1.5 text-xs outline-none">
                  <option>docking · AutoDock Vina</option><option>QM · DFT B3LYP</option><option>MD · GROMACS</option>
                </select>
              </label>
            </div>
            <div className="rounded border border-neon-cyan/30 bg-[color-mix(in_oklab,var(--neon-cyan)_6%,transparent)] p-2 text-[11px]">
              <div className="flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.16em] text-neon-cyan"><Sparkles className="h-3 w-3" /> NEXUS suggestion</div>
              Generate 24 methyl-substituted analogues, dock against A2A (PDB 4EIY), rank by Vina score, then re-score top 5 with MM-GBSA.
            </div>
          </div>
        </GlassPanel>

        <GlassPanel className="lg:col-span-3">
          <SectionHeader eyebrow="Queue" title="Experiments" />
          <div className="space-y-2 p-3 text-xs">
            {EXPERIMENTS.map(e => (
              <div key={e.id} className="rounded border border-border/50 p-2.5">
                <div className="flex items-center justify-between">
                  <div className="truncate text-[11px] font-medium">{e.name}</div>
                  <StatusDot tone={statusTone(e.status)} pulse={e.status === "running"} />
                </div>
                <div className="mt-0.5 font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground">{e.target}</div>
                <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-muted">
                  <div className={cn("h-full", e.status === "done" ? "bg-[color:var(--neon-lime)]" : "bg-gradient-to-r from-[color:var(--neon-cyan)] to-[color:var(--neon-violet)]")} style={{ width: `${e.progress}%` }} />
                </div>
              </div>
            ))}
          </div>
        </GlassPanel>
      </div>

      <GlassPanel>
        <SectionHeader eyebrow="Integrations" title="Connected research tools"
          subtitle="NEXUS taps into open scientific infrastructure" />
        <div className="grid grid-cols-2 gap-2 p-4 md:grid-cols-4">
          {SIMS.map(s => (
            <a key={s.name} href={s.url} target="_blank" rel="noreferrer"
              className="group rounded border border-border/50 p-3 transition-colors hover:border-neon-cyan/40">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold group-hover:text-neon-cyan">{s.name}</div>
                <span className="rounded border border-border/60 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground">{s.tag}</span>
              </div>
              <p className="mt-1 text-[11px] text-muted-foreground">{s.desc}</p>
            </a>
          ))}
        </div>
      </GlassPanel>
    </div>
  );
}