
import React from "react";
import { useLiveStats } from "@/hooks/useLiveStats";
import { Card, CardContent } from "@/components/ui/card";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";
import { Loader } from "lucide-react";

const statCardTheme = [
  { name: "visits", title: "Total Visits", color: "from-cyan-400 to-blue-500", text: "text-cyan-400", icon: "arrow-up" },
  { name: "downloads", title: "Total Downloads", color: "from-blue-500 to-purple-500", text: "text-purple-400", icon: "download" },
];

const AnalyticsTab = () => {
  const { stats, loading } = useLiveStats();

  if (loading) {
    return (
      <div className="text-center text-cyan-400 py-8 flex flex-col items-center animate-fade-in">
        <Loader className="animate-spin mb-2" />Loading analytics...
      </div>
    );
  }
  if (!stats) {
    return <div className="text-center text-red-400 py-8">No stats available.</div>;
  }

  const overall = stats.overall || { visits: 0, downloads: 0 };

  // Flatten per-tool stats into an array
  const toolRows: Array<{ category: string; tool: string; visits: number; downloads: number }> = [];
  Object.entries(stats.tools || {}).forEach(([category, tools]) => {
    Object.entries(tools || {}).forEach(([tool, stat]) => {
      toolRows.push({
        category,
        tool,
        visits: stat.visits || 0,
        downloads: stat.downloads || 0,
      });
    });
  });

  // For chart, show top 10 tools by visits
  const sortedTools = [...toolRows].sort((a, b) => b.visits - a.visits).slice(0, 10);
  const chartData = sortedTools.map(row => ({
    name: row.tool,
    visits: row.visits,
    downloads: row.downloads,
    category: row.category
  }));

  // Calculate stats for metric panels
  const topTool = chartData[0] ? chartData[0].name : "-";
  const maxVisits = chartData[0] ? chartData[0].visits : 0;
  const maxDownloads = chartData.reduce((max, d) => Math.max(max, d.downloads), 0);

  return (
    <div className="animate-fade-in space-y-10">
      {/* Metric Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <Card className="bg-gradient-to-br from-cyan-400 to-blue-500 p-0 border-none shadow-xl">
          <CardContent className="p-8 flex flex-col justify-between gap-2">
            <div className="text-lg text-white/80 font-bold uppercase mb-2">Total Visits</div>
            <div className="text-5xl font-extrabold font-mono text-cyan-100 drop-shadow">{overall.visits.toLocaleString()}</div>
            <div className="text-white/90 opacity-80 text-xs mt-2">Cumulative visits across all tools</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-blue-500 to-purple-600 p-0 border-none shadow-xl">
          <CardContent className="p-8 flex flex-col justify-between gap-2">
            <div className="text-lg text-white/80 font-bold uppercase mb-2">Total Downloads</div>
            <div className="text-5xl font-extrabold font-mono text-purple-100 drop-shadow">{overall.downloads.toLocaleString()}</div>
            <div className="text-white/90 opacity-80 text-xs mt-2">Downloads triggered by users</div>
          </CardContent>
        </Card>
      </div>

      {/* Highlight */}
      <div className="flex flex-col md:flex-row items-center bg-cyan-950/60 rounded-lg px-6 py-4 gap-4 shadow">
        <span className="font-semibold text-cyan-300 text-lg">Most Visited Tool: </span>
        <span className="text-white font-mono text-lg">{topTool}</span>
        <span className="text-xs text-cyan-200/80 ml-4">({maxVisits} visits)</span>
        <span className="hidden md:block mx-4 text-white/30">|</span>
        <span className="font-semibold text-purple-300 text-lg">Maximum Downloads: </span>
        <span className="text-white font-mono text-lg">{maxDownloads}</span>
      </div>

      {/* Engagement Chart Section */}
      <div className="bg-black/80 rounded-xl p-6 shadow-2xl">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-5">
          <div className="font-mono text-white text-xl font-bold tracking-wide">Tool Engagement (Top 10)</div>
          <div className="flex space-x-4">
            <span className="flex items-center gap-2 text-cyan-400 text-sm">
              <span className="inline-block w-4 h-2 rounded bg-cyan-400/70" /> Visits
            </span>
            <span className="flex items-center gap-2 text-purple-400 text-sm">
              <span className="inline-block w-4 h-2 rounded bg-purple-400/70" /> Downloads
            </span>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={330}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="visits" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.85}/>
                <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.13}/>
              </linearGradient>
              <linearGradient id="downloads" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#a78bfa" stopOpacity={0.92}/>
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0.12}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#2563eb" opacity={0.11} />
            <XAxis dataKey="name" stroke="#fff" fontSize={13} />
            <YAxis stroke="#fff" fontSize={13} />
            <Tooltip
              contentStyle={{ background: "#0f172a", color: "#fff", border: "1px solid #38bdf8" }}
              labelStyle={{ color: "#38bdf8", fontFamily: "monospace" }}
              formatter={(value, name) => {
                let label: string;
                if (typeof name === "string") {
                  label = name.charAt(0).toUpperCase() + name.slice(1);
                } else {
                  label = String(name);
                }
                return [value, label];
              }}
            />
            <Legend
              verticalAlign="top"
              height={32}
              content={() => (
                <div className="flex gap-8 pl-8 pt-2">
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-2 bg-cyan-400 rounded" /> Visits
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-2 bg-purple-400 rounded" /> Downloads
                  </span>
                </div>
              )}
            />
            <Area type="monotone" dataKey="visits" stroke="#06b6d4" fillOpacity={1} fill="url(#visits)" />
            <Area type="monotone" dataKey="downloads" stroke="#a78bfa" fillOpacity={1} fill="url(#downloads)" />
          </AreaChart>
        </ResponsiveContainer>
        <div className="text-white/60 text-xs mt-4">
          Engaging area chart shows top 10 tools by user visits and downloads.<br/>
          Hover for details. Use table below for full breakdown.
        </div>
      </div>

      {/* Per Tool/Category Table */}
      <div className="overflow-x-auto mt-3">
        <table className="min-w-full text-xs bg-gray-900/60 border border-cyan-200/10 rounded shadow-lg">
          <thead>
            <tr>
              <th className="py-2 px-3 text-left font-mono text-cyan-400">Category</th>
              <th className="py-2 px-3 text-left font-mono text-cyan-400">Tool</th>
              <th className="py-2 px-3 text-right font-mono text-cyan-400">Visits</th>
              <th className="py-2 px-3 text-right font-mono text-cyan-400">Downloads</th>
            </tr>
          </thead>
          <tbody>
            {toolRows.map((row) => (
              <tr key={`${row.category}.${row.tool}`} className="border-b border-white/10 hover:bg-cyan-950/20 transition">
                <td className="py-2 px-3 text-white/80">{row.category}</td>
                <td className="py-2 px-3 text-white/90 font-semibold">{row.tool}</td>
                <td className="py-2 px-3 text-right font-mono text-cyan-300">{row.visits}</td>
                <td className="py-2 px-3 text-right font-mono text-purple-400">{row.downloads}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="text-right text-xs text-white/30 my-3">Table: All tool stats</div>
      </div>
    </div>
  );
};

export default AnalyticsTab;
