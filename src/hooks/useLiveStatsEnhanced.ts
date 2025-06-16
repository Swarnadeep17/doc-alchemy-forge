import { useEffect, useState } from "react";
import { db } from "../lib/firebase";
import { ref, onValue } from "firebase/database";

interface TimeBasedStats {
  [key: string]: {
    visits: number;
    downloads: number;
  };
}

interface EnhancedStats {
  overall: {
    visits: number;
    downloads: number;
  };
  tools: {
    [category: string]: {
      [tool: string]: {
        visits: number;
        downloads: number;
      };
    };
  };
  timeBased: {
    daily: TimeBasedStats;
    weekly: TimeBasedStats;
    monthly: TimeBasedStats;
  };
  toolsTimeBased: {
    [category: string]: {
      [tool: string]: {
        daily: TimeBasedStats;
        weekly: TimeBasedStats;
        monthly: TimeBasedStats;
      };
    };
  };
}

export function useLiveStatsEnhanced() {
  const [stats, setStats] = useState<EnhancedStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [dateRange, setDateRange] = useState<{ start: Date; end: Date }>(() => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 30); // Default to last 30 days
    return { start, end };
  });

  useEffect(() => {
    const statsRef = ref(db, "/stats");
    const unsubscribe = onValue(statsRef, (snapshot) => {
      const data = snapshot.val();
      setStats(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Helper function to get time-based stats for the selected period
  const getTimeBasedData = () => {
    if (!stats?.timeBased) return [];

    const periodData = stats.timeBased[timeRange];
    const entries = Object.entries(periodData || {})
      .filter(([key]) => {
        const date = new Date(key);
        return date >= dateRange.start && date <= dateRange.end;
      })
      .sort(([a], [b]) => a.localeCompare(b));

    return entries.map(([date, data]) => ({
      date,
      ...data,
    }));
  };

  // Helper function to get tool-specific time-based stats
  const getToolTimeBasedData = (category: string, tool: string) => {
    if (!stats?.toolsTimeBased?.[category]?.[tool]) return [];

    const periodData = stats.toolsTimeBased[category][tool][timeRange];
    const entries = Object.entries(periodData || {})
      .filter(([key]) => {
        const date = new Date(key);
        return date >= dateRange.start && date <= dateRange.end;
      })
      .sort(([a], [b]) => a.localeCompare(b));

    return entries.map(([date, data]) => ({
      date,
      ...data,
    }));
  };

  // Helper function to get category totals
  const getCategoryTotals = () => {
    if (!stats?.tools) return [];

    return Object.entries(stats.tools).map(([category, tools]) => {
      const totals = Object.values(tools).reduce(
        (acc, tool) => ({
          visits: acc.visits + (tool.visits || 0),
          downloads: acc.downloads + (tool.downloads || 0),
        }),
        { visits: 0, downloads: 0 }
      );

      return {
        category,
        ...totals,
      };
    });
  };

  return {
    stats,
    loading,
    timeRange,
    setTimeRange,
    dateRange,
    setDateRange,
    getTimeBasedData,
    getToolTimeBasedData,
    getCategoryTotals,
  };
}
