import { useCallback, useMemo, useRef, useState } from "react";
import { sendChat } from "./chat-client";
import type { ChatMessage, ChatMessagePart, ChatStreamEvent, ChatToolPart } from "./types";

export type ChatStatus = "ready" | "submitted" | "streaming" | "reconnecting" | "error";

function createMessage(
  role: "user" | "assistant",
  content: string,
  parts?: ChatMessagePart[],
): ChatMessage {
  return {
    id: crypto.randomUUID(),
    role,
    content,
    parts: parts ?? [{ type: "text", text: content }],
    status: role === "assistant" ? "pending" : "complete",
    createdAt: new Date().toISOString(),
  };
}

function appendAssistantDelta(message: ChatMessage, delta: string): ChatMessage {
  const nextContent = `${message.content}${delta}`;
  const parts = message.parts.length
    ? [...message.parts]
    : [{ type: "text", text: "" } as ChatMessagePart];
  const textPartIndex = parts.findIndex((part) => part.type === "text");

  if (textPartIndex >= 0 && parts[textPartIndex]?.type === "text") {
    parts[textPartIndex] = { type: "text", text: nextContent };
  } else {
    parts.unshift({ type: "text", text: nextContent });
  }

  return { ...message, content: nextContent, parts, status: "streaming" };
}

function appendReasoning(message: ChatMessage, delta: string): ChatMessage {
  const parts = [...message.parts];
  const reasoningIndex = parts.findIndex((part) => part.type === "reasoning");

  if (reasoningIndex >= 0 && parts[reasoningIndex]?.type === "reasoning") {
    parts[reasoningIndex] = { type: "reasoning", text: `${parts[reasoningIndex].text}${delta}` };
  } else {
    parts.push({ type: "reasoning", text: delta });
  }

  return { ...message, parts, status: "streaming" };
}

export function useNexusChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [status, setStatus] = useState<ChatStatus>("ready");
  const [error, setError] = useState<Error | null>(null);
  const [reconnectAttempt, setReconnectAttempt] = useState(0);
  const abortRef = useRef<AbortController | null>(null);
  const assistantIdRef = useRef<string | null>(null);

  const isLive = status === "submitted" || status === "streaming" || status === "reconnecting";

  const stop = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    assistantIdRef.current = null;
    setStatus("ready");
  }, []);

  const updateAssistant = useCallback((updater: (message: ChatMessage) => ChatMessage) => {
    const assistantId = assistantIdRef.current;
    if (!assistantId) return;
    setMessages((current) =>
      current.map((message) => (message.id === assistantId ? updater(message) : message)),
    );
  }, []);

  const handleEvent = useCallback(
    (event: ChatStreamEvent) => {
      if (event.type === "start" && event.id) {
        assistantIdRef.current = event.id;
        updateAssistant((message) => ({
          ...message,
          id: event.id ?? message.id,
          status: "streaming",
        }));
        return;
      }

      if (event.type === "delta") {
        setStatus("streaming");
        updateAssistant((message) => appendAssistantDelta(message, event.delta));
        return;
      }

      if (event.type === "reasoning") {
        setStatus("streaming");
        updateAssistant((message) => appendReasoning(message, event.delta));
        return;
      }

      if (event.type === "tool") {
        updateAssistant((message) => ({
          ...message,
          parts: [...message.parts, event.part as ChatToolPart],
          status: "streaming",
        }));
      }
    },
    [updateAssistant],
  );

  const send = useCallback(
    async (text: string, options?: { stream?: boolean }) => {
      const trimmed = text.trim();
      if (!trimmed || isLive) return;

      const userMessage = createMessage("user", trimmed);
      const assistantMessage = createMessage("assistant", "");
      assistantIdRef.current = assistantMessage.id;
      abortRef.current = new AbortController();
      setError(null);
      setReconnectAttempt(0);
      setStatus("submitted");
      setMessages((current) => [...current, userMessage, assistantMessage]);

      const requestMessages = [...messages, userMessage];

      try {
        const response = await sendChat({
          messages: requestMessages,
          message: trimmed,
          stream: options?.stream ?? true,
          signal: abortRef.current.signal,
          onEvent: handleEvent,
          onReconnect: (attempt) => {
            setReconnectAttempt(attempt);
            setStatus("reconnecting");
          },
        });

        updateAssistant(() => ({ ...response, status: "complete" }));
        setStatus("ready");
      } catch (cause) {
        if (abortRef.current?.signal.aborted) return;
        const nextError = cause instanceof Error ? cause : new Error("Chat request failed");
        setError(nextError);
        updateAssistant((message) => ({
          ...message,
          content: message.content || nextError.message,
          parts: message.content ? message.parts : [{ type: "text", text: nextError.message }],
          status: "error",
        }));
        setStatus("error");
      } finally {
        abortRef.current = null;
        assistantIdRef.current = null;
      }
    },
    [handleEvent, isLive, messages, updateAssistant],
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
