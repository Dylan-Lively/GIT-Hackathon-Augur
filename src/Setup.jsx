import { useState } from "react";

const PRESETS = [
  { id: "coffee-shop",    label: "Coffee Shop",    description: "Small family-owned cafe" },
  { id: "retail-store",  label: "Retail Store",   description: "Local boutique or shop" },
  { id: "restaurant",    label: "Restaurant",     description: "Dine-in or takeout" },
  { id: "gym",           label: "Gym / Studio",   description: "Fitness or wellness space" },
  { id: "agency",        label: "Agency",         description: "Services & consulting" },
  { id: "ecommerce",     label: "E-Commerce",     description: "Online product store" },
];

export default function Setup({ onSelect }) {
  const [selectedPreset, setSelectedPreset] = useState(null);

  const handlePreset = (id) => {
    setSelectedPreset(id);
    onSelect?.({ preset: id, moves: selectedMoves });
  };

  return (
    <div className="min-h-screen bg-[#F1F3F5] flex items-start justify-center py-12 px-6">
      <div className="w-full max-w-4xl flex flex-col gap-6">

        {/* Header */}
        <div className="border-b border-[#E2E8F0] pb-5">
          <h1 className="text-[#0F172A] text-2xl font-semibold tracking-tight">Setup</h1>
          <p className="text-[#94A3B8] text-sm mt-1">Configure your business type and available decision moves.</p>
        </div>

        {/* Presets */}
        <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-[#E2E8F0]">
            <h2 className="text-[#0F172A] text-sm font-semibold uppercase tracking-widest">Business Preset</h2>
          </div>
          <div className="p-6 grid grid-cols-3 gap-3">
            {PRESETS.map((preset) => {
              const isSelected = selectedPreset === preset.id;
              return (
                <button
                  key={preset.id}
                  onClick={() => handlePreset(preset.id)}
                  className={`text-left px-4 py-3 rounded-lg border transition-all duration-200 cursor-pointer
                    ${isSelected
                      ? "border-[#2563EB] bg-[#EFF6FF] shadow-sm"
                      : "border-[#E2E8F0] bg-[#F8F9FA] hover:border-[#CBD5E1] hover:bg-white"
                    }`}
                >
                  <div className={`text-sm font-medium ${isSelected ? "text-[#2563EB]" : "text-[#0F172A]"}`}>
                    {preset.label}
                  </div>
                  <div className="text-xs text-[#94A3B8] mt-0.5">{preset.description}</div>
                </button>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}