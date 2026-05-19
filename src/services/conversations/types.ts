export type Conversation = {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
};

export type ConversationMessageRole = "user" | "assistant" | "system";

export type ConversationMessage = {
  id: string;
  conversationId: string;
  role: ConversationMessageRole;
  content: string;
  createdAt: string;
};
