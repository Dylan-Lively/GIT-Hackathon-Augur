import { useState, useCallback } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./NavBar";
import MainPage from "./MainPage";
import Setup from "./Setup";
import Settings from "./Settings";
import BestResults from "./BestResults";
import { simulationService } from "./services/simulationService";

export default function App() {
  const [setupConfig, setSetupConfig] = useState({ preset: null, moves: [] });
  const [mainConfig, setMainConfig] = useState({
    state1: "",
    state2: "",
    state3: "",
    state4: "",
    state5: "",
    state6: "",
    state7: "",
    state8: "",
  });

  // App builds the full payload for backend POST /simulate
  const handleGenerate = useCallback(async () => {
    const payload = {
      preset: setupConfig.preset ?? null,
      allowedMoves: setupConfig.moves ?? [],
      ...Object.fromEntries(
        Object.entries(mainConfig).map(([k, v]) => [k, v === "" ? 0 : Number(v)])
      ),
    };
    return simulationService.simulate(payload);
  }, [setupConfig, mainConfig]);

  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<MainPage onGenerate={handleGenerate} />} />
        <Route path="/setup" element={<Setup config={setupConfig} onChange={setSetupConfig} />} />
        <Route path="/settings" element={<Settings config={mainConfig} onChange={setMainConfig} />} />
        <Route path="/best-results" element={<BestResults />} />
      </Routes>
    </BrowserRouter>
  );
}