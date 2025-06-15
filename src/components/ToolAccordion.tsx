
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { Skeleton } from "@/components/ui/skeleton";
import { useEffect, useState } from "react";
import { useLiveStats } from "@/hooks/useLiveStats";

// Fetch tool status JSON ("available", "coming_soon") for each tool under each type.
type ToolStatus = { [category: string]: { [tool: string]: "available" | "coming_soon" } };

const ToolItem = ({
  title, status, toolKey, stat,
}: { title: string; status: "available" | "coming_soon"; toolKey: string; stat?: number }) => (
  <li className="flex items-center justify-between my-1 py-1 px-2 rounded group hover:bg-white/5 transition-colors">
    <span className="font-mono text-white text-base sm:text-lg">{title}</span>
    <span>
      {status === "available" ? (
        stat === undefined
          ? <Skeleton className="w-8 h-4 bg-gray-800 inline-block mx-2" />
          : <span className="text-xs font-medium text-white/60 bg-black/40 rounded px-2 py-0.5 tracking-wide">
              {stat} uses
            </span>
      ) : (
        <span className="text-xs px-2 py-0.5 rounded bg-white/10 text-white/40 uppercase font-bold">Coming Soon</span>
      )}
    </span>
  </li>
);

export const ToolAccordion = () => {
  const [toolStatus, setToolStatus] = useState<ToolStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const { stats } = useLiveStats();

  // Fetch /tools/status.json statically
  useEffect(() => {
    fetch("/tools/status.json")
      .then(r => r.json())
      .then(setToolStatus)
      .finally(() => setLoading(false));
  }, []);

  // Group: category(title) -> each subtool with status
  return (
    <section className="w-full max-w-2xl mx-auto mt-6 mb-8">
      <h2 className="text-xl font-bold text-white/90 font-mono mb-3 animate-fade-in tracking-wide">Tools</h2>
      <Accordion type="multiple" className="flex flex-col gap-2 w-full animate-fade-in">
        {loading || !toolStatus ? (
          <Skeleton className="w-full h-28 bg-gray-900/80 rounded-xl" />
        ) : (
          Object.entries(toolStatus).map(([category, tools]) => (
            <AccordionItem value={category} key={category} className="border border-white/10 rounded-xl bg-black/80 overflow-hidden shadow">
              <AccordionTrigger className="text-lg sm:text-xl text-white px-4 py-3 font-mono tracking-widest font-bold animate-fade-in">
                {category}
              </AccordionTrigger>
              <AccordionContent className="bg-gradient-to-bl from-gray-900/60 to-black/80 px-4 pb-2">
                <ul>
                  {Object.entries(tools).map(([tool, status]) => (
                    <ToolItem
                      key={tool}
                      title={tool[0].toUpperCase() + tool.slice(1)}
                      status={status}
                      toolKey={tool}
                      stat={status === "available"
                        ? stats?.tools?.[category]?.[tool]?.monthly_uses ?? 0 : undefined}
                    />
                  ))}
                </ul>
              </AccordionContent>
            </AccordionItem>
          ))
        )}
      </Accordion>
    </section>
  );
};
