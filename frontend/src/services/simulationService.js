// simulationService.js
// Central place to define ALL request shapes and API calls.
// Share this file with your teammate so you're always in sync.

const BASE_URL = "http://localhost:8080";
const MOCK_MODE = true; // flip to false when backend is ready

// ─── Mock Responses ───────────────────────────────────────────────────────────
const MOCK_RESPONSES = {
  generate: {
    status: "success",
    result: {
      score: 87,
      summary: "Mock simulation result",
      breakdown: { a: 40, b: 30, c: 17 },
    },
  },
};

// ─── HTTP ─────────────────────────────────────────────────────────────────────
async function post(path, body) {
  if (MOCK_MODE) {
    console.log("[MOCK] POST", path, JSON.stringify(body, null, 2));
    await new Promise((r) => setTimeout(r, 600));
    return MOCK_RESPONSES[path.replace("/", "")] ?? { status: "error", message: "No mock for " + path };
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`HTTP ${res.status}: ${err}`);
  }

  return res.json();
}

// ─── API Calls ────────────────────────────────────────────────────────────────
export const simulationService = {
  // Single generate call — sends everything to POST /generate
  // Shape: { preset, allowedMoves, ...mainFeatures }
  // Add more fields to the payload in App.jsx as you build MainPage features
  generate: (payload) => post("/generate", payload),
};