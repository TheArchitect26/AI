import { Link, Outlet, useRouterState } from "@tanstack/react-router";
import { NAV } from "@/lib/nav";
import { cn } from "@/lib/utils";
import { StatusDot, NeonButton } from "./primitives";
import { Mic, Command, Activity } from "lucide-react";
import { useEffect, useState } from "react";

const GROUPS = ["Core", "Markets", "Intelligence", "Ops"] as const;

function Clock() {
  const [t, setT] = useState<string>("--:--:--");
  useEffect(() => {
    const tick = () => setT(new Date().toISOString().slice(11, 19));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return <span suppressHydrationWarning className="font-mono text-xs tabular-nums text-muted-foreground">{t} UTC</span>;
}

function MiniMetric({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.14em]">
      <span className="text-muted-foreground">{label}</span>
      <span className={tone}>{value}</span>
    </div>
  );
}

export function NexusShell() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="flex min-h-screen w-full text-foreground">
      {/* Left rail */}
      <aside className="sticky top-0 z-30 flex h-screen w-60 shrink-0 flex-col border-r border-border bg-sidebar/80 backdrop-blur-xl">
        <div className="flex items-center gap-2 border-b border-sidebar-border px-4 py-4">
          <div className="relative h-8 w-8 rounded-md bg-gradient-to-br from-[color:var(--neon-cyan)] to-[color:var(--neon-violet)] glow-cyan">
            <div className="absolute inset-[3px] rounded-[5px] bg-sidebar/80 backdrop-blur" />
            <div className="absolute inset-0 grid place-items-center font-mono text-[10px] font-bold text-neon-cyan">N</div>
          </div>
          <div>
            <div className="text-sm font-semibold tracking-tight">NEXUS</div>
            <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground">Personal AI OS</div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-2 py-3">
          {GROUPS.map((group) => (
            <div key={group} className="mb-4">
              <div className="px-2 pb-1.5 font-mono text-[9px] uppercase tracking-[0.22em] text-muted-foreground/70">{group}</div>
              <div className="space-y-0.5">
                {NAV.filter((n) => n.group === group).map((n) => {
                  const Icon = n.icon;
                  const active = pathname === n.to;
                  return (
                    <Link
                      key={n.to}
                      to={n.to}
                      className={cn(
                        "group relative flex items-center gap-2.5 rounded-md px-2 py-1.5 text-xs transition-colors",
                        active
                          ? "bg-[color-mix(in_oklab,var(--neon-cyan)_10%,transparent)] text-foreground"
                          : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground",
                      )}
                    >
                      {active && <span className="absolute left-0 top-1/2 h-4 w-[2px] -translate-y-1/2 rounded-r bg-neon-cyan glow-cyan" />}
                      <Icon className={cn("h-3.5 w-3.5", active && "text-neon-cyan")} />
                      <span className="truncate">{n.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="border-t border-sidebar-border px-4 py-3">
          <div className="flex items-center gap-2 text-xs">
            <StatusDot tone="online" pulse />
            <span className="text-muted-foreground">Local kernel</span>
            <span className="ml-auto font-mono text-[10px] text-neon-cyan">v0.1.0</span>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top status bar */}
        <header className="sticky top-0 z-20 flex h-12 items-center gap-4 border-b border-border bg-background/70 px-4 backdrop-blur-xl">
          <div className="flex items-center gap-2">
            <Activity className="h-3.5 w-3.5 text-neon-cyan" />
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">System</span>
            <StatusDot tone="online" pulse />
          </div>
          <div className="hidden items-center gap-4 md:flex">
            <MiniMetric label="GPU" value="71%" tone="text-neon-cyan" />
            <MiniMetric label="VRAM" value="18.4/24GB" tone="text-neon-violet" />
            <MiniMetric label="Agents" value="7/9" tone="text-[color:var(--neon-lime)]" />
            <MiniMetric label="Latency" value="124ms" tone="text-[color:var(--neon-amber)]" />
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Clock />
            <NeonButton variant="ghost">
              <Command className="h-3 w-3" /> ⌘K
            </NeonButton>
            <NeonButton>
              <Mic className="h-3 w-3" /> Voice
            </NeonButton>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
