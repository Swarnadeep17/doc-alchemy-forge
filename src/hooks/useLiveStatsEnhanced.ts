// src/hooks/useLiveStatsEnhanced.ts

import { useEffect, useState, useMemo } from "react";
import { db } from "../lib/firebase";
import { ref, onValue } from "firebase/database";

// --- Type Definitions ---

interface ToolStats {
  visits?: number;
  downloads?: number;
}

interface TimeBasedStats {
  [key: string]: ToolStats; // e.g., "2024-07-31": { visits: 10, downloads: 5 }
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
  // We can add toolsTimeBased later if needed for deep dives
}

// --- The Hook ---

export function useLiveStatsEnhanced() {
  const [stats, setStats] = useState<EnhancedStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const statsRef = ref(db, "/stats");
    const unsubscribe = onValue(statsRef, (snapshot) => {
      const data = snapshot.val();
      setStats(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  /**
   * Memoized computation of tool-specific stats, flattened into an array.
   * This prevents recalculation on every render.
   */
  const toolStats = useMemo(() => {
    if (!stats?.tools) return [];
    
    return Object.entries(stats.tools).flatMap(([category, tools]) =>
      Object.entries(tools).map(([tool, stat]) => ({
        name: tool,
        category,
        visits: stat.visits || 0,
        downloads: stat.downloads || 0,
        conversionRate: stat.visits ? ((stat.downloads || 0) / stat.visits) * 100 : 0,
      }))
    );
  }, [stats]);

  /**
   * Memoized computation of category totals.
   */
  const categoryTotals = useMemo(() => {
    if (!toolStats.length) return [];

    const totals: Record<string, { visits: number; downloads: number }> = {};
    toolStats.forEach(({ category, visits, downloads }) => {
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
  }, [toolStats]);
  
  /**
   * Memoized computation of overall time-based data.
   */
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


  return {
    stats,
    loading,
    toolStats,
    categoryTotals,
    timeBasedData,
  };
}