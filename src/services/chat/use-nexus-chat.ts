import { useCallback, useMemo, useRef, useState } from "react";
import { sendChat } from "./chat-client";
import type { ChatMessage, ChatMessagePart, ChatToolPart } from "./types";

export type ChatStatus = "ready" | "submitted" | "streaming" | "reconnecting" | "error";
export type ConversationSummary = { id: string; title: string; updatedAt: string };

function createMessage(role: "user" | "assistant", content: string, parts?: ChatMessagePart[]): ChatMessage {
  const id = typeof crypto !== "undefined" && typeof crypto.randomUUID === "function" ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return { id, role, content, parts: parts ?? [{ type: "text", text: content }], status: role === "assistant" ? "pending" : "complete", createdAt: new Date().toISOString() };
}

export function useNexusChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [status, setStatus] = useState<ChatStatus>("ready");
  const [error, setError] = useState<Error | null>(null);
  const [reconnectAttempt, setReconnectAttempt] = useState(0);
  const [conversationId, setConversationId] = useState<string>("");
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const abortRef = useRef<AbortController | null>(null);

  const isLive = status === "submitted" || status === "streaming" || status === "reconnecting";

  const refreshConversations = useCallback(async () => {
    const res = await fetch("/api/conversations");
    const payload = (await res.json()) as { conversations?: ConversationSummary[] };
    setConversations(payload.conversations || []);
  }, []);

  const loadConversation = useCallback(async (id: string) => {
    const res = await fetch(`/api/conversations/${id}/messages`);
    const payload = (await res.json()) as { messages?: Array<{ id: string; role: "user" | "assistant" | "system"; content: string; createdAt?: string; created_at?: string }> };
    const mapped = (payload.messages || []).map((m) => ({ id: m.id, role: m.role, content: m.content, parts: [{ type: "text", text: m.content }] as ChatMessagePart[], createdAt: m.createdAt || m.created_at || new Date().toISOString(), status: "complete" as const }));
    setConversationId(id);
    setMessages(mapped);
  }, []);

  const startNewConversation = useCallback(() => {
    setConversationId("");
    setMessages([]);
    setError(null);
    setStatus("ready");
  }, []);

  const stop = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setStatus("ready");
  }, []);

  const send = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isLive) return;

    const userMessage = createMessage("user", trimmed);
    const assistantPlaceholder = createMessage("assistant", "");
    const assistantId = assistantPlaceholder.id;
    const controller = new AbortController();
    abortRef.current = controller;

    setError(null);
    setReconnectAttempt(0);
    setStatus("submitted");
    setMessages((current) => [...current, userMessage, assistantPlaceholder]);

    try {
      const result = await sendChat({ message: trimmed, conversationId: conversationId || undefined, signal: controller.signal, onReconnect: (attempt) => { setReconnectAttempt(attempt); setStatus("reconnecting"); } });
      if (result.conversationId && result.conversationId !== conversationId) setConversationId(result.conversationId);
      setMessages((current) => current.map((message) => (message.id === assistantId ? { ...result.assistant, status: "complete" } : message)));
      setStatus("ready");
      void refreshConversations();
    } catch (cause) {
      if (controller.signal.aborted) return;
      console.error("[Nexus Chat] send failed", cause);
      const nextError = cause instanceof Error ? cause : new Error("Chat request failed");
      setError(nextError);
      setMessages((current) => current.map((message) => message.id === assistantId ? { ...message, content: nextError.message, parts: [{ type: "text", text: nextError.message }], status: "error" } : message));
      setStatus("error");
    } finally {
      if (abortRef.current === controller) abortRef.current = null;
    }
  }, [conversationId, isLive, refreshConversations]);

  const activeTools = useMemo(() => messages.flatMap((message) => message.parts.filter((part): part is ChatToolPart => part.type.startsWith("tool-") || part.type === "dynamic-tool")), [messages]);

  return { messages, status, error, reconnectAttempt, isLive, activeTools, send, stop, conversationId, conversations, refreshConversations, startNewConversation, loadConversation };
}
