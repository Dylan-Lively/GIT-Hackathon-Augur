import { useState } from "react"
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom"
import NavBar from "./components/NavBar"
import MainPage from "./pages/MainPage"
import Setup from "./pages/Setup"
import Settings from "./pages/Settings"
import Results from "./pages/Results"
import { simulationService } from "./services/simulationService"

const ALL_MOVE_IDS = ["hire_barista", "upgrade_utilities", "increase_marketing", "raise_prices", "extend_hours"]

function AppInner() {
  const navigate = useNavigate()

  // Setup
  const [preset, setPreset] = useState("coffee_shop")
  const [selectedMoves, setSelectedMoves] = useState(ALL_MOVE_IDS)

  // Initial business state
  const [initialState, setInitialState] = useState({
    cash: 50000,
    baristas: 2,
    hoursOpen: 8,
    avgOrderValue: 6.0,
    marketingSpend: 500,
    rent: 3000,
    baristaWage: 15,
    baseFootTraffic: 100,
    utilityCapacity: 60,
  })

  // Simulation parameters
  const [simParams, setSimParams] = useState({
    horizon: 6,
    maxCombos: 1,
    beamWidth: 10,
  })

  // Scoring weights (0-100 scale, normalized before sending)
  const [scoringWeights, setScoringWeights] = useState({
    cashWeight: 60,
    profitWeight: 50,
    growthWeight: 40,
    riskTolerance: 40,
  })

  const [simulationResult, setSimulationResult] = useState(null)

  async function handleGenerate() {
    const payload = {
      preset,
      horizon: simParams.horizon,
      maxCombos: simParams.maxCombos,
      beamWidth: simParams.beamWidth,
      initialState: { type: preset, ...initialState },
      scoringWeights: {
        cashWeight: scoringWeights.cashWeight / 100,
        profitWeight: scoringWeights.profitWeight / 100,
        growthWeight: scoringWeights.growthWeight / 100,
        riskTolerance: scoringWeights.riskTolerance,
      },
    }
    const result = await simulationService.generate(payload)
    setSimulationResult(result)
  }

  return (
    <>
      <NavBar />
      <Routes>
        <Route path="/" element={
          <MainPage
            onGenerate={handleGenerate}
            scoringWeights={scoringWeights}
            setScoringWeights={setScoringWeights}
          />
        } />
        <Route path="/setup" element={
          <Setup
            preset={preset} setPreset={setPreset}
            selectedMoves={selectedMoves} setSelectedMoves={setSelectedMoves}
          />
        } />
        <Route path="/settings" element={
          <Settings
            state={initialState} onChange={setInitialState}
            simParams={simParams} setSimParams={setSimParams}
          />
        } />
        <Route path="/results" element={
          <Results result={simulationResult} initialState={initialState} />
        } />
      </Routes>
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AppInner />
    </BrowserRouter>
  )
}