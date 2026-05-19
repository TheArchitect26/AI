export type ChatRole = "user" | "assistant" | "system";

export type ChatMessageStatus = "pending" | "streaming" | "complete" | "error";

export type ChatTextPart = {
  type: "text";
  text: string;
};

export type ChatReasoningPart = {
  type: "reasoning";
  text: string;
};

export type ChatToolPart = {
  type: `tool-${string}` | "dynamic-tool";
  toolName?: string;
  state?: "input-streaming" | "input-available" | "output-available" | "output-error" | string;
  input?: unknown;
  output?: unknown;
  errorText?: string;
};

export type ChatMessagePart = ChatTextPart | ChatReasoningPart | ChatToolPart;

export type ChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
  parts: ChatMessagePart[];
  status?: ChatMessageStatus;
  createdAt: string;
};

export type ChatRequest = {
  messages: ChatMessage[];
  message?: string;
  stream?: boolean;
};

export type ChatResponse = {
  id: string;
  role: "assistant";
  content: string;
  parts: ChatMessagePart[];
  createdAt: string;
};

export type ChatStreamEvent =
  | { type: "start"; id?: string }
  | { type: "delta"; delta: string }
  | { type: "reasoning"; delta: string }
  | { type: "tool"; part: ChatToolPart }
  | { type: "done"; message?: ChatResponse }
  | { type: "error"; error: string; details?: unknown };
