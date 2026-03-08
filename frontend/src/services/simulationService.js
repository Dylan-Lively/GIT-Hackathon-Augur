// simulationService.js
// Central place to define ALL request shapes and API calls.
// Backend: POST /simulate expects { preset, allowedMoves, state1..state8, ... }

const BASE_URL = "http://localhost:8080";
const MOCK_MODE = true; // true = use mock; false = call real backend

// ─── Mock Responses ───────────────────────────────────────────────────────────
const MOCK_RESPONSES = {
  simulate: {
    status: "ok",
    preset: null,
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
    const key = path.replace("/", "");
    return MOCK_RESPONSES[key] ?? { status: "error", message: "No mock for " + path };
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
  /**
   * Sends full simulation payload to backend POST /simulate.
   * Payload: { preset, allowedMoves, state1, state2, ..., state8 }
   */
  simulate: (payload) => post("/simulate", payload),
};