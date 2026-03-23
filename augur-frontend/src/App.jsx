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

  const [preset, setPreset] = useState("coffee_shop")
  const [selectedMoves, setSelectedMoves] = useState(ALL_MOVE_IDS)

  const [initialState, setInitialState] = useState({
    cash: 50000,
    baristas: 2,
    hoursOpen: 10,
    avgOrderValue: 6,
    marketingSpend: 500,
    rent: 3000,
    baristaWage: 15,
    baseFootTraffic: 140,
    utilityCapacity: 100,
  })

  const [simParams, setSimParams] = useState({
    horizon: 6,
    maxCombos: 1,
    beamWidth: 10,
  })

  // Scoring weights on 0-100 scale — normalized to sum to 1.0 before sending
  const [scoringWeights, setScoringWeights] = useState({
    cashWeight: 33,
    profitWeight: 34,
    growthWeight: 33,
    riskTolerance: 50,
  })

  const [simulationResult, setSimulationResult] = useState(null)
  const [isLoading, setIsLoading] = useState(false)

  async function handleGenerate() {
    // Normalize so weights always sum to exactly 1.0
    const totalWeight = scoringWeights.cashWeight
                      + scoringWeights.profitWeight
                      + scoringWeights.growthWeight

    const payload = {
      preset,
      horizon: simParams.horizon,
      maxCombos: simParams.maxCombos,
      beamWidth: simParams.beamWidth,
      initialState: { type: preset, ...initialState },
      scoringWeights: {
        cashWeight:    scoringWeights.cashWeight   / totalWeight,
        profitWeight:  scoringWeights.profitWeight / totalWeight,
        growthWeight:  scoringWeights.growthWeight / totalWeight,
        riskTolerance: scoringWeights.riskTolerance,
      },
    }

    setIsLoading(true)
    setSimulationResult(null)
    navigate("/results")
    const result = await simulationService.generate(payload)
    setSimulationResult(result)
    setIsLoading(false)
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
          <Results
            result={simulationResult}
            initialState={initialState}
            isLoading={isLoading}
          />
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