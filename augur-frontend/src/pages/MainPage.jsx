import { useState, useRef } from "react"
import { useNavigate } from "react-router-dom"

const CARD_COLORS = ["#16a34a", "#2563eb", "#d97706"]

function Slider({ label, value, onChange, color, description }) {
  return (
    <div style={{ marginBottom: "22px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
        <div>
          <div style={{ fontSize: "12px", fontWeight: "700", color: "#0f172a", marginBottom: "2px" }}>{label}</div>
          <div style={{ fontSize: "11px", color: "#94a3b8", lineHeight: 1.5 }}>{description}</div>
        </div>
        <div style={{ fontSize: "16px", fontWeight: "800", color, fontFamily: "monospace", minWidth: "40px", textAlign: "right" }}>{value}</div>
      </div>
      <div style={{ position: "relative", height: "6px", background: "#f1f5f9", borderRadius: "3px" }}>
        <div style={{ position: "absolute", left: 0, top: 0, height: "100%", width: `${value}%`, background: color, borderRadius: "3px", transition: "width 0.1s" }} />
        <input type="range" min="0" max="100" value={value} onChange={e => onChange(Number(e.target.value))}
          style={{ position: "absolute", inset: "-8px 0", opacity: 0, cursor: "pointer", width: "100%" }} />
      </div>
    </div>
  )
}

const RISK_PROFILES = [
  { max: 33,  label: "Conservative", description: "Penalize strategies that dip below safe cash levels. Prefer stable growth over peak returns.", color: "#16a34a", bg: "#f0fdf4", border: "#bbf7d0" },
  { max: 66,  label: "Balanced",     description: "Moderate cash dips acceptable if long-term return justifies the risk.", color: "#2563eb", bg: "#eff6ff", border: "#bfdbfe" },
  { max: 100, label: "Aggressive",   description: "Prioritize upside. High-return strategies score well even with risky cash floors.", color: "#d97706", bg: "#fffbeb", border: "#fde68a" },
]

export default function MainPage({ onGenerate, scoringWeights, setScoringWeights }) {
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState(null)
  const navigate  = useNavigate()
  const lastTouched = useRef(null)

  const { cashWeight, profitWeight, growthWeight, riskTolerance } = scoringWeights
  const goals = { cashWeight, profitWeight, growthWeight }
  const riskProfile = RISK_PROFILES.find(r => riskTolerance <= r.max) || RISK_PROFILES[2]

  const setGoal = (key, val) => {
    const others = Object.keys(goals).filter(k => k !== key)
    const absorb = others.find(k => k !== lastTouched.current) ?? others[1]
    const fixed  = others.find(k => k !== absorb)

    const clamped   = Math.max(0, Math.min(100, val))
    const remaining = 100 - clamped
    const fixedVal  = Math.min(goals[fixed], remaining)
    const absorbVal = Math.max(0, remaining - fixedVal)

    lastTouched.current = key
    setScoringWeights(prev => ({
      ...prev,
      [key]:   clamped,
      [fixed]:  fixedVal,
      [absorb]: absorbVal,
    }))
  }

  async function handleGenerate() {
    setLoading(true)
    setError(null)
    try {
      await onGenerate()
      navigate("/results")
    } catch (err) {
      setError("Something went wrong. Is the backend running?")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: "calc(100vh - 56px)", background: "#fafafa", fontFamily: "Georgia, serif", padding: "40px" }}>
      <div style={{ maxWidth: "680px", margin: "0 auto" }}>

        <div style={{ marginBottom: "36px" }}>
          <div style={{ fontSize: "10px", color: "#94a3b8", letterSpacing: "3px", fontFamily: "monospace", marginBottom: "10px" }}>READY TO SIMULATE</div>
          <h1 style={{ fontSize: "32px", fontWeight: "800", color: "#0f172a", letterSpacing: "-1px", margin: "0 0 10px", lineHeight: 1.1 }}>Make the Best Move</h1>
          <p style={{ fontSize: "13px", color: "#64748b", margin: 0, lineHeight: 1.7 }}>
            Set your goals below, then generate. The engine will explore every possible strategy and rank the top 3 by what you care about most.
          </p>
        </div>

        {/* Goal weights */}
        <div style={{ background: "white", borderRadius: "12px", border: "1px solid #e2e8f0", padding: "24px 28px", marginBottom: "16px", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "22px" }}>
            <div style={{ fontSize: "10px", color: "#94a3b8", letterSpacing: "2px", fontFamily: "monospace" }}>GOAL WEIGHTS</div>
            <div style={{ padding: "4px 12px", borderRadius: "20px", background: "#f0fdf4", border: "1px solid #bbf7d0", fontSize: "10px", fontFamily: "monospace", fontWeight: "700", color: "#16a34a" }}>
              ✓ TOTAL: 100
            </div>
          </div>
          <Slider
            label="Final Cash"
            description="How much cash remains at the end of the horizon."
            value={cashWeight} color={CARD_COLORS[0]}
            onChange={v => setGoal("cashWeight", v)}
          />
          <Slider
            label="Monthly Profit"
            description="The monthly profit rate at the end of the simulation."
            value={profitWeight} color={CARD_COLORS[1]}
            onChange={v => setGoal("profitWeight", v)}
          />
          <Slider
            label="Customer Growth"
            description="How many customers are being served per month by the end."
            value={growthWeight} color={CARD_COLORS[2]}
            onChange={v => setGoal("growthWeight", v)}
          />
        </div>

        {/* Risk tolerance */}
        <div style={{ background: "white", borderRadius: "12px", border: "1px solid #e2e8f0", padding: "24px 28px", marginBottom: "16px", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", color: "#94a3b8", fontFamily: "monospace", marginBottom: "16px", letterSpacing: "2px" }}>
            <span>RISK TOLERANCE</span>
            <span style={{ color: riskProfile.color, fontWeight: "700" }}>{riskProfile.label.toUpperCase()}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "9px", color: "#94a3b8", fontFamily: "monospace", marginBottom: "8px", letterSpacing: "1px" }}>
            <span>CONSERVATIVE</span><span>AGGRESSIVE</span>
          </div>
          <Slider label="" description="" value={riskTolerance} color={riskProfile.color}
            onChange={v => setScoringWeights(prev => ({ ...prev, riskTolerance: v }))} />
          <div style={{ padding: "12px 16px", borderRadius: "10px", background: riskProfile.bg, border: `1px solid ${riskProfile.border}` }}>
            <div style={{ fontSize: "12px", color: "#64748b", lineHeight: 1.6 }}>{riskProfile.description}</div>
          </div>
        </div>

        {/* How it works */}
        <div style={{ background: "white", borderRadius: "12px", border: "1px solid #e2e8f0", padding: "20px 24px", marginBottom: "28px", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
          <div style={{ fontSize: "10px", color: "#94a3b8", letterSpacing: "2px", fontFamily: "monospace", marginBottom: "12px" }}>HOW SCORING WORKS</div>
          <div style={{ fontSize: "12px", color: "#64748b", lineHeight: 1.8 }}>
            Each path is scored on fixed scales relative to your starting state. Weights always sum to 100 — moving one slider shifts only the least recently adjusted other. Risk tolerance penalizes strategies where runway drops dangerously low.
          </div>
        </div>

        {error && (
          <div style={{ padding: "12px 16px", borderRadius: "8px", background: "#fef2f2", border: "1px solid #fecaca", fontSize: "12px", color: "#ef4444", fontFamily: "monospace", marginBottom: "16px", fontWeight: "600" }}>
            ⚠ {error}
          </div>
        )}

        <button onClick={handleGenerate} disabled={loading} style={{
          width: "100%", padding: "16px",
          background: loading ? "#f1f5f9" : "#0f172a",
          border: "none", borderRadius: "10px",
          color: loading ? "#94a3b8" : "white",
          fontSize: "12px", fontWeight: "700", letterSpacing: "2px",
          cursor: loading ? "not-allowed" : "pointer",
          fontFamily: "monospace",
          boxShadow: loading ? "none" : "0 4px 16px rgba(15,23,42,0.15)",
          transition: "all 0.2s",
        }}>
          {loading ? "CALCULATING STRATEGIES…" : "▶ GENERATE SIMULATION"}
        </button>

      </div>
    </div>
  )
}