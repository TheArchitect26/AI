import { useCallback, useMemo, useRef, useState } from "react";
import { sendChat } from "./chat-client";
import type { ChatMessage, ChatMessagePart, ChatToolPart } from "./types";

export type ChatStatus = "ready" | "submitted" | "streaming" | "reconnecting" | "error";

function createMessage(
  role: "user" | "assistant",
  content: string,
  parts?: ChatMessagePart[],
): ChatMessage {
  const id =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

  return {
    id,
    role,
    content,
    parts: parts ?? [{ type: "text", text: content }],
    status: role === "assistant" ? "pending" : "complete",
    createdAt: new Date().toISOString(),
  };
}

export function useNexusChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [status, setStatus] = useState<ChatStatus>("ready");
  const [error, setError] = useState<Error | null>(null);
  const [reconnectAttempt, setReconnectAttempt] = useState(0);
  const abortRef = useRef<AbortController | null>(null);

  const isLive = status === "submitted" || status === "streaming" || status === "reconnecting";

  const stop = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setStatus("ready");
  }, []);

  const send = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isLive) return;

      let assistantId = "";
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const userMessage = createMessage("user", trimmed);
        const assistantPlaceholder = createMessage("assistant", "");
        assistantId = assistantPlaceholder.id;

        setError(null);
        setReconnectAttempt(0);
        setStatus("submitted");
        setMessages((current) => [...current, userMessage, assistantPlaceholder]);
      } catch (error) {
        console.error("[Nexus Chat] failed to initialize message state", error);
        setError(error instanceof Error ? error : new Error("Failed to initialize chat state"));
        setStatus("error");
        abortRef.current = null;
        return;
      }

      try {
        const assistant = await sendChat({
          message: trimmed,
          signal: controller.signal,
          onReconnect: (attempt) => {
            setReconnectAttempt(attempt);
            setStatus("reconnecting");
          },
        });

        setMessages((current) =>
          current.map((message) =>
            message.id === assistantId ? { ...assistant, status: "complete" } : message,
          ),
        );
        setStatus("ready");
      } catch (cause) {
        if (controller.signal.aborted) return;
        console.error("[Nexus Chat] send failed", cause);
        const nextError = cause instanceof Error ? cause : new Error("Chat request failed");
        setError(nextError);
        setMessages((current) =>
          current.map((message) =>
            message.id === assistantId
              ? {
                  ...message,
                  content: nextError.message,
                  parts: [{ type: "text", text: nextError.message }],
                  status: "error",
                }
              : message,
          ),
        );
        setStatus("error");
      } finally {
        if (abortRef.current === controller) abortRef.current = null;
      }
    },
    [isLive],
  );

  const activeTools = useMemo(
    () =>
      messages.flatMap((message) =>
        message.parts.filter(
          (part): part is ChatToolPart =>
            part.type.startsWith("tool-") || part.type === "dynamic-tool",
        ),
      ),
    [messages],
  );

  return {
    messages,
    status,
    error,
    reconnectAttempt,
    isLive,
    activeTools,
    send,
    stop,
  };
}
