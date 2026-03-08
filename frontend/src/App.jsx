import { useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./NavBar";
import MainPage from "./MainPage";
import Setup from "./Setup";
import Settings from "./Settings";
import { simulationService } from "./services/simulationService";

// ─── State fields per preset — keys must match backend model field names exactly
const FIELDS_BY_PRESET = {
  coffee_shop: [
    { key: "cash",            label: "Cash ($)",               placeholder: "10000" },
    { key: "baristas",        label: "Baristas",               placeholder: "2" },
    { key: "hoursOpen",       label: "Hours Open / Day",       placeholder: "10" },
    { key: "avgOrderValue",   label: "Avg Order Value ($)",    placeholder: "6.50" },
    { key: "marketingSpend",  label: "Marketing Spend ($/mo)", placeholder: "500" },
    { key: "rent",            label: "Rent ($/mo)",            placeholder: "3000" },
    { key: "baristaWage",     label: "Barista Wage ($/hr)",    placeholder: "16" },
    { key: "baseFootTraffic", label: "Base Foot Traffic/day",  placeholder: "150" },
    { key: "utilityCapacity", label: "Utility Capacity",       placeholder: "200" },
  ],
  retail_chain: [
    { key: "cash",                  label: "Cash ($)",                    placeholder: "50000" },
    { key: "locations",             label: "Locations",                   placeholder: "1" },
    { key: "distributionCenters",   label: "Distribution Centers",        placeholder: "1" },
    { key: "employeesPerLocation",  label: "Employees / Location",        placeholder: "5" },
    { key: "avgBasketSize",         label: "Avg Basket Size ($)",         placeholder: "45" },
    { key: "marketingSpend",        label: "Marketing Spend ($/mo)",      placeholder: "2000" },
    { key: "rentPerLocation",       label: "Rent / Location ($/mo)",      placeholder: "5000" },
    { key: "wagePerEmployee",       label: "Wage / Employee ($/hr)",      placeholder: "18" },
    { key: "brandStrength",         label: "Brand Strength (0–100)",      placeholder: "50" },
    { key: "inventoryTurnover",     label: "Inventory Turnover",          placeholder: "6" },
    { key: "supplyChainEfficiency", label: "Supply Chain Efficiency",     placeholder: "0.8" },
  ],
};

function getFields(preset) {
  return FIELDS_BY_PRESET[preset] ?? [];
}

function emptyConfig(preset) {
  return Object.fromEntries((getFields(preset)).map(f => [f.key, ""]));
}

export default function App() {
  const [setupConfig, setSetupConfig] = useState({ preset: null, moves: [] });
  const [mainConfig,  setMainConfig]  = useState({});

  const handleSetupChange = (next) => {
    // When preset changes, reset state fields to match new preset
    if (next.preset !== setupConfig.preset) {
      setMainConfig(emptyConfig(next.preset));
    }
    setSetupConfig(next);
  };

  const handleGenerate = async () => {
    const payload = {
      preset: setupConfig.preset,
      moves:  setupConfig.moves,
      // Pass all state fields as numbers
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
        <Route
          path="/setup"
          element={<Setup config={setupConfig} onChange={handleSetupChange} />}
        />
        <Route
          path="/settings"
          element={
            <Settings
              config={mainConfig}
              onChange={setMainConfig}
              fields={getFields(setupConfig.preset)}
              preset={setupConfig.preset}
            />
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
