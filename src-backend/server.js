// index.js
const express = require("express");
const cors = require("cors");
const minimist = require("minimist");
const executeRequest = require("./src/common/executeRequest.js");

const args = minimist(process.argv.slice(2));
const port = args.port || 7777;

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: "50mb" }));

// AppState (placeholder giống Rust)
const appState = {};

// Health check
app.get("/", (req, res) => {
  res.send("Ok");
});

// Exec API
app.post("/exec", async (req, res) => {
  try {
    console.log("Đã nhận được request" + JSON.stringify(req.body));
    const result = await executeRequest(req.body);
    res.json(result);
    console.log("Đã nhận được response" + result.body);
  } catch (err) {
    res.status(500).json({
      error: err.message,
    });
  }
});

// Start server
app.listen(port, "0.0.0.0", () => {
  console.log(`API đang chạy tại http://0.0.0.0:${port}`);
});
