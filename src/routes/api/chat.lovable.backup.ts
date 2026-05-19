import "@tanstack/react-start";
import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, streamText, tool, stepCountIs, type UIMessage } from "ai";
import { z } from "zod";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway";

const SYSTEM = `You are NEXUS, an advanced personal AI operating system.
You orchestrate research, trading intel, code, and memory agents.
Respond with concise, structured markdown. Use **bold** for key facts and bullet lists.
When you need data, CALL a tool — do not fabricate values. Always cite which tool produced a number.`;

const tools = {
  marketScanner: tool({
    description: "Scan a market symbol for recent volatility and price action.",
    inputSchema: z.object({ symbol: z.string().describe("Ticker e.g. BTC, ETH, AAPL") }),
    execute: async ({ symbol }) => {
      const vol = (Math.random() * 5 + 0.5).toFixed(2);
      const price = (Math.random() * 80000 + 100).toFixed(2);
      return { symbol, realizedVol24h: `${vol}%`, lastPrice: price, regime: Number(vol) > 3 ? "elevated" : "calm" };
    },
  }),
  memoryRecall: tool({
    description: "Recall semantically similar memories from the vector store.",
    inputSchema: z.object({ query: z.string() }),
    execute: async ({ query }) => ({
      query,
      hits: [
        { id: "mem_a91", score: 0.87, snippet: "Prior session: defined risk cap at 2% daily VAR" },
        { id: "mem_c12", score: 0.74, snippet: "User prefers concise structured replies with citations" },
      ],
    }),
  }),
  webSearch: tool({
    description: "Search the public web for current information.",
    inputSchema: z.object({ query: z.string() }),
    execute: async ({ query }) => ({
      query,
      results: [
        { title: `Top result for ${query}`, url: "https://example.com/a", snippet: "Synthetic stub result. Wire to real search later." },
      ],
    }),
  }),
};

export const Route = createFileRoute("/api/chat/lovable/backup")({
  server: {
    handlers: {
      POST: async ({ request }: { request: Request }) => {
        const { messages } = (await request.json()) as { messages: UIMessage[] };
        const key = process.env.LOVABLE_API_KEY;
        if (!key) return new Response("Missing LOVABLE_API_KEY", { status: 500 });

        const gateway = createLovableAiGatewayProvider(key);
        const model = gateway("google/gemini-3-flash-preview");

        const result = streamText({
          model,
          system: SYSTEM,
          tools,
          stopWhen: stepCountIs(50),
          messages: await convertToModelMessages(messages),
          abortSignal: request.signal,
        });

        return result.toUIMessageStreamResponse({ originalMessages: messages });
      },
    },
  },
});