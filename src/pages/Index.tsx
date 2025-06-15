import { useLiveStats } from "@/hooks/useLiveStats";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

const Logo = () => (
  <div className="flex items-center justify-center my-4">
    {/* Minimalist monochrome D-shaped logo */}
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
      <rect x="4" y="4" width="40" height="40" rx="12" fill="#fff" stroke="#111" strokeWidth="2"/>
      <path
        d="M19 13h6a9 9 0 0 1 0 18h-6V13z"
        fill="#111"
      />
    </svg>
    <span className="ml-3 font-extrabold tracking-tight text-xl text-black">docenclave</span>
  </div>
);

const Tagline = () => (
  <div className="text-sm font-medium text-gray-700 opacity-80">
    Privacy, No files stored, Complete client side.
  </div>
);

const ToolCard = ({
  name,
  stats,
  soon = false,
  onClick,
}: {
  name: string;
  stats?: { visits?: number };
  soon?: boolean;
  onClick?: () => void;
}) => (
  <div
    className={`relative bg-white border border-gray-200 rounded-lg p-4 min-w-[120px] flex flex-col transition hover:shadow-lg cursor-${soon ? "not-allowed" : "pointer"} select-none group items-start`}
    onClick={soon ? undefined : onClick}
    aria-disabled={soon}
  >
    <span className="font-semibold text-lg text-black">{name}</span>
    <div className="flex items-center mt-1">
      <span className="text-xs text-gray-500">
        Visits this month:&nbsp;
        {stats ? (
          <span className="font-mono text-[13px] text-black group-hover:text-[#222] transition-all" style={{ textShadow: '0 0 8px #28282844' }}>
            {stats.visits ?? 0}
          </span>
        ) : (
          <Skeleton className="w-8 h-3 inline-block" />
        )}
      </span>
    </div>
    {soon && (
      <span className="absolute top-2 right-2 px-2 py-0.5 rounded text-xs bg-gray-900 text-gray-100">
        soon
      </span>
    )}
  </div>
);

const toolsConfig = [
  {
    category: "PDF",
    tools: [
      { name: "Merge", key: "merge", soon: false },
      { name: "Split", key: "split", soon: true },
    ],
  },
  {
    category: "Image",
    tools: [],
  },
  {
    category: "Converter",
    tools: [],
  },
];

const Index = () => {
  const { stats, loading } = useLiveStats();

  // Organize stats for easy access
  const overall = stats?.overall || { visits: 0, downloads: 0 };
  const toolStats = stats?.tools?.PDF || {};

  return (
    <main className="min-h-screen flex flex-col items-center justify-start px-2 bg-gradient-to-br from-white via-gray-100 to-gray-50">
      <header className="w-full flex flex-col items-center pt-8 pb-2">
        <Logo />
        <Tagline />
        <div className="mt-4 grid grid-cols-2 gap-4 sm:gap-7 text-center">
          <div className="px-4 py-2 rounded bg-black text-white text-xs flex flex-col items-center min-w-[100px]">
            <span className="opacity-60">Visits this month</span>
            <span className="font-mono text-2xl" style={{ textShadow: '0 0 14px #11166188' }}>
              {loading ? <Skeleton className="w-16 h-6 mx-auto" /> : overall.visits}
            </span>
          </div>
          <div className="px-4 py-2 rounded bg-black text-white text-xs flex flex-col items-center min-w-[100px]">
            <span className="opacity-60">Downloads this month</span>
            <span className="font-mono text-2xl" style={{ textShadow: '0 0 14px #11166188' }}>
              {loading ? <Skeleton className="w-16 h-6 mx-auto" /> : overall.downloads}
            </span>
          </div>
        </div>
      </header>

      <section className="w-full max-w-2xl mt-8">
        <div className="text-xs text-gray-600 font-medium mb-2 pl-1">
          Tools
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {/* PDF tools */}
          <div className="col-span-2 row-span-1">
            <div className="bg-white border border-gray-300 rounded-xl p-3 flex flex-col items-start mb-2">
              <span className="font-semibold text-base text-black mb-2">PDF</span>
              <div className="flex gap-2">
                {toolsConfig[0].tools.map(t => (
                  <ToolCard
                    key={t.key}
                    name={t.name}
                    soon={t.soon}
                    stats={toolStats[t.key]}
                  />
                ))}
              </div>
            </div>
          </div>
          {/* Other categories */}
          {toolsConfig.slice(1).map(c =>
            <ToolCard key={c.category} name={c.category} soon stats={undefined} />
          )}
        </div>
      </section>
    </main>
  );
};

export default Index;
