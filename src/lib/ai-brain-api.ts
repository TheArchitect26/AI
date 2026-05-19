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
