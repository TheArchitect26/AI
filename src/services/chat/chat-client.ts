import { getApiBaseUrl, getChatApiPath } from "@/services/api";
import type {
  ChatMessage,
  ChatRequest,
  ChatResponse,
  ChatStreamEvent,
  ChatToolPart,
} from "./types";

export class ChatClientError extends Error {
  status?: number;
  details?: unknown;

  constructor(message: string, status?: number, details?: unknown) {
    super(message);
    this.name = "ChatClientError";
    this.status = status;
    this.details = details;
  }
}

export type SendChatOptions = {
  messages: ChatMessage[];
  message?: string;
  stream?: boolean;
  signal?: AbortSignal;
  onEvent?: (event: ChatStreamEvent) => void;
  onReconnect?: (attempt: number) => void;
};

const RETRYABLE_STATUS = new Set([408, 425, 429, 500, 502, 503, 504]);

function sleep(ms: number, signal?: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    if (signal?.aborted) {
      reject(signal.reason ?? new DOMException("Aborted", "AbortError"));
      return;
    }

    const timeout = window.setTimeout(resolve, ms);
    signal?.addEventListener(
      "abort",
      () => {
        window.clearTimeout(timeout);
        reject(signal.reason ?? new DOMException("Aborted", "AbortError"));
      },
      { once: true },
    );
  });
}

function extractTextFromPayload(payload: unknown): string {
  if (!payload || typeof payload !== "object") return "";
  const record = payload as Record<string, unknown>;

  for (const key of ["delta", "text", "content", "reply", "message"]) {
    if (typeof record[key] === "string") return record[key] as string;
  }

  return "";
}

function normalizeStreamEvent(payload: unknown): ChatStreamEvent | null {
  if (!payload || typeof payload !== "object") return null;
  const record = payload as Record<string, unknown>;
  const type = typeof record.type === "string" ? record.type : "";

  if (["delta", "text-delta", "text_delta", "response.output_text.delta"].includes(type)) {
    return { type: "delta", delta: extractTextFromPayload(payload) };
  }

  if (["reasoning", "reasoning-delta", "reasoning_delta"].includes(type)) {
    return { type: "reasoning", delta: extractTextFromPayload(payload) };
  }

  if (type.startsWith("tool-") || type === "dynamic-tool" || type === "tool") {
    const part =
      type === "tool" && record.part && typeof record.part === "object" ? record.part : record;
    return { type: "tool", part: part as ChatToolPart };
  }

  if (["done", "finish", "message-finish"].includes(type)) return { type: "done" };

  if (type === "error") {
    return {
      type: "error",
      error: typeof record.error === "string" ? record.error : "Chat stream failed",
      details: record.details,
    };
  }

  const text = extractTextFromPayload(payload);
  return text ? { type: "delta", delta: text } : null;
}

async function readJsonResponse(response: Response): Promise<ChatResponse> {
  const data = await response.json();
  if (!response.ok) {
    throw new ChatClientError(
      data?.error || "Nexus chat request failed",
      response.status,
      data?.details ?? data,
    );
  }

  const content = data?.content || data?.reply || data?.message || "";
  return {
    id: data?.id || crypto.randomUUID(),
    role: "assistant",
    content,
    parts: Array.isArray(data?.parts) ? data.parts : [{ type: "text", text: content }],
    createdAt: data?.createdAt || new Date().toISOString(),
  };
}

async function readStreamResponse(
  response: Response,
  onEvent?: (event: ChatStreamEvent) => void,
): Promise<ChatResponse> {
  if (!response.body)
    throw new ChatClientError("Chat stream did not include a response body", response.status);

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  const assistant: ChatResponse = {
    id: crypto.randomUUID(),
    role: "assistant",
    content: "",
    parts: [{ type: "text", text: "" }],
    createdAt: new Date().toISOString(),
  };
  let buffer = "";

  const applyEvent = (event: ChatStreamEvent) => {
    onEvent?.(event);
    if (event.type === "start" && event.id) assistant.id = event.id;
    if (event.type === "delta") assistant.content += event.delta;
    if (event.type === "tool") assistant.parts.push(event.part);
    if (event.type === "done" && event.message) Object.assign(assistant, event.message);
    if (event.type === "error")
      throw new ChatClientError(event.error, response.status, event.details);
    const textPart = assistant.parts.find((part) => part.type === "text");
    if (textPart?.type === "text") textPart.text = assistant.content;
  };

  const flushLine = (line: string) => {
    if (!line.trim() || line.startsWith(":")) return;
    const payload = line.startsWith("data:") ? line.slice(5).trim() : line.trim();
    if (!payload || payload === "[DONE]") {
      applyEvent({ type: "done" });
      return;
    }

    try {
      const parsed = JSON.parse(payload) as unknown;
      const event = normalizeStreamEvent(parsed);
      if (event) applyEvent(event);
    } catch {
      applyEvent({ type: "delta", delta: payload });
    }
  };

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    lines.forEach(flushLine);
  }

  if (buffer.trim()) flushLine(buffer);
  applyEvent({ type: "done" });
  return assistant;
}

export async function sendChat(options: SendChatOptions): Promise<ChatResponse> {
  const request: ChatRequest = {
    messages: options.messages,
    message: options.message,
    stream: options.stream ?? true,
  };

  let attempt = 0;
  let consumedStream = false;

  while (true) {
    const response = await fetch(`${getApiBaseUrl()}${getChatApiPath()}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: request.stream ? "text/event-stream, application/json" : "application/json",
      },
      body: JSON.stringify(request),
      signal: options.signal,
    }).catch((error: unknown) => {
      if (options.signal?.aborted) throw error;
      throw new ChatClientError(error instanceof Error ? error.message : "Network request failed");
    });

    if (!response.ok && RETRYABLE_STATUS.has(response.status) && attempt < 1 && !consumedStream) {
      attempt += 1;
      options.onReconnect?.(attempt);
      await sleep(350 * attempt, options.signal);
      continue;
    }

    const contentType = response.headers.get("content-type") ?? "";
    if (contentType.includes("text/event-stream") || contentType.includes("application/x-ndjson")) {
      consumedStream = true;
      return readStreamResponse(response, options.onEvent);
    }

    return readJsonResponse(response);
  }
}
