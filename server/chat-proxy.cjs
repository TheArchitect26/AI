const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json({ limit: "5mb" }));

const AI_BRAIN = (process.env.AI_BRAIN_API_URL || process.env.AI_BRAIN_API || "").replace(
  /\/+$/,
  "",
);
const PORT = Number(process.env.NEXUS_CHAT_PROXY_PORT || process.env.PORT || 3010);

function extractMessage(body) {
  if (typeof body?.message === "string") return body.message;

  const messages = body?.messages;
  if (Array.isArray(messages) && messages.length > 0) {
    const last = messages[messages.length - 1];

    if (typeof last?.content === "string") return last.content;

    if (Array.isArray(last?.parts)) {
      const part = last.parts.find((p) => p?.type === "text");
      if (part?.text) return part.text;
    }
  }

  return "";
}

app.get("/health", (_req, res) => {
  res.json({ status: "proxy-online", port: PORT, aiBrainConfigured: Boolean(AI_BRAIN) });
});

app.post("/api/chat", async (req, res) => {
  try {
    if (!AI_BRAIN) {
      res.status(500).json({ error: "AI Brain API URL is not configured" });
      return;
    }

    const message = extractMessage(req.body);

    if (!message) {
      res.status(400).json({ error: "message required" });
      return;
    }

    const response = await fetch(`${AI_BRAIN}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, stream: Boolean(req.body?.stream) }),
    });

    const data = await response.json();
    res.status(response.status).json(data);
  } catch (err) {
    res.status(500).json({ error: "Proxy failed", details: err.message });
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Nexus AI chat proxy running on :${PORT}`);
});
