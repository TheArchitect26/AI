import { createFileRoute } from "@tanstack/react-router";
import { GlassPanel, SectionHeader, StatusDot, NeonButton, PulseRing, MetricTile } from "@/components/nexus/primitives";
import { useEffect, useRef, useState } from "react";
import { Mic, Square, Volume2 } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/voice")({
  head: () => ({ meta: [{ title: "Voice Console — NEXUS" }, { name: "description", content: "Push-to-talk · live waveform · transcript" }] }),
  component: Page,
});

type Line = { id: string; speaker: "you" | "nexus"; text: string; ts: string };

function LiveWave({ active }: { active: boolean }) {
  const [bars, setBars] = useState<number[]>(() => Array.from({ length: 64 }, () => 0.1));
  useEffect(() => {
    const id = setInterval(() => {
      setBars(prev => prev.map(() => active ? 0.15 + Math.random() * 0.85 : 0.05 + Math.random() * 0.08));
    }, 80);
    return () => clearInterval(id);
  }, [active]);
  return (
    <div className="flex h-32 items-center justify-center gap-[3px]">
      {bars.map((h, i) => (
        <span key={i}
          style={{ height: `${h * 100}%` }}
          className={cn("w-[4px] rounded-full transition-all duration-75",
            active ? "bg-gradient-to-t from-[color:var(--neon-cyan)] to-[color:var(--neon-violet)]" : "bg-border")} />
      ))}
    </div>
  );
}

function Page() {
  const [recording, setRecording] = useState(false);
  const [lines, setLines] = useState<Line[]>([
    { id: "1", speaker: "nexus", ts: "11:32:04", text: "Voice channel ready. Hold the spacebar or press the orb to talk." },
    { id: "2", speaker: "you", ts: "11:32:18", text: "What's the latest on the BTC volatility spike?" },
    { id: "3", speaker: "nexus", ts: "11:32:19", text: "Realized vol jumped to 3.42% in the last 24 hours, 84th percentile of the trailing 90 day window." },
  ]);
  const partialRef = useRef("");
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const start = () => {
    if (recording) return;
    setRecording(true);
    partialRef.current = "";
    const id = setInterval(() => {
      const fragments = ["analyze ", "the latest ", "earnings report ", "from nvidia ", "and summarize ", "key risks"];
      partialRef.current += fragments[Math.floor(Math.random() * fragments.length)];
    }, 400);
    timerRef.current = id;
  };
  const stop = () => {
    if (!recording) return;
    setRecording(false);
    if (timerRef.current) clearInterval(timerRef.current);
    const text = partialRef.current.trim() || "(silence)";
    const ts = new Date().toISOString().slice(11, 19);
    setLines(prev => [...prev,
      { id: crypto.randomUUID(), speaker: "you", ts, text },
      { id: crypto.randomUUID(), speaker: "nexus", ts, text: "Pulling NVDA filings, parsing risk factors, will return a structured digest in chat." },
    ]);
  };

  useEffect(() => {
    const down = (e: KeyboardEvent) => { if (e.code === "Space" && !e.repeat) { e.preventDefault(); start(); } };
    const up = (e: KeyboardEvent) => { if (e.code === "Space") { e.preventDefault(); stop(); } };
    window.addEventListener("keydown", down); window.addEventListener("keyup", up);
    return () => { window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); };
  });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <MetricTile label="STT latency" value="84" unit="ms" delta="↘ 12ms" tone="cyan" spark={[140,120,100,95,90,84]} />
        <MetricTile label="TTS latency" value="142" unit="ms" tone="violet" spark={[180,160,150,140,142,142]} />
        <MetricTile label="Wake-word" value="0.94" unit="conf" tone="lime" />
        <MetricTile label="Session" value="00:04:21" tone="amber" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <GlassPanel className="lg:col-span-2" scanline>
          <SectionHeader eyebrow="Acoustic interface" title="Push-to-talk"
            subtitle="Hold SPACE or click the orb · whisper-streaming STT · ElevenLabs TTS"
            right={<div className="flex items-center gap-2"><StatusDot tone={recording ? "online" : "idle"} pulse={recording} /><span className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">{recording ? "capturing" : "idle"}</span></div>} />
          <div className="flex flex-col items-center gap-6 p-8">
            <PulseRing size={140} label={recording ? "listening" : "tap to talk"} />
            <LiveWave active={recording} />
            <div className="flex items-center gap-3">
              <NeonButton onClick={recording ? stop : start} className={recording ? "border-[color:var(--neon-amber)]/50 text-[color:var(--neon-amber)]" : ""}>
                {recording ? <><Square className="h-3 w-3" /> Stop</> : <><Mic className="h-3 w-3" /> Hold to talk</>}
              </NeonButton>
              <NeonButton variant="ghost"><Volume2 className="h-3 w-3" /> Playback</NeonButton>
            </div>
          </div>
        </GlassPanel>

        <GlassPanel>
          <SectionHeader eyebrow="Transcript" title="Live captions" />
          <div className="max-h-[26rem] space-y-3 overflow-y-auto p-4">
            {lines.map(l => (
              <motion.div key={l.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                className={cn("rounded border p-2 text-xs",
                  l.speaker === "you" ? "border-neon-violet/30 bg-[color-mix(in_oklab,var(--neon-violet)_8%,transparent)]" : "border-neon-cyan/30 bg-[color-mix(in_oklab,var(--neon-cyan)_6%,transparent)]")}>
                <div className="flex items-center justify-between font-mono text-[9px] uppercase tracking-[0.18em]">
                  <span className={l.speaker === "you" ? "text-neon-violet" : "text-neon-cyan"}>{l.speaker}</span>
                  <span className="text-muted-foreground">{l.ts}</span>
                </div>
                <p className="mt-1 leading-relaxed">{l.text}</p>
              </motion.div>
            ))}
            {recording && <div className="rounded border border-dashed border-neon-cyan/30 p-2 text-xs italic text-muted-foreground">▌ partial · listening…</div>}
          </div>
        </GlassPanel>
      </div>
    </div>
  );
}
