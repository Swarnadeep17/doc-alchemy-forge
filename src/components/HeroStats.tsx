
import { useLiveStats } from "@/hooks/useLiveStats";
import { Skeleton } from "@/components/ui/skeleton";
import React from "react";

const AnimatedStat = ({
  children,
}: { children: React.ReactNode }) => (
  <span className="inline-block bg-gradient-to-r from-gray-100 via-gray-400/40 to-gray-900/30 rounded-md p-2 mx-1 text-black/90 font-black text-[1.80rem] sm:text-4xl shadow-lg animate-fade-in border border-white/10">
    {children}
  </span>
);

export const HeroStats = () => {
  const { stats, loading } = useLiveStats();

  // Debug
  console.log("HeroStats: received stats", stats);

  const visits = stats?.overall?.visits;
  const downloads = stats?.overall?.downloads;

  // Format month string (visual only)
  const month = new Date().toLocaleString("en-US", { month: "short", year: "2-digit" });

  // Show a clearer fallback if stats are not available
  let visitsContent: React.ReactNode;
  if (loading) {
    visitsContent = <Skeleton className="w-12 h-9 bg-gray-700"/>;
  } else if (typeof visits === "number") {
    visitsContent = (
      <>
        {visits}
        <span className="ml-2 text-base font-normal text-black/60 tracking-normal">
          visits
        </span>
      </>
    );
  } else {
    visitsContent = <span className="text-red-400 font-mono">No stats</span>;
  }

  let downloadsContent: React.ReactNode;
  if (loading) {
    downloadsContent = <Skeleton className="w-12 h-9 bg-gray-700"/>;
  } else if (typeof downloads === "number") {
    downloadsContent = (
      <>
        {downloads}
        <span className="ml-2 text-base font-normal text-black/60 tracking-normal">
          downloads
        </span>
      </>
    );
  } else {
    downloadsContent = <span className="text-red-400 font-mono">No stats</span>;
  }

  return (
    <section className="mt-12 mb-8 flex flex-col items-center w-full animate-fade-in">
      <div className="bg-gradient-to-br from-white/5 via-black/40 to-black/80 px-8 py-7 rounded-2xl border border-white/10 shadow-2xl w-full max-w-lg text-center">
        <h1 className="text-4xl md:text-5xl font-extrabold font-mono tracking-[.02em] text-white drop-shadow-xl mb-5 animate-fade-in">
          Privacy-first document tools
        </h1>
        <div className="flex items-center justify-center gap-3 flex-wrap mt-2">
          <AnimatedStat>
            {visitsContent}
          </AnimatedStat>
          <span className="text-sm text-white/40 font-mono">|</span>
          <AnimatedStat>
            {downloadsContent}
          </AnimatedStat>
          <span className="text-xs text-gray-400 font-mono ml-2">{month}</span>
        </div>
        <div className="text-gray-300 text-base mt-6 font-medium max-w-sm mx-auto leading-relaxed animate-fade-in">
          All tools run fully in your browser for total privacy. <br />
          Never upload your files. No sign up needed.
        </div>
      </div>
    </section>
  );
};

