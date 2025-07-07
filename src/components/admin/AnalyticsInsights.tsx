// src/components/admin/AnalyticsInsights.tsx

import React, { useMemo } from "react";
import { useEnhancedAnalytics } from "@/hooks/useEnhancedAnalytics";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Lightbulb,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Target,
  Users,
  Clock,
  Zap,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Insight {
  id: string;
  type: "opportunity" | "warning" | "success" | "trend";
  priority: "high" | "medium" | "low";
  title: string;
  description: string;
  metric: string;
  value: string | number;
  recommendation?: string;
  icon: React.ElementType;
}

export const AnalyticsInsights: React.FC<{
  timeRange: "day" | "week" | "month" | "all";
}> = ({ timeRange }) => {
  const { data, loading } = useEnhancedAnalytics(timeRange);

  const insights = useMemo(() => {
    if (!data) return [];

    const generatedInsights: Insight[] = [];

    // Bounce Rate Analysis
    if (data.sessions.bounceRate > 0.7) {
      generatedInsights.push({
        id: "high-bounce-rate",
        type: "warning",
        priority: "high",
        title: "High Bounce Rate Detected",
        description: `${(data.sessions.bounceRate * 100).toFixed(1)}% of users leave after viewing only one page`,
        metric: "Bounce Rate",
        value: `${(data.sessions.bounceRate * 100).toFixed(1)}%`,
        recommendation:
          "Consider improving homepage content and adding clear calls-to-action to encourage exploration",
        icon: TrendingDown,
      });
    } else if (data.sessions.bounceRate < 0.3) {
      generatedInsights.push({
        id: "low-bounce-rate",
        type: "success",
        priority: "medium",
        title: "Excellent User Engagement",
        description: `Low bounce rate of ${(data.sessions.bounceRate * 100).toFixed(1)}% indicates high content relevance`,
        metric: "Bounce Rate",
        value: `${(data.sessions.bounceRate * 100).toFixed(1)}%`,
        icon: CheckCircle,
      });
    }

    // Tool Performance Analysis
    if (data.tools.completionRate < 0.5) {
      generatedInsights.push({
        id: "low-completion-rate",
        type: "warning",
        priority: "high",
        title: "Tool Completion Rate Needs Attention",
        description: `Only ${(data.tools.completionRate * 100).toFixed(1)}% of tool interactions are completed successfully`,
        metric: "Completion Rate",
        value: `${(data.tools.completionRate * 100).toFixed(1)}%`,
        recommendation:
          "Review tool UX and identify common failure points. Consider adding progress indicators and better error handling",
        icon: AlertTriangle,
      });
    }

    // Error Rate Analysis
    if (data.tools.errorRate > 0.1) {
      generatedInsights.push({
        id: "high-error-rate",
        type: "warning",
        priority: "high",
        title: "High Error Rate Detected",
        description: `${(data.tools.errorRate * 100).toFixed(1)}% of tool interactions result in errors`,
        metric: "Error Rate",
        value: `${(data.tools.errorRate * 100).toFixed(1)}%`,
        recommendation:
          "Investigate common error patterns and improve error handling. Consider adding input validation",
        icon: XCircle,
      });
    }

    // Performance Analysis
    if (data.performance.averagePageLoad > 3000) {
      generatedInsights.push({
        id: "slow-page-load",
        type: "warning",
        priority: "medium",
        title: "Page Load Speed Optimization Needed",
        description: `Average page load time is ${(data.performance.averagePageLoad / 1000).toFixed(1)} seconds`,
        metric: "Page Load Time",
        value: `${(data.performance.averagePageLoad / 1000).toFixed(1)}s`,
        recommendation:
          "Optimize images, minify assets, and consider implementing lazy loading",
        icon: Clock,
      });
    } else if (data.performance.averagePageLoad < 1500) {
      generatedInsights.push({
        id: "fast-page-load",
        type: "success",
        priority: "low",
        title: "Excellent Page Performance",
        description: `Fast page load time of ${(data.performance.averagePageLoad / 1000).toFixed(1)} seconds enhances user experience`,
        metric: "Page Load Time",
        value: `${(data.performance.averagePageLoad / 1000).toFixed(1)}s`,
        icon: Zap,
      });
    }

    // Session Duration Analysis
    const avgDurationMinutes = data.sessions.averageDuration / (1000 * 60);
    if (avgDurationMinutes > 5) {
      generatedInsights.push({
        id: "high-engagement",
        type: "success",
        priority: "medium",
        title: "High User Engagement",
        description: `Users spend an average of ${avgDurationMinutes.toFixed(1)} minutes on the platform`,
        metric: "Session Duration",
        value: `${avgDurationMinutes.toFixed(1)}m`,
        icon: Users,
      });
    } else if (avgDurationMinutes < 1) {
      generatedInsights.push({
        id: "low-engagement",
        type: "opportunity",
        priority: "medium",
        title: "Opportunity to Increase Engagement",
        description: `Short average session duration of ${avgDurationMinutes.toFixed(1)} minutes`,
        metric: "Session Duration",
        value: `${avgDurationMinutes.toFixed(1)}m`,
        recommendation:
          "Add more interactive content and improve tool discoverability",
        icon: TrendingUp,
      });
    }

    // Popular Tools Analysis
    if (data.tools.popularTools.length > 0) {
      const topTool = data.tools.popularTools[0];
      const totalUsage = data.tools.popularTools.reduce(
        (sum, tool) => sum + tool.usage,
        0,
      );
      const topToolPercentage = (topTool.usage / totalUsage) * 100;

      if (topToolPercentage > 70) {
        generatedInsights.push({
          id: "tool-dominance",
          type: "opportunity",
          priority: "medium",
          title: "Tool Usage Heavily Concentrated",
          description: `${topTool.tool} accounts for ${topToolPercentage.toFixed(1)}% of all tool usage`,
          metric: "Tool Distribution",
          value: `${topToolPercentage.toFixed(1)}%`,
          recommendation:
            "Promote other tools to diversify usage and increase overall platform value",
          icon: Target,
        });
      }
    }

    // Device Analysis
    const mobileUsage = data.sessions.deviceBreakdown["Mobile"] || 0;
    const totalSessions = data.sessions.totalSessions;
    const mobilePercentage =
      totalSessions > 0 ? (mobileUsage / totalSessions) * 100 : 0;

    if (mobilePercentage > 60) {
      generatedInsights.push({
        id: "mobile-dominance",
        type: "trend",
        priority: "medium",
        title: "Mobile-First User Base",
        description: `${mobilePercentage.toFixed(1)}% of users access the platform via mobile devices`,
        metric: "Mobile Usage",
        value: `${mobilePercentage.toFixed(1)}%`,
        recommendation:
          "Ensure mobile experience is optimized and consider mobile-specific features",
        icon: TrendingUp,
      });
    }

    // Sort insights by priority
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    return generatedInsights.sort(
      (a, b) => priorityOrder[b.priority] - priorityOrder[a.priority],
    );
  }, [data]);

  if (loading) {
    return (
      <Card className="bg-gray-950/50 border border-white/10">
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-cyan-400"></div>
            <span className="ml-2 text-cyan-400">Generating insights...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Lightbulb className="w-5 h-5 text-yellow-400" />
        <h3 className="text-lg font-semibold text-white">
          AI-Powered Insights
        </h3>
        <Badge variant="secondary" className="bg-yellow-900/30 text-yellow-300">
          {insights.length} insights
        </Badge>
      </div>

      {insights.length === 0 ? (
        <Card className="bg-gray-950/50 border border-white/10">
          <CardContent className="p-6 text-center">
            <Lightbulb className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-400">
              No significant insights detected for this time period.
            </p>
            <p className="text-gray-500 text-sm mt-1">
              Check back as more data is collected.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {insights.map((insight) => (
            <InsightCard key={insight.id} insight={insight} />
          ))}
        </div>
      )}
    </div>
  );
};

// Insight Card Component
const InsightCard: React.FC<{ insight: Insight }> = ({ insight }) => {
  const getTypeStyles = (type: Insight["type"]) => {
    switch (type) {
      case "opportunity":
        return {
          border: "border-blue-400/30",
          bg: "bg-blue-900/20",
          icon: "text-blue-400",
          badge: "bg-blue-900/50 text-blue-300",
        };
      case "warning":
        return {
          border: "border-yellow-400/30",
          bg: "bg-yellow-900/20",
          icon: "text-yellow-400",
          badge: "bg-yellow-900/50 text-yellow-300",
        };
      case "success":
        return {
          border: "border-green-400/30",
          bg: "bg-green-900/20",
          icon: "text-green-400",
          badge: "bg-green-900/50 text-green-300",
        };
      case "trend":
        return {
          border: "border-purple-400/30",
          bg: "bg-purple-900/20",
          icon: "text-purple-400",
          badge: "bg-purple-900/50 text-purple-300",
        };
      default:
        return {
          border: "border-gray-400/30",
          bg: "bg-gray-900/20",
          icon: "text-gray-400",
          badge: "bg-gray-800 text-gray-300",
        };
    }
  };

  const styles = getTypeStyles(insight.type);
  const Icon = insight.icon;

  return (
    <Card className={cn("border", styles.border, styles.bg)}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <Icon className={cn("w-5 h-5", styles.icon)} />
            <Badge className={cn("text-xs font-mono uppercase", styles.badge)}>
              {insight.type}
            </Badge>
          </div>
          <Badge
            variant="outline"
            className={cn(
              "text-xs",
              insight.priority === "high"
                ? "border-red-400 text-red-400"
                : insight.priority === "medium"
                  ? "border-yellow-400 text-yellow-400"
                  : "border-gray-400 text-gray-400",
            )}
          >
            {insight.priority}
          </Badge>
        </div>

        <h4 className="text-white font-semibold mb-2">{insight.title}</h4>
        <p className="text-gray-300 text-sm mb-3">{insight.description}</p>

        <div className="flex items-center justify-between mb-3">
          <span className="text-gray-400 text-xs">{insight.metric}</span>
          <span className="text-white font-mono font-bold">
            {insight.value}
          </span>
        </div>

        {insight.recommendation && (
          <Alert className="mt-3 bg-gray-800/50 border-gray-600">
            <AlertDescription className="text-gray-300 text-sm">
              <strong>Recommendation:</strong> {insight.recommendation}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

export default AnalyticsInsights;
