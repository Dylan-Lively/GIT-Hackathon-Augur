import { memo } from "react";

function SkeletonCard() {
  return (
    <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-sm overflow-hidden animate-pulse">
      <div className="p-6 space-y-4">
        <div className="h-4 bg-[#E2E8F0] rounded w-3/4" />
        <div className="h-3 bg-[#E2E8F0] rounded w-full" />
        <div className="h-3 bg-[#E2E8F0] rounded w-5/6" />
        <div className="h-8 bg-[#E2E8F0] rounded w-1/3 mt-4" />
      </div>
    </div>
  );
}

function GraphPlaceholder() {
  return (
    <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-sm overflow-hidden min-h-[280px] flex items-center justify-center">
      <div className="text-center text-[#94A3B8] text-sm">
        <div className="w-16 h-16 mx-auto mb-3 rounded-lg bg-[#F1F3F5] border border-dashed border-[#CBD5E1] flex items-center justify-center">
          <svg className="w-8 h-8 text-[#94A3B8]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
          </svg>
        </div>
        <p className="font-medium">Graph placeholder</p>
        <p className="text-xs mt-1">Visualization will go here</p>
      </div>
    </div>
  );
}

function BestResults() {
  return (
    <div className="min-h-screen bg-[#F1F3F5] flex items-start justify-center py-12 px-6">
      <div className="w-full max-w-5xl flex flex-col gap-6">
        <div className="border-b border-[#E2E8F0] pb-5">
          <h1 className="text-[#0F172A] text-2xl font-semibold tracking-tight">Best Results</h1>
          <p className="text-[#94A3B8] text-sm mt-1">Top simulation outcomes and performance metrics.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>

        <GraphPlaceholder />
      </div>
    </div>
  );
}

export default memo(BestResults);
