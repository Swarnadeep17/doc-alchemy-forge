// src/lib/enhancedAnalytics.ts

import { db } from "./firebase";
import {
  ref,
  push,
  set,
  runTransaction,
  serverTimestamp,
} from "firebase/database";

// ========== TYPE DEFINITIONS ==========

export interface SessionData {
  sessionId: string;
  userId?: string;
  userRole?: string;
  startTime: number;
  lastActivity: number;
  duration?: number;
  pageViews: number;
  toolsUsed: string[];
  conversions: string[];
  deviceInfo: DeviceInfo;
  locationData?: LocationData;
  referrer?: string;
  userAgent: string;
}

export interface DeviceInfo {
  isMobile: boolean;
  browser: string;
  os: string;
  screenResolution: string;
  viewport: string;
  connection?: string;
}

export interface LocationData {
  country?: string;
  region?: string;
  timezone: string;
}

export interface ToolInteraction {
  sessionId: string;
  toolCategory: string;
  toolName: string;
  timestamp: number;
  action: "start" | "complete" | "abandon" | "error";
  duration?: number;
  fileSize?: number;
  processingTime?: number;
  options?: Record<string, any>;
  errorType?: string;
  errorMessage?: string;
  userRole?: string;
}

export interface PerformanceMetric {
  timestamp: number;
  metricType: "page_load" | "tool_processing" | "api_response" | "error";
  value: number;
  context: string;
  sessionId: string;
  additionalData?: Record<string, any>;
}

export interface ConversionEvent {
  sessionId: string;
  userId?: string;
  type: "signup" | "login" | "promo_redeem" | "tool_first_use" | "return_visit";
  timestamp: number;
  value?: number;
  metadata?: Record<string, any>;
}

export interface UserJourney {
  sessionId: string;
  path: string[];
  timestamps: number[];
  duration: number;
  exitPoint?: string;
  conversionPoint?: string;
}

// ========== ANALYTICS SERVICE CLASS ==========

class EnhancedAnalyticsService {
  private sessionId: string;
  private sessionStartTime: number;
  private lastActivity: number;
  private pageViews: number = 0;
  private toolsUsed: Set<string> = new Set();
  private conversions: string[] = [];
  private userJourney: { path: string[]; timestamps: number[] } = {
    path: [],
    timestamps: [],
  };

  constructor() {
    this.sessionId = this.generateSessionId();
    this.sessionStartTime = Date.now();
    this.lastActivity = Date.now();
    this.initializeSession();
    this.setupActivityTracking();
    this.setupPerformanceMonitoring();
  }

  // ========== SESSION MANAGEMENT ==========

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async initializeSession() {
    const deviceInfo = this.getDeviceInfo();
    const locationData = this.getLocationData();

    const sessionData: SessionData = {
      sessionId: this.sessionId,
      startTime: this.sessionStartTime,
      lastActivity: this.lastActivity,
      pageViews: 0,
      toolsUsed: [],
      conversions: [],
      deviceInfo,
      locationData,
      referrer: document.referrer || undefined,
      userAgent: navigator.userAgent,
    };

    await set(ref(db, `analytics/sessions/${this.sessionId}`), sessionData);
  }

  private setupActivityTracking() {
    // Track page visibility changes
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden) {
        this.updateLastActivity();
      }
    });

    // Track mouse/keyboard activity
    let activityTimeout: NodeJS.Timeout;
    const resetActivityTimer = () => {
      clearTimeout(activityTimeout);
      activityTimeout = setTimeout(() => {
        this.updateLastActivity();
      }, 30000); // Update every 30 seconds of activity
    };

    document.addEventListener("mousemove", resetActivityTimer);
    document.addEventListener("keypress", resetActivityTimer);
    document.addEventListener("scroll", resetActivityTimer);
    document.addEventListener("click", resetActivityTimer);
  }

  private setupPerformanceMonitoring() {
    // Monitor page load performance
    window.addEventListener("load", () => {
      setTimeout(() => {
        const perfData = performance.getEntriesByType(
          "navigation",
        )[0] as PerformanceNavigationTiming;
        if (perfData) {
          this.trackPerformance(
            "page_load",
            perfData.loadEventEnd - perfData.loadEventStart,
            "initial_load",
            {
              domContentLoaded:
                perfData.domContentLoadedEventEnd -
                perfData.domContentLoadedEventStart,
              firstPaint:
                performance
                  .getEntriesByType("paint")
                  .find((p) => p.name === "first-paint")?.startTime || 0,
              firstContentfulPaint:
                performance
                  .getEntriesByType("paint")
                  .find((p) => p.name === "first-contentful-paint")
                  ?.startTime || 0,
            },
          );
        }
      }, 1000);
    });

    // Monitor unhandled errors
    window.addEventListener("error", (event) => {
      this.trackPerformance("error", 1, "javascript_error", {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      });
    });

    // Monitor unhandled promise rejections
    window.addEventListener("unhandledrejection", (event) => {
      this.trackPerformance("error", 1, "unhandled_promise_rejection", {
        reason: event.reason?.toString() || "Unknown promise rejection",
      });
    });
  }

  // ========== DEVICE & LOCATION INFO ==========

  private getDeviceInfo(): DeviceInfo {
    const ua = navigator.userAgent;
    const isMobile = /Mobi|Android/i.test(ua);

    let browser = "Unknown";
    if (ua.includes("Chrome")) browser = "Chrome";
    else if (ua.includes("Firefox")) browser = "Firefox";
    else if (ua.includes("Safari")) browser = "Safari";
    else if (ua.includes("Edge")) browser = "Edge";

    let os = "Unknown";
    if (ua.includes("Windows")) os = "Windows";
    else if (ua.includes("Mac")) os = "macOS";
    else if (ua.includes("Linux")) os = "Linux";
    else if (ua.includes("Android")) os = "Android";
    else if (ua.includes("iOS")) os = "iOS";

    return {
      isMobile,
      browser,
      os,
      screenResolution: `${screen.width}x${screen.height}`,
      viewport: `${window.innerWidth}x${window.innerHeight}`,
      connection: (navigator as any).connection?.effectiveType || undefined,
    };
  }

  private getLocationData(): LocationData {
    return {
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      // Note: For privacy compliance, we don't collect precise location data
      // Country/region would need to be obtained server-side from IP if needed
    };
  }

  // ========== TRACKING METHODS ==========

  async trackPageView(page: string) {
    this.pageViews++;
    this.userJourney.path.push(page);
    this.userJourney.timestamps.push(Date.now());
    this.updateLastActivity();

    await this.updateSession({ pageViews: this.pageViews });

    // Track in page views collection
    await push(ref(db, "analytics/pageViews"), {
      sessionId: this.sessionId,
      page,
      timestamp: Date.now(),
      referrer: document.referrer || null,
    });
  }

  async trackToolInteraction(
    interaction: Omit<ToolInteraction, "sessionId" | "timestamp">,
  ) {
    const fullInteraction: ToolInteraction = {
      ...interaction,
      sessionId: this.sessionId,
      timestamp: Date.now(),
    };

    this.toolsUsed.add(`${interaction.toolCategory}/${interaction.toolName}`);
    await this.updateSession({ toolsUsed: Array.from(this.toolsUsed) });

    await push(ref(db, "analytics/toolInteractions"), fullInteraction);

    // Update legacy stats for backwards compatibility
    if (interaction.action === "start") {
      await this.incrementStat([
        "tools",
        interaction.toolCategory,
        interaction.toolName,
        "visits",
      ]);
    } else if (interaction.action === "complete") {
      await this.incrementStat([
        "tools",
        interaction.toolCategory,
        interaction.toolName,
        "downloads",
      ]);
    } else if (interaction.action === "error") {
      await this.incrementStat([
        "tools",
        interaction.toolCategory,
        interaction.toolName,
        "errors",
      ]);
    }
  }

  async trackPerformance(
    metricType: PerformanceMetric["metricType"],
    value: number,
    context: string,
    additionalData?: Record<string, any>,
  ) {
    const metric: PerformanceMetric = {
      timestamp: Date.now(),
      metricType,
      value,
      context,
      sessionId: this.sessionId,
      additionalData,
    };

    await push(ref(db, "analytics/performance"), metric);
  }

  async trackConversion(
    type: ConversionEvent["type"],
    value?: number,
    metadata?: Record<string, any>,
  ) {
    const conversion: ConversionEvent = {
      sessionId: this.sessionId,
      type,
      timestamp: Date.now(),
      value,
      metadata,
    };

    this.conversions.push(type);
    await this.updateSession({ conversions: this.conversions });

    await push(ref(db, "analytics/conversions"), conversion);
  }

  async trackUserJourney() {
    const journey: UserJourney = {
      sessionId: this.sessionId,
      path: this.userJourney.path,
      timestamps: this.userJourney.timestamps,
      duration: Date.now() - this.sessionStartTime,
      exitPoint: this.userJourney.path[this.userJourney.path.length - 1],
    };

    await set(ref(db, `analytics/userJourneys/${this.sessionId}`), journey);
  }

  // ========== UTILITY METHODS ==========

  private async updateLastActivity() {
    this.lastActivity = Date.now();
    await this.updateSession({
      lastActivity: this.lastActivity,
      duration: this.lastActivity - this.sessionStartTime,
    });
  }

  private async updateSession(updates: Partial<SessionData>) {
    const sessionRef = ref(db, `analytics/sessions/${this.sessionId}`);
    await runTransaction(sessionRef, (currentData) => {
      if (currentData) {
        return { ...currentData, ...updates };
      }
      return currentData;
    });
  }

  private async incrementStat(pathParts: string[]) {
    const statRef = ref(db, `/stats/${pathParts.join("/")}`);
    return runTransaction(statRef, (currentVal) => {
      if (typeof currentVal === "number") {
        return currentVal + 1;
      }
      return 1;
    });
  }

  // ========== SESSION CLEANUP ==========

  async endSession() {
    await this.trackUserJourney();
    await this.updateSession({
      duration: Date.now() - this.sessionStartTime,
      lastActivity: Date.now(),
    });
  }

  // ========== PUBLIC API ==========

  getSessionId(): string {
    return this.sessionId;
  }

  getSessionDuration(): number {
    return Date.now() - this.sessionStartTime;
  }

  getPageViews(): number {
    return this.pageViews;
  }

  getToolsUsed(): string[] {
    return Array.from(this.toolsUsed);
  }
}

// ========== SINGLETON INSTANCE ==========

export const analyticsService = new EnhancedAnalyticsService();

// ========== CONVENIENCE FUNCTIONS ==========

export const trackPageView = (page: string) =>
  analyticsService.trackPageView(page);
export const trackToolStart = (
  category: string,
  tool: string,
  options?: Record<string, any>,
) =>
  analyticsService.trackToolInteraction({
    toolCategory: category,
    toolName: tool,
    action: "start",
    options,
  });
export const trackToolComplete = (
  category: string,
  tool: string,
  duration?: number,
  fileSize?: number,
  processingTime?: number,
) =>
  analyticsService.trackToolInteraction({
    toolCategory: category,
    toolName: tool,
    action: "complete",
    duration,
    fileSize,
    processingTime,
  });
export const trackToolError = (
  category: string,
  tool: string,
  errorType: string,
  errorMessage: string,
) =>
  analyticsService.trackToolInteraction({
    toolCategory: category,
    toolName: tool,
    action: "error",
    errorType,
    errorMessage,
  });
export const trackConversion = (
  type: ConversionEvent["type"],
  value?: number,
  metadata?: Record<string, any>,
) => analyticsService.trackConversion(type, value, metadata);
export const trackPerformance = (
  metricType: PerformanceMetric["metricType"],
  value: number,
  context: string,
  additionalData?: Record<string, any>,
) =>
  analyticsService.trackPerformance(metricType, value, context, additionalData);

// ========== CLEANUP ON PAGE UNLOAD ==========

window.addEventListener("beforeunload", () => {
  analyticsService.endSession();
});

window.addEventListener("pagehide", () => {
  analyticsService.endSession();
});
