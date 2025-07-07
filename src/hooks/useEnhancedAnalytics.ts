// src/hooks/useEnhancedAnalytics.ts

import { useEffect, useState, useMemo } from "react";
import { db } from "@/lib/firebase";
import {
  ref,
  onValue,
  query,
  orderByChild,
  limitToLast,
  startAt,
  endAt,
} from "firebase/database";

// ========== TYPE DEFINITIONS ==========

export interface AnalyticsDashboardData {
  sessions: SessionAnalytics;
  tools: ToolAnalytics;
  performance: PerformanceAnalytics;
  conversions: ConversionAnalytics;
  userJourneys: UserJourneyAnalytics;
  realTime: RealTimeAnalytics;
}

export interface SessionAnalytics {
  totalSessions: number;
  averageDuration: number;
  averagePageViews: number;
  bounceRate: number;
  returnUserRate: number;
  deviceBreakdown: Record<string, number>;
  browserBreakdown: Record<string, number>;
  topPages: Array<{ page: string; views: number }>;
}

export interface ToolAnalytics {
  totalInteractions: number;
  completionRate: number;
  averageProcessingTime: number;
  errorRate: number;
  popularTools: Array<{ tool: string; category: string; usage: number }>;
  toolPerformance: Array<{
    tool: string;
    avgTime: number;
    successRate: number;
  }>;
  filesSizeDistribution: Record<string, number>;
}

export interface PerformanceAnalytics {
  averagePageLoad: number;
  errorCount: number;
  performanceTrends: Array<{ timestamp: number; value: number; type: string }>;
  criticalErrors: Array<{ message: string; count: number; lastSeen: number }>;
}

export interface ConversionAnalytics {
  totalConversions: number;
  conversionRate: number;
  conversionFunnel: Array<{ step: string; count: number; rate: number }>;
  topConversionPaths: Array<{ path: string[]; conversions: number }>;
}

export interface UserJourneyAnalytics {
  commonPaths: Array<{ path: string[]; frequency: number }>;
  dropOffPoints: Array<{ page: string; dropOffs: number }>;
  averageJourneyLength: number;
  conversionPaths: Array<{ path: string[]; conversions: number }>;
}

export interface RealTimeAnalytics {
  activeUsers: number;
  currentPageViews: Record<string, number>;
  liveToolUsage: Array<{ tool: string; timestamp: number }>;
  recentErrors: Array<{ message: string; timestamp: number }>;
}

// ========== MAIN HOOK ==========

export function useEnhancedAnalytics(
  timeRange: "day" | "week" | "month" | "all" = "week",
) {
  const [data, setData] = useState<AnalyticsDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const timeRangeMs = useMemo(() => {
    const now = Date.now();
    switch (timeRange) {
      case "day":
        return now - 24 * 60 * 60 * 1000;
      case "week":
        return now - 7 * 24 * 60 * 60 * 1000;
      case "month":
        return now - 30 * 24 * 60 * 60 * 1000;
      default:
        return 0;
    }
  }, [timeRange]);

  useEffect(() => {
    const fetchAnalyticsData = async () => {
      setLoading(true);
      setError(null);

      try {
        const [
          sessions,
          toolInteractions,
          performance,
          conversions,
          userJourneys,
        ] = await Promise.all([
          fetchSessionsData(timeRangeMs),
          fetchToolInteractionsData(timeRangeMs),
          fetchPerformanceData(timeRangeMs),
          fetchConversionsData(timeRangeMs),
          fetchUserJourneysData(timeRangeMs),
        ]);

        const analyticsData: AnalyticsDashboardData = {
          sessions: processSessionsData(sessions),
          tools: processToolsData(toolInteractions),
          performance: processPerformanceData(performance),
          conversions: processConversionsData(conversions),
          userJourneys: processUserJourneysData(userJourneys),
          realTime: await fetchRealTimeData(),
        };

        setData(analyticsData);
      } catch (err) {
        console.error("Error fetching analytics data:", err);
        setError("Failed to load analytics data");
      } finally {
        setLoading(false);
      }
    };

    fetchAnalyticsData();
  }, [timeRangeMs]);

  return { data, loading, error };
}

// ========== DATA FETCHING FUNCTIONS ==========

async function fetchSessionsData(sinceTime: number): Promise<any[]> {
  return new Promise((resolve) => {
    const sessionsRef = query(
      ref(db, "analytics/sessions"),
      orderByChild("startTime"),
      startAt(sinceTime),
    );

    onValue(
      sessionsRef,
      (snapshot) => {
        const data = snapshot.val();
        resolve(data ? Object.values(data) : []);
      },
      { onlyOnce: true },
    );
  });
}

async function fetchToolInteractionsData(sinceTime: number): Promise<any[]> {
  return new Promise((resolve) => {
    const interactionsRef = query(
      ref(db, "analytics/toolInteractions"),
      orderByChild("timestamp"),
      startAt(sinceTime),
    );

    onValue(
      interactionsRef,
      (snapshot) => {
        const data = snapshot.val();
        resolve(data ? Object.values(data) : []);
      },
      { onlyOnce: true },
    );
  });
}

async function fetchPerformanceData(sinceTime: number): Promise<any[]> {
  return new Promise((resolve) => {
    const performanceRef = query(
      ref(db, "analytics/performance"),
      orderByChild("timestamp"),
      startAt(sinceTime),
    );

    onValue(
      performanceRef,
      (snapshot) => {
        const data = snapshot.val();
        resolve(data ? Object.values(data) : []);
      },
      { onlyOnce: true },
    );
  });
}

async function fetchConversionsData(sinceTime: number): Promise<any[]> {
  return new Promise((resolve) => {
    const conversionsRef = query(
      ref(db, "analytics/conversions"),
      orderByChild("timestamp"),
      startAt(sinceTime),
    );

    onValue(
      conversionsRef,
      (snapshot) => {
        const data = snapshot.val();
        resolve(data ? Object.values(data) : []);
      },
      { onlyOnce: true },
    );
  });
}

async function fetchUserJourneysData(sinceTime: number): Promise<any[]> {
  return new Promise((resolve) => {
    const journeysRef = query(
      ref(db, "analytics/userJourneys"),
      orderByChild("timestamps/0"),
      startAt(sinceTime),
    );

    onValue(
      journeysRef,
      (snapshot) => {
        const data = snapshot.val();
        resolve(data ? Object.values(data) : []);
      },
      { onlyOnce: true },
    );
  });
}

async function fetchRealTimeData(): Promise<RealTimeAnalytics> {
  const now = Date.now();
  const fiveMinutesAgo = now - 5 * 60 * 1000;

  const [recentSessions, recentInteractions, recentErrors] = await Promise.all([
    fetchSessionsData(fiveMinutesAgo),
    fetchToolInteractionsData(fiveMinutesAgo),
    fetchPerformanceData(fiveMinutesAgo),
  ]);

  return {
    activeUsers: recentSessions.filter(
      (s: any) => s.lastActivity > fiveMinutesAgo,
    ).length,
    currentPageViews: {},
    liveToolUsage: recentInteractions
      .filter((i: any) => i.action === "start")
      .map((i: any) => ({
        tool: `${i.toolCategory}/${i.toolName}`,
        timestamp: i.timestamp,
      }))
      .slice(-10),
    recentErrors: recentErrors
      .filter((e: any) => e.metricType === "error")
      .map((e: any) => ({ message: e.context, timestamp: e.timestamp }))
      .slice(-10),
  };
}

// ========== DATA PROCESSING FUNCTIONS ==========

function processSessionsData(sessions: any[]): SessionAnalytics {
  if (!sessions.length) {
    return {
      totalSessions: 0,
      averageDuration: 0,
      averagePageViews: 0,
      bounceRate: 0,
      returnUserRate: 0,
      deviceBreakdown: {},
      browserBreakdown: {},
      topPages: [],
    };
  }

  const totalSessions = sessions.length;
  const totalDuration = sessions.reduce((sum, s) => sum + (s.duration || 0), 0);
  const totalPageViews = sessions.reduce(
    (sum, s) => sum + (s.pageViews || 0),
    0,
  );
  const bounces = sessions.filter((s) => (s.pageViews || 0) <= 1).length;

  const deviceBreakdown: Record<string, number> = {};
  const browserBreakdown: Record<string, number> = {};

  sessions.forEach((session) => {
    const device = session.deviceInfo?.isMobile ? "Mobile" : "Desktop";
    const browser = session.deviceInfo?.browser || "Unknown";

    deviceBreakdown[device] = (deviceBreakdown[device] || 0) + 1;
    browserBreakdown[browser] = (browserBreakdown[browser] || 0) + 1;
  });

  return {
    totalSessions,
    averageDuration: totalDuration / totalSessions,
    averagePageViews: totalPageViews / totalSessions,
    bounceRate: bounces / totalSessions,
    returnUserRate: 0, // Would need user tracking to calculate
    deviceBreakdown,
    browserBreakdown,
    topPages: [], // Would need to aggregate from pageViews collection
  };
}

function processToolsData(interactions: any[]): ToolAnalytics {
  if (!interactions.length) {
    return {
      totalInteractions: 0,
      completionRate: 0,
      averageProcessingTime: 0,
      errorRate: 0,
      popularTools: [],
      toolPerformance: [],
      filesSizeDistribution: {},
    };
  }

  const totalInteractions = interactions.length;
  const completions = interactions.filter(
    (i) => i.action === "complete",
  ).length;
  const errors = interactions.filter((i) => i.action === "error").length;
  const starts = interactions.filter((i) => i.action === "start").length;

  const processingTimes = interactions
    .filter((i) => i.processingTime)
    .map((i) => i.processingTime);

  const toolUsage: Record<string, number> = {};
  interactions.forEach((interaction) => {
    const toolKey = `${interaction.toolCategory}/${interaction.toolName}`;
    toolUsage[toolKey] = (toolUsage[toolKey] || 0) + 1;
  });

  const popularTools = Object.entries(toolUsage)
    .map(([tool, usage]) => {
      const [category, name] = tool.split("/");
      return { tool: name, category, usage };
    })
    .sort((a, b) => b.usage - a.usage)
    .slice(0, 10);

  return {
    totalInteractions,
    completionRate: starts > 0 ? completions / starts : 0,
    averageProcessingTime:
      processingTimes.length > 0
        ? processingTimes.reduce((sum, time) => sum + time, 0) /
          processingTimes.length
        : 0,
    errorRate: totalInteractions > 0 ? errors / totalInteractions : 0,
    popularTools,
    toolPerformance: [],
    filesSizeDistribution: {},
  };
}

function processPerformanceData(performance: any[]): PerformanceAnalytics {
  if (!performance.length) {
    return {
      averagePageLoad: 0,
      errorCount: 0,
      performanceTrends: [],
      criticalErrors: [],
    };
  }

  const pageLoads = performance.filter((p) => p.metricType === "page_load");
  const errors = performance.filter((p) => p.metricType === "error");

  return {
    averagePageLoad:
      pageLoads.length > 0
        ? pageLoads.reduce((sum, p) => sum + p.value, 0) / pageLoads.length
        : 0,
    errorCount: errors.length,
    performanceTrends: performance.map((p) => ({
      timestamp: p.timestamp,
      value: p.value,
      type: p.metricType,
    })),
    criticalErrors: [],
  };
}

function processConversionsData(conversions: any[]): ConversionAnalytics {
  if (!conversions.length) {
    return {
      totalConversions: 0,
      conversionRate: 0,
      conversionFunnel: [],
      topConversionPaths: [],
    };
  }

  return {
    totalConversions: conversions.length,
    conversionRate: 0, // Would need to calculate against total sessions
    conversionFunnel: [],
    topConversionPaths: [],
  };
}

function processUserJourneysData(journeys: any[]): UserJourneyAnalytics {
  if (!journeys.length) {
    return {
      commonPaths: [],
      dropOffPoints: [],
      averageJourneyLength: 0,
      conversionPaths: [],
    };
  }

  const totalLength = journeys.reduce(
    (sum, j) => sum + (j.path?.length || 0),
    0,
  );

  return {
    commonPaths: [],
    dropOffPoints: [],
    averageJourneyLength: totalLength / journeys.length,
    conversionPaths: [],
  };
}

// ========== REAL-TIME HOOKS ==========

export function useRealTimeAnalytics() {
  const [realTimeData, setRealTimeData] = useState<RealTimeAnalytics | null>(
    null,
  );

  useEffect(() => {
    const interval = setInterval(async () => {
      const data = await fetchRealTimeData();
      setRealTimeData(data);
    }, 10000); // Update every 10 seconds

    return () => clearInterval(interval);
  }, []);

  return realTimeData;
}

export function useLiveUserCount() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
    const sessionsRef = query(
      ref(db, "analytics/sessions"),
      orderByChild("lastActivity"),
      startAt(fiveMinutesAgo),
    );

    const unsubscribe = onValue(sessionsRef, (snapshot) => {
      const data = snapshot.val();
      setCount(data ? Object.keys(data).length : 0);
    });

    return () => unsubscribe();
  }, []);

  return count;
}
