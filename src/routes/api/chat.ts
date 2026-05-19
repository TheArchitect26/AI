import { createFileRoute } from "@tanstack/react-router";
import { getAiBrainBaseUrl } from "@/services/api/config";
import type { ChatMessage, ChatResponse } from "@/services/chat/types";

type RawChatRequest = {
  message?: unknown;
  messages?: unknown;
  stream?: unknown;
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
    },
  });
}

function sse(data: unknown) {
  return `data: ${JSON.stringify(data)}\n\n`;
}

function textFromMessage(message: unknown): string {
  if (!message || typeof message !== "object") return "";
  const record = message as Record<string, unknown>;
  if (typeof record.content === "string") return record.content;

  if (Array.isArray(record.parts)) {
    return record.parts
      .map((part) => {
        if (part && typeof part === "object" && (part as Record<string, unknown>).type === "text") {
          const text = (part as Record<string, unknown>).text;
          return typeof text === "string" ? text : "";
        }
        return "";
      })
      .join("");
  }

  return "";
}

function extractUserText(body: RawChatRequest): string {
  if (typeof body.message === "string" && body.message.trim()) return body.message.trim();
  if (!Array.isArray(body.messages)) return "";

  const lastUserMessage = [...body.messages]
    .reverse()
    .find(
      (message) =>
        message &&
        typeof message === "object" &&
        (message as Record<string, unknown>).role === "user",
    );

  return textFromMessage(lastUserMessage).trim();
}

function normalizeAssistant(data: unknown): ChatResponse {
  const record = data && typeof data === "object" ? (data as Record<string, unknown>) : {};
  const content =
    (typeof record.content === "string" && record.content) ||
    (typeof record.reply === "string" && record.reply) ||
    (typeof record.message === "string" && record.message) ||
    "No response.";

  return {
    id: typeof record.id === "string" ? record.id : crypto.randomUUID(),
    role: "assistant",
    content,
    parts: Array.isArray(record.parts)
      ? (record.parts as ChatMessage["parts"])
      : [{ type: "text", text: content }],
    createdAt: typeof record.createdAt === "string" ? record.createdAt : new Date().toISOString(),
  };
}

function wantsStream(request: Request, body: RawChatRequest) {
  const accept = request.headers.get("accept") ?? "";
  return body.stream === true || accept.includes("text/event-stream");
}

async function streamJsonAsSse(response: ChatResponse) {
  const encoder = new TextEncoder();
  const words = response.content.match(/\S+\s*/g) ?? [response.content];

  return new Response(
    new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode(sse({ type: "start", id: response.id })));
        for (const word of words) {
          controller.enqueue(encoder.encode(sse({ type: "delta", delta: word })));
        }
        controller.enqueue(encoder.encode(sse({ type: "done", message: response })));
        controller.close();
      },
    }),
    {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    },
  );
}

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = (await request.json()) as RawChatRequest;
          const message = extractUserText(body);
          const aiBrainBaseUrl = getAiBrainBaseUrl();

          if (!message) return json({ error: "No message provided" }, 400);
          if (!aiBrainBaseUrl) {
            return json(
              {
                error: "AI Brain API URL is not configured",
                details: "Set AI_BRAIN_API_URL on the server environment.",
              },
              500,
            );
          }

          const upstream = await fetch(`${aiBrainBaseUrl}/api/chat`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Accept: wantsStream(request, body)
                ? "text/event-stream, application/json"
                : "application/json",
            },
            body: JSON.stringify({ message, stream: wantsStream(request, body) }),
            signal: request.signal,
          });

          const upstreamContentType = upstream.headers.get("content-type") ?? "";

          if (
            wantsStream(request, body) &&
            upstream.ok &&
            upstreamContentType.includes("text/event-stream") &&
            upstream.body
          ) {
            return new Response(upstream.body, {
              status: upstream.status,
              headers: {
                "Content-Type": upstreamContentType,
                "Cache-Control": "no-cache, no-transform",
                Connection: "keep-alive",
              },
            });
          }

          const upstreamText = await upstream.text();
          let data: Record<string, unknown>;
          try {
            data = upstreamText ? JSON.parse(upstreamText) : {};
          } catch {
            data = { reply: upstreamText };
          }

          if (!upstream.ok) {
            return json(
              {
                error: typeof data.error === "string" ? data.error : "AI Brain backend failed",
                details: data.details ?? data,
              },
              upstream.status,
            );
          }

          const assistant = normalizeAssistant(data);
          return wantsStream(request, body) ? streamJsonAsSse(assistant) : json(assistant);
        } catch (error) {
          if (error instanceof DOMException && error.name === "AbortError") {
            return json({ error: "Chat request aborted" }, 499);
          }

          return json(
            {
              error: "Nexus chat bridge failed",
              details: error instanceof Error ? error.message : String(error),
            },
            500,
          );
        }
      },
    },
  },
});
