// src/components/admin/ToolDetailTab.tsx

import React, { useState, useMemo, useEffect } from "react";
import { useLiveStatsEnhanced } from "@/hooks/useLiveStatsEnhanced";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";
import { Loader, BarChart2, Zap, HelpCircle } from "lucide-react";

const COLORS = ["#06b6d4", "#8b5cf6", "#22c55e", "#f59e0b", "#ef4444", "#3b82f6"];

const ToolDetailTab = () => {
  const { stats, loading, toolStats } = useLiveStatsEnhanced();
  const [selectedTool, setSelectedTool] = useState<string | null>(null);

  const categories = useMemo(() => {
    return [...new Set(toolStats.map(t => t.category))];
  }, [toolStats]);

  const toolsInCategory = useMemo(() => {
    if (!stats?.tools) return [];
    const category = toolStats.find(t => t.name === selectedTool)?.category;
    if (!category) return [];
    return Object.keys(stats.tools[category] || {});
  }, [selectedTool, stats?.tools, toolStats]);
  
  // Set default tool on load
  useEffect(() => {
    if (toolStats.length > 0 && !selectedTool) {
      setSelectedTool(toolStats[0].name);
    }
  }, [toolStats, selectedTool]);

  const toolData = useMemo(() => {
    if (!selectedTool) return null;
    return stats?.tools?.[toolStats.find(t=>t.name === selectedTool)?.category]?.[selectedTool];
  }, [selectedTool, stats?.tools, toolStats]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-cyan-400">
        <Loader className="h-8 w-8 animate-spin" />
        <p className="mt-2 text-lg">Loading Tool Data...</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-white">Tool Deep Dive</h2>
        <p className="text-sm text-gray-400 mt-1">Select a tool to analyze usage of its specific features and options.</p>
      </div>

      <Card className="bg-gray-950/50 border border-white/10">
        <CardContent className="py-6 flex flex-col md:flex-row gap-4 items-center">
          <div className="w-full md:w-1/2">
            <label className="text-sm font-medium text-gray-300 mb-2 block">Select Category</label>
            <Select 
              value={toolStats.find(t => t.name === selectedTool)?.category || ""}
              onValueChange={(category) => {
                const firstToolInCategory = Object.keys(stats.tools[category])[0];
                setSelectedTool(firstToolInCategory);
              }}
            >
              <SelectTrigger className="bg-gray-900 border-white/20"><SelectValue placeholder="Select a category..." /></SelectTrigger>
              <SelectContent>
                {categories.map(cat => <SelectItem key={cat} value={cat} className="capitalize">{cat}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="w-full md:w-1/2">
            <label className="text-sm font-medium text-gray-300 mb-2 block">Select Tool</label>
            <Select value={selectedTool || ""} onValueChange={setSelectedTool}>
              <SelectTrigger className="bg-gray-900 border-white/20"><SelectValue placeholder="Select a tool..." /></SelectTrigger>
              <SelectContent>
                {toolsInCategory.map(tool => <SelectItem key={tool} value={tool} className="capitalize">{tool}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
      
      {selectedTool && toolData?.options ? (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          {Object.entries(toolData.options).map(([optionName, optionValues], index) => (
            <Card key={optionName} className="bg-gray-950/50 border border-white/10">
              <CardHeader><CardTitle className="text-lg text-white capitalize">{optionName.replace(/([A-Z])/g, ' $1')}</CardTitle></CardHeader>
              <CardContent>
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={Object.entries(optionValues).map(([name, value]) => ({ name, count: value }))} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#2563eb" opacity={0.1} />
                      <XAxis type="number" stroke="#9ca3af" fontSize={12} />
                      <YAxis type="category" dataKey="name" stroke="#9ca3af" fontSize={12} width={80} />
                      <Tooltip contentStyle={{ backgroundColor: "#111827", border: "1px solid #374151" }} labelStyle={{ color: "#e5e7eb" }}/>
                      <Bar dataKey="count" name="Times Used" fill={COLORS[index % COLORS.length]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : selectedTool ? (
        <Card className="bg-gray-950/50 border border-white/10">
          <CardContent className="py-16 flex flex-col items-center justify-center text-center">
            <HelpCircle className="w-10 h-10 text-gray-500 mb-3"/>
            <h3 className="text-lg font-semibold text-white">No Feature Data Available</h3>
            <p className="text-sm text-gray-400 mt-1">This tool does not have specific features being tracked, or none have been used yet.</p>
          </CardContent>
        </Card>
      ) : null}

    </div>
  );
};

export default ToolDetailTab;