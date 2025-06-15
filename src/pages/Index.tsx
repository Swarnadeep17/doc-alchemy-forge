import Header from "@/components/Header";
import { ToolAccordion } from "@/components/ToolAccordion";
import { HeroStats } from "@/components/HeroStats";
import { WhyUsTable } from "@/components/WhyUsTable";
import { USPCard } from "@/components/USPCard";
import { useLiveStats } from "@/hooks/useLiveStats";
import { useEffect, useState } from "react";
import { incrementStat } from "@/lib/incrementStats";

// Mockup: Tool cards for a horizontally scrolling tools section.
// For real design, use ToolAccordion; here, lay out a special horizontal area as a "Surprise".
const ToolCard = ({
  tool,
  category,
  status,
  uses,
}: {
  tool: string;
  category: string;
  status: "available" | "coming_soon";
  uses: number;
}) => (
  <div className={`flex flex-col items-center px-6 py-5 mx-2 min-w-[180px] rounded-xl border shadow-lg transition-all ${
    status === "available"
      ? "bg-gray-900/80 border-cyan-400/40 shadow-cyan-200/5"
      : "bg-black/80 border-white/15 opacity-60"
  }`}>
    <span className="text-lg font-bold uppercase tracking-widest text-white font-mono mb-1">
      {tool}
    </span>
    <span
      className={`text-xs px-2 py-0.5 rounded ${
        status === "available"
          ? "bg-cyan-600/10 text-cyan-200"
          : "bg-white/10 text-white/40 font-semibold"
      }`}
    >
      {status === "available" ? `${uses} uses` : "Coming Soon"}
    </span>
    <span className="text-xs mt-1 text-white/25">{category}</span>
  </div>
);

// custom hook to fetch tool list and inject stats
const useToolList = (stats: any) => {
  const [tools, setTools] = useState<
    { category: string; tool: string; status: "available" | "coming_soon"; uses: number }[]
  >([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/tools/status.json")
      .then((r) => r.json())
      .then((toolStatus) => {
        const arr = [];
        for (const [category, obj] of Object.entries(toolStatus)) {
          for (const [tool, status] of Object.entries(obj as Record<string, any>)) {
            arr.push({
              category,
              tool: tool[0].toUpperCase() + tool.slice(1),
              status,
              uses:
                status === "available"
                  ? stats?.tools?.[category]?.[tool]?.visits ?? 0
                  : 0,
            });
          }
        }
        setTools(arr);
      })
      .finally(() => setLoading(false));
  }, [stats]);
  return { tools, loading };
};

const USP_LIST = [
  {
    title: "Client-Side Only",
    description: "All processing is local—your data is never sent to any server, ensuring 100% privacy.",
  },
  {
    title: "No Account Needed",
    description: "Access powerful document tools instantly with zero signup and no personal info required.",
  },
  {
    title: "Real-Time Transparency",
    description: "Live stats are publicly displayed, reflecting our commitment to open usage and honesty.",
  },
  {
    title: "Zero File Uploads",
    description: "Never upload your docs to the internet—edit, convert or redact securely in your own browser.",
  },
  {
    title: "Modern Web Tech",
    description: "Optimized for speed using cutting-edge browser technologies—no plugins or downloads needed.",
  },
  {
    title: "Forever Free & Secure",
    description: "Our mission: Simple, secure, and free tools for everyone, with no tracking—ever.",
  },
];

const Index = () => {
  const { stats } = useLiveStats();
  const { tools, loading } = useToolList(stats);

  // Increment website visit count on mount (once per user session)
  useEffect(() => {
    incrementStat(["overall", "visits"]);
  }, []);

  return (
    <div className="min-h-screen w-full flex flex-col bg-gradient-to-br from-black via-gray-900 to-black">
      <Header />

      <main className="flex-1 flex flex-col items-center">
        {/* Hero + Stats Section, centered */}
        <section className="w-full flex flex-col items-center justify-center py-10 px-2 sm:px-0 mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl font-extrabold font-mono text-white tracking-widest mb-5 animate-fade-in uppercase drop-shadow">
            Privacy-first Document Tools
          </h1>
          <HeroStats />
        </section>

        {/* ---- USP Cards Section ---- */}
        <section className="w-full flex flex-col items-center justify-center mt-2 mb-12 px-2">
          <div className="w-full max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {USP_LIST.map((usp) => (
              <USPCard
                key={usp.title}
                title={usp.title}
                description={usp.description}
              />
            ))}
          </div>
        </section>
        {/* -------------------------- */}

        {/* Tools Accordion - highlight, no centering, full width */}
        <section className="w-full max-w-3xl mx-auto mt-8 mb-10 px-2">
          <ToolAccordion />
        </section>

        {/* Why Us - centered */}
        <section id="whyus" className="w-full flex flex-col items-center max-w-2xl mx-auto mt-12 mb-8 px-2 text-center">
          <h2 className="text-xl font-bold text-white font-mono mb-4 tracking-wide">Why DocEnclave?</h2>
          <div className="flex flex-col md:flex-row gap-6 justify-center items-center">
            <div className="flex-1 min-w-[240px]">
              <ul className="space-y-4">
                <li className="flex items-center gap-3 justify-center">
                  <span className="rounded-full p-2 bg-white/10 text-white/60">
                    <svg width="22" height="22" fill="none" viewBox="0 0 24 24"><path stroke="#dadada" strokeWidth="2" d="M12 4l7 4v6c0 5-3.8 7.7-7 8-3.2-.3-7-3-7-8V8l7-4z"/></svg>
                  </span>
                  <span className="font-semibold text-white">All processing is client-side (100% privacy)</span>
                </li>
                <li className="flex items-center gap-3 justify-center">
                  <span className="rounded-full p-2 bg-white/10 text-white/60">
                    <svg width="22" height="22" fill="none" viewBox="0 0 24 24"><path stroke="#dadada" strokeWidth="2" d="M13 2L3 14h7v8l7-12h-7z"/></svg>
                  </span>
                  <span className="font-semibold text-white">Instant, free, no sign up ever</span>
                </li>
                <li className="flex items-center gap-3 justify-center">
                  <span className="rounded-full p-2 bg-white/10 text-white/60">
                    <svg width="22" height="22" fill="none" viewBox="0 0 24 24"><path stroke="#dadada" strokeWidth="2" d="M3 17v2h18v-2M7 9v6m4-9v9m4-5v5"/></svg>
                  </span>
                  <span className="font-semibold text-white">Transparent real-time usage stats</span>
                </li>
              </ul>
            </div>
            <div className="flex-1 min-w-[240px]">
              <WhyUsTable />
            </div>
          </div>
        </section>
      </main>

      {/* Footer centered */}
      <footer className="w-full py-6 text-center text-xs text-white/60 font-mono border-t border-white/10 mt-auto">
        © {new Date().getFullYear()} docenclave — Built for the future.
      </footer>
    </div>
  );
};

export default Index;
