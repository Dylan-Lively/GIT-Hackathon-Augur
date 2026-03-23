const BASE_URL = "http://localhost:8080"

async function post(path, body) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`HTTP ${res.status}: ${err}`)
  }
  return res.json()
}

export const simulationService = {
  generate: (payload) => post("/simulate", payload),
}