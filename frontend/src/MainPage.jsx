import { useState } from "react";

const GENERATE_STATUS = {
    idle: "idle",
    loading: "loading",
    success: "success",
};

export default function MainPage({ onGenerate }) {

    const [status, setStatus] = useState(GENERATE_STATUS.idle);
    const [result, setResult] = useState(null);

    const handleGenerate = async () => {
        setStatus(GENERATE_STATUS.loading);
        setResult(null);
        try {
            const data = await onGenerate();
            setResult(data);
            setStatus(GENERATE_STATUS.success);
        } catch (err) {
        }
    };

    return (
        <>
            {status === GENERATE_STATUS.success && result && (
                <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-[#E2E8F0]">
                        <h2 className="text-[#0F172A] text-sm font-semibold uppercase tracking-widest">Result</h2>
                    </div>
                    <pre className="p-6 text-xs text-[#475569] overflow-auto">
                        {JSON.stringify(result, null, 2)}
                    </pre>
                </div>
            )}

            <div className="flex justify-center mg-top-500">
                <button
                    onClick={handleGenerate}
                    disabled={status === GENERATE_STATUS.loading}
                    className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200
                        ${status === GENERATE_STATUS.loading
                            ? "bg-[#2563EB] text-white opacity-70 cursor-wait"
                            : status === GENERATE_STATUS.success
                                ? "bg-[#16A34A] text-white"
                                : "bg-[#2563EB] text-white hover:bg-[#1D4ED8]"
                        }`}
                >
                    {status === GENERATE_STATUS.loading && "Generating…"}
                    {status === GENERATE_STATUS.success && "Generated"}
                    {status === GENERATE_STATUS.idle && "Generate"}
                </button>
            </div>
        </>
    );
}