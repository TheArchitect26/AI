import { getApiBaseUrl, getChatApiPath } from "@/services/api";
import { assistantFromAiBrainReply } from "./adapters";
import type { ChatMessage, ChatResponse } from "./types";

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
  message: string;
  messages?: ChatMessage[];
  signal?: AbortSignal;
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

async function readJsonSafely(response: Response) {
  const text = await response.text();
  if (!text) return null;

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

function extractError(payload: unknown) {
  if (payload && typeof payload === "object" && "error" in payload) {
    const error = (payload as { error?: unknown }).error;
    if (typeof error === "string" && error.trim()) return error;
  }

  if (typeof payload === "string" && payload.trim()) return payload;
  return "Nexus chat request failed";
}

export async function sendChat(options: SendChatOptions): Promise<ChatResponse> {
  const message = options.message.trim();
  if (!message) throw new ChatClientError("No message provided", 400);

  let attempt = 0;

  while (true) {
    const response = await fetch(`${getApiBaseUrl()}${getChatApiPath()}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ message }),
      signal: options.signal,
    }).catch((error: unknown) => {
      if (options.signal?.aborted) throw error;
      throw new ChatClientError(error instanceof Error ? error.message : "Network request failed");
    });

    const payload = await readJsonSafely(response);

    if (!response.ok) {
      if (RETRYABLE_STATUS.has(response.status) && attempt < 1) {
        attempt += 1;
        options.onReconnect?.(attempt);
        await sleep(350 * attempt, options.signal);
        continue;
      }

      throw new ChatClientError(extractError(payload), response.status, payload);
    }

    return assistantFromAiBrainReply(payload);
  }
}
