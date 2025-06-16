// src/components/admin/ToolDetailTab.tsx

import React, { useState, useMemo, useEffect } from "react";
import { useLiveStatsEnhanced } from "@/hooks/useLiveStatsEnhanced";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";
import { Loader, BarChart2, Zap, HelpCircle } from "lucide-react";

const COLORS = ["#06b6d4", "#8b5cf6", "#22c55e", "#f59e0b", "#ef4444", "#3b82f6"];

const ToolDetailTab = () => {
  const { loading, toolStats, getToolOptions, toolStatus } = useLiveStatsEnhanced();
  const [selectedTool, setSelectedTool] = useState<string | null>(null);

  const availableCategories = useMemo(() => {
    if (!toolStatus) return [];
    return Object.keys(toolStatus);
  }, [toolStatus]);
  
  const toolsInCategory = useMemo(() => {
    if (!toolStatus || !selectedTool) return [];
    const category = toolStats.find(t => t.name === selectedTool)?.category;
    if (!category) return [];
    return Object.entries(toolStatus[category])
        .filter(([, status]) => status === 'available')
        .map(([toolName]) => toolName);
  }, [selectedTool, toolStatus, toolStats]);

  // Set default tool on load from available tools
  useEffect(() => {
    if (toolStats.length > 0 && !selectedTool) {
      setSelectedTool(toolStats[0].name);
    }
  }, [toolStats, selectedTool]);

  const toolOptionsData = useMemo(() => {
    if (!selectedTool) return null;
    const category = toolStats.find(t => t.name === selectedTool)?.category;
    if (!category) return null;
    return getToolOptions(category, selectedTool);
  }, [selectedTool, toolStats, getToolOptions]);

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
                  if(!toolStatus) return;
                  const firstToolInCategory = Object.keys(toolStatus[category]).find(t => toolStatus[category][t] === 'available');
                  setSelectedTool(firstToolInCategory || null);
              }}
            >
              <SelectTrigger className="w-full bg-gray-900 border-gray-700 text-gray-200 hover:border-cyan-500/80 focus:ring-2 focus:ring-cyan-500/50 transition-colors">
                <SelectValue placeholder="Select a category..." />
              </SelectTrigger>
              <SelectContent className="bg-gray-950 border-gray-700 text-gray-200">
                {availableCategories.map(cat => <SelectItem key={cat} value={cat} className="capitalize focus:bg-cyan-800/50">{cat}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="w-full md:w-1/2">
            <label className="text-sm font-medium text-gray-300 mb-2 block">Select Tool</label>
            <Select value={selectedTool || ""} onValueChange={setSelectedTool}>
              <SelectTrigger className="w-full bg-gray-900 border-gray-700 text-gray-200 hover:border-cyan-500/80 focus:ring-2 focus:ring-cyan-500/50 transition-colors">
                <SelectValue placeholder="Select a tool..." />
              </SelectTrigger>
              <SelectContent className="bg-gray-950 border-gray-700 text-gray-200">
                {toolsInCategory.map(tool => <SelectItem key={tool} value={tool} className="capitalize focus:bg-cyan-800/50">{tool}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
      
      {selectedTool && toolOptionsData ? (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          {Object.entries(toolOptionsData).map(([optionName, optionValues], index) => (
            <Card key={optionName} className="bg-gray-950/50 border border-white/10">
              <CardHeader><CardTitle className="text-lg text-white capitalize">{optionName.replace(/([A-Z])/g, ' $1')}</CardTitle></CardHeader>
              <CardContent>
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={Object.entries(optionValues).map(([name, value]) => ({ name, count: value as number }))} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#2563eb" opacity={0.1} />
                      <XAxis type="number" stroke="#9ca3af" fontSize={12} />
                      <YAxis type="category" dataKey="name" stroke="#9ca3af" fontSize={12} width={80} tick={{ fill: '#d1d5db' }} />
                      <Tooltip cursor={{fill: 'rgba(100, 116, 139, 0.1)'}} contentStyle={{ backgroundColor: "#111827", border: "1px solid #374151" }} labelStyle={{ color: "#e5e7eb" }}/>
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