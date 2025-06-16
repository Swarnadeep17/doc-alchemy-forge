import React, { useState } from "react";
import { useLiveStatsEnhanced } from "../../hooks/useLiveStatsEnhanced";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, BarChart, Bar, PieChart, Pie, Cell, LineChart, Line } from "recharts";
import { Loader, TrendingUp, Download, Users, Clock } from "lucide-react";

const COLORS = {
  primary: "#06b6d4",    // cyan-500
  secondary: "#a78bfa",  // violet-400
  tertiary: "#22c55e",   // green-500
  quaternary: "#f59e0b", // amber-500
};

const AnalyticsTabNew = () => {
  const {
    stats,
    loading,
    timeRange,
    setTimeRange,
    dateRange,
    setDateRange,
    getTimeBasedData,
    getToolTimeBasedData,
    getCategoryTotals
  } = useLiveStatsEnhanced();

  const [selectedMetric, setSelectedMetric] = useState<"visits" | "downloads">("visits");

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
  const timeBasedData = getTimeBasedData();
  const categoryTotals = getCategoryTotals();

  // Prepare tool stats
  const toolStats = Object.entries(stats.tools || {}).flatMap(([category, tools]) =>
    Object.entries(tools).map(([tool, stat]) => ({
      name: tool,
      category,
      visits: stat.visits || 0,
      downloads: stat.downloads || 0,
    }))
  ).sort((a, b) => b[selectedMetric] - a[selectedMetric]);

  return (
    <div className="animate-fade-in space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-cyan-500/20 to-cyan-600/20 border-cyan-500/30">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-cyan-400">Total Visits</p>
                <h3 className="text-2xl font-bold text-white mt-2">{overall.visits.toLocaleString()}</h3>
              </div>
              <div className="p-2 bg-cyan-500/10 rounded-lg">
                <TrendingUp className="w-6 h-6 text-cyan-400" />
              </div>
            </div>
            <p className="text-xs text-cyan-300/70 mt-2">Across all tools</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-violet-500/20 to-violet-600/20 border-violet-500/30">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-violet-400">Total Downloads</p>
                <h3 className="text-2xl font-bold text-white mt-2">{overall.downloads.toLocaleString()}</h3>
              </div>
              <div className="p-2 bg-violet-500/10 rounded-lg">
                <Download className="w-6 h-6 text-violet-400" />
              </div>
            </div>
            <p className="text-xs text-violet-300/70 mt-2">User downloads</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/20 to-green-600/20 border-green-500/30">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-green-400">Active Tools</p>
                <h3 className="text-2xl font-bold text-white mt-2">{toolStats.length}</h3>
              </div>
              <div className="p-2 bg-green-500/10 rounded-lg">
                <Users className="w-6 h-6 text-green-400" />
              </div>
            </div>
            <p className="text-xs text-green-300/70 mt-2">Tools with activity</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-500/20 to-amber-600/20 border-amber-500/30">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-amber-400">Categories</p>
                <h3 className="text-2xl font-bold text-white mt-2">{categoryTotals.length}</h3>
              </div>
              <div className="p-2 bg-amber-500/10 rounded-lg">
                <Clock className="w-6 h-6 text-amber-400" />
              </div>
            </div>
            <p className="text-xs text-amber-300/70 mt-2">Active categories</p>
          </CardContent>
        </Card>
      </div>

      {/* Time Range Selector */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-white">Analytics Overview</h2>
        <div className="flex gap-2">
          {['daily', 'weekly', 'monthly'].map((range) => (
            <Button
              key={range}
              variant={timeRange === range ? "default" : "outline"}
              size="sm"
              onClick={() => setTimeRange(range as any)}
              className={timeRange === range ? "bg-cyan-600 hover:bg-cyan-700" : ""}
            >
              {range.charAt(0).toUpperCase() + range.slice(1)}
            </Button>
          ))}
        </div>
      </div>

      {/* Time-based Chart */}
      <Card className="bg-gray-900/70">
        <CardHeader>
          <CardTitle className="text-lg text-white">Engagement Over Time</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={timeBasedData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2563eb" opacity={0.1} />
                <XAxis
                  dataKey="date"
                  stroke="#fff"
                  fontSize={12}
                  tickFormatter={(value) => new Date(value).toLocaleDateString()}
                />
                <YAxis stroke="#fff" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1f2937",
                    border: "1px solid #374151",
                    borderRadius: "4px",
                  }}
                  labelFormatter={(value) => new Date(value).toLocaleDateString()}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="visits"
                  stroke={COLORS.primary}
                  name="Visits"
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="downloads"
                  stroke={COLORS.secondary}
                  name="Downloads"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Tool Performance and Category Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tool Performance Chart */}
        <Card className="lg:col-span-2 bg-gray-900/70">
          <CardHeader>
            <CardTitle className="text-lg text-white">Tool Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={toolStats.slice(0, 10)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2563eb" opacity={0.1} />
                  <XAxis dataKey="name" stroke="#fff" fontSize={12} />
                  <YAxis stroke="#fff" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1f2937",
                      border: "1px solid #374151",
                      borderRadius: "4px",
                    }}
                  />
                  <Legend />
                  <Bar dataKey="visits" fill={COLORS.primary} name="Visits" />
                  <Bar dataKey="downloads" fill={COLORS.secondary} name="Downloads" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Category Distribution */}
        <Card className="bg-gray-900/70">
          <CardHeader>
            <CardTitle className="text-lg text-white">Category Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryTotals}
                    dataKey={selectedMetric}
                    nameKey="category"
                    cx="50%"
                    cy="50%"
                    outerRadius={120}
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {categoryTotals.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={Object.values(COLORS)[index % Object.values(COLORS).length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1f2937",
                      border: "1px solid #374151",
                      borderRadius: "4px",
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedMetric(selectedMetric === "visits" ? "downloads" : "visits")}
                className="text-cyan-400 border-cyan-400/30"
              >
                Show {selectedMetric === "visits" ? "Downloads" : "Visits"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Stats Table */}
      <Card className="bg-gray-900/70">
        <CardHeader>
          <CardTitle className="text-lg text-white">Detailed Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="text-left py-3 px-4 text-cyan-400">Tool</th>
                  <th className="text-left py-3 px-4 text-cyan-400">Category</th>
                  <th className="text-right py-3 px-4 text-cyan-400">Visits</th>
                  <th className="text-right py-3 px-4 text-cyan-400">Downloads</th>
                  <th className="text-right py-3 px-4 text-cyan-400">Conversion Rate</th>
                </tr>
              </thead>
              <tbody>
                {toolStats.map((tool) => (
                  <tr key={tool.name} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                    <td className="py-2 px-4 text-white">{tool.name}</td>
                    <td className="py-2 px-4 text-gray-300">{tool.category}</td>
                    <td className="py-2 px-4 text-right text-cyan-400">{tool.visits.toLocaleString()}</td>
                    <td className="py-2 px-4 text-right text-violet-400">{tool.downloads.toLocaleString()}</td>
                    <td className="py-2 px-4 text-right text-green-400">
                      {tool.visits > 0
                        ? `${((tool.downloads / tool.visits) * 100).toFixed(1)}%`
                        : "0%"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AnalyticsTabNew;
