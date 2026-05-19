import { createFileRoute } from "@tanstack/react-router";
import { AnimatePresence } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { Brain, Database, Mic, Paperclip, Send, Sparkles, Square } from "lucide-react";
import { GlassPanel, NeonButton, SectionHeader, StatusDot } from "@/components/nexus/primitives";
import { MessageView, ToolPart } from "@/components/chat";
import { useNexusChat } from "@/services/chat";

export const Route = createFileRoute("/chat")({
  head: () => ({
    meta: [
      { title: "AI Chat — NEXUS" },
      {
        name: "description",
        content: "Production AI Brain chat with resilient streaming and direct JSON fallback",
      },
    ],
  }),
  component: Page,
});

function Page() {
  const {
    messages,
    status,
    stop,
    error,
    isLive,
    activeTools,
    reconnectAttempt,
    send: sendMessage,
  } = useNexusChat();
  const [input, setInput] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, status]);

  const send = (text?: string) => {
    const nextText = (text ?? input).trim();
    if (!nextText || isLive) return;
    setInput("");
    void sendMessage(nextText, { stream: true });
  };

  const statusLabel =
    status === "reconnecting"
      ? `reconnect ${reconnectAttempt}`
      : isLive
        ? status
        : status === "error"
          ? "error"
          : "ready";

  return (
    <div className="flex h-[calc(100vh-7rem)] flex-col gap-4 lg:flex-row">
      <GlassPanel className="flex min-h-0 flex-1 flex-col">
        <SectionHeader
          eyebrow="Cognition · AI Brain"
          title="AI Chat"
          subtitle="Nexus AI Brain · streaming + JSON fallback · resilient state"
          right={
            <div className="flex items-center gap-2">
              <StatusDot
                tone={isLive ? "online" : status === "error" ? "error" : "idle"}
                pulse={isLive}
              />
              <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-neon-cyan">
                {statusLabel}
              </span>
            </div>
          }
        />
        <div className="flex-1 space-y-4 overflow-y-auto p-5">
          {messages.length === 0 && (
            <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground/70">
              ▸ NEXUS cognition online. Ask anything — try “scan BTC volatility”.
            </div>
          )}
          <AnimatePresence>
            {messages.map((message) => (
              <MessageView key={message.id} message={message} />
            ))}
          </AnimatePresence>
          {error && (
            <div className="rounded border border-status-error/40 bg-status-error/10 p-2 text-xs text-status-error">
              {error.message}
            </div>
          )}
          <div ref={endRef} />
        </div>
        <div className="border-t border-border/60 p-3">
          <div className="glass flex items-end gap-2 rounded-lg p-2">
            <button
              className="rounded p-1.5 text-muted-foreground hover:text-neon-cyan"
              type="button"
            >
              <Paperclip className="h-4 w-4" />
            </button>
            <textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  send();
                }
              }}
              placeholder="Ask NEXUS anything · ⏎ to send · ⇧⏎ newline"
              rows={1}
              className="flex-1 resize-none bg-transparent px-2 py-1.5 text-sm outline-none placeholder:text-muted-foreground/60"
            />
            <button
              className="rounded p-1.5 text-muted-foreground hover:text-neon-cyan"
              type="button"
            >
              <Mic className="h-4 w-4" />
            </button>
            {isLive ? (
              <NeonButton type="button" onClick={stop}>
                <Square className="h-3 w-3" /> Stop
              </NeonButton>
            ) : (
              <NeonButton type="button" onClick={() => send()} disabled={!input.trim()}>
                <Send className="h-3 w-3" /> Send
              </NeonButton>
            )}
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5 px-1 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
            {["Scan BTC volatility", "Recall my risk caps", "Search latest AI papers"].map(
              (suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => send(suggestion)}
                  className="rounded border border-border/50 px-1.5 py-0.5 hover:border-neon-cyan/40 hover:text-neon-cyan"
                  type="button"
                >
                  {suggestion}
                </button>
              ),
            )}
          </div>
        </div>
      </GlassPanel>

      <GlassPanel className="flex w-full flex-col lg:w-80">
        <SectionHeader
          eyebrow="Tool dispatch"
          title="Live tool calls"
          right={
            <div className="flex items-center gap-1.5">
              <StatusDot tone={isLive ? "online" : "idle"} pulse={isLive} />
              <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-neon-cyan">
                {activeTools.length}
              </span>
            </div>
          }
        />
        <div className="flex-1 space-y-2 overflow-y-auto p-3">
          {activeTools.length === 0 ? (
            <div className="rounded border border-dashed border-border/50 p-3 text-center font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
              No tools dispatched yet
            </div>
          ) : (
            activeTools
              .slice()
              .reverse()
              .map((tool, index) => <ToolPart key={`${tool.type}-${index}`} part={tool} />)
          )}
        </div>
        <div className="space-y-3 border-t border-border/60 p-4 text-xs">
          <div className="rounded border border-border/50 p-2.5">
            <div className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-neon-cyan">
              <Sparkles className="h-3 w-3" /> Provider
            </div>
            <div className="mt-1">Nexus AI Brain</div>
            <div className="mt-1 font-mono text-[10px] text-muted-foreground">
              stream · JSON fallback · env configured
            </div>
          </div>
          <div className="rounded border border-border/50 p-2.5">
            <div className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-neon-violet">
              <Database className="h-3 w-3" /> Tools available
            </div>
            <ul className="mt-1 space-y-0.5 font-mono text-[10px] text-muted-foreground">
              <li>· marketScanner</li>
              <li>· memoryRecall</li>
              <li>· webSearch</li>
            </ul>
          </div>
        </div>
      </GlassPanel>
    </div>
  );
}
