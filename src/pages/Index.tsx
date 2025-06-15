
import { HeroStats } from "@/components/HeroStats";
import Header from "@/components/Header";
import { ToolAccordion } from "@/components/ToolAccordion";
import { WhyUsTable } from "@/components/WhyUsTable";

// Re-inserted original D logo as LogoFuturistic
const LogoFuturistic = () => (
  <div className="flex flex-col items-center justify-center select-none mt-6">
    <div className="relative flex items-center justify-center">
      <svg 
        width="64" height="64" viewBox="0 0 64 64" fill="none"
        className="drop-shadow-[0_0_28px_#fff2] animate-spin-slow"
        style={{ filter:'drop-shadow(0 0 16px #fff8), drop-shadow(0 0 48px #57cbfd08)' }}
      >
        <rect 
          x="7" y="7" rx="16" width="50" height="50" 
          fill="rgba(44,44,44,0.72)"
          stroke="#e9e9e9"
          strokeWidth="2.5"
          style={{ filter: "drop-shadow(0 0 8px #fff3)" }}
        />
        <path
          d="M25 17h13a13 13 0 1 1 0 26h-13V17z"
          fill="#fff"
          style={{ filter: "drop-shadow(0 0 14px #e9e9e9)" }}
        />
        <path
          d="M25 17h13a13 13 0 1 1 0 26h-13V17z"
          fill="none"
          stroke="#9DECF9"
          strokeWidth="2"
          style={{ filter: "drop-shadow(0 0 12px #9DECF966)" }}
        />
      </svg>
      <span className="absolute left-1/2 -translate-x-1/2 bottom-[-20px] text-xs uppercase text-gray-300 tracking-widest font-bold pointer-events-none select-none shadow-glow animate-pulse">docenclave</span>
    </div>
  </div>
);

const Index = () => {
  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-black via-gray-900 to-black text-white flex flex-col">
      <Header />
      <main className="flex-1 flex flex-col">
        <LogoFuturistic />
        <HeroStats />
        <ToolAccordion />
        <WhyUsTable />
      </main>
      <footer className="w-full py-6 text-center text-xs text-white/50 font-mono">
        © {new Date().getFullYear()} docenclave — Built for the future.
      </footer>
    </div>
  );
};

export default Index;

