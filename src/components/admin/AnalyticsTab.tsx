
import React from "react";
import { useLiveStats } from "@/hooks/useLiveStats";
import { Card, CardContent } from "@/components/ui/card";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { Loader } from "lucide-react";

const statCardTheme = [
  { name: "visits", title: "Total Visits", color: "from-cyan-400 to-blue-500", text: "text-cyan-400" },
  { name: "downloads", title: "Total Downloads", color: "from-blue-500 to-purple-500", text: "text-purple-400" },
];

const AnalyticsTab = () => {
  const { stats, loading } = useLiveStats();

  if (loading) return <div className="text-center text-cyan-400 py-8 flex flex-col items-center animate-fade-in"><Loader className="animate-spin mb-2" />Loading analytics...</div>;
  if (!stats)
    return <div className="text-center text-red-400 py-8">No stats available.</div>;

  const overall = stats.overall || { visits: 0, downloads: 0 };

  // Flatten per-tool stats into an array
  const toolRows: Array<{ category: string; tool: string; visits: number; downloads: number }> = [];
  Object.entries(stats.tools || {}).forEach(([category, tools]) => {
    Object.entries(tools || {}).forEach(([tool, stat]) => {
      toolRows.push({ category, tool, visits: stat.visits || 0, downloads: stat.downloads || 0 });
    });
  });

  // For chart, show visit and download last 10 tool stats as bar chart
  const chartData = toolRows.slice(-10).map(row => ({
    name: row.tool,
    visits: row.visits,
    downloads: row.downloads,
  }));

  return (
    <div className="animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {statCardTheme.map(stat => (
          <Card key={stat.name} className={`bg-gradient-to-br ${stat.color} p-0 border-none shadow-lg`}>
            <CardContent className="p-8 flex flex-col items-start gap-2">
              <div className="text-xl text-white font-mono mb-2">{stat.title}</div>
              <div className={`text-5xl font-extrabold font-mono ${stat.text}`}>{overall[stat.name].toLocaleString()}</div>
              <div className="text-white/80 text-sm mt-2">{stat.title === "Total Visits"
                ? "Number of page visits across all tools and users"
                : "Number of downloads triggered by users"}</div>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="bg-black/75 rounded-xl p-6 shadow mb-10">
        <div className="text-white text-lg font-mono mb-5 font-bold">Tool Engagement</div>
        <ResponsiveContainer width="100%" height={360}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="visits" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.9}/>
                <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.1}/>
              </linearGradient>
              <linearGradient id="downloads" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#a78bfa" stopOpacity={0.95}/>
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0.1}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="4 2" stroke="#2563eb" opacity={0.09} />
            <XAxis dataKey="name" stroke="#fff" fontSize={13} />
            <YAxis stroke="#fff" fontSize={13} />
            <Tooltip
              contentStyle={{ background: "#18181b", color: "#fff", border: "1px solid #06b6d4" }}
              labelStyle={{ color: "#a5f3fc" }}
              formatter={(value, name) => {
                // Ensure name is always rendered as a string
                let label: string;
                if (typeof name === "string") {
                  label = name.charAt(0).toUpperCase() + name.slice(1);
                } else {
                  label = String(name);
                }
                return [value, label];
              }}
            />
            <Area type="monotone" dataKey="visits" stroke="#06b6d4" fillOpacity={1} fill="url(#visits)" />
            <Area type="monotone" dataKey="downloads" stroke="#a78bfa" fillOpacity={1} fill="url(#downloads)" />
          </AreaChart>
        </ResponsiveContainer>
        <div className="text-white/70 text-xs mt-4">
          Graph above shows per tool engagement in the last 10 tools (visits and downloads).
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm bg-gray-900/60 border border-cyan-200/10 rounded shadow">
          <thead>
            <tr>
              <th className="py-2 px-3 text-left font-mono text-cyan-400">Category</th>
              <th className="py-2 px-3 text-left font-mono text-cyan-400">Tool</th>
              <th className="py-2 px-3 text-right font-mono text-cyan-400">Visits</th>
              <th className="py-2 px-3 text-right font-mono text-cyan-400">Downloads</th>
            </tr>
          </thead>
          <tbody>
            {toolRows.map((row, i) => (
              <tr key={`${row.category}.${row.tool}`} className="border-b border-white/5 hover:bg-cyan-950/20 transition">
                <td className="py-2 px-3 text-white/90">{row.category}</td>
                <td className="py-2 px-3 text-white/90">{row.tool}</td>
                <td className="py-2 px-3 text-right font-mono text-cyan-300">{row.visits}</td>
                <td className="py-2 px-3 text-right font-mono text-purple-400">{row.downloads}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="text-right text-xs text-white/40 my-3">Table: All tool stats</div>
      </div>
    </div>
  );
};

export default AnalyticsTab;
