import { useLocation, useNavigate } from "react-router-dom"

const TABS = [
  { label: "SETUP", path: "/setup" },
  { label: "SETTINGS", path: "/settings" },
  { label: "GOALS & GENERATE", path: "/" },
  { label: "RESULTS", path: "/results" },
]

export default function NavBar() {
  const location = useLocation()
  const navigate = useNavigate()

  return (
    <nav style={{
      background: "white", borderBottom: "1px solid #e2e8f0",
      padding: "0 40px", display: "flex", alignItems: "center",
      justifyContent: "space-between", height: "56px",
      position: "sticky", top: 0, zIndex: 50,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: "160px" }}>
        <span style={{ fontSize: "15px", fontWeight: "800", color: "#0f172a", letterSpacing: "-0.5px", fontFamily: "Georgia, serif" }}>Augur</span>
        <span style={{ fontSize: "11px", color: "#94a3b8", fontFamily: "monospace" }}>by Pivott</span>
      </div>

      <div style={{ display: "flex", alignItems: "center", height: "100%" }}>
        {TABS.map((tab, i) => {
          const isActive = location.pathname === tab.path ||
            (tab.path === "/setup" && location.pathname === "/setup")
          const isResults = tab.path === "/results"
          return (
            <button
              key={tab.path}
              onClick={() => !isResults && navigate(tab.path)}
              style={{
                height: "100%", padding: "0 18px", background: "none", border: "none",
                borderBottom: isActive ? "2px solid #0f172a" : "2px solid transparent",
                color: isActive ? "#0f172a" : "#94a3b8",
                fontSize: "10px", fontWeight: "700", letterSpacing: "1.5px",
                fontFamily: "monospace", cursor: isResults ? "default" : "pointer",
                display: "flex", alignItems: "center", gap: "7px",
                transition: "color 0.15s, border-color 0.15s",
                opacity: isResults ? 0.35 : 1,
              }}
            >
              <span style={{
                width: "16px", height: "16px", borderRadius: "50%",
                background: isActive ? "#0f172a" : "#f1f5f9",
                color: isActive ? "white" : "#94a3b8",
                fontSize: "9px", fontWeight: "800",
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
              }}>{i + 1}</span>
              {tab.label}
            </button>
          )
        })}
      </div>

      <div style={{ minWidth: "160px" }} />
    </nav>
  )
}