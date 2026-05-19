#!/bin/bash
set -e

cd /root/ai-os/nexus-core

echo "🔧 Fixing Nexus chat rendering..."

cp src/routes/chat.tsx "src/routes/chat.backup.$(date +%s).tsx"

cat > src/routes/chat.tsx <<'EOF'
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

export const Route = createFileRoute("/chat")({
  component: ChatPage,
});

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content?: string;
  parts?: { type: string; text?: string }[];
};

function getMessageText(message: ChatMessage) {
  if (typeof message.content === "string") return message.content;

  if (Array.isArray(message.parts)) {
    return message.parts.map((part) => part.text || "").join("\n");
  }

  return "";
}

function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  async function sendMessage() {
    if (!input.trim()) return;

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: input,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("http://172.236.24.95:3010/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: userMessage.content,
        }),
      });

      const data = await res.json();

      const assistantMessage: ChatMessage = {
        id: data.id || crypto.randomUUID(),
        role: "assistant",
        content: data.reply || data.content || data.error || "No response.",
        parts: data.parts,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content:
            error instanceof Error
              ? error.message
              : "Failed to contact AI Brain.",
        },
      ]);
    }

    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-[#070712] text-white">
      <div className="border-b border-white/10 p-4">
        <p className="font-mono text-xs uppercase tracking-[0.25em] text-cyan-400">
          Cognition · Live Stream
        </p>
        <h1 className="mt-3 text-2xl font-bold">AI Chat</h1>
        <p className="mt-1 text-sm text-zinc-400">
          AI Brain OS · OpenRouter · backend connected
        </p>
      </div>

      <div className="h-[calc(100vh-210px)] space-y-4 overflow-y-auto p-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${
              message.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-[80%] whitespace-pre-wrap rounded-2xl border p-4 text-sm ${
                message.role === "user"
                  ? "border-violet-500/60 bg-violet-950/40"
                  : "border-cyan-500/50 bg-cyan-950/30"
              }`}
            >
              <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-400">
                {message.role === "user" ? "You" : "AI Brain"}
              </div>

              {getMessageText(message)}
            </div>
          </div>
        ))}

        {loading && (
          <div className="rounded-2xl border border-cyan-500/40 bg-cyan-950/20 p-4 text-sm text-cyan-300">
            AI Brain is thinking...
          </div>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 border-t border-white/10 bg-[#070712] p-4">
        <div className="flex gap-3">
          <textarea
            className="min-h-14 flex-1 rounded-xl border border-white/10 bg-black/50 p-4 text-sm outline-none focus:border-cyan-400"
            placeholder="Ask AI Brain anything..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
          />

          <button
            onClick={sendMessage}
            disabled={loading}
            className="rounded-xl bg-cyan-400 px-6 font-bold text-black disabled:opacity-50"
          >
            {loading ? "..." : "Send"}
          </button>
        </div>
      </div>
    </div>
  );
}
EOF

pm2 restart ai-brain-frontend

echo "✅ Chat render fixed."
echo "Open: http://172.236.24.95:3000/chat"
