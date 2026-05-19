import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import type { ReactNode, HTMLAttributes, ButtonHTMLAttributes } from "react";

export function GlassPanel({ className, children, scanline, ...rest }: HTMLAttributes<HTMLDivElement> & { scanline?: boolean }) {
  return (
    <div
      className={cn(
        "glass relative overflow-hidden rounded-lg",
        scanline && "scanline",
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

export function SectionHeader({ eyebrow, title, subtitle, right }: { eyebrow?: string; title: string; subtitle?: string; right?: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-border/60 px-5 py-4">
      <div>
        {eyebrow && <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-neon-cyan">{eyebrow}</div>}
        <h2 className="mt-1 text-base font-semibold tracking-tight text-foreground">{title}</h2>
        {subtitle && <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>}
      </div>
      {right}
    </div>
  );
}

export function StatusDot({ tone = "online", pulse }: { tone?: "online" | "warn" | "error" | "idle"; pulse?: boolean }) {
  const color = {
    online: "bg-status-online",
    warn: "bg-status-warn",
    error: "bg-status-error",
    idle: "bg-status-idle",
  }[tone];
  return (
    <span className="relative inline-flex h-2 w-2">
      {pulse && <span className={cn("absolute inset-0 animate-ping rounded-full opacity-60", color)} />}
      <span className={cn("relative inline-flex h-2 w-2 rounded-full", color)} />
    </span>
  );
}

export function MetricTile({ label, value, unit, delta, tone = "cyan", spark }: {
  label: string; value: string | number; unit?: string; delta?: string;
  tone?: "cyan" | "violet" | "amber" | "lime"; spark?: number[];
}) {
  const accent = {
    cyan: "text-neon-cyan", violet: "text-neon-violet", amber: "text-[color:var(--neon-amber)]", lime: "text-[color:var(--neon-lime)]",
  }[tone];
  return (
    <GlassPanel className="p-4">
      <div className="flex items-center justify-between">
        <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{label}</div>
        {delta && <div className={cn("font-mono text-[10px]", accent)}>{delta}</div>}
      </div>
      <div className="mt-2 flex items-baseline gap-1.5">
        <div className={cn("font-mono text-2xl font-semibold tabular-nums", accent)}>{value}</div>
        {unit && <div className="font-mono text-xs text-muted-foreground">{unit}</div>}
      </div>
      {spark && <Sparkline data={spark} tone={tone} className="mt-2 h-8 w-full" />}
    </GlassPanel>
  );
}

export function Sparkline({ data, tone = "cyan", className }: { data: number[]; tone?: "cyan" | "violet" | "amber" | "lime"; className?: string }) {
  const w = 100, h = 28;
  const min = Math.min(...data), max = Math.max(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * h}`).join(" ");
  const stroke = `var(--neon-${tone})`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className={className}>
      <defs>
        <linearGradient id={`sp-${tone}`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity="0.4" />
          <stop offset="100%" stopColor={stroke} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polyline points={pts} fill="none" stroke={stroke} strokeWidth="1.4" vectorEffect="non-scaling-stroke" />
      <polygon points={`0,${h} ${pts} ${w},${h}`} fill={`url(#sp-${tone})`} />
    </svg>
  );
}

export function PulseRing({ size = 120, label }: { size?: number; label?: string }) {
  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <motion.div
        className="absolute inset-0 rounded-full border border-neon-cyan/40"
        animate={{ scale: [1, 1.15, 1], opacity: [0.6, 0.1, 0.6] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute inset-3 rounded-full border border-neon-violet/40"
        animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0.15, 0.5] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 0.6 }}
      />
      <div className="relative h-12 w-12 rounded-full bg-gradient-to-br from-[color:var(--neon-cyan)] to-[color:var(--neon-violet)] glow-cyan" />
      {label && <div className="absolute -bottom-6 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{label}</div>}
    </div>
  );
}

export function Waveform({ bars = 48, active = true }: { bars?: number; active?: boolean }) {
  return (
    <div className="flex h-12 items-center gap-[3px]">
      {Array.from({ length: bars }).map((_, i) => (
        <motion.span
          key={i}
          className="w-[3px] rounded-full bg-neon-cyan/80"
          animate={active ? { height: [6, 12 + Math.abs(Math.sin(i * 0.5)) * 28, 6] } : { height: 4 }}
          transition={{ duration: 1.2 + (i % 5) * 0.1, repeat: Infinity, ease: "easeInOut", delay: i * 0.04 }}
        />
      ))}
    </div>
  );
}

export function NeonButton({ children, className, variant = "primary", ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "ghost" }) {
  return (
    <button
      className={cn(
        "inline-flex items-center gap-2 rounded-md border px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.14em] transition-all",
        variant === "primary"
          ? "border-neon-cyan/40 bg-[color-mix(in_oklab,var(--neon-cyan)_10%,transparent)] text-neon-cyan hover:bg-[color-mix(in_oklab,var(--neon-cyan)_18%,transparent)] hover:glow-cyan"
          : "border-border text-muted-foreground hover:border-border-strong hover:text-foreground",
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}
