import { useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./NavBar";
import MainPage from "./MainPage";
import Setup from "./Setup";
import Settings from "./Settings";
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

  // App builds the full payload — MainPage just triggers onGenerate()
  const handleGenerate = async () => {
    const payload = {
      ...setupConfig, // preset, allowedMoves
      // Convert state values to numbers before sending
      ...Object.fromEntries(
        Object.entries(mainConfig).map(([k, v]) => [k, v === "" ? 0 : Number(v)])
      ),
    };
    return simulationService.generate(payload);
  };

  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<MainPage onGenerate={handleGenerate} />} />
        <Route path="/setup" element={<Setup config={setupConfig} onChange={setSetupConfig} />} />
        <Route path="/settings" element={<Settings config={mainConfig} onChange={setMainConfig} />} />
      </Routes>
    </BrowserRouter>
  );
}