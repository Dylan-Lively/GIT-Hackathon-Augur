import { useState } from "react"
import { useNavigate } from "react-router-dom"

const PRESETS = [
  {
    id: "coffee_shop",
    label: "Coffee Shop",
    icon: "☕",
    description: "Single-location café. Balance baristas, hours, and capacity to grow customer volume and profit.",
    tags: ["Service", "Local", "Capacity-constrained"],
    color: "#d97706",
    accent: "#fef3c7",
    border: "#f59e0b33",
  },
  {
    id: "retail_chain",
    label: "Retail Chain",
    icon: "🏪",
    description: "Multi-location retail. Expand distribution, optimize supply chains, and scale brand strength.",
    tags: ["Retail", "Multi-location", "Supply chain"],
    color: "#94a3b8",
    accent: "#f1f5f9",
    border: "#e2e8f0",
    locked: true,
  },
]

const MOVES = [
  {
    id: "hire_barista",
    name: "Hire Barista",
    icon: "👤",
    duration: "1 mo",
    cost: "−$2,000",
    costIsFree: false,
    effect: "baristas +1",
    description: "Increases service capacity. Only effective if utility capacity isn't the bottleneck.",
    category: "Operations",
  },
  {
    id: "upgrade_utilities",
    name: "Upgrade Utilities",
    icon: "⚡",
    duration: "1 mo",
    cost: "−$5,000",
    costIsFree: false,
    effect: "utilityCapacity +50",
    description: "Raises the utility ceiling on customers served. Often needs to come before hiring.",
    category: "Infrastructure",
  },
  {
    id: "increase_marketing",
    name: "Increase Marketing",
    icon: "📣",
    duration: "1 mo",
    cost: "−$1,000",
    costIsFree: false,
    effect: "marketingSpend +500",
    description: "Logarithmic foot traffic boost. Diminishing returns above $2k spend.",
    category: "Growth",
  },
  {
    id: "raise_prices",
    name: "Raise Prices",
    icon: "💰",
    duration: "1 mo",
    cost: "Free",
    costIsFree: true,
    effect: "avgOrderValue +$1",
    description: "Immediately increases revenue per customer with no upfront cost.",
    category: "Revenue",
  },
  {
    id: "extend_hours",
    name: "Extend Hours",
    icon: "🕐",
    duration: "1 mo",
    cost: "Free",
    costIsFree: true,
    effect: "hoursOpen +2",
    description: "More open hours = more service capacity. Compounds well with more baristas.",
    category: "Operations",
  },
]

const CATEGORY_COLORS = {
  Operations:     { color: "#2563eb", bg: "#dbeafe" },
  Infrastructure: { color: "#7c3aed", bg: "#ede9fe" },
  Growth:         { color: "#16a34a", bg: "#dcfce7" },
  Revenue:        { color: "#d97706", bg: "#fef3c7" },
}

export default function Setup({ preset, setPreset, selectedMoves, setSelectedMoves }) {
  const navigate = useNavigate()
  const allSelected = selectedMoves.length === MOVES.length

  const toggleMove = (id) =>
    setSelectedMoves(prev =>
      prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]
    )

  const toggleAll = () =>
    setSelectedMoves(allSelected ? [] : MOVES.map(m => m.id))

  const canContinue = preset && selectedMoves.length > 0

  return (
    <div style={{ minHeight: "calc(100vh - 56px)", background: "#fafafa", fontFamily: "Georgia, serif", padding: "40px" }}>
      <div style={{ maxWidth: "820px", margin: "0 auto" }}>

        {/* Page header */}
        <div style={{ marginBottom: "32px" }}>
          <div style={{ fontSize: "10px", color: "#94a3b8", letterSpacing: "3px", fontFamily: "monospace", marginBottom: "8px" }}>STEP 1 OF 3</div>
          <h1 style={{ fontSize: "28px", fontWeight: "800", color: "#0f172a", letterSpacing: "-0.5px", margin: "0 0 8px" }}>Configure Simulation</h1>
          <p style={{ fontSize: "13px", color: "#64748b", margin: 0, lineHeight: 1.6 }}>
            Choose your business type and which moves the engine is allowed to explore.
          </p>
        </div>

        {/* Preset */}
        <div style={{ marginBottom: "36px" }}>
          <div style={{ fontSize: "10px", color: "#94a3b8", letterSpacing: "2px", fontFamily: "monospace", marginBottom: "12px" }}>BUSINESS PRESET</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            {PRESETS.map(p => {
              const isSelected = preset === p.id
              return (
                <div
                  key={p.id}
                  onClick={() => !p.locked && setPreset(p.id)}
                  style={{
                    padding: "20px 22px",
                    borderRadius: "12px",
                    background: "white",
                    border: `1px solid ${isSelected ? p.color + "66" : "#e2e8f0"}`,
                    boxShadow: isSelected ? `0 0 0 1px ${p.color}22, 0 4px 20px ${p.color}10` : "0 1px 4px rgba(0,0,0,0.04)",
                    cursor: p.locked ? "not-allowed" : "pointer",
                    opacity: p.locked ? 0.5 : 1,
                    transition: "all 0.2s",
                    position: "relative",
                  }}
                >
                  {p.locked && (
                    <div style={{
                      position: "absolute", top: "12px", right: "12px",
                      fontSize: "9px", fontFamily: "monospace", fontWeight: "700",
                      color: "#94a3b8", letterSpacing: "1px",
                      background: "#f1f5f9", borderRadius: "4px", padding: "2px 8px",
                      border: "1px solid #e2e8f0",
                    }}>COMING SOON</div>
                  )}
                  <div style={{ display: "flex", alignItems: "flex-start", gap: "14px" }}>
                    <div style={{
                      width: "44px", height: "44px", borderRadius: "10px",
                      background: isSelected ? p.accent : "#f8fafc",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: "22px", flexShrink: 0,
                      transition: "background 0.2s",
                    }}>{p.icon}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "5px" }}>
                        <div style={{ fontSize: "15px", fontWeight: "800", color: "#0f172a" }}>{p.label}</div>
                        {isSelected && (
                          <div style={{
                            width: "16px", height: "16px", borderRadius: "50%",
                            background: p.color,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: "9px", color: "white", fontWeight: "800",
                          }}>✓</div>
                        )}
                      </div>
                      <div style={{ fontSize: "12px", color: "#64748b", lineHeight: 1.5, marginBottom: "10px" }}>{p.description}</div>
                      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                        {p.tags.map(tag => (
                          <span key={tag} style={{
                            fontSize: "9px", fontFamily: "monospace", fontWeight: "700",
                            color: isSelected ? p.color : "#94a3b8",
                            background: isSelected ? p.accent : "#f8fafc",
                            borderRadius: "4px", padding: "2px 7px",
                            border: `1px solid ${isSelected ? p.color + "33" : "#f1f5f9"}`,
                            letterSpacing: "0.5px",
                          }}>{tag}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Moves */}
        <div style={{ marginBottom: "36px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
            <div style={{ fontSize: "10px", color: "#94a3b8", letterSpacing: "2px", fontFamily: "monospace" }}>
              ALLOWED MOVES — {selectedMoves.length}/{MOVES.length} SELECTED
            </div>
            <button
              onClick={toggleAll}
              style={{
                fontSize: "9px", fontFamily: "monospace", fontWeight: "700",
                color: "#0f172a", background: "white",
                border: "1px solid #e2e8f0", borderRadius: "4px",
                padding: "4px 10px", cursor: "pointer", letterSpacing: "1px",
              }}
            >
              {allSelected ? "DESELECT ALL" : "SELECT ALL"}
            </button>
          </div>

          <div style={{ background: "white", borderRadius: "12px", border: "1px solid #e2e8f0", overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
            {MOVES.map((move, idx) => {
              const isSelected = selectedMoves.includes(move.id)
              const cat = CATEGORY_COLORS[move.category]
              const isLast = idx === MOVES.length - 1
              return (
                <div
                  key={move.id}
                  onClick={() => toggleMove(move.id)}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "24px 44px 1fr auto",
                    alignItems: "center",
                    gap: "14px",
                    padding: "16px 20px",
                    borderBottom: isLast ? "none" : "1px solid #f8fafc",
                    background: isSelected ? "#fafeff" : "white",
                    cursor: "pointer",
                    transition: "background 0.12s",
                  }}
                >
                  {/* Checkbox */}
                  <div style={{
                    width: "18px", height: "18px", borderRadius: "5px",
                    border: `2px solid ${isSelected ? "#0f172a" : "#e2e8f0"}`,
                    background: isSelected ? "#0f172a" : "transparent",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "10px", color: "white",
                    transition: "all 0.12s", flexShrink: 0,
                  }}>
                    {isSelected ? "✓" : ""}
                  </div>

                  {/* Icon */}
                  <div style={{
                    width: "36px", height: "36px", borderRadius: "8px",
                    background: isSelected ? cat.bg : "#f8fafc",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "18px", transition: "background 0.12s",
                  }}>{move.icon}</div>

                  {/* Info */}
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "3px" }}>
                      <span style={{ fontSize: "14px", fontWeight: "700", color: "#0f172a" }}>{move.name}</span>
                      <span style={{
                        fontSize: "9px", fontFamily: "monospace", fontWeight: "700",
                        color: cat.color, background: cat.bg,
                        borderRadius: "3px", padding: "1px 6px", letterSpacing: "0.5px",
                      }}>{move.category.toUpperCase()}</span>
                    </div>
                    <div style={{ fontSize: "12px", color: "#64748b", lineHeight: 1.5 }}>{move.description}</div>
                  </div>

                  {/* Stats */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "4px", alignItems: "flex-end", minWidth: "100px" }}>
                    <div style={{ fontSize: "10px", fontFamily: "monospace", color: "#94a3b8" }}>⏱ {move.duration}</div>
                    <div style={{
                      fontSize: "10px", fontFamily: "monospace", fontWeight: "700",
                      color: move.costIsFree ? "#16a34a" : "#ef4444",
                    }}>
                      {move.costIsFree ? "✦ FREE" : move.cost}
                    </div>
                    <div style={{ fontSize: "10px", fontFamily: "monospace", color: "#2563eb", fontWeight: "600" }}>
                      ↑ {move.effect}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Footer */}
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          padding: "18px 22px",
          background: "white",
          borderRadius: "12px",
          border: "1px solid #e2e8f0",
          boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
        }}>
          <div>
            <div style={{ fontSize: "12px", color: "#64748b", fontFamily: "monospace" }}>
              {preset === "coffee_shop" ? "☕ Coffee Shop" : "No preset selected"} · {selectedMoves.length} moves enabled
            </div>
            {selectedMoves.length === 0 && (
              <div style={{ fontSize: "11px", color: "#ef4444", fontFamily: "monospace", marginTop: "3px" }}>
                Select at least one move to continue
              </div>
            )}
          </div>
          <button
            onClick={() => canContinue && navigate("/settings")}
            disabled={!canContinue}
            style={{
              padding: "10px 24px",
              background: canContinue ? "#0f172a" : "#f1f5f9",
              border: "none", borderRadius: "8px",
              color: canContinue ? "white" : "#94a3b8",
              fontSize: "11px", fontWeight: "700", letterSpacing: "1.5px",
              cursor: canContinue ? "pointer" : "not-allowed",
              fontFamily: "monospace",
              transition: "all 0.2s",
            }}
          >
            NEXT: SETTINGS →
          </button>
        </div>

      </div>
    </div>
  )
}