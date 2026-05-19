import { createFileRoute } from "@tanstack/react-router";
import { GlassPanel, SectionHeader, StatusDot, NeonButton } from "@/components/nexus/primitives";
import { motion } from "framer-motion";

export const Route = createFileRoute("/trading")({
  head: () => ({
    meta: [
      { title: "Trading Intelligence — NEXUS" },
      { name: "description", content: "Charts, sentiment, regimes, AI reasoning" },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <div className="space-y-6">
      <GlassPanel className="relative overflow-hidden p-6" scanline>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,color-mix(in_oklab,var(--neon-cyan)_14%,transparent),transparent_60%)]" />
        <div className="relative">
          <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-neon-cyan">
            <StatusDot pulse /> Markets desk
          </div>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight md:text-3xl">Trading Intelligence</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">Charts, sentiment, regimes, AI reasoning</p>
        </div>
      </GlassPanel>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <GlassPanel className="lg:col-span-2">
          <SectionHeader eyebrow="Module" title="Online · awaiting backend" subtitle="UI scaffold ready. Service contract pending in /docs/architecture." right={<NeonButton variant="ghost">Inspect</NeonButton>} />
          <div className="grid grid-cols-2 gap-3 p-5 md:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                className="rounded border border-border/60 p-3">
                <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">slot-{(i + 1).toString().padStart(2, "0")}</div>
                <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-muted">
                  <div className="h-full bg-gradient-to-r from-[color:var(--neon-cyan)] to-[color:var(--neon-violet)]" style={{ width: `${20 + ((i * 13) % 70)}%` }} />
                </div>
              </motion.div>
            ))}
          </div>
        </GlassPanel>
        <GlassPanel>
          <SectionHeader eyebrow="Status" title="Service contract" />
          <ul className="space-y-2 px-5 py-4 font-mono text-xs">
            <li className="flex justify-between"><span className="text-muted-foreground">runtime</span><span className="text-neon-cyan">edge / worker</span></li>
            <li className="flex justify-between"><span className="text-muted-foreground">transport</span><span className="text-neon-cyan">REST + WS</span></li>
            <li className="flex justify-between"><span className="text-muted-foreground">store</span><span className="text-neon-violet">postgres + chroma</span></li>
            <li className="flex justify-between"><span className="text-muted-foreground">queue</span><span className="text-neon-violet">redis · celery</span></li>
            <li className="flex justify-between"><span className="text-muted-foreground">status</span><span className="text-[color:var(--neon-lime)]">scaffold ready</span></li>
          </ul>
        </GlassPanel>
      </div>
    </div>
  );
}
