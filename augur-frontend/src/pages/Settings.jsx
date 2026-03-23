import { useNavigate } from "react-router-dom"

const FIELDS = [
  {
    group: "Financials",
    items: [
      { key: "cash", label: "Starting Cash", prefix: "$", step: 1000, min: 0, description: "Initial capital available to spend on moves." },
      { key: "rent", label: "Monthly Rent", prefix: "$", step: 100, min: 0, description: "Fixed monthly cost for the location." },
      { key: "baristaWage", label: "Barista Wage ($/hr)", prefix: "$", step: 1, min: 0, description: "Hourly wage per barista." },
    ]
  },
  {
    group: "Operations",
    items: [
      { key: "baristas", label: "Baristas", prefix: null, step: 1, min: 1, description: "Starting number of baristas on staff." },
      { key: "hoursOpen", label: "Hours Open / Day", prefix: null, step: 1, min: 1, description: "Daily operating hours." },
      { key: "utilityCapacity", label: "Utility Capacity", prefix: null, step: 10, min: 1, description: "Max customers your utilities can support per day." },
    ]
  },
  {
    group: "Customers & Revenue",
    items: [
      { key: "avgOrderValue", label: "Avg Order Value", prefix: "$", step: 0.5, min: 0, description: "Average spend per customer visit." },
      { key: "baseFootTraffic", label: "Base Foot Traffic / Day", prefix: null, step: 10, min: 0, description: "Daily potential customers before marketing." },
      { key: "marketingSpend", label: "Monthly Marketing", prefix: "$", step: 100, min: 0, description: "Current monthly marketing budget." },
    ]
  },
]

const SIM_PARAMS = [
  { key: "horizon", label: "Horizon", suffix: "months", step: 1, min: 1, max: 24, description: "How many months to simulate forward." },
  { key: "maxCombos", label: "Max Combo Size", suffix: "moves", step: 1, min: 1, max: 3, description: "Max moves the engine can take simultaneously per step." },
  { key: "beamWidth", label: "Beam Width", suffix: "paths", step: 5, min: 5, max: 50, description: "How many branches to keep at each level. Higher = more thorough, slower." },
]

function FieldInput({ field, value, onChange }) {
  return (
    <div style={{
      padding: "14px 16px", background: "white", borderRadius: "10px",
      border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
    }}>
      <div style={{ fontSize: "11px", fontWeight: "700", color: "#0f172a", marginBottom: "2px" }}>{field.label}</div>
      <div style={{ fontSize: "11px", color: "#94a3b8", lineHeight: 1.4, marginBottom: "10px" }}>{field.description}</div>
      <div style={{ display: "flex", alignItems: "center", border: "1px solid #e2e8f0", borderRadius: "7px", overflow: "hidden", background: "#f8fafc" }}>
        {field.prefix && (
          <div style={{ padding: "8px 10px", fontSize: "12px", fontWeight: "700", color: "#94a3b8", fontFamily: "monospace", background: "#f1f5f9", borderRight: "1px solid #e2e8f0" }}>
            {field.prefix}
          </div>
        )}
        {field.suffix && (
          <div style={{ padding: "8px 10px", fontSize: "12px", fontWeight: "700", color: "#94a3b8", fontFamily: "monospace", background: "#f1f5f9", borderRight: "1px solid #e2e8f0" }}>
            {field.suffix}
          </div>
        )}
        <input
          type="number" min={field.min} max={field.max} step={field.step} value={value}
          onChange={e => onChange(field.key, Number(e.target.value))}
          style={{ flex: 1, padding: "8px 10px", border: "none", background: "transparent", fontSize: "15px", fontWeight: "800", color: "#0f172a", fontFamily: "monospace", outline: "none", minWidth: 0 }}
        />
        <div style={{ display: "flex", flexDirection: "column", borderLeft: "1px solid #e2e8f0" }}>
          {[{ label: "▲", delta: field.step }, { label: "▼", delta: -field.step }].map(({ label, delta }) => (
            <button key={label}
              onClick={() => {
                const next = value + delta
                if (next >= field.min && (!field.max || next <= field.max)) onChange(field.key, next)
              }}
              style={{ width: "30px", height: "19px", border: "none", background: "white", cursor: "pointer", fontSize: "8px", color: "#94a3b8", borderBottom: label === "▲" ? "1px solid #e2e8f0" : "none" }}
            >{label}</button>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function Settings({ state, onChange, simParams, setSimParams }) {
  const navigate = useNavigate()

  const handleStateChange = (key, val) => onChange(prev => ({ ...prev, [key]: val }))
  const handleParamChange = (key, val) => setSimParams(prev => ({ ...prev, [key]: val }))

  // Mirrors StateEngine.java exactly
  const effectiveHours = Math.min(state.hoursOpen, 10) + Math.max(0, state.hoursOpen - 10) * 0.3
  const serviceCapacity = state.baristas * 12 * effectiveHours * 30

  const marketingMultiplier = 1 + 0.45 * Math.log1p(state.marketingSpend / 250.0)
  const priceElasticity = Math.pow(0.82, 0) // no raises at start
  const footTraffic = state.baseFootTraffic * 30 * marketingMultiplier * priceElasticity

  const monthlyUtilityCapacity = state.utilityCapacity * 30
  const capacityLimit = Math.min(serviceCapacity, monthlyUtilityCapacity)
  const customersServed = Math.min(footTraffic, capacityLimit)

  const revenue = customersServed * state.avgOrderValue

  const cogs = customersServed * 1.80
  const regularHours = Math.min(state.hoursOpen, 10)
  const overtimeHours = Math.max(0, state.hoursOpen - 10)
  const wages = state.baristas * state.baristaWage * 30 * (regularHours + overtimeHours * 1.5)
  const utilityMaintenance = Math.max(0, (state.utilityCapacity - 60) / 60.0) * 180

  const operatingCosts = wages + state.rent + state.marketingSpend + cogs + utilityMaintenance
  const profit = revenue - operatingCosts
  const runway = operatingCosts > 0 ? state.cash / operatingCosts : 999

  const fmt = n => "$" + Math.round(n).toLocaleString()
  const fmtN = n => Math.round(n).toLocaleString()

  const bottleneck =
    customersServed === monthlyUtilityCapacity ? "Utility Capacity"
    : customersServed === serviceCapacity ? "Service Capacity"
    : "Foot Traffic"

  return (
    <div style={{ minHeight: "calc(100vh - 56px)", background: "#fafafa", fontFamily: "Georgia, serif", padding: "40px" }}>
      <div style={{ maxWidth: "940px", margin: "0 auto" }}>

        <div style={{ marginBottom: "32px" }}>
          <div style={{ fontSize: "10px", color: "#94a3b8", letterSpacing: "3px", fontFamily: "monospace", marginBottom: "8px" }}>STEP 2 OF 3</div>
          <h1 style={{ fontSize: "28px", fontWeight: "800", color: "#0f172a", letterSpacing: "-0.5px", margin: "0 0 8px" }}>Business State & Parameters</h1>
          <p style={{ fontSize: "13px", color: "#64748b", margin: 0, lineHeight: 1.6 }}>Set your starting conditions and simulation parameters. The engine simulates forward from this state.</p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: "24px", alignItems: "start" }}>

          <div>
            {FIELDS.map(group => (
              <div key={group.group} style={{ marginBottom: "28px" }}>
                <div style={{ fontSize: "10px", color: "#94a3b8", letterSpacing: "2px", fontFamily: "monospace", marginBottom: "12px" }}>{group.group.toUpperCase()}</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px" }}>
                  {group.items.map(field => (
                    <FieldInput key={field.key} field={field} value={state[field.key]} onChange={handleStateChange} />
                  ))}
                </div>
              </div>
            ))}

            <div style={{ marginBottom: "28px" }}>
              <div style={{ fontSize: "10px", color: "#94a3b8", letterSpacing: "2px", fontFamily: "monospace", marginBottom: "12px" }}>SIMULATION PARAMETERS</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px" }}>
                {SIM_PARAMS.map(field => (
                  <FieldInput key={field.key} field={field} value={simParams[field.key]} onChange={handleParamChange} />
                ))}
              </div>
            </div>
          </div>

          <div style={{ position: "sticky", top: "76px" }}>
            <div style={{ fontSize: "10px", color: "#94a3b8", letterSpacing: "2px", fontFamily: "monospace", marginBottom: "12px" }}>LIVE PREVIEW</div>

            <div style={{ background: "white", borderRadius: "12px", border: "1px solid #e2e8f0", overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.04)", marginBottom: "12px" }}>
              {[
                { label: "MONTHLY REVENUE",  value: fmt(revenue),      color: "#16a34a" },
                { label: "OPERATING COSTS",  value: fmt(operatingCosts), color: "#ef4444" },
                { label: "MONTHLY PROFIT",   value: fmt(profit),        color: profit >= 0 ? "#16a34a" : "#ef4444" },
                { label: "RUNWAY",           value: `${Math.min(runway, 999).toFixed(1)} mo`, color: runway < 3 ? "#ef4444" : runway < 6 ? "#d97706" : "#16a34a" },
              ].map(({ label, value, color }, i, arr) => (
                <div key={label} style={{ padding: "13px 18px", borderBottom: i < arr.length - 1 ? "1px solid #f8fafc" : "none", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ fontSize: "9px", color: "#94a3b8", letterSpacing: "1.5px", fontFamily: "monospace" }}>{label}</div>
                  <div style={{ fontSize: "15px", fontWeight: "800", color, fontFamily: "monospace" }}>{value}</div>
                </div>
              ))}
            </div>

            <div style={{ background: "white", borderRadius: "12px", border: "1px solid #e2e8f0", overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.04)", marginBottom: "12px" }}>
              {[
                { label: "CUSTOMERS / MO",   value: fmtN(customersServed) },
                { label: "SERVICE CAPACITY", value: fmtN(serviceCapacity) },
                { label: "FOOT TRAFFIC",     value: fmtN(footTraffic) },
              ].map(({ label, value }, i, arr) => (
                <div key={label} style={{ padding: "13px 18px", borderBottom: i < arr.length - 1 ? "1px solid #f8fafc" : "none", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ fontSize: "9px", color: "#94a3b8", letterSpacing: "1.5px", fontFamily: "monospace" }}>{label}</div>
                  <div style={{ fontSize: "15px", fontWeight: "800", color: "#0f172a", fontFamily: "monospace" }}>{value}</div>
                </div>
              ))}
            </div>

            <div style={{ padding: "12px 16px", borderRadius: "10px", background: "#fef3c7", border: "1px solid #f59e0b33" }}>
              <div style={{ fontSize: "9px", color: "#d97706", letterSpacing: "1.5px", fontFamily: "monospace", marginBottom: "4px", fontWeight: "700" }}>CURRENT BOTTLENECK</div>
              <div style={{ fontSize: "13px", fontWeight: "700", color: "#92400e" }}>{bottleneck}</div>
              <div style={{ fontSize: "11px", color: "#b45309", marginTop: "3px", lineHeight: 1.5 }}>
                {bottleneck === "Utility Capacity" && "Upgrading utilities will unlock more customers served."}
                {bottleneck === "Service Capacity" && "More baristas or longer hours will increase throughput."}
                {bottleneck === "Foot Traffic" && "Marketing spend will bring more customers in the door."}
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "18px 22px", marginTop: "32px", background: "white", borderRadius: "12px", border: "1px solid #e2e8f0", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
          <button onClick={() => navigate("/setup")} style={{ padding: "10px 20px", background: "white", border: "1px solid #e2e8f0", borderRadius: "8px", color: "#64748b", fontSize: "11px", fontWeight: "700", letterSpacing: "1.5px", cursor: "pointer", fontFamily: "monospace" }}>← BACK</button>
          <button onClick={() => navigate("/")} style={{ padding: "10px 24px", background: "#0f172a", border: "none", borderRadius: "8px", color: "white", fontSize: "11px", fontWeight: "700", letterSpacing: "1.5px", cursor: "pointer", fontFamily: "monospace" }}>NEXT: GOALS & GENERATE →</button>
        </div>

      </div>
    </div>
  )
}