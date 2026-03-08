export default function Settings({ config, onChange, fields = [], preset }) {
  const handleChange = (key, value) => {
    onChange({ ...config, [key]: value });
  };

  const presetLabel = preset
    ? preset.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())
    : null;

  return (
    <div className="min-h-screen bg-[#F1F3F5] flex items-start justify-center py-12 px-6">
      <div className="w-full max-w-4xl flex flex-col gap-6">

        {/* Header */}
        <div className="border-b border-[#E2E8F0] pb-5">
          <h1 className="text-[#0F172A] text-2xl font-semibold tracking-tight">Simulation</h1>
          <p className="text-[#94A3B8] text-sm mt-1">
            Configure your inputs, then hit Generate to run the simulation.
          </p>
        </div>

        {/* No preset warning */}
        {!preset && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-6 py-4 text-sm text-amber-700">
            ⚠ No business preset selected. Go to{" "}
            <a href="/setup" className="underline font-medium">Setup</a>{" "}
            to choose a preset first.
          </div>
        )}

        {/* Inputs Card */}
        {fields.length > 0 && (
          <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-[#E2E8F0] flex items-center justify-between">
              <h2 className="text-[#0F172A] text-sm font-semibold uppercase tracking-widest">Parameters</h2>
              {presetLabel && (
                <span className="text-xs font-medium text-[#2563EB] bg-[#EFF6FF] px-3 py-1 rounded-full">
                  {presetLabel}
                </span>
              )}
            </div>
            <div className="p-6 grid grid-cols-2 gap-4">
              {fields.map((field) => (
                <div key={field.key} className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-[#64748B] uppercase tracking-wider">
                    {field.label}
                  </label>
                  <input
                    type="number"
                    value={config[field.key] ?? ""}
                    onChange={(e) => handleChange(field.key, e.target.value)}
                    placeholder={field.placeholder ?? "0"}
                    className="px-3 py-2 rounded-lg border border-[#E2E8F0] bg-[#F8F9FA] text-sm text-[#0F172A] placeholder-[#CBD5E1] focus:outline-none focus:border-[#2563EB] focus:bg-white transition-all duration-200"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
