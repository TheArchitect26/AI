import { motion } from "framer-motion";
import { Brain, ChevronRight } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";
import type { ChatMessage, ChatToolPart } from "@/services/chat";
import { ToolPart } from "./tool-part";

export function MessageView({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";
  const text =
    message.parts
      .filter((part) => part.type === "text")
      .map((part) => (part.type === "text" ? part.text : ""))
      .join("") || message.content;
  const reasoning = message.parts
    .filter((part) => part.type === "reasoning")
    .map((part) => (part.type === "reasoning" ? part.text : ""))
    .join("\n");
  const toolParts = message.parts.filter(
    (part): part is ChatToolPart => part.type.startsWith("tool-") || part.type === "dynamic-tool",
  );
  const showPending = !isUser && message.status === "pending" && !text;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("flex gap-3", isUser && "flex-row-reverse")}
    >
      <div
        className={cn(
          "flex h-7 w-7 shrink-0 items-center justify-center rounded-md border font-mono text-[10px]",
          isUser
            ? "border-neon-violet/40 bg-[color-mix(in_oklab,var(--neon-violet)_12%,transparent)] text-neon-violet"
            : "border-neon-cyan/40 bg-[color-mix(in_oklab,var(--neon-cyan)_12%,transparent)] text-neon-cyan",
        )}
      >
        {isUser ? "YOU" : "AI"}
      </div>
      <div className="min-w-0 flex-1 space-y-2">
        {reasoning && (
          <details className="group rounded border border-border/40 bg-background/30 p-2 text-xs">
            <summary className="flex cursor-pointer items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
              <Brain className="h-3 w-3" /> reasoning trace{" "}
              <ChevronRight className="h-3 w-3 transition-transform group-open:rotate-90" />
            </summary>
            <p className="mt-2 whitespace-pre-wrap text-[11px] text-muted-foreground/80">
              {reasoning}
            </p>
          </details>
        )}
        {toolParts.length > 0 && (
          <div className="grid grid-cols-1 gap-1.5 md:grid-cols-2">
            {toolParts.map((part, index) => (
              <ToolPart key={`${part.type}-${index}`} part={part} />
            ))}
          </div>
        )}
        {(text || showPending) && (
          <div
            className={cn(
              "rounded-lg border px-3 py-2 text-sm leading-relaxed",
              isUser
                ? "border-neon-violet/30 bg-[color-mix(in_oklab,var(--neon-violet)_8%,transparent)]"
                : "glass border-border/60",
            )}
          >
            {showPending ? (
              <div className="font-mono text-xs uppercase tracking-[0.14em] text-muted-foreground">
                Thinking…
              </div>
            ) : (
              <div className="prose prose-sm prose-invert max-w-none prose-p:my-1 prose-strong:text-neon-cyan prose-a:text-neon-cyan">
                <ReactMarkdown>{text}</ReactMarkdown>
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}
