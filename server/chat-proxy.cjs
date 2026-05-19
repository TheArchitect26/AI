const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json({ limit: "5mb" }));

const AI_BRAIN = "http://127.0.0.1:4000";
const PORT = 3010;

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
  res.json({ status: "proxy-online", port: PORT });
});

app.post("/api/chat", async (req, res) => {
  try {
    const message = extractMessage(req.body);

    if (!message) {
      res.status(400).send(`3:${JSON.stringify("message required")}\n`);
      return;
    }

    const response = await fetch(`${AI_BRAIN}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
    });

    const data = await response.json();
    const text = data.reply || data.content || data.error || "No response.";

    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.setHeader("Cache-Control", "no-cache");
    res.send(`0:${JSON.stringify(text)}\n`);
  } catch (err) {
    res.status(500).send(`3:${JSON.stringify(err.message)}\n`);
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Nexus AI stream proxy running on :${PORT}`);
});
