import { useState } from "react";
import { Link } from "react-router-dom";
import { useLiveStats } from "../hooks/useLiveStats";

interface ToolInfo {
  status: "available" | "coming_soon";
  path?: string;
}

interface ToolStatus {
  [category: string]: {
    [tool: string]: ToolInfo;
  }
}

const defaultToolStatus: ToolStatus = {
  PDF: {
    merge: { status: "available", path: "/tools/pdf/merge" },
    compress: { status: "coming_soon" }
  },
  Image: {
    convert: { status: "coming_soon" }
  }
};

const ToolItem = ({
  title,
  toolInfo,
  visits,
}: {
  title: string;
  toolInfo: ToolInfo;
  visits?: number;
}) => (
  <li className="flex items-center justify-between gap-4 my-2 py-2 px-4 rounded-xl group border border-white/10 transition-all bg-gradient-to-tr from-black/40 to-white/5 hover:shadow-lg hover:scale-105 hover:bg-white/8 backdrop-blur animate-fade-in">
    {toolInfo.status === "available" && toolInfo.path ? (
      <Link to={toolInfo.path} className="w-full flex justify-between items-center">
        <span className="font-mono text-white text-base sm:text-lg tracking-widest uppercase drop-shadow">
          {title}
        </span>
        <span className="flex items-center gap-2">
          {typeof visits === "number" && (
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-white/10 text-white uppercase font-bold tracking-widest border border-white/20">
              {visits.toLocaleString()} views
            </span>
          )}
          <span className="text-xs font-mono px-2 py-0.5 rounded bg-green-500/20 text-green-400 uppercase font-bold tracking-widest border border-green-500/20">
            Available
          </span>
        </span>
      </Link>
    ) : (
      <>
        <span className="font-mono text-white/50 text-base sm:text-lg tracking-widest uppercase drop-shadow">
          {title}
        </span>
        <span className="text-xs font-mono px-2 py-0.5 rounded bg-white/5 text-white/50 uppercase font-bold tracking-widest border border-white/10 blur-[0.5px]">
          Coming Soon
        </span>
      </>
    )}
  </li>
);

export const ToolAccordion = () => {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const { stats } = useLiveStats();

  const toggleCategory = (category: string) => {
    setExpanded(prev => ({ ...prev, [category]: !prev[category] }));
  };

  return (
    <section className="w-full max-w-3xl mx-auto animate-fade-in">
      <h2 className="text-2xl font-mono font-extrabold uppercase mb-6 text-center text-white tracking-[0.2em] letterspace-[2px] select-none drop-shadow-xl">
        <span className="inline-block px-5 py-2 rounded-full bg-gradient-to-tr from-white/5 via-white/0 to-black/30 border border-white/15 shadow-inner backdrop-blur-sm">
          TOOLS
        </span>
      </h2>
      <div className="flex flex-col gap-6 w-full">
        {Object.entries(defaultToolStatus).map(([category, tools]) => (
          <div
            key={category}
            className="border border-white/15 rounded-2xl bg-gradient-to-bl from-black/25 via-white/5 to-black/65 overflow-hidden shadow-glass backdrop-blur-sm animate-scale-in group"
          >
            <button
              onClick={() => toggleCategory(category)}
              className="w-full px-8 py-6 text-xl sm:text-2xl font-mono font-black tracking-wider uppercase text-white border-b border-white/10 bg-gradient-to-r from-black/30 via-white/0 to-black/40 hover:bg-white/10 transition-all animate-fade-in drop-shadow text-left"
            >
              {category}
            </button>
            <div
              className={`bg-gradient-to-bl from-black/60 to-white/10 pb-4 px-2 sm:px-6 transition-all duration-500 ease-in-out overflow-hidden ${
                expanded[category] ? "max-h-screen opacity-100" : "max-h-0 opacity-0"
              }`}
              aria-hidden={!expanded[category]}
            >
              <ul>
                {Object.entries(tools).map(([tool, toolInfo]) => {
                  const visits = stats?.tools?.[category]?.[tool]?.visits;
                  return (
                    <ToolItem
                      key={tool}
                      title={tool[0].toUpperCase() + tool.slice(1)}
                      toolInfo={toolInfo}
                      visits={visits}
                    />
                  );
                })}
              </ul>
            </div>
          </div>
        ))}
      </div>
      <div className="text-center text-xs text-gray-400 font-mono mt-8">
        * All tools run locally in your browser
      </div>
    </section>
  );
};
