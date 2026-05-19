import { getPersistence } from "@/services/persistence";
import type { Conversation, ConversationMessage, ConversationMessageRole } from "./types";

function id() { return typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`; }
const now = () => new Date().toISOString();

const mapConversation = (row: Record<string, unknown>): Conversation => ({
  id: String(row.id), title: String(row.title), createdAt: String(row.created_at), updatedAt: String(row.updated_at),
});
const mapMessage = (row: Record<string, unknown>): ConversationMessage => ({
  id: String(row.id), conversationId: String(row.conversation_id), role: row.role as ConversationMessageRole, content: String(row.content), createdAt: String(row.created_at),
});

export function createConversation(title?: string): Conversation {
  const db = getPersistence();
  const conversation: Conversation = { id: id(), title: title?.trim() || "New Chat", createdAt: now(), updatedAt: now() };
  db.execute("INSERT INTO conversations(id,title,created_at,updated_at) VALUES (?,?,?,?)", [conversation.id, conversation.title, conversation.createdAt, conversation.updatedAt]);
  return conversation;
}

export function listConversations(): Conversation[] {
  return getPersistence().query("SELECT * FROM conversations ORDER BY updated_at DESC").rows.map((r) => mapConversation(r as Record<string, unknown>));
}

export function getConversationMessages(conversationId: string): ConversationMessage[] {
  return getPersistence().query("SELECT * FROM conversation_messages WHERE conversation_id = ? ORDER BY created_at ASC", [conversationId]).rows.map((r) => mapMessage(r as Record<string, unknown>));
}

export function appendConversationMessage(conversationId: string, role: ConversationMessageRole, content: string): ConversationMessage {
  const db = getPersistence();
  const message: ConversationMessage = { id: id(), conversationId, role, content: content.trim(), createdAt: now() };
  db.execute("INSERT INTO conversation_messages(id,conversation_id,role,content,created_at) VALUES (?,?,?,?,?)", [message.id, message.conversationId, message.role, message.content, message.createdAt]);
  db.execute("UPDATE conversations SET updated_at = ?, title = CASE WHEN title = 'New Chat' AND ? = 'user' THEN substr(?,1,60) ELSE title END WHERE id = ?", [now(), role, content.trim(), conversationId]);
  return message;
}
