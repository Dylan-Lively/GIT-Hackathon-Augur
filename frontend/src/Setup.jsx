// Preset IDs must match backend SimulationEngine.getMovesForPreset() exactly
const PRESETS = [
    { id: "coffee_shop",  label: "Coffee Shop",  description: "Small family-owned cafe" },
    { id: "retail_chain", label: "Retail Store",  description: "Local boutique or shop" },
    { id: "restaurant",   label: "Restaurant",    description: "Dine-in or takeout" },
    { id: "gym",          label: "Gym / Studio",  description: "Fitness or wellness space" },
    { id: "agency",       label: "Agency",        description: "Services & consulting" },
    { id: "ecommerce",    label: "E-Commerce",    description: "Online product store" },
];

// Move IDs and names must match backend SimulationEngine.getMovesForPreset()
const MOVES_BY_PRESET = {
    coffee_shop: [
        { id: "hire_barista",       label: "Hire Barista",       icon: "👤", description: "Add staff · costs $2,000 cash" },
        { id: "upgrade_utilities",  label: "Upgrade Utilities",  icon: "⚡", description: "Boost capacity · costs $5,000 cash" },
        { id: "increase_marketing", label: "Increase Marketing", icon: "📣", description: "Drive foot traffic · costs $1,000/mo" },
        { id: "raise_prices",       label: "Raise Prices",       icon: "💲", description: "Increase avg order value by $1" },
        { id: "extend_hours",       label: "Extend Hours",       icon: "🕐", description: "Open 2 more hours per day" },
    ],
    retail_chain: [
        { id: "open_location",      label: "Open Location",      icon: "🏪", description: "New store · high upfront cost" },
        { id: "hire_staff",         label: "Hire Staff",         icon: "👥", description: "More employees per location" },
        { id: "boost_marketing",    label: "Boost Marketing",    icon: "📣", description: "Increase brand strength" },
        { id: "optimize_supply",    label: "Optimize Supply",    icon: "🔗", description: "Improve supply chain efficiency" },
        { id: "raise_prices",       label: "Raise Prices",       icon: "💲", description: "Increase avg basket size" },
    ],
};

const FALLBACK_MOVES = [];

export default function Setup({ config, onChange }) {
    const { preset: selectedPreset, moves: selectedMoves } = config;
    const availableMoves = MOVES_BY_PRESET[selectedPreset] ?? FALLBACK_MOVES;

    const handlePreset = (id) => {
        // Reset moves when switching preset
        onChange({ preset: id, moves: [] });
    };

    const toggleMove = (id) => {
        const updated = selectedMoves.includes(id)
            ? selectedMoves.filter((m) => m !== id)
            : [...selectedMoves, id];
        onChange({ preset: selectedPreset, moves: updated });
    };

    return (
        <div className="min-h-screen bg-[#F1F3F5] flex items-start justify-center py-12 px-6">
            <div className="w-full max-w-4xl flex flex-col gap-6">

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

                {/* Moves */}
                <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-[#E2E8F0] flex items-center justify-between">
                        <h2 className="text-[#0F172A] text-sm font-semibold uppercase tracking-widest">Allowed Moves</h2>
                        <span className="text-xs text-[#94A3B8]">{selectedMoves.length} selected</span>
                    </div>

                    {!selectedPreset ? (
                        <div className="px-6 py-8 text-center text-sm text-[#94A3B8]">
                            Select a business preset above to see available moves.
                        </div>
                    ) : availableMoves.length === 0 ? (
                        <div className="px-6 py-8 text-center text-sm text-[#94A3B8]">
                            No moves defined for this preset yet.
                        </div>
                    ) : (
                        <div className="p-6 grid grid-cols-2 gap-3">
                            {availableMoves.map((move) => {
                                const isSelected = selectedMoves.includes(move.id);
                                return (
                                    <button
                                        key={move.id}
                                        onClick={() => toggleMove(move.id)}
                                        className={`text-left px-4 py-3 rounded-lg border flex items-start gap-3 transition-all duration-200 cursor-pointer
                                            ${isSelected
                                                ? "border-[#2563EB] bg-[#EFF6FF]"
                                                : "border-[#E2E8F0] bg-[#F8F9FA] hover:border-[#CBD5E1] hover:bg-white"
                                            }`}
                                    >
                                        <div className={`mt-0.5 w-4 h-4 rounded flex-shrink-0 border flex items-center justify-center transition-all
                                            ${isSelected ? "bg-[#2563EB] border-[#2563EB]" : "border-[#CBD5E1] bg-white"}`}>
                                            {isSelected && (
                                                <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 10 10">
                                                    <path d="M1.5 5l2.5 2.5 4.5-4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                                </svg>
                                            )}
                                        </div>
                                        <div className="flex items-start gap-2 flex-1">
                                            <span className="text-base leading-none mt-0.5">{move.icon}</span>
                                            <div>
                                                <div className={`text-sm font-medium ${isSelected ? "text-[#2563EB]" : "text-[#0F172A]"}`}>
                                                    {move.label}
                                                </div>
                                                <div className="text-xs text-[#94A3B8] mt-0.5">{move.description}</div>
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}
