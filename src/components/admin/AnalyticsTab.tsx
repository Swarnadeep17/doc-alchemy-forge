// src/components/admin/AnalyticsTab.tsx

import React, { useState, useMemo, useEffect } from "react";
import { useLiveStatsEnhanced } from "@/hooks/useLiveStatsEnhanced";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader, TrendingUp, Download, CheckCircle, BarChart2 } from "lucide-react";
import { cn } from "@/lib/utils";

const AnalyticsTab = () => {
  const { stats, loading, toolStats, categoryTotals } = useLiveStatsEnhanced();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

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
        <p className="text-sm text-white/60 mt-1">A high-level summary of key performance indicators across the entire application.</p>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4 mt-4">
          <KPICard icon={TrendingUp} title="Total Visits" value={overall.visits?.toLocaleString() || '0'} color="cyan" />
          <KPICard icon={Download} title="Total Downloads" value={overall.downloads?.toLocaleString() || '0'} color="violet" />
          <KPICard icon={CheckCircle} title="Conversion Rate" value={`${overallConversionRate.toFixed(1)}%`} color="green" />
          <KPICard icon={BarChart2} title="Most Popular Tool" value={topToolByVisits.name} description={`${topToolByVisits.visits.toLocaleString()} visits`} color="amber" />
        </div>
      </div>

      {/* Interactive Tables Section */}
      <div>
        <h2 className="text-2xl font-semibold text-white">Engagement Analytics</h2>
        <p className="text-sm text-white/60 mt-1">Analyze user engagement by tool category. Click a category on the left to see a detailed breakdown.</p>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 mt-4">
          <Card className="bg-gray-900/70 lg:col-span-1">
            <CardHeader><CardTitle className="text-lg text-white">Tool Categories</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="border-white/10">
                    <TableHead className="text-white/80">Category</TableHead>
                    <TableHead className="text-right text-white/80">Visits</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categoryTotals.map((category) => (
                    <TableRow
                      key={category.name}
                      onClick={() => setSelectedCategory(category.name)}
                      className={cn(
                        "cursor-pointer transition-colors hover:bg-cyan-900/30 border-white/10",
                        selectedCategory === category.name && "bg-cyan-900/50"
                      )}
                    >
                      <TableCell className="font-semibold text-white capitalize">{category.name}</TableCell>
                      <TableCell className="text-right font-mono text-cyan-300">{category.visits.toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          <Card className="bg-gray-900/70 lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg text-white">
                Tool Details: <span className="capitalize text-cyan-400">{selectedCategory || '...'}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="border-white/10">
                    <TableHead className="text-white/80">Tool</TableHead>
                    <TableHead className="text-right text-white/80">Visits</TableHead>
                    <TableHead className="text-right text-white/80">Downloads</TableHead>
                    <TableHead className="text-right text-white/80">Conversion</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {toolsForSelectedCategory.length > 0 ? (
                    toolsForSelectedCategory.map((tool) => (
                      <TableRow key={tool.name} className="hover:bg-gray-800/50 border-white/10">
                        <TableCell className="font-medium capitalize text-white">{tool.name}</TableCell>
                        <TableCell className="text-right font-mono text-cyan-300">{tool.visits.toLocaleString()}</TableCell>
                        <TableCell className="text-right font-mono text-violet-300">{tool.downloads.toLocaleString()}</TableCell>
                        <TableCell className="text-right font-mono text-green-400">{tool.conversionRate.toFixed(1)}%</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow className="border-none">
                      <TableCell colSpan={4} className="h-24 text-center text-white/50">
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
  cyan: "from-cyan-900/30 to-black/30 border-cyan-500/30",
  violet: "from-violet-900/30 to-black/30 border-violet-500/30",
  green: "from-green-900/30 to-black/30 border-green-500/30",
  amber: "from-amber-900/30 to-black/30 border-amber-500/30",
};
const kpiIconBgVariants = {
    cyan: "bg-cyan-900/50",
    violet: "bg-violet-900/50",
    green: "bg-green-900/50",
    amber: "bg-amber-900/50",
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
  <Card className={cn("bg-gradient-to-br border", kpiCardColorVariants[color])}>
    <CardContent className="p-4 flex flex-col justify-between h-full">
      <div className="flex justify-between items-center mb-2">
        <p className={cn("text-sm font-semibold", kpiTextColorVariants[color])}>{title}</p>
        <div className={cn("p-2 rounded-lg", kpiIconBgVariants[color])}>
          <Icon className={cn("w-5 h-5", kpiTextColorVariants[color])} />
        </div>
      </div>
      <div>
        <h3 className="text-3xl font-bold text-white capitalize">{value}</h3>
        {description && <p className="text-xs text-white/70 mt-1 capitalize">{description}</p>}
      </div>
    </CardContent>
  </Card>
);

export default AnalyticsTab;