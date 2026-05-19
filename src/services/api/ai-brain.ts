import { api } from "./http";

export type AiBrainChatResponse = {
  reply?: string;
  message?: string;
  content?: string;
  error?: string;
  details?: unknown;
};

export const aiBrain = {
  health: () => api.get<unknown>("/api/health"),
  stats: () => api.get<Record<string, unknown>>("/api/dashboard/stats"),
  agents: () => api.get<unknown[]>("/api/agents"),
  tasks: () => api.get<unknown[]>("/api/tasks"),
  logs: () => api.get<unknown[]>("/api/agent/logs"),
  chat: (message: string) => api.post<AiBrainChatResponse>("/api/chat", { message }),
};
