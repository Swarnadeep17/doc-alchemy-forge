// src/components/admin/AnalyticsTab.tsx

import React, { useState, useMemo } from "react";
import { useLiveStatsEnhanced } from "@/hooks/useLiveStatsEnhanced";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, BarChart, Bar, PieChart, Pie, Cell, LineChart, Line } from "recharts";
import { Loader, TrendingUp, Download, Users, BarChart2, CheckCircle } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const COLORS = {
  primary: "#06b6d4",    // cyan-500
  secondary: "#a78bfa",  // violet-400
  tertiary: "#22c55e",   // green-500
  quaternary: "#f59e0b", // amber-500
};

const AnalyticsTab = () => {
  const {
    stats,
    loading,
    toolStats,
    categoryTotals,
    timeBasedData
  } = useLiveStatsEnhanced();
  
  const [timeRange, setTimeRange] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [pieChartMetric, setPieChartMetric] = useState<'visits' | 'downloads'>('visits');

  const overall = useMemo(() => stats?.overall || { visits: 0, downloads: 0 }, [stats]);

  const topToolByVisits = useMemo(() => {
    if (!toolStats.length) return { name: '-', visits: 0 };
    return [...toolStats].sort((a,b) => b.visits - a.visits)[0];
  }, [toolStats]);
  
  const overallConversionRate = useMemo(() => {
      if (!overall.visits) return 0;
      return ((overall.downloads || 0) / overall.visits) * 100;
  }, [overall]);

  if (loading) {
    return (
      <div className="text-center text-cyan-400 py-8 flex flex-col items-center animate-fade-in">
        <Loader className="animate-spin h-8 w-8 mb-2" />
        <p className="text-lg">Loading Dashboard...</p>
      </div>
    );
  }

  if (!stats) {
    return <div className="text-center text-red-400 py-8">No stats available.</div>;
  }

  return (
    <div className="animate-fade-in space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-cyan-500/20 to-cyan-600/20 border-cyan-500/30">
          <CardContent className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-cyan-400">Total Visits</p>
                <h3 className="text-3xl font-bold text-white mt-1">{overall.visits?.toLocaleString() || 0}</h3>
              </div>
              <div className="p-2 bg-cyan-500/10 rounded-lg"><TrendingUp className="w-5 h-5 text-cyan-400" /></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-violet-500/20 to-violet-600/20 border-violet-500/30">
          <CardContent className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-violet-400">Total Downloads</p>
                <h3 className="text-3xl font-bold text-white mt-1">{overall.downloads?.toLocaleString() || 0}</h3>
              </div>
              <div className="p-2 bg-violet-500/10 rounded-lg"><Download className="w-5 h-5 text-violet-400" /></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-500/20 to-green-600/20 border-green-500/30">
          <CardContent className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-green-400">Conversion Rate</p>
                <h3 className="text-3xl font-bold text-white mt-1">{overallConversionRate.toFixed(1)}%</h3>
              </div>
              <div className="p-2 bg-green-500/10 rounded-lg"><CheckCircle className="w-5 h-5 text-green-400" /></div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-amber-500/20 to-amber-600/20 border-amber-500/30">
          <CardContent className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-amber-400">Most Popular Tool</p>
                <h3 className="text-2xl font-bold text-white mt-1 capitalize">{topToolByVisits.name}</h3>
                <p className="text-xs text-amber-300/70">{topToolByVisits.visits.toLocaleString()} visits</p>
              </div>
              <div className="p-2 bg-amber-500/10 rounded-lg"><BarChart2 className="w-5 h-5 text-amber-400" /></div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Chart: Engagement Over Time */}
      <Card className="bg-gray-900/70">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg text-white">Engagement Over Time</CardTitle>
          <div className="flex gap-1">
            {['daily', 'weekly', 'monthly'].map((range) => (
              <Button
                key={range}
                variant={timeRange === range ? "default" : "ghost"}
                size="sm"
                onClick={() => setTimeRange(range as any)}
                className={timeRange === range ? "bg-cyan-600 hover:bg-cyan-700" : "text-white/70 hover:bg-white/10"}
              >
                {range.charAt(0).toUpperCase() + range.slice(1)}
              </Button>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={timeBasedData[timeRange]}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2563eb" opacity={0.1} />
                <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} tickFormatter={(val) => new Date(val).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} />
                <YAxis stroke="#9ca3af" fontSize={12} />
                <Tooltip contentStyle={{ backgroundColor: "#111827", border: "1px solid #374151" }} labelStyle={{ color: "#e5e7eb" }}/>
                <Legend />
                <Line type="monotone" dataKey="visits" stroke={COLORS.primary} name="Visits" dot={false} strokeWidth={2} />
                <Line type="monotone" dataKey="downloads" stroke={COLORS.secondary} name="Downloads" dot={false} strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
      
      {/* Secondary Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <Card className="lg:col-span-3 bg-gray-900/70">
          <CardHeader><CardTitle className="text-lg text-white">Tool Performance (Top 10 by Visits)</CardTitle></CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={[...toolStats].sort((a,b) => b.visits - a.visits).slice(0, 10)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2563eb" opacity={0.1} />
                  <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} angle={-30} textAnchor="end" height={50} />
                  <YAxis stroke="#9ca3af" fontSize={12} />
                  <Tooltip contentStyle={{ backgroundColor: "#111827", border: "1px solid #374151" }} labelStyle={{ color: "#e5e7eb" }}/>
                  <Legend />
                  <Bar dataKey="visits" fill={COLORS.primary} name="Visits" />
                  <Bar dataKey="downloads" fill={COLORS.secondary} name="Downloads" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        <Card className="lg:col-span-2 bg-gray-900/70">
          <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg text-white">Category Distribution</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setPieChartMetric(pieChartMetric === 'visits' ? 'downloads' : 'visits')} className="text-cyan-400 hover:bg-white/10">
                Show {pieChartMetric === 'visits' ? 'Downloads' : 'Visits'}
              </Button>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={categoryTotals} dataKey={pieChartMetric} nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                      {categoryTotals.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={Object.values(COLORS)[index % Object.values(COLORS).length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: "#111827", border: "1px solid #374151" }}/>
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Table */}
      <Card className="bg-gray-900/70">
        <CardHeader><CardTitle className="text-lg text-white">Detailed Tool Statistics</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tool</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Visits</TableHead>
                <TableHead className="text-right">Downloads</TableHead>
                <TableHead className="text-right">Conversion Rate</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {toolStats.map((tool) => (
                <TableRow key={tool.name}>
                  <TableCell className="font-medium capitalize">{tool.name}</TableCell>
                  <TableCell className="capitalize">{tool.category}</TableCell>
                  <TableCell className="text-right">{tool.visits.toLocaleString()}</TableCell>
                  <TableCell className="text-right">{tool.downloads.toLocaleString()}</TableCell>
                  <TableCell className="text-right text-green-400">{tool.conversionRate.toFixed(1)}%</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default AnalyticsTab;