
import { useLiveStats } from "@/hooks/useLiveStats";
import { Skeleton } from "@/components/ui/skeleton";
import React from "react";

/**
 * Soft animated number: modern, subtle, with only a gentle highlight.
 * Removes aggressive drop-shadow, keeps just a light highlight + gentle animation.
 */
const SoftGlowingNumber = ({ children }: { children: React.ReactNode }) => (
  <span
    className="inline-block font-bold font-mono text-[2.1rem] sm:text-4xl
      text-transparent bg-gradient-to-br from-cyan-100 via-white to-violet-200 bg-clip-text
      animate-number-wiggle"
    style={{
      // fallback for browsers not supporting keyframes
      textShadow: "0 1px 4px #89c2fa, 0 0px 1px #fff",
      filter: "drop-shadow(0 2px 6px #6ee7b7b6)",
    }}
  >
    {children}
  </span>
);

// Subtle number wiggle
const numberWiggleAnimation = `
@keyframes number-wiggle {
  0%, 100% { transform: translateY(0); }
  35% { transform: translateY(-2px) scale(1.025); }
  65% { transform: translateY(1px) scale(0.99); }
}
.animate-number-wiggle {
  animation: number-wiggle 1.7s ease-in-out infinite;
}
`;

if (typeof document !== "undefined" && !document.getElementById("hero-soft-wiggle-style")) {
  const s = document.createElement("style");
  s.id = "hero-soft-wiggle-style";
  s.innerHTML = numberWiggleAnimation;
  document.head.appendChild(s);
}

const StatLabel = ({ children }: { children: React.ReactNode }) => (
  <span className="ml-1 text-base font-medium text-cyan-100/75 tracking-wide">{children}</span>
);

const DotSep = () => (
  <span className="mx-3 text-cyan-300/20 select-none text-2xl align-middle">•</span>
);

export const HeroStats = () => {
  const { stats, loading } = useLiveStats();

  const visits = stats?.overall?.visits;
  const downloads = stats?.overall?.downloads;
  const month = new Date().toLocaleString("en-US", { month: "short", year: "2-digit" });

  let content: React.ReactNode;

  if (loading) {
    content = (
      <div className="flex items-center gap-3">
        <Skeleton className="w-12 h-7 bg-gray-700" />
        <DotSep />
        <Skeleton className="w-12 h-7 bg-gray-700" />
      </div>
    );
  } else if (typeof visits === "number" && typeof downloads === "number") {
    content = (
      <div className="flex items-center justify-center gap-0 whitespace-nowrap">
        <SoftGlowingNumber>{visits}</SoftGlowingNumber>
        <StatLabel>visits</StatLabel>
        <DotSep />
        <SoftGlowingNumber>{downloads}</SoftGlowingNumber>
        <StatLabel>downloads</StatLabel>
        <span className="ml-2 text-xs text-cyan-100/40 font-mono">{month}</span>
      </div>
    );
  } else {
    content = (
      <div className="flex items-center gap-3">
        <span className="text-red-400 font-mono">No stats</span>
      </div>
    );
  }

  return (
    <section className="mt-12 mb-8 flex flex-col items-center w-full animate-fade-in">
      <div className="bg-gradient-to-br from-gray-900/90 via-gray-950/70 to-black/95
          px-8 py-8 rounded-2xl border border-cyan-300/20 shadow-cyan-200/10 shadow-2xl w-full max-w-lg text-center
          backdrop-blur-md ring-2 ring-cyan-300/10 animate-fade-in"
      >
        <h1 className="text-4xl md:text-5xl font-extrabold font-mono tracking-[.02em] text-white drop-shadow-xl mb-5">
          Privacy-first document tools
        </h1>
        {/* Compact stats row */}
        <div className="mt-2 mb-1 flex items-center justify-center w-full">
          {content}
        </div>
        {/* Debug block for raw stats */}
        <div className="mt-4 w-full max-w-lg mx-auto px-3 rounded bg-black/50 text-left text-xs text-white/80 font-mono break-words select-all">
          <strong>Debug: Raw stats from Firebase:</strong>
          <pre className="whitespace-pre-wrap">{JSON.stringify(stats, null, 2)}</pre>
        </div>
        <div className="text-cyan-50/90 text-base mt-7 font-medium max-w-sm mx-auto leading-relaxed animate-fade-in">
          All tools run fully in your browser for total privacy. <br />
          Never upload your files. No sign up needed.
        </div>
      </div>
    </section>
  );
};
