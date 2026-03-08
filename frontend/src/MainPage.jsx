import { useState } from "react";

const GENERATE_STATUS = {
    idle: "idle",
    loading: "loading",
    success: "success",
    error: "error",
};

export default function MainPage({ onGenerate }) {
    const [status, setStatus] = useState(GENERATE_STATUS.idle);
    const [errorMsg, setErrorMsg] = useState("");

    const handleGenerate = async () => {
        setStatus(GENERATE_STATUS.loading);
        setErrorMsg("");
        try {
            await onGenerate();
            setStatus(GENERATE_STATUS.success);
        } catch (err) {
            setErrorMsg(err.message);
            setStatus(GENERATE_STATUS.error);
        }
    };

    return (
        <div className="min-h-screen bg-[#F1F3F5] flex flex-col items-center py-12 px-6 gap-8">

            {/* Generate Button */}
            <div className="flex justify-center">
                <button
                    onClick={handleGenerate}
                    disabled={status === GENERATE_STATUS.loading}
                    className={`px-12 py-5 rounded-lg text-lg font-semibold transition-all duration-200
                        ${status === GENERATE_STATUS.loading
                            ? "bg-[#2563EB] text-white opacity-70 cursor-wait"
                            : status === GENERATE_STATUS.success
                                ? "bg-[#16A34A] text-white"
                                : "bg-[#2563EB] text-white hover:bg-[#1D4ED8]"
                        }`}
                >
                    {status === GENERATE_STATUS.loading && "Generating…"}
                    {status === GENERATE_STATUS.success && "Generated"}
                    {status === GENERATE_STATUS.error && "Retry"}
                    {status === GENERATE_STATUS.idle && "Generate"}
                </button>
            </div>

            {/* Error */}
            {status === GENERATE_STATUS.error && (
                <div className="w-full max-w-4xl bg-[#FEF2F2] border border-[#FECACA] text-[#DC2626] text-sm px-4 py-3 rounded-lg">
                    ⚠ {errorMsg || "Something went wrong. Please try again."}
                </div>
            )}

        </div>
    );
}