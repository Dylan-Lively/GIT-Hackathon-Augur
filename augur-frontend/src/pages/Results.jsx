import { useState, useEffect, useRef } from "react"
import { useNavigate } from "react-router-dom"

const CARD_COLORS = ["#16a34a", "#2563eb", "#d97706"]
const CARD_ACCENTS = ["#dcfce7", "#dbeafe", "#fef3c7"]
const LABELS = ["Strategy A", "Strategy B", "Strategy C"]

const fmt = (n) => n >= 1000 ? `$${(n / 1000).toFixed(0)}k` : `$${Math.round(n)}`
const fmtFull = (n) => "$" + Math.round(n).toLocaleString()
const fmtPct = (n) => (n >= 0 ? "+" : "") + n.toFixed(1) + "%"
const fmtProfit = (n) => (n >= 0 ? "+" : "") + fmt(n) + "/mo"

function transformPath(path, index, initialCash) {
  const final = path.finalState ?? path.nodes?.[path.nodes.length - 1]?.state
  const progression = [initialCash, ...path.nodes.map(n => n.state.cash)]
  const timeLabels = ["Start", ...path.nodes.map(n => `Mo ${n.state.monthsElapsed}`)]
  const timeValues = [0, ...path.nodes.map(n => n.state.monthsElapsed)]
  const totalHorizon = final?.monthsElapsed ?? timeValues[timeValues.length - 1]
  const cashGrowth = ((final.cash - initialCash) / initialCash) * 100
  const minRunway = Math.min(...path.nodes.map(n => n.state.runway))
  const riskScore = Math.min(100, Math.round(minRunway * 20))

  return {
    id: LABELS[index],
    pathId: path.id,
    score: Math.round(path.score),
    progression,
    timeLabels,
    timeValues,
    totalHorizon,
    final,
    cashGrowth,
    minRunway,
    riskScore,
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
  const growthN = normalize(paths.map(p => p.cashGrowth))
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

// ── Tree Build Animation ──────────────────────────────────────────────────────
function TreeAnimation({ onComplete }) {
  const canvasRef = useRef()
  const rafRef = useRef()

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    const W = canvas.width, H = canvas.height
    const cx = W / 2

    // Light theme matching results page
    const BG         = "#ffffff"
    const EDGE_DIM   = "#e2e8f0"
    const NODE_DIM   = "#cbd5e1"
    const NODE_ROOT  = "#0f172a"
    const TEXT_DIM   = "#94a3b8"
    const TEXT_COUNT = "#64748b"
    const PATH_COLORS = ["#16a34a", "#2563eb", "#d97706"]
    const PATH_ACCENTS = ["#dcfce7", "#dbeafe", "#fef3c7"]

    // ── 5-layer tree layout ──────────────────────────────────────────────
    // L0: root
    const L0 = [{ x: cx, y: 44, id: 0 }]

    // L1: 5 children
    const L1 = [-340, -170, 0, 170, 340].map((dx, i) => ({ x: cx + dx, y: 128, id: 1 + i }))

    // L2: 10 nodes, 2 per L1 node
    const L2 = [
      cx - 390, cx - 290, cx - 200, cx - 120, cx - 40,
      cx + 40,  cx + 120, cx + 200, cx + 290, cx + 390,
    ].map((x, i) => ({ x, y: 218, id: 6 + i }))

    // L3: 16 nodes (some L2 get 2, some 1)
    const L3xs = [
      cx - 420, cx - 360, cx - 295, cx - 230,
      cx - 165, cx - 95,  cx - 30,  cx + 30,
      cx + 95,  cx + 165, cx + 230, cx + 295,
      cx + 360, cx + 420, cx + 470, cx - 470,
    ]
    const L3 = L3xs.map((x, i) => ({ x, y: 308, id: 16 + i }))

    // L4: 20 leaf nodes
    const L4xs = [
      cx - 450, cx - 410, cx - 365, cx - 320, cx - 275,
      cx - 225, cx - 175, cx - 125, cx - 75,  cx - 25,
      cx + 25,  cx + 75,  cx + 125, cx + 175, cx + 225,
      cx + 275, cx + 325, cx + 375, cx + 415, cx + 455,
    ]
    const L4 = L4xs.map((x, i) => ({ x, y: 398, id: 32 + i }))

    const allNodes = [...L0, ...L1, ...L2, ...L3, ...L4]

    // ── Edges ────────────────────────────────────────────────────────────
    const allEdges = [
      // L0 → L1
      ...L1.map(n => ({ from: L0[0], to: n })),
      // L1 → L2 (each L1 gets 2 L2 children)
      { from: L1[0], to: L2[0] }, { from: L1[0], to: L2[1] },
      { from: L1[1], to: L2[2] }, { from: L1[1], to: L2[3] },
      { from: L1[2], to: L2[4] }, { from: L1[2], to: L2[5] },
      { from: L1[3], to: L2[6] }, { from: L1[3], to: L2[7] },
      { from: L1[4], to: L2[8] }, { from: L1[4], to: L2[9] },
      // L2 → L3 (mixed 1 or 2 children)
      { from: L2[0], to: L3[0]  }, { from: L2[0],  to: L3[15] },
      { from: L2[1], to: L3[1]  }, { from: L2[1],  to: L3[2]  },
      { from: L2[2], to: L3[3]  },
      { from: L2[3], to: L3[4]  }, { from: L2[3],  to: L3[5]  },
      { from: L2[4], to: L3[6]  },
      { from: L2[5], to: L3[7]  }, { from: L2[5],  to: L3[8]  },
      { from: L2[6], to: L3[9]  },
      { from: L2[7], to: L3[10] }, { from: L2[7], to: L3[11] },
      { from: L2[8], to: L3[12] },
      { from: L2[9], to: L3[13] }, { from: L2[9], to: L3[14] },
      // L3 → L4 (roughly 1-2 children each)
      { from: L3[0],  to: L4[0]  }, { from: L3[0],  to: L4[1]  },
      { from: L3[1],  to: L4[2]  },
      { from: L3[2],  to: L4[3]  }, { from: L3[2],  to: L4[4]  },
      { from: L3[3],  to: L4[5]  },
      { from: L3[4],  to: L4[6]  }, { from: L3[4],  to: L4[7]  },
      { from: L3[5],  to: L4[8]  },
      { from: L3[6],  to: L4[9]  }, { from: L3[6],  to: L4[10] },
      { from: L3[7],  to: L4[11] },
      { from: L3[8],  to: L4[12] }, { from: L3[8],  to: L4[13] },
      { from: L3[9],  to: L4[14] },
      { from: L3[10], to: L4[15] }, { from: L3[10], to: L4[16] },
      { from: L3[11], to: L4[17] },
      { from: L3[12], to: L4[18] },
      { from: L3[13], to: L4[19] },
      { from: L3[14], to: L4[18] },
      { from: L3[15], to: L4[0]  },
    ]

    // ── 3 highlighted paths (one per strategy color) ──────────────────
    const highlightPaths = [
      [L0[0], L1[0], L2[1], L3[2],  L4[4]  ], // green  – Strategy A
      [L0[0], L1[2], L2[4], L3[6],  L4[9]  ], // blue   – Strategy B
      [L0[0], L1[4], L2[9], L3[13], L4[19] ], // amber  – Strategy C
    ]

    let startTime = null
    const TOTAL = 3600

    function easeOut(t) { return 1 - Math.pow(1 - t, 3) }
    function easeInOut(t) { return t < 0.5 ? 2*t*t : -1+(4-2*t)*t }

    function nodeRadius(n) {
      if (n.id === 0) return 9
      if (n.id <= 5)  return 6
      return 4.5
    }

    function draw(ts) {
      if (!startTime) startTime = ts
      const raw = Math.min((ts - startTime) / TOTAL, 1)

      // White card background
      ctx.fillStyle = BG
      ctx.fillRect(0, 0, W, H)

      // Subtle grid dots for texture (matches results page card feel)
      ctx.fillStyle = "#f1f5f9"
      for (let gx = 20; gx < W; gx += 28) {
        for (let gy = 20; gy < H; gy += 28) {
          ctx.beginPath()
          ctx.arc(gx, gy, 1, 0, Math.PI * 2)
          ctx.fill()
        }
      }

      const buildEnd   = 0.52
      const selectStart = 0.58

      if (raw < buildEnd) {
        // ── Phase 1: build tree left-to-right, layer by layer ──────────
        const progress = easeOut(raw / buildEnd)
        const layers = [L0, L1, L2, L3, L4]
        const totalEdges = allEdges.length
        const totalNodes = allNodes.length
        const totalItems = totalEdges + totalNodes
        const revealed = Math.floor(progress * totalItems)

        // Edges first (drawn behind nodes)
        allEdges.slice(0, Math.max(0, revealed)).forEach(e => {
          ctx.beginPath()
          ctx.moveTo(e.from.x, e.from.y)
          ctx.lineTo(e.to.x, e.to.y)
          ctx.strokeStyle = EDGE_DIM
          ctx.lineWidth = 1
          ctx.stroke()
        })

        // Nodes
        allNodes.slice(0, Math.min(revealed, totalNodes)).forEach(n => {
          const r = nodeRadius(n)
          // White fill with border (matches card style)
          ctx.beginPath()
          ctx.arc(n.x, n.y, r, 0, Math.PI * 2)
          ctx.fillStyle = n.id === 0 ? NODE_ROOT : "white"
          ctx.fill()
          ctx.strokeStyle = n.id === 0 ? NODE_ROOT : NODE_DIM
          ctx.lineWidth = n.id === 0 ? 0 : 1.5
          ctx.stroke()
        })

        // Animated counter
        const pathCount = Math.floor(progress * 7654)
        ctx.fillStyle = TEXT_COUNT
        ctx.font = "600 12px monospace"
        ctx.textAlign = "center"
        ctx.fillText(`evaluating ${pathCount.toLocaleString()} paths...`, cx, H - 20)

      } else {
        // ── Phase 2: dim everything, then illuminate 3 paths ───────────
        const selectProgress = Math.min((raw - selectStart) / (1 - selectStart), 1)
        const sp = easeInOut(selectProgress)

        // Draw all dim edges
        allEdges.forEach(e => {
          ctx.beginPath()
          ctx.moveTo(e.from.x, e.from.y)
          ctx.lineTo(e.to.x, e.to.y)
          ctx.strokeStyle = EDGE_DIM
          ctx.lineWidth = 1
          ctx.stroke()
        })

        // Draw all dim nodes
        allNodes.forEach(n => {
          const r = nodeRadius(n)
          ctx.beginPath()
          ctx.arc(n.x, n.y, r, 0, Math.PI * 2)
          ctx.fillStyle = "#f8fafc"
          ctx.fill()
          ctx.strokeStyle = "#e2e8f0"
          ctx.lineWidth = 1.5
          ctx.stroke()
        })

        // Highlight each path with staggered timing
        highlightPaths.forEach((path, pi) => {
          const delay  = pi * 0.22
          const pp     = Math.max(0, Math.min((sp - delay) / 0.5, 1))
          if (pp <= 0) return

          const color  = PATH_COLORS[pi]
          const accent = PATH_ACCENTS[pi]

          // Glowing edges along path
          for (let i = 0; i < path.length - 1; i++) {
            const segP = Math.min(Math.max((pp - i * 0.2) / 0.3, 0), 1)
            if (segP <= 0) continue
            const from = path[i], to = path[i + 1]
            const ex = from.x + (to.x - from.x) * segP
            const ey = from.y + (to.y - from.y) * segP

            // Soft glow underneath
            ctx.beginPath()
            ctx.moveTo(from.x, from.y)
            ctx.lineTo(ex, ey)
            ctx.strokeStyle = color + "33"
            ctx.lineWidth = 7
            ctx.stroke()

            // Crisp colored edge on top
            ctx.beginPath()
            ctx.moveTo(from.x, from.y)
            ctx.lineTo(ex, ey)
            ctx.strokeStyle = color
            ctx.lineWidth = 2
            ctx.stroke()
          }

          // Highlighted nodes along path
          path.forEach((n, ni) => {
            const np = Math.min(Math.max((pp - ni * 0.18) / 0.25, 0), 1)
            if (np <= 0) return
            const r = (nodeRadius(n) + 2) * np
            // Accent fill (matches card accent colors)
            ctx.beginPath()
            ctx.arc(n.x, n.y, r + 3, 0, Math.PI * 2)
            ctx.fillStyle = accent
            ctx.fill()
            ctx.beginPath()
            ctx.arc(n.x, n.y, r, 0, Math.PI * 2)
            ctx.fillStyle = color
            ctx.fill()
          })
        })

        // Strategy labels on terminal nodes
        if (sp > 0.80) {
          const alpha = Math.min((sp - 0.80) / 0.20, 1)
          highlightPaths.forEach((path, pi) => {
            const end   = path[path.length - 1]
            const color = PATH_COLORS[pi]
            const accent = PATH_ACCENTS[pi]

            ctx.globalAlpha = alpha

            // Pill badge (matches ranked badge style)
            const label = `Strategy ${String.fromCharCode(65 + pi)}`
            ctx.font = "700 10px monospace"
            const tw = ctx.measureText(label).width
            const bw = tw + 16, bh = 18, bx = end.x - bw / 2, by = end.y + 13

            ctx.fillStyle = accent
            ctx.beginPath()
            ctx.roundRect(bx, by, bw, bh, 9)
            ctx.fill()

            ctx.fillStyle = color
            ctx.textAlign = "center"
            ctx.fillText(label, end.x, by + 13)

            ctx.globalAlpha = 1
          })
        }

        // Bottom status line
        const statusAlpha = Math.min(sp * 3, 1)
        ctx.globalAlpha = statusAlpha
        ctx.fillStyle = TEXT_COUNT
        ctx.font = "600 12px monospace"
        ctx.textAlign = "center"
        ctx.fillText("7,654 paths evaluated · top 3 strategies selected", cx, H - 20)
        ctx.globalAlpha = 1
      }

      if (raw < 1) {
        rafRef.current = requestAnimationFrame(draw)
      } else {
        setTimeout(onComplete, 200)
      }
    }

    rafRef.current = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(rafRef.current)
  }, [onComplete])

  return (
    <canvas
      ref={canvasRef}
      width={980}
      height={460}
      style={{ width: "100%", maxWidth: 980, borderRadius: 12, display: "block" }}
    />
  )
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

function RiskBadge({ score }) {
  const level = score >= 70 ? "LOW" : score >= 40 ? "MED" : "HIGH"
  const color = score >= 70 ? "#16a34a" : score >= 40 ? "#d97706" : "#ef4444"
  const bg = score >= 70 ? "#dcfce7" : score >= 40 ? "#fef3c7" : "#fee2e2"
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 4, background: bg, borderRadius: 6, padding: "2px 7px" }}>
      <div style={{ width: 6, height: 6, borderRadius: "50%", background: color }} />
      <span style={{ fontSize: 11, fontWeight: 700, color, fontFamily: "monospace" }}>{level} RISK</span>
    </div>
  )
}

function StrategyCard({ path, rank, isFront, offset, onClick, onDetail }) {
  const color = CARD_COLORS[rank]
  const accent = CARD_ACCENTS[rank]
  const scale = isFront ? 1 : 0.88

  const metrics = [
    { label: "FINAL CASH",      value: fmtFull(path.final.cash),          hi: true  },
    { label: "MONTHLY PROFIT",  value: fmtProfit(path.final.profit),       hi: false },
    { label: "CASH GROWTH",     value: fmtPct(path.cashGrowth),            hi: false },
    { label: "RISK",            value: <RiskBadge score={path.riskScore} />, hi: false },
  ]

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
        {metrics.map(({ label, value, hi }) => (
          <div key={label} style={{
            padding: "10px 12px",
            background: hi ? accent : "#f8fafc",
            borderRadius: "8px",
            border: `1px solid ${hi ? color + "33" : "#f1f5f9"}`,
          }}>
            <div style={{ fontSize: "9px", color: "#94a3b8", letterSpacing: "1.5px", marginBottom: "4px", fontFamily: "monospace" }}>{label}</div>
            <div style={{ fontSize: typeof value === "string" ? "17px" : "14px", fontWeight: "800", color: hi ? color : "#0f172a", display: "flex", alignItems: "center" }}>{value}</div>
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
            { label: "FINAL CASH",     value: fmtFull(path.final.cash) },
            { label: "MONTHLY PROFIT", value: fmtProfit(path.final.profit) },
            { label: "CASH GROWTH",    value: fmtPct(path.cashGrowth) },
            { label: "RISK SCORE",     value: `${path.riskScore}/100` },
            { label: "MIN RUNWAY",     value: `${path.minRunway.toFixed(1)} mo` },
            { label: "CUSTOMERS/MO",   value: Math.round(path.final.customersServed).toLocaleString() },
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
                    <td style={{ padding: "12px 8px 12px 0", color: node.state.profit >= 0 ? "#16a34a" : "#ef4444", fontWeight: "600", whiteSpace: "nowrap" }}>{fmtProfit(node.state.profit)}</td>
                    <td style={{ padding: "12px 0", color: "#0f172a", whiteSpace: "nowrap" }}>{Math.round(node.state.customersServed).toLocaleString()}/mo</td>
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
          <Slider label="FINAL CASH"     value={goals.cash}   color="#16a34a" onChange={v => setGoals(g => ({ ...g, cash: v }))} />
          <Slider label="MONTHLY PROFIT" value={goals.profit} color="#2563eb" onChange={v => setGoals(g => ({ ...g, profit: v }))} />
          <Slider label="CASH GROWTH"    value={goals.growth} color="#d97706" onChange={v => setGoals(g => ({ ...g, growth: v }))} />
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

export default function Results({ result, initialState, isLoading }) {
  const [active, setActive] = useState(0)
  const [showGoals, setShowGoals] = useState(false)
  const [detailIndex, setDetailIndex] = useState(null)
  const [goals, setGoals] = useState({ cash: 60, profit: 50, growth: 40 })
  const [risk, setRisk] = useState(40)
  const [ranked, setRanked] = useState([])
  const [showAnimation, setShowAnimation] = useState(false)
  const [animDone, setAnimDone] = useState(false)
  const navigate = useNavigate()

  const initialCash = initialState?.cash ?? 50000

  // When loading starts, show animation
  useEffect(() => {
    if (isLoading) {
      setShowAnimation(true)
      setAnimDone(false)
    }
  }, [isLoading])

  // When both animation done AND result ready, hide animation
  const readyToShow = animDone && !isLoading && result

  useEffect(() => {
    if (!result?.topPaths) return
    const transformed = result.topPaths.map((p, i) => transformPath(p, i, initialCash))
    const rescored = rescorePaths(transformed, goals, risk)
    setRanked(rescored.map((p, i) => ({ ...p, id: LABELS[i] })))
    setActive(0)
  }, [result, goals, risk])

  // No result and not loading
  if (!result && !isLoading) return (
    <div style={{ minHeight: "calc(100vh - 56px)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "16px", background: "#fafafa" }}>
      <div style={{ fontSize: "14px", color: "#94a3b8", fontFamily: "monospace" }}>No results yet.</div>
      <button onClick={() => navigate("/")} style={{ padding: "10px 24px", background: "#0f172a", border: "none", borderRadius: "8px", color: "white", fontSize: "12px", fontWeight: "700", cursor: "pointer", fontFamily: "monospace", letterSpacing: "1px" }}>
        GO GENERATE A SIMULATION
      </button>
    </div>
  )

  // Show animation overlay while loading or animation running
  if (showAnimation && !readyToShow) {
    return (
      <div style={{
        minHeight: "calc(100vh - 56px)", background: "#fafafa",
        display: "flex", flexDirection: "column", alignItems: "center",
        justifyContent: "center", gap: "20px", padding: "40px 24px",
      }}>
        <div style={{ textAlign: "center", marginBottom: "4px" }}>
          <div style={{ fontSize: "10px", color: "#94a3b8", letterSpacing: "3px", fontFamily: "monospace", marginBottom: "10px" }}>
            AUGUR ENGINE RUNNING
          </div>
          <div style={{ fontSize: "22px", fontWeight: "800", color: "#0f172a", letterSpacing: "-0.5px" }}>
            Searching decision tree...
          </div>
        </div>
        <div style={{
          background: "white", borderRadius: "16px", border: "1px solid #e2e8f0",
          boxShadow: "0 4px 24px rgba(0,0,0,0.06)", padding: "24px", width: "100%", maxWidth: 1000,
        }}>
          <TreeAnimation onComplete={() => setAnimDone(true)} />
        </div>
        {isLoading && (
          <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
            {[0, 1, 2].map(i => (
              <div key={i} style={{
                width: 6, height: 6, borderRadius: "50%", background: "#cbd5e1",
                animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite`,
              }} />
            ))}
            <style>{`@keyframes pulse { 0%,100%{opacity:0.2;transform:scale(0.8)} 50%{opacity:1;transform:scale(1.2)} }`}</style>
          </div>
        )}
      </div>
    )
  }

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
      {showGoals && result && (
        <GoalsPanel
          goals={goals} setGoals={setGoals}
          risk={risk} setRisk={setRisk}
          onClose={() => setShowGoals(false)}
          pathCount={result.pathsEvaluated ?? 0}
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
              SIMULATION COMPLETE · {(result?.pathsEvaluated ?? 0).toLocaleString()} PATHS EVALUATED
            </div>
            <h1 style={{ fontSize: "30px", fontWeight: "800", color: "#0f172a", letterSpacing: "-1px", margin: "0 0 6px", lineHeight: 1.2 }}>Top 3 Strategies</h1>
            <p style={{ fontSize: "13px", color: "#64748b", margin: 0 }}>
              Coffee Shop · {horizon}mo horizon —{" "}
              <span style={{ color: "#16a34a", fontWeight: "700" }}>{fmtFull(gap)} separates #1 from #3</span>
            </p>
          </div>
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            {[
              { label: "Cash",   val: goals.cash,   color: "#16a34a", bg: "#dcfce7" },
              { label: "Profit", val: goals.profit, color: "#2563eb", bg: "#dbeafe" },
              { label: "Growth", val: goals.growth, color: "#d97706", bg: "#fef3c7" },
              { label: `Risk ${risk < 33 ? "Low" : risk < 66 ? "Med" : "High"}`, val: null, color: "#7c3aed", bg: "#faf5ff" },
            ].map(({ label, val, color, bg }) => (
              <div key={label} onClick={() => result && setShowGoals(true)} style={{ padding: "4px 10px", background: bg, borderRadius: "20px", fontSize: "10px", fontWeight: "700", color, cursor: result ? "pointer" : "default", fontFamily: "monospace", letterSpacing: "0.5px" }}>
                {label}{val !== null ? ` ${val}` : ""}
              </div>
            ))}
            <button onClick={() => result && setShowGoals(true)} style={{ padding: "8px 16px", background: "white", border: "1px solid #e2e8f0", borderRadius: "6px", color: "#0f172a", fontSize: "11px", fontWeight: "600", cursor: result ? "pointer" : "default", fontFamily: "monospace" }}>
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
                { label: "Final Cash",     get: p => fmtFull(p.final.cash) },
                { label: "Monthly Profit", get: p => fmtProfit(p.final.profit) },
                { label: "Cash Growth",    get: p => fmtPct(p.cashGrowth) },
                { label: "Risk",           get: p => <RiskBadge score={p.riskScore} /> },
                { label: "Customers/mo",   get: p => Math.round(p.final.customersServed).toLocaleString() },
              ].map(({ label, get }) => (
                <>
                  <div key={label} style={{ fontSize: "11px", color: "#64748b", padding: "10px 0", borderBottom: "1px solid #f8fafc", fontFamily: "monospace" }}>{label}</div>
                  {ranked.map((p, i) => (
                    <div key={p.id + label} style={{ textAlign: "center", padding: "10px 0", borderBottom: "1px solid #f8fafc", fontSize: "13px", fontWeight: "700", color: "#0f172a", display: "flex", alignItems: "center", justifyContent: "center" }}>
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