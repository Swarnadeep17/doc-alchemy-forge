// src/components/admin/AnalyticsTab.tsx

import React, { useState, useMemo, useEffect } from "react";
import { useLiveStatsEnhanced } from "@/hooks/useLiveStatsEnhanced";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader, TrendingUp, Download, CheckCircle, BarChart2 } from "lucide-react";
import { cn } from "@/lib/utils";

// --- Main Analytics Component ---
const AnalyticsTab = () => {
  const { stats, loading, toolStats, categoryTotals } = useLiveStatsEnhanced();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Set the first category as default once data is loaded
  useEffect(() => {
    if (categoryTotals.length > 0 && !selectedCategory) {
      setSelectedCategory(categoryTotals[0].name);
    }
  }, [categoryTotals, selectedCategory]);

  const overall = useMemo(() => stats?.overall || { visits: 0, downloads: 0 }, [stats]);

  const topToolByVisits = useMemo(() => {
    if (!toolStats.length) return { name: 'N/A', visits: 0 };
    return [...toolStats].sort((a, b) => b.visits - a.visits)[0];
  }, [toolStats]);

  const overallConversionRate = useMemo(() => {
    if (!overall.visits) return 0;
    return ((overall.downloads || 0) / (overall.visits || 1)) * 100;
  }, [overall]);
  
  const toolsForSelectedCategory = useMemo(() => {
    if (!selectedCategory) return [];
    return toolStats.filter(tool => tool.category === selectedCategory);
  }, [selectedCategory, toolStats]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-cyan-400">
        <Loader className="h-8 w-8 animate-spin" />
        <p className="mt-2 text-lg">Loading Dashboard Data...</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-10">
      {/* KPI Section */}
      <div>
        <h2 className="text-2xl font-semibold text-white">Platform Overview</h2>
        <p className="text-sm text-gray-400 mt-1">A high-level summary of key performance indicators across the entire application.</p>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4 mt-4">
          <KPICard icon={TrendingUp} title="Total Visits" value={overall.visits?.toLocaleString() || '0'} color="cyan" />
          <KPICard icon={Download} title="Total Downloads" value={overall.downloads?.toLocaleString() || '0'} color="violet" />
          <KPICard icon={CheckCircle} title="Conversion Rate" value={`${overallConversionRate.toFixed(1)}%`} color="green" />
          <KPICard icon={BarChart2} title="Most Popular Tool" value={topToolByVisits.name} description={`${topToolByVisits.visits.toLocaleString()} visits`} color="amber" />
        </div>
      </div>

      {/* Interactive Tables Section */}
      <div>
        <h2 className="text-2xl font-semibold text-white">Engagement Analytics</h2>
        <p className="text-sm text-gray-400 mt-1">Analyze user engagement by tool category. Click a category on the left to see a detailed breakdown.</p>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 mt-4">
          <Card className="bg-gray-950/50 border border-white/10 lg:col-span-1">
            <CardHeader><CardTitle className="text-lg text-white">Tool Categories</CardTitle></CardHeader>
            <CardContent className="px-2 pb-2 md:px-4 md:pb-4">
              <Table>
                <TableHeader>
                  <TableRow className="border-b-white/10">
                    <TableHead className="text-gray-300 uppercase text-xs tracking-wider">Category</TableHead>
                    <TableHead className="text-right text-gray-300 uppercase text-xs tracking-wider">Visits</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categoryTotals.map((category) => (
                    <TableRow
                      key={category.name}
                      onClick={() => setSelectedCategory(category.name)}
                      className={cn(
                        "cursor-pointer transition-colors hover:bg-white/10 border-white/10",
                        selectedCategory === category.name && "bg-cyan-600/20 border-l-2 border-l-cyan-400"
                      )}
                    >
                      <TableCell className="font-semibold text-gray-200 capitalize">{category.name}</TableCell>
                      <TableCell className="text-right font-mono text-cyan-300">{category.visits.toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          <Card className="bg-gray-950/50 border border-white/10 lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg text-white">
                Tool Details: <span className="capitalize text-cyan-400">{selectedCategory || '...'}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="px-2 pb-2 md:px-4 md:pb-4">
              <Table>
                <TableHeader>
                  <TableRow className="border-b-white/10">
                    <TableHead className="text-gray-300 uppercase text-xs tracking-wider">Tool</TableHead>
                    <TableHead className="text-right text-gray-300 uppercase text-xs tracking-wider">Visits</TableHead>
                    <TableHead className="text-right text-gray-300 uppercase text-xs tracking-wider">Downloads</TableHead>
                    <TableHead className="text-right text-gray-300 uppercase text-xs tracking-wider">Conversion</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {toolsForSelectedCategory.length > 0 ? (
                    toolsForSelectedCategory.map((tool) => (
                      <TableRow key={tool.name} className="hover:bg-white/5 border-white/10">
                        <TableCell className="font-medium capitalize text-gray-200">{tool.name}</TableCell>
                        <TableCell className="text-right font-mono text-cyan-300">{tool.visits.toLocaleString()}</TableCell>
                        <TableCell className="text-right font-mono text-violet-300">{tool.downloads.toLocaleString()}</TableCell>
                        <TableCell className="text-right font-mono text-green-400">{tool.conversionRate.toFixed(1)}%</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow className="border-none hover:bg-transparent">
                      <TableCell colSpan={4} className="h-24 text-center text-gray-500">
                        {selectedCategory ? 'No tools in this category.' : 'Select a category to view tools.'}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

// --- Helper Component for KPI Cards ---
const kpiCardColorVariants = {
  cyan: "border-cyan-500/40 hover:border-cyan-500/80",
  violet: "border-violet-500/40 hover:border-violet-500/80",
  green: "border-green-500/40 hover:border-green-500/80",
  amber: "border-amber-500/40 hover:border-amber-500/80",
};
const kpiIconBgVariants = {
    cyan: "bg-cyan-900/70",
    violet: "bg-violet-900/70",
    green: "bg-green-900/70",
    amber: "bg-amber-900/70",
}
const kpiTextColorVariants = {
  cyan: "text-cyan-400",
  violet: "text-violet-400",
  green: "text-green-400",
  amber: "text-amber-400",
};

interface KPICardProps {
  icon: React.ElementType;
  title: string;
  value: string;
  description?: string;
  color: keyof typeof kpiCardColorVariants;
}

const KPICard = ({ icon: Icon, title, value, description, color }: KPICardProps) => (
  <Card className={cn("bg-gray-950/50 border transition-colors", kpiCardColorVariants[color])}>
    <CardContent className="p-4 flex flex-col justify-between h-full">
      <div className="flex justify-between items-start mb-2">
        <p className={cn("text-sm font-semibold", kpiTextColorVariants[color])}>{title}</p>
        <div className={cn("p-2 rounded-lg", kpiIconBgVariants[color])}>
          <Icon className={cn("w-5 h-5", kpiTextColorVariants[color])} />
        </div>
      </div>
      <div>
        <h3 className="text-3xl font-bold text-white capitalize">{value}</h3>
        {description && <p className="text-xs text-gray-400 mt-1 capitalize">{description}</p>}
      </div>
    </CardContent>
  </Card>
);

export default AnalyticsTab;