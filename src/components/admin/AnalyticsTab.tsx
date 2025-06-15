
import React from "react";
import { useLiveStats } from "@/hooks/useLiveStats";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

const AnalyticsTab = () => {
  const { stats, loading } = useLiveStats();

  if (loading) return <div className="text-center text-cyan-400 py-8">Loading stats...</div>;
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

  // For chart, just use total visits/downloads by tool
  const chartData = toolRows.map(row => ({
    name: row.tool,
    visits: row.visits,
    downloads: row.downloads,
  }));

  return (
    <div>
      <div className="flex flex-col md:flex-row gap-6 mb-8">
        <Card className="flex-1 bg-gray-900 border-cyan-400/20 shadow">
          <CardHeader>
            <CardTitle className="text-white text-lg">Total Visits</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl text-cyan-400 font-mono">{overall.visits.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card className="flex-1 bg-gray-900 border-cyan-400/20 shadow">
          <CardHeader>
            <CardTitle className="text-white text-lg">Total Downloads</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl text-cyan-400 font-mono">{overall.downloads.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>
      <div className="bg-white/5 rounded-xl p-5 shadow mb-10">
        <div className="text-white text-base font-mono mb-3">Visits & Downloads by Tool</div>
        <ResponsiveContainer width="100%" height={340}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="visits" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.7}/>
                <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.1}/>
              </linearGradient>
              <linearGradient id="downloads" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.7}/>
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0.1}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#3b82f6" opacity={0.08} />
            <XAxis dataKey="name" stroke="#fff" fontSize={13} />
            <YAxis stroke="#fff" fontSize={13} />
            <Tooltip contentStyle={{ background: "#020617", color: "#fff", border: "1px solid #06b6d4" }} />
            <Area type="monotone" dataKey="visits" stroke="#06b6d4" fillOpacity={1} fill="url(#visits)" />
            <Area type="monotone" dataKey="downloads" stroke="#6366f1" fillOpacity={1} fill="url(#downloads)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm bg-gray-900/60 border border-cyan-200/10 rounded">
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
              <tr key={`${row.category}.${row.tool}`} className="border-b border-white/5">
                <td className="py-2 px-3 text-white/90">{row.category}</td>
                <td className="py-2 px-3 text-white/90">{row.tool}</td>
                <td className="py-2 px-3 text-right font-mono text-white">{row.visits}</td>
                <td className="py-2 px-3 text-right font-mono text-white">{row.downloads}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AnalyticsTab;
