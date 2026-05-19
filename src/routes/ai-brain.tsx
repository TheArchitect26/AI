import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { aiBrain } from "@/services/api";

export const Route = createFileRoute("/ai-brain")({
  component: AIBrainPage,
});

type AgentSummary = { name?: string; role?: string };
type TaskSummary = { id?: string; title?: string; agent?: string; status?: string };
type LogSummary = { id?: string; action?: string; result?: string };

function AIBrainPage() {
  const [health, setHealth] = useState<unknown>(null);
  const [stats, setStats] = useState<Record<string, unknown> | null>(null);
  const [agents, setAgents] = useState<AgentSummary[]>([]);
  const [tasks, setTasks] = useState<TaskSummary[]>([]);
  const [logs, setLogs] = useState<LogSummary[]>([]);
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
    setStats(s && typeof s === "object" && !Array.isArray(s) ? s : null);
    setAgents(Array.isArray(a) ? (a as AgentSummary[]) : []);
    setTasks(Array.isArray(t) ? (t as TaskSummary[]) : []);
    setLogs(Array.isArray(l) ? (l as LogSummary[]) : []);
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
          <p className="text-sm uppercase tracking-[0.3em] text-cyan-400">AI Brain Bridge</p>
          <h1 className="mt-2 text-4xl font-bold">Nexus connected to AI Brain Backend</h1>
          <p className="mt-2 text-zinc-400">Live backend: configured by environment</p>
        </div>

        <button onClick={load} className="rounded-xl bg-white px-5 py-3 font-semibold text-black">
          Refresh
        </button>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats &&
          Object.entries(stats).map(([key, value]) => (
            <div key={key} className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
              <p className="text-sm text-zinc-500">{key}</p>
              <p className="mt-2 text-4xl font-bold text-cyan-400">{String(value)}</p>
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
              <div
                key={agent.name ?? crypto.randomUUID()}
                className="rounded-xl border border-zinc-800 bg-black p-4"
              >
                <p className="font-bold">{agent.name ?? "Unnamed agent"}</p>
                <p className="text-sm text-zinc-400">{agent.role ?? "unknown"}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
          <h2 className="mb-4 text-2xl font-bold">Tasks</h2>
          <div className="space-y-3">
            {tasks.slice(0, 8).map((task) => (
              <div
                key={task.id ?? crypto.randomUUID()}
                className="rounded-xl border border-zinc-800 bg-black p-4"
              >
                <p className="font-bold">{task.title ?? "Untitled task"}</p>
                <p className="text-sm text-zinc-400">
                  {task.agent ?? "unassigned"} · {task.status ?? "unknown"}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
          <h2 className="mb-4 text-2xl font-bold">AI Logs</h2>
          <div className="space-y-3">
            {logs.slice(0, 8).map((log) => (
              <div
                key={log.id ?? crypto.randomUUID()}
                className="rounded-xl border border-zinc-800 bg-black p-4"
              >
                <p className="font-bold">{log.action ?? "Log entry"}</p>
                <p className="line-clamp-3 text-sm text-zinc-400">{log.result ?? ""}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
