import { useState, useCallback, memo } from "react";

const GENERATE_STATUS = {
  idle: "idle",
  loading: "loading",
  success: "success",
  error: "error",
};

function MainPage({ onGenerate }) {
  const [status, setStatus] = useState(GENERATE_STATUS.idle);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleGenerate = useCallback(async () => {
    setStatus(GENERATE_STATUS.loading);
    setResult(null);
    setError(null);
    try {
      const data = await onGenerate();
      setResult(data);
      setStatus(GENERATE_STATUS.success);
    } catch (err) {
      setError(err?.message ?? "Request failed");
      setStatus(GENERATE_STATUS.error);
    }
  }, [onGenerate]);

  return (
    <div className="min-h-screen bg-[#F1F3F5] flex items-start justify-center py-12 px-6">
      <div className="w-full max-w-4xl flex flex-col gap-6">
        <div className="border-b border-[#E2E8F0] pb-5">
          <h1 className="text-[#0F172A] text-2xl font-semibold tracking-tight">Simulation</h1>
          <p className="text-[#94A3B8] text-sm mt-1">Configure Setup and Settings, then run the simulation.</p>
        </div>

        {status === GENERATE_STATUS.success && result && (
          <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-[#E2E8F0]">
              <h2 className="text-[#0F172A] text-sm font-semibold uppercase tracking-widest">Result</h2>
            </div>
            <pre className="p-6 text-xs text-[#475569] overflow-auto max-h-80">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}

        {status === GENERATE_STATUS.error && error && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-6 py-4 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="flex justify-center">
          <button
            onClick={handleGenerate}
            disabled={status === GENERATE_STATUS.loading}
            className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200
              ${status === GENERATE_STATUS.loading
                ? "bg-[#2563EB] text-white opacity-70 cursor-wait"
                : status === GENERATE_STATUS.success
                  ? "bg-[#16A34A] text-white"
                  : status === GENERATE_STATUS.error
                    ? "bg-[#DC2626] text-white hover:bg-[#B91C1C]"
                    : "bg-[#2563EB] text-white hover:bg-[#1D4ED8]"
              }`}
          >
            {status === GENERATE_STATUS.loading && "Generating…"}
            {status === GENERATE_STATUS.success && "Generated"}
            {status === GENERATE_STATUS.error && "Retry"}
            {status === GENERATE_STATUS.idle && "Generate"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default memo(MainPage);