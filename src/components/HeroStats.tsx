
import { useLiveStats } from "@/hooks/useLiveStats";
import { Skeleton } from "@/components/ui/skeleton";
import React from "react";

/** 
 * Animated glowing stat number. 
 * Add pulsing, glow, and a lively gradient via Tailwind and animation.
 */
const GlowingNumber = ({ children }: { children: React.ReactNode }) => (
  <span
    className="inline-block text-[2.3rem] sm:text-5xl font-black font-mono
      text-transparent bg-gradient-to-r from-cyan-200 via-white to-purple-200 bg-clip-text
      drop-shadow-[0_2px_20px_rgba(100,255,255,0.3)]
      animate-glow"
    style={{
      // fallback if animate-glow fails on some browsers
      filter: "drop-shadow(0px 0px 8px #67e8f9) drop-shadow(0px 0px 2px #fff)",
    }}
  >
    {children}
  </span>
);

// Custom glowing animation (fade + glow)
const glowAnimation = `
@keyframes glow {
  0%, 100% {
    text-shadow: 0 0 18px #67e8f9, 0 0 8px #fff, 0 0 2px #fff;
  }
  50% {
    text-shadow: 0 0 28px #fff, 0 0 12px #a78bfa, 0 0 6px #fff;
  }
}
.animate-glow {
  animation: glow 1.5s ease-in-out infinite alternate;
}
`;

// Inject the animation into the page once
if (typeof document !== "undefined" && !document.getElementById("hero-glow-style")) {
  const s = document.createElement("style");
  s.id = "hero-glow-style";
  s.innerHTML = glowAnimation;
  document.head.appendChild(s);
}

// Stat box with improved background (darker, semi-translucent, glassy)
const AnimatedStat = ({
  children,
}: { children: React.ReactNode }) => (
  <span className="inline-flex items-center bg-gradient-to-r from-gray-900/90 via-gray-900/80 to-black/80
      rounded-xl px-5 py-3 mx-2
      shadow-xl border border-cyan-400/30 ring-2 ring-cyan-400/20
      animate-fade-in
  ">
    {children}
  </span>
);

export const HeroStats = () => {
  const { stats, loading } = useLiveStats();

  // Debug
  console.log("HeroStats: received stats", stats);

  const visits = stats?.overall?.visits;
  const downloads = stats?.overall?.downloads;
  const month = new Date().toLocaleString("en-US", { month: "short", year: "2-digit" });

  // Show a clearer fallback if stats are not available
  let visitsContent: React.ReactNode;
  if (loading) {
    visitsContent = <Skeleton className="w-14 h-10 bg-gray-700" />;
  } else if (typeof visits === "number") {
    visitsContent = (
      <>
        <GlowingNumber>{visits}</GlowingNumber>
        <span className="ml-2 text-lg sm:text-base font-medium text-cyan-100/80 tracking-normal">
          visits
        </span>
      </>
    );
  } else {
    visitsContent = <span className="text-red-400 font-mono">No stats</span>;
  }

  let downloadsContent: React.ReactNode;
  if (loading) {
    downloadsContent = <Skeleton className="w-14 h-10 bg-gray-700" />;
  } else if (typeof downloads === "number") {
    downloadsContent = (
      <>
        <GlowingNumber>{downloads}</GlowingNumber>
        <span className="ml-2 text-lg sm:text-base font-medium text-cyan-100/80 tracking-normal">
          downloads
        </span>
      </>
    );
  } else {
    downloadsContent = <span className="text-red-400 font-mono">No stats</span>;
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
        <div className="flex items-center justify-center gap-5 flex-wrap mt-2">
          <AnimatedStat>
            {visitsContent}
          </AnimatedStat>
          <span className="text-xl text-cyan-100/30 font-mono px-2 select-none">|</span>
          <AnimatedStat>
            {downloadsContent}
          </AnimatedStat>
          <span className="text-xs text-cyan-100/40 font-mono ml-2">{month}</span>
        </div>
        <div className="text-cyan-50/90 text-base mt-7 font-medium max-w-sm mx-auto leading-relaxed animate-fade-in">
          All tools run fully in your browser for total privacy. <br />
          Never upload your files. No sign up needed.
        </div>
      </div>
    </section>
  );
};
