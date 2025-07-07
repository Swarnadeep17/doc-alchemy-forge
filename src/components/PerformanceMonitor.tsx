// src/components/PerformanceMonitor.tsx

import React, { useEffect, useState } from "react";
import { trackPerformance } from "@/lib/enhancedAnalytics";

interface PerformanceMetrics {
  pageLoadTime: number;
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  cumulativeLayoutShift: number;
  firstInputDelay: number;
  connectionSpeed?: string;
  memoryUsage?: number;
}

export const PerformanceMonitor: React.FC = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);

  useEffect(() => {
    const collectPerformanceMetrics = () => {
      // Wait for page to fully load
      if (document.readyState !== "complete") {
        window.addEventListener("load", collectPerformanceMetrics, {
          once: true,
        });
        return;
      }

      setTimeout(() => {
        const perfData = performance.getEntriesByType(
          "navigation",
        )[0] as PerformanceNavigationTiming;
        const paintMetrics = performance.getEntriesByType("paint");
        const layoutShiftEntries = performance.getEntriesByType("layout-shift");

        const fcp =
          paintMetrics.find((p) => p.name === "first-contentful-paint")
            ?.startTime || 0;

        // Calculate LCP (approximation)
        const lcpEntries = performance.getEntriesByType(
          "largest-contentful-paint",
        );
        const lcp =
          lcpEntries.length > 0
            ? lcpEntries[lcpEntries.length - 1].startTime
            : 0;

        // Calculate CLS
        const cls = layoutShiftEntries.reduce((sum: number, entry: any) => {
          if (!entry.hadRecentInput) {
            return sum + entry.value;
          }
          return sum;
        }, 0);

        const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;

        const collectedMetrics: PerformanceMetrics = {
          pageLoadTime,
          firstContentfulPaint: fcp,
          largestContentfulPaint: lcp,
          cumulativeLayoutShift: cls,
          firstInputDelay: 0, // Would need additional setup for FID
          connectionSpeed: (navigator as any).connection?.effectiveType,
          memoryUsage: (performance as any).memory?.usedJSHeapSize,
        };

        setMetrics(collectedMetrics);

        // Track metrics in analytics
        trackPerformance("page_load", pageLoadTime, "full_page_load", {
          fcp,
          lcp,
          cls,
          connectionSpeed: collectedMetrics.connectionSpeed,
          memoryUsage: collectedMetrics.memoryUsage,
        });

        // Track Core Web Vitals
        if (fcp > 0)
          trackPerformance("page_load", fcp, "first_contentful_paint");
        if (lcp > 0)
          trackPerformance("page_load", lcp, "largest_contentful_paint");
        if (cls > 0)
          trackPerformance("page_load", cls * 1000, "cumulative_layout_shift"); // Convert to ms for consistency

        // Track performance thresholds
        if (pageLoadTime > 3000) {
          trackPerformance("error", 1, "slow_page_load", {
            loadTime: pageLoadTime,
          });
        }
        if (lcp > 2500) {
          trackPerformance("error", 1, "poor_lcp", { lcp });
        }
        if (cls > 0.1) {
          trackPerformance("error", 1, "poor_cls", { cls });
        }
      }, 1000); // Wait 1 second for metrics to stabilize
    };

    collectPerformanceMetrics();

    // Monitor runtime performance
    const monitorRuntimePerformance = () => {
      // Monitor memory usage periodically
      if ((performance as any).memory) {
        const memoryInfo = (performance as any).memory;
        if (memoryInfo.usedJSHeapSize > memoryInfo.totalJSHeapSize * 0.9) {
          trackPerformance("error", 1, "high_memory_usage", {
            used: memoryInfo.usedJSHeapSize,
            total: memoryInfo.totalJSHeapSize,
          });
        }
      }

      // Monitor long tasks
      if ("PerformanceObserver" in window) {
        try {
          const longTaskObserver = new PerformanceObserver((list) => {
            list.getEntries().forEach((entry) => {
              if (entry.duration > 50) {
                // Tasks longer than 50ms
                trackPerformance("page_load", entry.duration, "long_task", {
                  startTime: entry.startTime,
                  name: entry.name,
                });
              }
            });
          });
          longTaskObserver.observe({ entryTypes: ["longtask"] });

          // Monitor resource loading
          const resourceObserver = new PerformanceObserver((list) => {
            list.getEntries().forEach((entry: any) => {
              if (entry.duration > 1000) {
                // Resources taking longer than 1 second
                trackPerformance("page_load", entry.duration, "slow_resource", {
                  name: entry.name,
                  type: entry.initiatorType,
                  size: entry.transferSize,
                });
              }
            });
          });
          resourceObserver.observe({ entryTypes: ["resource"] });
        } catch (error) {
          console.warn("PerformanceObserver not supported or failed:", error);
        }
      }
    };

    monitorRuntimePerformance();

    // Monitor unhandled errors and rejections
    const errorHandler = (event: ErrorEvent) => {
      trackPerformance("error", 1, "javascript_error", {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack,
      });
    };

    const rejectionHandler = (event: PromiseRejectionEvent) => {
      trackPerformance("error", 1, "unhandled_promise_rejection", {
        reason: event.reason?.toString() || "Unknown rejection",
        stack: event.reason?.stack,
      });
    };

    window.addEventListener("error", errorHandler);
    window.addEventListener("unhandledrejection", rejectionHandler);

    return () => {
      window.removeEventListener("error", errorHandler);
      window.removeEventListener("unhandledrejection", rejectionHandler);
    };
  }, []);

  // This component doesn't render anything visible
  // It's purely for monitoring performance in the background
  return null;
};

// Hook for components that want to track specific performance metrics
export const usePerformanceTracking = () => {
  const trackComponentPerformance = (
    componentName: string,
    operation: string,
    duration: number,
  ) => {
    trackPerformance(
      "tool_processing",
      duration,
      `${componentName}_${operation}`,
      {
        component: componentName,
        operation,
      },
    );
  };

  const trackApiCall = async <T,>(
    apiCall: () => Promise<T>,
    apiName: string,
  ): Promise<T> => {
    const startTime = performance.now();
    try {
      const result = await apiCall();
      const duration = performance.now() - startTime;
      trackPerformance("api_response", duration, apiName, { success: true });
      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      trackPerformance("api_response", duration, apiName, {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  };

  const trackUserInteraction = (interactionType: string, element: string) => {
    trackPerformance("tool_processing", 0, "user_interaction", {
      type: interactionType,
      element,
      timestamp: Date.now(),
    });
  };

  return {
    trackComponentPerformance,
    trackApiCall,
    trackUserInteraction,
  };
};

export default PerformanceMonitor;
