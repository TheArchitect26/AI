import { Wrench } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ChatToolPart } from "@/services/chat";

export function ToolPart({ part }: { part: ChatToolPart }) {
  const type = String(part.type);
  const name = type.startsWith("tool-")
    ? type.slice(5)
    : type === "dynamic-tool"
      ? String(part.toolName ?? "tool")
      : "tool";
  const state = String(part.state ?? "");
  const tone =
    state === "output-available"
      ? "bg-status-online"
      : state === "input-streaming" || state === "input-available"
        ? "bg-neon-cyan animate-pulse"
        : state === "output-error"
          ? "bg-status-error"
          : "bg-status-idle";
  const label = state === "output-available" ? "done" : state.replace(/-/g, " ") || "pending";
  const preview =
    state === "output-available"
      ? JSON.stringify(part.output).slice(0, 140)
      : part.input
        ? JSON.stringify(part.input).slice(0, 140)
        : part.errorText || "dispatching…";

  return (
    <div className="flex items-start gap-2 rounded border border-border/50 bg-background/30 p-2">
      <span className={cn("mt-1 h-1.5 w-1.5 shrink-0 rounded-full", tone)} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.16em] text-neon-cyan">
          <span className="flex items-center gap-1">
            <Wrench className="h-3 w-3" /> {name}
          </span>
          <span className="text-muted-foreground">{label}</span>
        </div>
        <div className="mt-0.5 truncate text-[11px] text-muted-foreground">{preview}</div>
      </div>
    </div>
  );
}
