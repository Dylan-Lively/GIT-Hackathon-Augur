import { useState, useEffect, useRef } from "react"
import { useNavigate } from "react-router-dom"

const CARD_COLORS = ["#16a34a", "#2563eb", "#d97706"]
const CARD_ACCENTS = ["#dcfce7", "#dbeafe", "#fef3c7"]
const LABELS = ["Strategy A", "Strategy B", "Strategy C"]

const fmt = (n) => n >= 1000 ? `$${(n / 1000).toFixed(0)}k` : `$${Math.round(n)}`
const fmtFull = (n) => "$" + Math.round(n).toLocaleString()
const fmtPct = (n) => (n >= 0 ? "+" : "") + n.toFixed(1) + "%"

function transformPath(path, index, initialCash) {
  const final = path.finalState ?? path.nodes?.[path.nodes.length - 1]?.state
  const progression = [initialCash, ...path.nodes.map(n => n.state.cash)]
  const timeLabels = ["Start", ...path.nodes.map(n => `Mo ${n.state.monthsElapsed}`)]
  const timeValues = [0, ...path.nodes.map(n => n.state.monthsElapsed)]
  const totalHorizon = final?.monthsElapsed ?? timeValues[timeValues.length - 1]
  const growth = ((final.cash - initialCash) / initialCash) * 100
  const minRunway = Math.min(...path.nodes.map(n => n.state.runway))

  return {
    id: LABELS[2 - index],
    pathId: path.id,
    score: Math.round(path.score),
    progression,
    timeLabels,
    timeValues,
    totalHorizon,
    final,
    growth,
    minRunway,
    nodes: path.nodes,
    initialCash,
  }
}

function rescorePaths(paths, goals, risk) {
  const normalize = (arr) => {
    const min = Math.min(...arr), max = Math.max(...arr)
    return arr.map(v => max === min ? 50 : ((v - min) / (max - min)) * 100)
  }
  const cashN = normalize(paths.map(p => p.final.cash))
  const profitN = normalize(paths.map(p => p.final.profit))
  const growthN = normalize(paths.map(p => p.growth))
  const riskN = normalize(paths.map(p => p.minRunway))
  const riskAversion = (100 - risk) / 100

  return paths.map((p, i) => {
    const goalScore =
      (goals.cash / 100) * cashN[i] +
      (goals.profit / 100) * profitN[i] +
      (goals.growth / 100) * growthN[i]
    const riskPenalty = riskAversion * (100 - riskN[i]) * 0.4
    const score = Math.round(Math.max(0, Math.min(100, goalScore - riskPenalty + 10)))
    return { ...p, score }
  }).sort((a, b) => b.score - a.score)
}

function DivergenceChart({ paths, activeIndex }) {
  const [progress, setProgress] = useState(0)
  const rafRef = useRef()
  const startRef = useRef()

  useEffect(() => {
    setProgress(0)
    startRef.current = null
    const duration = 1600
    const animate = (ts) => {
      if (!startRef.current) startRef.current = ts
      const p = Math.min((ts - startRef.current) / duration, 1)
      setProgress(1 - Math.pow(1 - p, 3))
      if (p < 1) rafRef.current = requestAnimationFrame(animate)
    }
    rafRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(rafRef.current)
  }, [paths])

  const W = 800, H = 200
  const PAD = { top: 20, right: 72, bottom: 30, left: 64 }
  const innerW = W - PAD.left - PAD.right
  const innerH = H - PAD.top - PAD.bottom
  const totalHorizon = Math.max(...paths.map(p => p.totalHorizon))
  const allVals = paths.flatMap(p => p.progression)
  const minV = Math.min(...allVals) * 0.96
  const maxV = Math.max(...allVals) * 1.02
  const pxByMonth = (month) => PAD.left + (month / totalHorizon) * innerW
  const py = (v) => PAD.top + innerH - ((v - minV) / (maxV - minV)) * innerH

  const animPts = (prog, path) => {
    const data = path.progression
    const times = path.timeValues
    const floatIdx = prog * (data.length - 1)
    const full = Math.floor(floatIdx)
    const frac = floatIdx - full
    const pts = data.slice(0, full + 1).map((v, i) => [pxByMonth(times[i]), py(v)])
    if (full < data.length - 1) {
      const x1 = pxByMonth(times[full]), x2 = pxByMonth(times[full + 1])
      pts.push([x1 + frac * (x2 - x1), py(data[full]) + frac * (py(data[full + 1]) - py(data[full]))])
    }
    return pts
  }

  const firstPath = paths[0]

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ overflow: "visible" }}>
      {[0, 0.25, 0.5, 0.75, 1].map((t, i) => {
        const y = PAD.top + t * innerH
        return (
          <g key={i}>
            <line x1={PAD.left} y1={y} x2={W - PAD.right} y2={y} stroke="#f1f5f9" strokeWidth="1" />
            <text x={PAD.left - 8} y={y + 4} textAnchor="end" fill="#cbd5e1" fontSize="10" fontFamily="monospace">
              {fmt(maxV - t * (maxV - minV))}
            </text>
          </g>
        )
      })}
      {firstPath?.timeLabels.map((label, i) => (
        <text key={i} x={pxByMonth(firstPath.timeValues[i])} y={H - 4}
          textAnchor="middle" fill="#cbd5e1" fontSize="10" fontFamily="monospace">{label}</text>
      ))}
      {paths.map((path, si) => {
        const pts = animPts(progress, path)
        const isActive = si === activeIndex
        const color = CARD_COLORS[si]
        const pathD = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p[0]},${p[1]}`).join(" ")
        return (
          <g key={path.id}>
            {isActive && pts.length > 1 && (
              <path
                d={`${pathD} L${pts[pts.length - 1][0]},${PAD.top + innerH} L${PAD.left},${PAD.top + innerH} Z`}
                fill={color} opacity="0.07"
              />
            )}
            <path d={pathD} fill="none" stroke={color}
              strokeWidth={isActive ? 2.5 : 1.5} strokeLinecap="round" strokeLinejoin="round"
              opacity={isActive ? 1 : 0.2}
            />
            {pts.map((p, i) => i < path.progression.length && (
              <circle key={i} cx={p[0]} cy={p[1]} r={isActive ? 4 : 2.5}
                fill={isActive ? color : "white"} stroke={color}
                strokeWidth={isActive ? 0 : 1.5} opacity={isActive ? 1 : 0.35}
              />
            ))}
            {progress > 0.92 && pts.length >= path.progression.length && (
              <text
                x={pxByMonth(totalHorizon) + 8}
                y={py(path.progression[path.progression.length - 1]) + 4}
                fill={color} fontSize="11" fontWeight="700" fontFamily="monospace"
                opacity={isActive ? 1 : 0.35}
              >
                {fmt(path.progression[path.progression.length - 1])}
              </text>
            )}
          </g>
        )
      })}
    </svg>
  )
}

function ScoreArc({ score, color }) {
  const r = 22, sw = 4, circ = 2 * Math.PI * r
  return (
    <svg width="56" height="56">
      <circle cx="28" cy="28" r={r} fill="none" stroke="#f1f5f9" strokeWidth={sw} />
      <circle cx="28" cy="28" r={r} fill="none" stroke={color} strokeWidth={sw}
        strokeDasharray={`${(score / 100) * circ} ${circ}`}
        strokeLinecap="round" transform="rotate(-90 28 28)"
      />
      <text x="28" y="33" textAnchor="middle" fill={color} fontSize="13" fontWeight="800" fontFamily="monospace">{score}</text>
    </svg>
  )
}

function StrategyCard({ path, rank, isFront, offset, onClick, onDetail }) {
  const color = CARD_COLORS[rank]
  const accent = CARD_ACCENTS[rank]
  const scale = isFront ? 1 : 0.88

  return (
    <div onClick={onClick} style={{
      position: "absolute", left: "50%", top: 0, width: "340px",
      transform: `translateX(calc(-50% + ${offset * 340}px)) translateY(${isFront ? 0 : 18}px) scale(${scale})`,
      opacity: isFront ? 1 : 0.5,
      filter: isFront ? "none" : "blur(1.5px)",
      zIndex: isFront ? 10 : 5 - Math.abs(offset),
      transition: "all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)",
      cursor: isFront ? "default" : "pointer",
      borderRadius: "16px", background: "white",
      border: `1px solid ${isFront ? color : "#e2e8f0"}`,
      boxShadow: isFront ? `0 20px 60px rgba(0,0,0,0.1), 0 0 0 1px ${color}22` : "0 4px 20px rgba(0,0,0,0.05)",
      padding: "28px", userSelect: "none",
    }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "18px" }}>
        <div>
          <div style={{ display: "inline-flex", alignItems: "center", background: accent, borderRadius: "20px", padding: "3px 10px", marginBottom: "8px" }}>
            <span style={{ fontSize: "10px", fontWeight: "700", color, letterSpacing: "1px", fontFamily: "monospace" }}>
              #{rank + 1} RANKED
            </span>
          </div>
          <div style={{ fontSize: "17px", fontWeight: "800", color: "#0f172a", letterSpacing: "-0.5px" }}>
            {path.id}
          </div>
        </div>
        <ScoreArc score={path.score} color={color} />
      </div>

      {/* Metrics */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "18px" }}>
        {[
          { label: "FINAL CASH", value: fmtFull(path.final.cash), hi: true },
          { label: "MONTHLY PROFIT", value: fmt(path.final.profit), hi: false },
          { label: "CASH CHANGE", value: fmtPct(path.growth), hi: false },
          { label: "MIN RUNWAY", value: `${path.minRunway.toFixed(1)} mo`, hi: false },
        ].map(({ label, value, hi }) => (
          <div key={label} style={{
            padding: "10px 12px",
            background: hi ? accent : "#f8fafc",
            borderRadius: "8px",
            border: `1px solid ${hi ? color + "33" : "#f1f5f9"}`,
          }}>
            <div style={{ fontSize: "9px", color: "#94a3b8", letterSpacing: "1.5px", marginBottom: "3px", fontFamily: "monospace" }}>{label}</div>
            <div style={{ fontSize: "17px", fontWeight: "800", color: hi ? color : "#0f172a" }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Move sequence */}
      <div style={{ marginBottom: "18px" }}>
        <div style={{ fontSize: "9px", color: "#94a3b8", letterSpacing: "2px", marginBottom: "8px", fontFamily: "monospace" }}>MOVE SEQUENCE</div>
        {path.nodes.map((node, i) => {
          const prevElapsed = i === 0 ? 0 : path.nodes[i - 1].state.monthsElapsed
          const elapsed = node.state.monthsElapsed
          const duration = +(elapsed - prevElapsed).toFixed(1)
          const moves = node.moves ?? []
          return (
            <div key={i} style={{
              display: "flex", alignItems: "center", gap: "8px",
              padding: "7px 10px", marginBottom: "4px",
              background: "#f8fafc", borderRadius: "6px",
              borderLeft: `3px solid ${color}`,
            }}>
              <div style={{ display: "flex", gap: "1px", flexShrink: 0 }}>
                {moves.map((m, mi) => <span key={mi} style={{ fontSize: "12px" }}>{m.icon}</span>)}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                {moves.map((m, mi) => (
                  <div key={mi} style={{ fontSize: "11px", fontWeight: "600", color: "#0f172a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {m.name}
                  </div>
                ))}
              </div>
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <div style={{ fontSize: "9px", fontWeight: "700", color, fontFamily: "monospace" }}>+{duration}mo</div>
                <div style={{ fontSize: "9px", color: "#94a3b8", fontFamily: "monospace" }}>{elapsed}mo</div>
              </div>
            </div>
          )
        })}
      </div>

      {isFront && (
        <button
          onClick={e => { e.stopPropagation(); onDetail() }}
          style={{
            width: "100%", padding: "10px", background: color,
            border: "none", borderRadius: "8px", color: "white",
            fontSize: "11px", fontWeight: "700", letterSpacing: "1.5px",
            cursor: "pointer", fontFamily: "monospace",
          }}>
          VIEW FULL DETAIL →
        </button>
      )}
    </div>
  )
}

function DetailModal({ path, rank, onClose }) {
  const color = CARD_COLORS[rank]
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, padding: "24px" }}>
      <div style={{ background: "white", borderRadius: "20px", width: "100%", maxWidth: "720px", maxHeight: "90vh", overflowY: "auto", boxShadow: "0 40px 100px rgba(0,0,0,0.2)" }}>
        <div style={{ padding: "28px 28px 20px", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: "10px", color, letterSpacing: "2px", fontFamily: "monospace", marginBottom: "4px" }}>FULL DETAIL</div>
            <div style={{ fontSize: "20px", fontWeight: "800", color: "#0f172a" }}>{path.id}</div>
          </div>
          <button onClick={onClose} style={{ width: "36px", height: "36px", borderRadius: "10px", border: "1px solid #e2e8f0", background: "white", cursor: "pointer", fontSize: "18px", color: "#94a3b8" }}>✕</button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px", padding: "20px 28px", borderBottom: "1px solid #f1f5f9" }}>
          {[
            { label: "FINAL CASH", value: fmtFull(path.final.cash) },
            { label: "MONTHLY PROFIT", value: fmtFull(path.final.profit) },
            { label: "CUSTOMERS/DAY", value: Math.round(path.final.customersServed) },
            { label: "CASH CHANGE", value: fmtPct(path.growth) },
            { label: "MIN RUNWAY", value: `${path.minRunway.toFixed(1)} mo` },
            { label: "BARISTAS", value: path.final.baristas },
          ].map(({ label, value }) => (
            <div key={label} style={{ padding: "12px 14px", background: "#f8fafc", borderRadius: "10px" }}>
              <div style={{ fontSize: "9px", color: "#94a3b8", letterSpacing: "1.5px", marginBottom: "4px", fontFamily: "monospace" }}>{label}</div>
              <div style={{ fontSize: "20px", fontWeight: "800", color: "#0f172a" }}>{value}</div>
            </div>
          ))}
        </div>

        <div style={{ padding: "24px 28px" }}>
          <div style={{ fontSize: "9px", color: "#94a3b8", letterSpacing: "2px", fontFamily: "monospace", marginBottom: "14px" }}>DECISION BY DECISION</div>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #f1f5f9" }}>
                {["TIME", "MOVE(S)", "DURATION", "CASH AFTER", "PROFIT/MO", "CUSTOMERS"].map(h => (
                  <th key={h} style={{ padding: "0 8px 10px 0", textAlign: "left", fontSize: "9px", color: "#94a3b8", letterSpacing: "1.5px", fontFamily: "monospace", fontWeight: "600" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {path.nodes.map((node, i) => {
                const moves = node.moves ?? []
                const prevElapsed = i === 0 ? 0 : path.nodes[i - 1].state.monthsElapsed
                const elapsed = node.state.monthsElapsed
                const duration = +(elapsed - prevElapsed).toFixed(1)
                const prevCash = i === 0 ? path.initialCash : path.nodes[i - 1].state.cash
                const cashDelta = node.state.cash - prevCash
                return (
                  <tr key={i} style={{ borderBottom: "1px solid #f8fafc", verticalAlign: "top" }}>
                    <td style={{ padding: "12px 8px 12px 0", color: "#94a3b8", fontFamily: "monospace", fontSize: "12px", whiteSpace: "nowrap" }}>Mo {elapsed}</td>
                    <td style={{ padding: "12px 8px 12px 0" }}>
                      {moves.map((m, mi) => (
                        <div key={mi} style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: mi < moves.length - 1 ? "5px" : 0 }}>
                          <span style={{ fontSize: "13px" }}>{m.icon}</span>
                          <span style={{ fontWeight: "600", color: "#0f172a", fontSize: "12px" }}>{m.name}</span>
                        </div>
                      ))}
                    </td>
                    <td style={{ padding: "12px 8px 12px 0", whiteSpace: "nowrap" }}>
                      <span style={{ fontSize: "11px", fontWeight: "700", color, fontFamily: "monospace" }}>+{duration}mo</span>
                    </td>
                    <td style={{ padding: "12px 8px 12px 0", whiteSpace: "nowrap" }}>
                      <div style={{ fontWeight: "700", color: "#0f172a" }}>{fmtFull(node.state.cash)}</div>
                      <div style={{ fontSize: "10px", color: cashDelta >= 0 ? "#16a34a" : "#ef4444", fontFamily: "monospace" }}>
                        {cashDelta >= 0 ? "+" : ""}{fmt(cashDelta)}
                      </div>
                    </td>
                    <td style={{ padding: "12px 8px 12px 0", color: "#16a34a", fontWeight: "600", whiteSpace: "nowrap" }}>{fmt(node.state.profit)}</td>
                    <td style={{ padding: "12px 0", color: "#0f172a", whiteSpace: "nowrap" }}>{Math.round(node.state.customersServed)}/day</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function GoalsPanel({ goals, setGoals, risk, setRisk, onClose, pathCount }) {
  const total = goals.cash + goals.profit + goals.growth
  const Slider = ({ label, value, onChange, color }) => (
    <div style={{ marginBottom: "14px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
        <span style={{ fontSize: "11px", color: "#475569", fontFamily: "monospace", letterSpacing: "1px" }}>{label}</span>
        <span style={{ fontSize: "11px", fontWeight: "700", color, fontFamily: "monospace" }}>{value}</span>
      </div>
      <div style={{ position: "relative", height: "4px", background: "#f1f5f9", borderRadius: "2px" }}>
        <div style={{ position: "absolute", left: 0, top: 0, height: "100%", width: `${value}%`, background: color, borderRadius: "2px", transition: "width 0.1s" }} />
        <input type="range" min="0" max="100" value={value} onChange={e => onChange(Number(e.target.value))}
          style={{ position: "absolute", inset: "-6px 0", opacity: 0, cursor: "pointer", width: "100%" }} />
      </div>
    </div>
  )

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "flex-start", justifyContent: "flex-end" }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(15,23,42,0.15)" }} />
      <div style={{
        position: "relative", width: "360px", height: "100vh",
        background: "white", borderLeft: "1px solid #e2e8f0",
        padding: "32px 28px", overflowY: "auto",
        boxShadow: "-8px 0 40px rgba(0,0,0,0.08)",
        animation: "slideIn 0.25s ease",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "28px" }}>
          <div>
            <div style={{ fontSize: "10px", color: "#94a3b8", letterSpacing: "2px", fontFamily: "monospace", marginBottom: "4px" }}>RE-RANK STRATEGIES</div>
            <div style={{ fontSize: "18px", fontWeight: "800", color: "#0f172a" }}>Goals & Risk</div>
          </div>
          <button onClick={onClose} style={{ width: "32px", height: "32px", borderRadius: "8px", border: "1px solid #e2e8f0", background: "white", cursor: "pointer", fontSize: "16px", color: "#94a3b8" }}>✕</button>
        </div>

        <div style={{ marginBottom: "28px" }}>
          <div style={{ fontSize: "11px", color: "#0f172a", fontWeight: "700", letterSpacing: "1px", fontFamily: "monospace", marginBottom: "16px" }}>GOAL WEIGHTS</div>
          <div style={{
            padding: "10px 14px", background: total > 100 ? "#fef2f2" : "#f0fdf4",
            borderRadius: "8px", marginBottom: "16px",
            border: `1px solid ${total > 100 ? "#fecaca" : "#bbf7d0"}`,
            fontSize: "11px", color: total > 100 ? "#ef4444" : "#16a34a",
            fontFamily: "monospace", fontWeight: "600",
          }}>
            {total > 100 ? `⚠ Total ${total} — reduce weights` : `✓ Total weight: ${total}`}
          </div>
          <Slider label="FINAL CASH" value={goals.cash} color="#16a34a" onChange={v => setGoals(g => ({ ...g, cash: v }))} />
          <Slider label="MONTHLY PROFIT" value={goals.profit} color="#2563eb" onChange={v => setGoals(g => ({ ...g, profit: v }))} />
          <Slider label="CUSTOMER GROWTH" value={goals.growth} color="#d97706" onChange={v => setGoals(g => ({ ...g, growth: v }))} />
        </div>

        <div style={{ height: "1px", background: "#f1f5f9", marginBottom: "24px" }} />

        <div style={{ marginBottom: "28px" }}>
          <div style={{ fontSize: "11px", color: "#0f172a", fontWeight: "700", letterSpacing: "1px", fontFamily: "monospace", marginBottom: "8px" }}>RISK TOLERANCE</div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", color: "#94a3b8", fontFamily: "monospace", marginBottom: "10px" }}>
            <span>Conservative</span><span>Aggressive</span>
          </div>
          <Slider label="" value={risk} color="#7c3aed" onChange={v => setRisk(v)} />
          <div style={{ padding: "12px 14px", background: "#faf5ff", borderRadius: "8px", border: "1px solid #e9d5ff", fontSize: "11px", color: "#7c3aed", lineHeight: "1.6" }}>
            {risk < 33 ? "Penalizing strategies that dip below safe cash levels."
              : risk < 66 ? "Balanced approach. Moderate cash dips acceptable."
              : "Prioritizing upside. Risky strategies score well if returns are high."}
          </div>
        </div>

        <div style={{ height: "1px", background: "#f1f5f9", marginBottom: "24px" }} />
        <div>
          <div style={{ fontSize: "11px", color: "#94a3b8", letterSpacing: "1px", fontFamily: "monospace", marginBottom: "12px" }}>HOW SCORING WORKS</div>
          <div style={{ fontSize: "12px", color: "#64748b", lineHeight: "1.8" }}>
            Each path is scored by normalizing its metrics across all {pathCount.toLocaleString()} discovered paths, then weighted by your goals. Risk tolerance penalizes low-runway strategies.
          </div>
        </div>
      </div>
      <style>{`@keyframes slideIn { from { transform: translateX(100%) } to { transform: translateX(0) } }`}</style>
    </div>
  )
}

export default function Results({ result, initialState }) {
  const [active, setActive] = useState(0)
  const [showGoals, setShowGoals] = useState(false)
  const [detailIndex, setDetailIndex] = useState(null)
  const [goals, setGoals] = useState({ cash: 60, profit: 50, growth: 40 })
  const [risk, setRisk] = useState(40)
  const [ranked, setRanked] = useState([])
  const navigate = useNavigate()

  const initialCash = initialState?.cash ?? 50000

  useEffect(() => {
    if (!result?.topPaths) return
    const transformed = result.topPaths.map((p, i) => transformPath(p, i, initialCash))
    const rescored = rescorePaths(transformed, goals, risk)
    setRanked(rescored)
    setActive(0)
  }, [result, goals, risk])

  if (!result) return (
    <div style={{ minHeight: "calc(100vh - 56px)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "16px", background: "#fafafa" }}>
      <div style={{ fontSize: "14px", color: "#94a3b8", fontFamily: "monospace" }}>No results yet.</div>
      <button onClick={() => navigate("/")} style={{ padding: "10px 24px", background: "#0f172a", border: "none", borderRadius: "8px", color: "white", fontSize: "12px", fontWeight: "700", cursor: "pointer", fontFamily: "monospace", letterSpacing: "1px" }}>
        GO GENERATE A SIMULATION
      </button>
    </div>
  )

  const rotate = (dir) => setActive(p => (p + dir + 3) % 3)
  const getOffset = (i) => {
    const diff = i - active
    if (diff === 0) return 0
    if (diff === 1 || diff === -2) return 1
    return -1
  }

  const top = ranked[0]
  const bottom = ranked[ranked.length - 1]
  const gap = top && bottom ? top.final.cash - bottom.final.cash : 0
  const horizon = ranked[0]?.totalHorizon ?? 6

  return (
    <div style={{ minHeight: "calc(100vh - 56px)", background: "#fafafa", fontFamily: "Georgia, serif" }}>
      {showGoals && (
        <GoalsPanel
          goals={goals} setGoals={setGoals}
          risk={risk} setRisk={setRisk}
          onClose={() => setShowGoals(false)}
          pathCount={result.pathsEvaluated}
        />
      )}
      {detailIndex !== null && ranked[detailIndex] && (
        <DetailModal path={ranked[detailIndex]} rank={detailIndex} onClose={() => setDetailIndex(null)} />
      )}

      <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "36px 40px 0" }}>

        {/* Page header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "24px" }}>
          <div>
            <div style={{ fontSize: "10px", color: "#94a3b8", letterSpacing: "3px", fontFamily: "monospace", marginBottom: "8px" }}>
              SIMULATION COMPLETE · {result.pathsEvaluated.toLocaleString()} PATHS EVALUATED
            </div>
            <h1 style={{ fontSize: "30px", fontWeight: "800", color: "#0f172a", letterSpacing: "-1px", margin: "0 0 6px", lineHeight: 1.2 }}>Top 3 Strategies</h1>
            <p style={{ fontSize: "13px", color: "#64748b", margin: 0 }}>
              Coffee Shop · {horizon}mo horizon —{" "}
              <span style={{ color: "#16a34a", fontWeight: "700" }}>{fmtFull(gap)} separates #1 from #3</span>
            </p>
          </div>
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            {[
              { label: "Cash", val: goals.cash, color: "#16a34a", bg: "#dcfce7" },
              { label: "Profit", val: goals.profit, color: "#2563eb", bg: "#dbeafe" },
              { label: "Growth", val: goals.growth, color: "#d97706", bg: "#fef3c7" },
              { label: `Risk ${risk < 33 ? "Low" : risk < 66 ? "Med" : "High"}`, val: null, color: "#7c3aed", bg: "#faf5ff" },
            ].map(({ label, val, color, bg }) => (
              <div key={label} onClick={() => setShowGoals(true)} style={{ padding: "4px 10px", background: bg, borderRadius: "20px", fontSize: "10px", fontWeight: "700", color, cursor: "pointer", fontFamily: "monospace", letterSpacing: "0.5px" }}>
                {label}{val !== null ? ` ${val}` : ""}
              </div>
            ))}
            <button onClick={() => setShowGoals(true)} style={{ padding: "8px 16px", background: "white", border: "1px solid #e2e8f0", borderRadius: "6px", color: "#0f172a", fontSize: "11px", fontWeight: "600", cursor: "pointer", fontFamily: "monospace" }}>
              ⚙ Re-rank
            </button>
          </div>
        </div>

        {/* Chart */}
        {ranked.length === 3 && (
          <div style={{ background: "white", borderRadius: "12px", border: "1px solid #e2e8f0", padding: "20px 24px 12px", marginBottom: "14px", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
              <span style={{ fontSize: "10px", color: "#94a3b8", letterSpacing: "2px", fontFamily: "monospace" }}>CASH OVER TIME</span>
              <div style={{ display: "flex", gap: "16px" }}>
                {ranked.map((p, i) => (
                  <div key={p.id} style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer" }} onClick={() => setActive(i)}>
                    <div style={{ width: "20px", height: "3px", borderRadius: "2px", background: CARD_COLORS[i], opacity: i === active ? 1 : 0.3 }} />
                    <span style={{ fontSize: "10px", color: i === active ? CARD_COLORS[i] : "#94a3b8", fontFamily: "monospace", fontWeight: i === active ? "700" : "400" }}>
                      {p.id} (#{i + 1})
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <DivergenceChart paths={ranked} activeIndex={active} />
          </div>
        )}

        {/* Comparison strip */}
        {ranked.length === 3 && (
          <div style={{ background: "white", borderRadius: "12px", border: "1px solid #e2e8f0", padding: "16px 24px", marginBottom: "28px", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
            <div style={{ fontSize: "10px", color: "#94a3b8", letterSpacing: "2px", fontFamily: "monospace", marginBottom: "14px" }}>AT A GLANCE</div>
            <div style={{ display: "grid", gridTemplateColumns: "120px 1fr 1fr 1fr" }}>
              <div />
              {ranked.map((p, i) => (
                <div key={p.id} style={{ textAlign: "center", paddingBottom: "10px", borderBottom: `2px solid ${CARD_COLORS[i]}` }}>
                  <span style={{ fontSize: "11px", fontWeight: "700", color: CARD_COLORS[i], fontFamily: "monospace" }}>{p.id}</span>
                </div>
              ))}
              {[
                { label: "Final Cash", get: p => fmtFull(p.final.cash) },
                { label: "Monthly Profit", get: p => fmtFull(p.final.profit) },
                { label: "Cash Change", get: p => fmtPct(p.growth) },
                { label: "Customers/day", get: p => Math.round(p.final.customersServed) },
                { label: "Min Runway", get: p => `${p.minRunway.toFixed(1)} mo` },
              ].map(({ label, get }) => (
                <>
                  <div key={label} style={{ fontSize: "11px", color: "#64748b", padding: "10px 0", borderBottom: "1px solid #f8fafc", fontFamily: "monospace" }}>{label}</div>
                  {ranked.map((p, i) => (
                    <div key={p.id + label} style={{ textAlign: "center", padding: "10px 0", borderBottom: "1px solid #f8fafc", fontSize: "13px", fontWeight: "700", color: "#0f172a" }}>
                      {get(p)}
                    </div>
                  ))}
                </>
              ))}
            </div>
          </div>
        )}

        {/* Carousel */}
        <div style={{ fontSize: "10px", color: "#94a3b8", letterSpacing: "3px", fontFamily: "monospace", marginBottom: "18px", textAlign: "center" }}>
          STRATEGY BREAKDOWN — SCORED BY YOUR GOALS
        </div>
        <div style={{ position: "relative", height: "520px" }}>
          {ranked.map((p, i) => (
            <StrategyCard key={p.id} path={p} rank={i} isFront={i === active}
              offset={getOffset(i)} onClick={() => i !== active && setActive(i)}
              onDetail={() => setDetailIndex(i)}
            />
          ))}
        </div>

        {/* Dots + arrows */}
        <div style={{ display: "flex", justifyContent: "center", gap: "12px", paddingTop: "14px", paddingBottom: "48px", alignItems: "center" }}>
          <button onClick={() => rotate(-1)} style={{ width: "38px", height: "38px", borderRadius: "50%", border: "1px solid #e2e8f0", background: "white", fontSize: "15px", cursor: "pointer", color: "#0f172a", display: "flex", alignItems: "center", justifyContent: "center" }}>←</button>
          {[0, 1, 2].map(i => (
            <div key={i} onClick={() => setActive(i)} style={{ width: i === active ? "22px" : "8px", height: "8px", borderRadius: "4px", background: i === active ? CARD_COLORS[i] : "#e2e8f0", cursor: "pointer", transition: "all 0.3s ease" }} />
          ))}
          <button onClick={() => rotate(1)} style={{ width: "38px", height: "38px", borderRadius: "50%", border: "1px solid #e2e8f0", background: "white", fontSize: "15px", cursor: "pointer", color: "#0f172a", display: "flex", alignItems: "center", justifyContent: "center" }}>→</button>
        </div>

      </div>
    </div>
  )
}