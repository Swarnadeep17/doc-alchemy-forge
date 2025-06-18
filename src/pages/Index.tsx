import Header from "../components/Header";
import { ToolAccordion } from "../components/ToolAccordion";
import { HeroStats } from "../components/HeroStats";
import { WhyUsTable } from "../components/WhyUsTable";
import { USPCard } from "../components/USPCard";
import { useEffect } from "react";
import { incrementStat } from "../lib/incrementStats";
import { Shield, Zap, TrendingUp, Lock, Cpu, Gem } from "lucide-react";

const USP_LIST = [
  {
    title: "Client-Side Only",
    description: "All processing is local—your data is never sent to any server, ensuring 100% privacy.",
    icon: <Lock className="w-6 h-6 text-cyan-400" />,
  },
  {
    title: "No Account Needed",
    description: "Access powerful document tools instantly with zero signup and no personal info required.",
    icon: <Zap className="w-6 h-6 text-cyan-400" />,
  },
  {
    title: "Real-Time Transparency",
    description: "Live stats are publicly displayed, reflecting our commitment to open usage and honesty.",
    icon: <TrendingUp className="w-6 h-6 text-cyan-400" />,
  },
  {
    title: "Zero File Uploads",
    description: "Never upload your docs to the internet—edit, convert or redact securely in your own browser.",
    icon: <Shield className="w-6 h-6 text-cyan-400" />,
  },
  {
    title: "Modern Web Tech",
    description: "Optimized for speed using cutting-edge browser technologies—no plugins or downloads needed.",
    icon: <Cpu className="w-6 h-6 text-cyan-400" />,
  },
  {
    title: "Forever Free & Secure",
    description: "Our mission: Simple, secure, and free tools for everyone, with no tracking—ever.",
    icon: <Gem className="w-6 h-6 text-cyan-400" />,
  },
];

const Index = () => {
  // Increment website visit count on mount (once per user session)
  useEffect(() => {
    incrementStat(["overall", "visits"]);
  }, []);

  return (
    <div className="min-h-screen w-full flex flex-col bg-gradient-to-br from-black via-gray-900 to-black">
      <Header />

      <main className="flex-1 flex flex-col items-center">
        <HeroStats />

        {/* ---- USP Cards Section ---- */}
        <section className="w-full flex flex-col items-center justify-center mt-8 mb-16 px-4">
          <div className="w-full max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {USP_LIST.map((usp) => (
              <USPCard
                key={usp.title}
                title={usp.title}
                description={usp.description}
                icon={usp.icon}
              />
            ))}
          </div>
        </section>
        
        <ToolAccordion />
        
        <WhyUsTable />
      </main>

      <footer className="w-full py-6 text-center text-xs text-white/60 font-mono border-t border-white/10 mt-12">
        © {new Date().getFullYear()} docenclave — Built for the future.
      </footer>
    </div>
  );
};

export default Index;
