const express = require("express");

const app = express();
app.use(express.json());

const AI_BRAIN = (
  process.env.AI_BRAIN_API_URL ||
  process.env.AI_BRAIN_API ||
  "http://172.236.24.95:4000"
).replace(/\/+$/, "");
const PORT = Number(process.env.NEXUS_API_PROXY_PORT || process.env.PORT || 3001);

app.post("/api/chat", async (req, res) => {
  try {
    if (!AI_BRAIN) {
      res.status(500).json({ error: "AI Brain API URL is not configured" });
      return;
    }

    const response = await fetch(`${AI_BRAIN}/api/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(req.body),
    });

    const data = await response.json();
    res.status(response.status).json(data);
  } catch (err) {
    res.status(500).json({
      error: "Proxy failed",
      details: err.message,
    });
  }
});

app.get("/health", (_req, res) => {
  res.json({ status: "proxy-online", aiBrainConfigured: Boolean(AI_BRAIN) });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Nexus API proxy running on :${PORT}`);
});
