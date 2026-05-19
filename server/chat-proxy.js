const express = require("express");

const app = express();
app.use(express.json());

const AI_BRAIN = "http://127.0.0.1:4000";

app.post("/api/chat", async (req, res) => {
  try {
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
  res.json({ status: "proxy-online" });
});

app.listen(3001, "0.0.0.0", () => {
  console.log("Nexus API proxy running on :3001");
});
