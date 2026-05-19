#!/bin/bash
set -e

cd /root/ai-os/nexus-core

echo "🚀 Adding AI Brain bridge to Nexus..."

mkdir -p src/lib src/routes

cat > src/lib/ai-brain-api.ts <<'EOF'
const API_BASE_URL =
  import.meta.env.VITE_AI_BRAIN_API || "http://172.236.24.95:4000";

export async function apiGet(path: string) {
  const res = await fetch(`${API_BASE_URL}${path}`);
  if (!res.ok) throw new Error(`GET ${path} failed`);
  return res.json();
}

export async function apiPost(path: string, body: unknown) {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data?.error || `POST ${path} failed`);
  return data;
}

export const aiBrain = {
  health: () => apiGet("/api/health"),
  stats: () => apiGet("/api/dashboard/stats"),
  agents: () => apiGet("/api/agents"),
  tasks: () => apiGet("/api/tasks"),
  logs: () => apiGet("/api/agent/logs"),
  chat: (message: string) => apiPost("/api/chat", { message }),
};
EOF

cat > src/routes/ai-brain.tsx <<'EOF'
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { aiBrain } from "@/lib/ai-brain-api";

export const Route = createFileRoute("/ai-brain")({
  component: AIBrainPage,
});

function AIBrainPage() {
  const [health, setHealth] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [agents, setAgents] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [message, setMessage] = useState("");
  const [reply, setReply] = useState("");
  const [loading, setLoading] = useState(false);

  async function load() {
    const [h, s, a, t, l] = await Promise.all([
      aiBrain.health(),
      aiBrain.stats(),
      aiBrain.agents(),
      aiBrain.tasks(),
      aiBrain.logs(),
    ]);

    setHealth(h);
    setStats(s);
    setAgents(Array.isArray(a) ? a : []);
    setTasks(Array.isArray(t) ? t : []);
    setLogs(Array.isArray(l) ? l : []);
  }

  async function send() {
    if (!message.trim()) return;
    setLoading(true);
    setReply("");

    try {
      const data = await aiBrain.chat(message);
      setReply(data.reply || "No response");
      setMessage("");
    } catch (error) {
      setReply(error instanceof Error ? error.message : "Chat failed");
    }

    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="min-h-screen bg-black p-6 text-white">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-cyan-400">
            AI Brain Bridge
          </p>
          <h1 className="mt-2 text-4xl font-bold">
            Nexus connected to AI Brain Backend
          </h1>
          <p className="mt-2 text-zinc-400">
            Live backend: http://172.236.24.95:4000
          </p>
        </div>

        <button
          onClick={load}
          className="rounded-xl bg-white px-5 py-3 font-semibold text-black"
        >
          Refresh
        </button>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats &&
          Object.entries(stats).map(([key, value]) => (
            <div key={key} className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
              <p className="text-sm text-zinc-500">{key}</p>
              <p className="mt-2 text-4xl font-bold text-cyan-400">
                {String(value)}
              </p>
            </div>
          ))}
      </div>

      <div className="mb-8 grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
          <h2 className="mb-4 text-2xl font-bold">Backend Health</h2>
          <pre className="overflow-auto rounded-xl border border-zinc-800 bg-black p-4 text-sm">
            {JSON.stringify(health, null, 2)}
          </pre>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
          <h2 className="mb-4 text-2xl font-bold">AI Chat</h2>

          <textarea
            className="mb-4 min-h-32 w-full rounded-xl border border-zinc-700 bg-black p-4"
            placeholder="Ask AI Brain..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />

          <button
            onClick={send}
            disabled={loading}
            className="rounded-xl bg-white px-5 py-3 font-semibold text-black disabled:opacity-50"
          >
            {loading ? "Thinking..." : "Send"}
          </button>

          {reply && (
            <div className="mt-4 whitespace-pre-wrap rounded-xl border border-zinc-800 bg-black p-4">
              {reply}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
          <h2 className="mb-4 text-2xl font-bold">Agents</h2>
          <div className="space-y-3">
            {agents.map((agent) => (
              <div key={agent.name} className="rounded-xl border border-zinc-800 bg-black p-4">
                <p className="font-bold">{agent.name}</p>
                <p className="text-sm text-zinc-400">{agent.role}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
          <h2 className="mb-4 text-2xl font-bold">Tasks</h2>
          <div className="space-y-3">
            {tasks.slice(0, 8).map((task) => (
              <div key={task.id} className="rounded-xl border border-zinc-800 bg-black p-4">
                <p className="font-bold">{task.title}</p>
                <p className="text-sm text-zinc-400">
                  {task.agent} · {task.status}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
          <h2 className="mb-4 text-2xl font-bold">AI Logs</h2>
          <div className="space-y-3">
            {logs.slice(0, 8).map((log) => (
              <div key={log.id} className="rounded-xl border border-zinc-800 bg-black p-4">
                <p className="font-bold">{log.action}</p>
                <p className="line-clamp-3 text-sm text-zinc-400">
                  {log.result}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
EOF

cat > .env <<'EOF'
VITE_AI_BRAIN_API=http://172.236.24.95:4000
VITE_APP_NAME=NEXUS AI Brain
EOF

echo "✅ AI Brain bridge added."
echo "Restart frontend:"
echo "pm2 restart ai-brain-frontend"
