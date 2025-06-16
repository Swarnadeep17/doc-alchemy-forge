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
    if (categoryTotals.length > 0) {
      setSelectedCategory(categoryTotals[0].name);
    }
  }, [categoryTotals]);

  const overall = useMemo(() => stats?.overall || { visits: 0, downloads: 0 }, [stats]);

  const topToolByVisits = useMemo(() => {
    if (!toolStats.length) return { name: '-', visits: 0 };
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
    <div className="animate-fade-in space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KPICard icon={TrendingUp} title="Total Visits" value={overall.visits?.toLocaleString() || '0'} color="cyan" />
        <KPICard icon={Download} title="Total Downloads" value={overall.downloads?.toLocaleString() || '0'} color="violet" />
        <KPICard icon={CheckCircle} title="Conversion Rate" value={`${overallConversionRate.toFixed(1)}%`} color="green" />
        <KPICard icon={BarChart2} title="Most Popular Tool" value={topToolByVisits.name} description={`${topToolByVisits.visits.toLocaleString()} visits`} color="amber" />
      </div>

      {/* Interactive Tables */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Category Performance Table (Master) */}
        <Card className="bg-gray-900/70 lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg text-white">Performance by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-white/60 mb-3 -mt-2">Click a category to see tool details.</p>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Visits</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categoryTotals.map((category) => (
                  <TableRow
                    key={category.name}
                    onClick={() => setSelectedCategory(category.name)}
                    className={cn(
                      "cursor-pointer transition-colors hover:bg-cyan-900/30",
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

        {/* Tool Performance Table (Detail) */}
        <Card className="bg-gray-900/70 lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg text-white">
              Tool Details: <span className="capitalize text-cyan-400">{selectedCategory || '...'}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tool</TableHead>
                  <TableHead className="text-right">Visits</TableHead>
                  <TableHead className="text-right">Downloads</TableHead>
                  <TableHead className="text-right">Conversion</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {toolsForSelectedCategory.length > 0 ? (
                  toolsForSelectedCategory.map((tool) => (
                    <TableRow key={tool.name} className="hover:bg-gray-800/50">
                      <TableCell className="font-medium capitalize text-white">{tool.name}</TableCell>
                      <TableCell className="text-right font-mono text-cyan-300">{tool.visits.toLocaleString()}</TableCell>
                      <TableCell className="text-right font-mono text-violet-300">{tool.downloads.toLocaleString()}</TableCell>
                      <TableCell className="text-right font-mono text-green-400">{tool.conversionRate.toFixed(1)}%</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
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
  );
};

// --- Helper Component for KPI Cards ---
const kpiCardColorVariants = {
  cyan: "from-cyan-500/20 to-cyan-600/20 border-cyan-500/30",
  violet: "from-violet-500/20 to-violet-600/20 border-violet-500/30",
  green: "from-green-500/20 to-green-600/20 border-green-500/30",
  amber: "from-amber-500/20 to-amber-600/20 border-amber-500/30",
};
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
  <Card className={cn("bg-gradient-to-br", kpiCardColorVariants[color])}>
    <CardContent className="p-4">
      <div className="flex justify-between items-start">
        <div>
          <p className={cn("text-sm font-medium", kpiTextColorVariants[color])}>{title}</p>
          <h3 className="text-3xl font-bold text-white mt-1 capitalize">{value}</h3>
          {description && <p className="text-xs text-white/60 mt-1">{description}</p>}
        </div>
        <div className={cn("p-2 rounded-lg", kpiCardColorVariants[color].replace('/20', '/10'))}>
          <Icon className={cn("w-5 h-5", kpiTextColorVariants[color])} />
        </div>
      </div>
    </CardContent>
  </Card>
);

export default AnalyticsTab;