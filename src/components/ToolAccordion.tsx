
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { Skeleton } from "@/components/ui/skeleton";
import { useEffect, useState } from "react";
import { useLiveStats } from "@/hooks/useLiveStats";

// Types for tool status
type ToolStatus = { [category: string]: { [tool: string]: "available" | "coming_soon" } };

// Futuristic, monochrome stat item
const StatDisplay = ({count}: {count: number}) => (
  <div className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-white/5 border border-white/15 font-mono font-bold text-base text-white shadow-inner backdrop-blur select-none animate-fade-in">
    <span>
      {count.toLocaleString()}
    </span>
    <span className="ml-1 text-xs font-medium text-gray-300/70 tracking-tight">USES</span>
  </div>
);

// Tool item with modern monochrome feel
const ToolItem = ({
  title, status, toolKey, stat,
}: { title: string; status: "available" | "coming_soon"; toolKey: string; stat?: number }) => (
  <li className="flex items-center justify-between gap-4 my-2 py-2 px-4 rounded-xl group border border-white/10 transition-all bg-gradient-to-tr from-black/40 to-white/5 hover:shadow-lg hover:scale-105 hover:bg-white/8 backdrop-blur animate-fade-in">
    <span className="font-mono text-white text-base sm:text-lg tracking-widest uppercase drop-shadow">
      {title}
    </span>
    <span>
      {status === "available" ? (
        stat === undefined
          ? <Skeleton className="w-12 h-6 bg-gray-700 rounded-md mx-2" />
          : <StatDisplay count={stat}/>
      ) : (
        <span className="text-xs font-mono px-2 py-0.5 rounded bg-white/5 text-white/50 uppercase font-bold tracking-widest border border-white/10 blur-[0.5px]">
          Coming Soon
        </span>
      )}
    </span>
  </li>
);

export const ToolAccordion = () => {
  const [toolStatus, setToolStatus] = useState<ToolStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const { stats } = useLiveStats();

  // Debug
  console.log("ToolAccordion: liveStats tools", stats?.tools);

  useEffect(() => {
    fetch("/tools/status.json")
      .then(r => r.json())
      .then(setToolStatus)
      .finally(() => setLoading(false));
  }, []);

  // Modern glassmorphism/arctic border + futuristic title for each category
  return (
    <section className="w-full max-w-3xl mx-auto animate-fade-in">
      <h2 className="text-2xl font-mono font-extrabold uppercase mb-6 text-center text-white tracking-[0.2em] letterspace-[2px] select-none drop-shadow-xl">
        <span className="inline-block px-5 py-2 rounded-full bg-gradient-to-tr from-white/5 via-white/0 to-black/30 border border-white/15 shadow-inner backdrop-blur-sm">
          TOOLS
        </span>
      </h2>
      <Accordion type="multiple" className="flex flex-col gap-6 w-full">
        {loading || !toolStatus ? (
          <Skeleton className="w-full h-40 bg-white/10 rounded-2xl" />
        ) : (
          Object.entries(toolStatus).map(([category, tools]) => (
            <AccordionItem
              value={category}
              key={category}
              className="border border-white/15 rounded-2xl bg-gradient-to-bl from-black/25 via-white/5 to-black/65 overflow-hidden shadow-glass backdrop-blur-sm animate-scale-in group"
            >
              <AccordionTrigger className="px-8 py-6 text-xl sm:text-2xl font-mono font-black tracking-wider uppercase text-white border-b border-white/10 bg-gradient-to-r from-black/30 via-white/0 to-black/40 group-hover:bg-white/10 transition-all animate-fade-in drop-shadow">
                {category}
              </AccordionTrigger>
              <AccordionContent className="bg-gradient-to-bl from-black/60 to-white/10 pb-4 px-2 sm:px-6">
                <ul>
                  {Object.entries(tools).map(([tool, status]) => {
                    let statValue = undefined;
                    if (status === "available") {
                      statValue = stats?.tools?.[category]?.[tool]?.visits;
                      // Log each tool's stat for debug visibility
                      console.log(`Tool stat for ${category}/${tool}:`, statValue);
                    }
                    return (
                      <ToolItem
                        key={tool}
                        title={tool[0].toUpperCase() + tool.slice(1)}
                        status={status}
                        toolKey={tool}
                        stat={status === "available"
                          ? (typeof statValue === "number" ? statValue : undefined)
                          : undefined}
                      />
                    );
                  })}
                </ul>
              </AccordionContent>
            </AccordionItem>
          ))
        )}
      </Accordion>
      <div className="text-center text-xs text-gray-400 font-mono mt-8">
        * All tools run locally in your browser. Realtime stats update live.
      </div>
    </section>
  );
};
