
import { useLiveStats } from "@/hooks/useLiveStats";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

const LogoFuturistic = () => (
  <div className="flex flex-col items-center justify-center select-none">
    {/* Animated glowy monochrome D */}
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
        {/* Futuristic ‘D’ letter, glowing edge */}
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

const TaglineFuturistic = () => (
  <div className="mt-8 w-full">
    <h1 className="text-3xl md:text-4xl font-black text-white text-center tracking-wider font-mono drop-shadow-glow animate-fade-in">
      <span className="whitespace-nowrap">
        Pure privacy.
      </span>
      <span className="mx-2 text-[#a5f3fc]">No files stored.</span>
      <span className="whitespace-nowrap">All client side.</span>
    </h1>
    <p className="mt-4 text-base text-gray-400 mx-auto text-center max-w-xl font-medium animate-fade-in">
      ⚡ Embrace the future. Files never leave your device.<br />
      No account needed. Everything encrypted. Experience the new era of trustless document tools.<br />
    </p>
  </div>
);

const StatNumber = ({ value, loading }: { value: number, loading: boolean }) => (
  <span className="font-mono text-4xl md:text-5xl text-[#e9e9e9] drop-shadow-[0_0_18px_#e7f6ff44] animate-glow font-black">
    {loading ? <Skeleton className="w-16 h-10 mx-auto bg-gray-800" /> : (
      <span className="tracking-wide animate-fade-in">{value}</span>
    )}
  </span>
);

const StatTile = ({
  label,
  value,
  loading,
  highlight,
}: {
  label: string;
  value: number;
  loading: boolean;
  highlight?: boolean;
}) => (
  <div
    className={`relative rounded-xl bg-gradient-to-b from-white/0 via-white/5 to-[#272b2f] border border-[#24282e] px-5 py-3 sm:px-7 sm:py-4 flex flex-col items-center shadow-neon transition-all 
    ${highlight ? "ring-2 ring-cyan-300/60 ring-offset-[2px] animate-futuristicPulse" : ""}`}
  >
    <StatNumber value={value} loading={loading} />
    <span
      className="block mt-1 uppercase text-xs font-bold tracking-widest text-[#70e2ff] drop-shadow-neon"
    >
      {label}
    </span>
  </div>
);

const ToolCard = ({
  name,
  description,
  stats,
  soon = false,
  onClick,
}: {
  name: string;
  description?: string;
  stats?: { visits?: number };
  soon?: boolean;
  onClick?: () => void;
}) => (
  <div
    className={`
      group relative rounded-2xl overflow-hidden bg-gradient-to-br from-gray-800/90 via-[#24272B]/80 to-black/80 border border-cyan-900/50 shadow-[0_8px_50px_0_#00eaff0b]
      px-5 py-4 flex flex-col items-start cursor-${soon ? "not-allowed" : "pointer"} transition hover:ring-2 hover:ring-cyan-400/50
      min-h-[110px]
    `}
    onClick={soon ? undefined : onClick}
    aria-disabled={soon}
    tabIndex={soon ? -1 : 0}
  >
    <span className="font-mono text-lg font-bold text-white drop-shadow-glow tracking-wide animate-glow">
      {name}
      {soon && (
        <Badge variant="secondary" className="absolute top-2 right-2 z-10 bg-[#101518] text-cyan-300 border-none font-bold opacity-80 animate-pulse">
          soon
        </Badge>
      )}
    </span>
    {description && (
      <p className="text-xs text-gray-400 mt-0.5 mb-1">{description}</p>
    )}
    {/* Glowing stat chip */}
    <div className="flex items-center mt-auto">
      <span className="rounded-full bg-cyan-400/10 px-2 py-[2px] text-xs font-bold font-mono text-cyan-200 tracking-tight shadow-cyan-glow">
        Visits:{" "}
        {stats ? (
          <span className="animate-glow">{stats.visits ?? 0}</span>
        ) : (
          <Skeleton className="w-6 h-3 bg-cyan-800/30 inline-block" />
        )}
      </span>
    </div>
  </div>
);

const toolsConfig = [
  {
    category: "PDF",
    tools: [
      { name: "Merge", key: "merge", description: "Combine PDFs instantly" },
      { name: "Split", key: "split", soon: true, description: "Extract/separate pages" },
    ],
  },
  {
    category: "Image",
    tools: [
      { name: "Image Tools", key: "image", soon: true, description: "Image convert/crop coming soon" },
    ],
  },
  {
    category: "Converter",
    tools: [
      { name: "File Convert", key: "convert", soon: true, description: "Convert files safely, privacy-first" },
    ],
  },
];

const Index = () => {
  const { stats, loading } = useLiveStats();
  const overall = stats?.overall || { visits: 0, downloads: 0 };
  const pdfStats = stats?.tools?.PDF || {};
  // * Futuristic scroll background
  return (
    <div className="min-h-screen w-full bg-gradient-to-tr from-black via-[#20232b] to-black flex flex-col items-center justify-start dark font-sans overflow-x-hidden selection:bg-cyan-300/40">
      <header className="w-full max-w-2xl flex flex-col items-center mx-auto pt-10 md:pt-14 pb-4">
        <LogoFuturistic />
        <TaglineFuturistic />
      </header>

      <section className="w-full max-w-lg mx-auto px-2">
        {/* Stats: floats/overlays hero with a glass tile */}
        <div className="w-full flex gap-4 justify-center mt-10 mb-6">
          <StatTile label="Visits" value={overall.visits} loading={loading} highlight />
          <StatTile label="Downloads" value={overall.downloads} loading={loading} />
        </div>
      </section>

      <section className="w-full max-w-xl mx-auto px-2 py-4 md:py-8">
        <div className="text-cyan-200 text-xs font-mono mb-3 uppercase tracking-wide">Tools</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {toolsConfig.map(category =>
            category.tools.map(t => (
              <ToolCard
                key={t.key}
                name={t.name}
                description={t.description}
                soon={!!t.soon}
                stats={
                  category.category === "PDF"
                    ? pdfStats[t.key]
                    : undefined
                }
              />
            ))
          )}
        </div>
      </section>

      <footer className="w-full pt-8 pb-4 flex flex-col items-center">
        <div className="text-xs text-cyan-800/80 drop-shadow-cyan tracking-widest uppercase font-semibold font-mono opacity-70 animate-fade-in text-center">
          © {new Date().getFullYear()} DOCENCLAVE &mdash; The Future Is Yours
        </div>
      </footer>
    </div>
  );
};

export default Index;
