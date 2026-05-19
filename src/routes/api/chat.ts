import { createServerFileRoute } from "@tanstack/react-start/server";

const AI_BRAIN_API =
  process.env.VITE_AI_BRAIN_API || "http://172.236.24.95:4000";

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
    },
  });
}

export const ServerRoute = createServerFileRoute("/api/chat").methods({
  POST: async ({ request }) => {
    try {
      const body = await request.json();

      const lastMessage = Array.isArray(body?.messages)
        ? body.messages[body.messages.length - 1]
        : null;

      const text =
        body?.message ||
        lastMessage?.content ||
        lastMessage?.parts?.find?.((p: any) => p.type === "text")?.text ||
        "";

      if (!text) {
        return json({ error: "No message provided" }, 400);
      }

      const response = await fetch(`${AI_BRAIN_API}/api/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: text }),
      });

      const data = await response.json();

      if (!response.ok) {
        return json(
          {
            error: data?.error || "AI Brain backend failed",
            details: data?.details,
          },
          response.status
        );
      }

      return json({
        id: crypto.randomUUID(),
        role: "assistant",
        content: data.reply || "No response.",
        parts: [
          {
            type: "text",
            text: data.reply || "No response.",
          },
        ],
      });
    } catch (error) {
      return json(
        {
          error: "Nexus chat bridge failed",
          details: error instanceof Error ? error.message : String(error),
        },
        500
      );
    }
  },
});
