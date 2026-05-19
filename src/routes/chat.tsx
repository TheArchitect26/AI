import { createFileRoute } from "@tanstack/react-router";
import { GlassPanel, SectionHeader, StatusDot, NeonButton } from "@/components/nexus/primitives";
import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Paperclip, Mic, Sparkles, Wrench, Brain, Database, ChevronRight, Square } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";

export const Route = createFileRoute("/chat")({
  head: () => ({ meta: [{ title: "AI Chat — NEXUS" }, { name: "description", content: "Streaming multi-agent chat with tool calls and reasoning" }] }),
  component: Page,
});

type AnyPart = UIMessage["parts"][number] & Record<string, unknown>;

function ToolPart({ part }: { part: AnyPart }) {
  const type = String(part.type);
  const name = type.startsWith("tool-") ? type.slice(5) : type === "dynamic-tool" ? String(part.toolName ?? "tool") : "tool";
  const state = String(part.state ?? "");
  const tone = state === "output-available" ? "bg-status-online" : state === "input-streaming" || state === "input-available" ? "bg-neon-cyan animate-pulse" : state === "output-error" ? "bg-status-error" : "bg-status-idle";
  const label = state === "output-available" ? "done" : state.replace(/-/g, " ") || "pending";
  const preview = state === "output-available"
    ? JSON.stringify(part.output).slice(0, 140)
    : part.input ? JSON.stringify(part.input).slice(0, 140) : "dispatching…";
  return (
    <div className="flex items-start gap-2 rounded border border-border/50 bg-background/30 p-2">
      <span className={cn("mt-1 h-1.5 w-1.5 shrink-0 rounded-full", tone)} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.16em] text-neon-cyan">
          <span className="flex items-center gap-1"><Wrench className="h-3 w-3" /> {name}</span>
          <span className="text-muted-foreground">{label}</span>
        </div>
        <div className="mt-0.5 truncate text-[11px] text-muted-foreground">{preview}</div>
      </div>
    </div>
  );
}

function MessageView({ m }: { m: UIMessage }) {
  const isUser = m.role === "user";
  const text = m.parts.filter(p => p.type === "text").map(p => (p as { text: string }).text).join("");
  const reasoning = m.parts.filter(p => p.type === "reasoning").map(p => (p as { text: string }).text).join("\n");
  const toolParts = m.parts.filter(p => p.type.startsWith("tool-") || p.type === "dynamic-tool") as AnyPart[];

  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className={cn("flex gap-3", isUser && "flex-row-reverse")}>
      <div className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-md border font-mono text-[10px]",
        isUser ? "border-neon-violet/40 bg-[color-mix(in_oklab,var(--neon-violet)_12%,transparent)] text-neon-violet"
               : "border-neon-cyan/40 bg-[color-mix(in_oklab,var(--neon-cyan)_12%,transparent)] text-neon-cyan")}>
        {isUser ? "YOU" : "AI"}
      </div>
      <div className={cn("min-w-0 flex-1 space-y-2")}>
        {reasoning && (
          <details className="group rounded border border-border/40 bg-background/30 p-2 text-xs">
            <summary className="flex cursor-pointer items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
              <Brain className="h-3 w-3" /> reasoning trace <ChevronRight className="h-3 w-3 transition-transform group-open:rotate-90" />
            </summary>
            <p className="mt-2 whitespace-pre-wrap text-[11px] text-muted-foreground/80">{reasoning}</p>
          </details>
        )}
        {toolParts.length > 0 && (
          <div className="grid grid-cols-1 gap-1.5 md:grid-cols-2">{toolParts.map((t, i) => <ToolPart key={i} part={t} />)}</div>
        )}
        {text && (
          <div className={cn("rounded-lg border px-3 py-2 text-sm leading-relaxed",
            isUser ? "border-neon-violet/30 bg-[color-mix(in_oklab,var(--neon-violet)_8%,transparent)]" : "glass border-border/60")}>
            <div className="prose prose-sm prose-invert max-w-none prose-p:my-1 prose-strong:text-neon-cyan prose-a:text-neon-cyan">
              <ReactMarkdown>{text}</ReactMarkdown>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

function Page() {
  const transport = useMemo(() => new DefaultChatTransport({ api: "http://172.236.24.95:3010/api/chat" }), []);
  const { messages, sendMessage, status, stop, error } = useChat({ transport });
  const [input, setInput] = useState("");
  const endRef = useRef<HTMLDivElement>(null);
  const isLive = status === "submitted" || status === "streaming";

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, status]);

  const send = (text?: string) => {
    const t = (text ?? input).trim();
    if (!t || isLive) return;
    setInput("");
    sendMessage({ text: t });
  };

  const activeTools = messages.flatMap(m => m.parts.filter(p => p.type.startsWith("tool-") || p.type === "dynamic-tool")) as AnyPart[];

  return (
    <div className="flex h-[calc(100vh-7rem)] flex-col gap-4 lg:flex-row">
      <GlassPanel className="flex min-h-0 flex-1 flex-col">
        <SectionHeader eyebrow="Cognition · live stream" title="AI Chat"
          subtitle="Lovable AI · gemini-3-flash · tools + memory"
          right={<div className="flex items-center gap-2"><StatusDot tone={isLive ? "online" : "idle"} pulse={isLive} /><span className="font-mono text-[10px] uppercase tracking-[0.16em] text-neon-cyan">{isLive ? status : "ready"}</span></div>} />
        <div className="flex-1 space-y-4 overflow-y-auto p-5">
          {messages.length === 0 && (
            <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground/70">▸ NEXUS cognition online. Ask anything — try “scan BTC volatility”.</div>
          )}
          <AnimatePresence>{messages.map(m => <MessageView key={m.id} m={m} />)}</AnimatePresence>
          {error && <div className="rounded border border-status-error/40 bg-status-error/10 p-2 text-xs text-status-error">{error.message}</div>}
          <div ref={endRef} />
        </div>
        <div className="border-t border-border/60 p-3">
          <div className="glass flex items-end gap-2 rounded-lg p-2">
            <button className="rounded p-1.5 text-muted-foreground hover:text-neon-cyan"><Paperclip className="h-4 w-4" /></button>
            <textarea value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }}}
              placeholder="Ask NEXUS anything · ⏎ to send · ⇧⏎ newline"
              rows={1}
              className="flex-1 resize-none bg-transparent px-2 py-1.5 text-sm outline-none placeholder:text-muted-foreground/60" />
            <button className="rounded p-1.5 text-muted-foreground hover:text-neon-cyan"><Mic className="h-4 w-4" /></button>
            {isLive ? (
              <NeonButton type="button" onClick={stop}><Square className="h-3 w-3" /> Stop</NeonButton>
            ) : (
              <NeonButton type="button" onClick={() => send()} disabled={!input.trim()}><Send className="h-3 w-3" /> Send</NeonButton>
            )}
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5 px-1 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
            {["Scan BTC volatility", "Recall my risk caps", "Search latest AI papers"].map(s => (
              <button key={s} onClick={() => send(s)} className="rounded border border-border/50 px-1.5 py-0.5 hover:border-neon-cyan/40 hover:text-neon-cyan">{s}</button>
            ))}
          </div>
        </div>
      </GlassPanel>

      <GlassPanel className="flex w-full flex-col lg:w-80">
        <SectionHeader eyebrow="Tool dispatch" title="Live tool calls"
          right={<div className="flex items-center gap-1.5"><StatusDot tone={isLive ? "online" : "idle"} pulse={isLive} /><span className="font-mono text-[10px] uppercase tracking-[0.16em] text-neon-cyan">{activeTools.length}</span></div>} />
        <div className="flex-1 space-y-2 overflow-y-auto p-3">
          {activeTools.length === 0 ? (
            <div className="rounded border border-dashed border-border/50 p-3 text-center font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">No tools dispatched yet</div>
          ) : activeTools.slice().reverse().map((t, i) => <ToolPart key={i} part={t} />)}
        </div>
        <div className="space-y-3 border-t border-border/60 p-4 text-xs">
          <div className="rounded border border-border/50 p-2.5">
            <div className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-neon-cyan"><Sparkles className="h-3 w-3" /> Model</div>
            <div className="mt-1">google/gemini-3-flash-preview</div>
            <div className="mt-1 font-mono text-[10px] text-muted-foreground">stream · tools · 128k ctx</div>
          </div>
          <div className="rounded border border-border/50 p-2.5">
            <div className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-neon-violet"><Database className="h-3 w-3" /> Tools available</div>
            <ul className="mt-1 space-y-0.5 font-mono text-[10px] text-muted-foreground">
              <li>· marketScanner</li><li>· memoryRecall</li><li>· webSearch</li>
            </ul>
          </div>
        </div>
      </GlassPanel>
    </div>
  );
}