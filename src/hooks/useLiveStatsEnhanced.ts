// src/hooks/useLiveStatsEnhanced.ts

import { useEffect, useState, useMemo } from "react";
import { db } from "../lib/firebase";
import { ref, onValue } from "firebase/database";

// --- Type Definitions ---

interface ToolStats {
  visits?: number;
  downloads?: number;
  options?: Record<string, Record<string, number>>;
}

interface TimeBasedStats {
  [key: string]: ToolStats;
}

interface EnhancedStats {
  overall: ToolStats;
  tools: {
    [category: string]: {
      [tool: string]: ToolStats;
    };
  };
  timeBased: {
    daily: TimeBasedStats;
    weekly: TimeBasedStats;
    monthly: TimeBasedStats;
  };
}

type ToolStatusMap = Record<string, Record<string, "available" | "coming_soon">>;

// --- The Hook ---

export function useLiveStatsEnhanced() {
  const [stats, setStats] = useState<EnhancedStats | null>(null);
  const [toolStatus, setToolStatus] = useState<ToolStatusMap | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch both stats from Firebase and status from JSON
  useEffect(() => {
    const fetchAllData = async () => {
      setLoading(true);
      try {
        // Fetch status.json
        const statusResponse = await fetch("/tools/status.json");
        const statusData = await statusResponse.json();
        setToolStatus(statusData);

        // Set up Firebase listener for stats
        const statsRef = ref(db, "/stats");
        const unsubscribe = onValue(statsRef, (snapshot) => {
          const statsData = snapshot.val();
          setStats(statsData);
          setLoading(false); // Only stop loading once both are fetched
        });
        
        return () => unsubscribe();
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
        setLoading(false);
      }
    };
    fetchAllData();
  }, []);

  const availableToolStats = useMemo(() => {
    if (!stats?.tools || !toolStatus) return [];

    const availableTools: any[] = [];
    Object.entries(toolStatus).forEach(([category, tools]) => {
      Object.entries(tools).forEach(([tool, status]) => {
        if (status === 'available') {
          const toolData = stats.tools[category]?.[tool];
          if (toolData) {
            availableTools.push({
              name: tool,
              category,
              visits: toolData.visits || 0,
              downloads: toolData.downloads || 0,
              conversionRate: toolData.visits ? ((toolData.downloads || 0) / toolData.visits) * 100 : 0,
            });
          }
        }
      });
    });
    return availableTools;
  }, [stats, toolStatus]);

  const availableCategoryTotals = useMemo(() => {
    if (!availableToolStats.length) return [];

    const totals: Record<string, { visits: number; downloads: number }> = {};
    availableToolStats.forEach(({ category, visits, downloads }) => {
      if (!totals[category]) {
        totals[category] = { visits: 0, downloads: 0 };
      }
      totals[category].visits += visits;
      totals[category].downloads += downloads;
    });

    return Object.entries(totals).map(([name, data]) => ({
      name,
      ...data,
    }));
  }, [availableToolStats]);

  const timeBasedData = useMemo(() => {
    if (!stats?.timeBased) return { daily: [], weekly: [], monthly: [] };
    const formatPeriod = (periodData: TimeBasedStats | undefined) => {
      if (!periodData) return [];
      return Object.entries(periodData)
        .map(([date, data]) => ({ date, ...data }))
        .sort((a, b) => a.date.localeCompare(b.date));
    };
    return {
      daily: formatPeriod(stats.timeBased.daily),
      weekly: formatPeriod(stats.timeBased.weekly),
      monthly: formatPeriod(stats.timeBased.monthly),
    };
  }, [stats]);
  
  const getToolOptions = (category: string, tool: string) => {
      return stats?.tools?.[category]?.[tool]?.options || null;
  }

  return {
    stats,
    loading,
    toolStatus,
    toolStats: availableToolStats, // Renamed for clarity
    categoryTotals: availableCategoryTotals, // Renamed for clarity
    timeBasedData,
    getToolOptions,
  };
}