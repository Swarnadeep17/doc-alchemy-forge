// src/components/admin/EnhancedAnalyticsTab.tsx

import React, { useState } from "react";
import {
  useEnhancedAnalytics,
  useLiveUserCount,
} from "@/hooks/useEnhancedAnalytics";
import RealTimeAnalyticsDashboard from "./RealTimeAnalyticsDashboard";
import AnalyticsInsights from "./AnalyticsInsights";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Users,
  Clock,
  MousePointer,
  TrendingUp,
  Activity,
  Smartphone,
  Monitor,
  Chrome,
  Zap,
  AlertTriangle,
  Target,
  Route,
  BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";

type TimeRange = "day" | "week" | "month" | "all";

const EnhancedAnalyticsTab = () => {
  const [selectedTimeRange, setSelectedTimeRange] = useState<TimeRange>("week");
  const { data, loading, error } = useEnhancedAnalytics(selectedTimeRange);
  const liveUserCount = useLiveUserCount();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto"></div>
          <p className="mt-4 text-cyan-400 font-mono">
            Loading Enhanced Analytics...
          </p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <p className="text-red-400 font-mono">
            Failed to load analytics data
          </p>
          <p className="text-gray-400 text-sm mt-2">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header with Time Range Selector */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-white">
            Enhanced Analytics
          </h2>
          <p className="text-sm text-gray-400 mt-1">
            Deep insights into user behavior, performance, and conversions
          </p>
        </div>
        <div className="flex gap-2">
          {(["day", "week", "month", "all"] as TimeRange[]).map((range) => (
            <Button
              key={range}
              variant={selectedTimeRange === range ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedTimeRange(range)}
              className={cn(
                "font-mono uppercase",
                selectedTimeRange === range
                  ? "bg-cyan-600 hover:bg-cyan-700"
                  : "border-gray-600 text-gray-300 hover:bg-gray-800",
              )}
            >
              {range}
            </Button>
          ))}
        </div>
      </div>

      {/* Real-time Stats Bar */}
      <Card className="bg-gradient-to-r from-gray-950 to-gray-900 border border-cyan-400/30">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-white font-mono text-sm">LIVE</span>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-cyan-400 font-mono">
                  {liveUserCount}
                </div>
                <div className="text-xs text-gray-400">Active Users</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-400 font-mono">
                  {data.realTime.liveToolUsage.length}
                </div>
                <div className="text-xs text-gray-400">Tools in Use</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-400 font-mono">
                  {data.realTime.recentErrors.length}
                </div>
                <div className="text-xs text-gray-400">Recent Errors</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Analytics Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-6 bg-gray-900 border border-gray-700">
          <TabsTrigger value="overview" className="font-mono">
            Overview
          </TabsTrigger>
          <TabsTrigger value="behavior" className="font-mono">
            Behavior
          </TabsTrigger>
          <TabsTrigger value="performance" className="font-mono">
            Performance
          </TabsTrigger>
          <TabsTrigger value="conversions" className="font-mono">
            Conversions
          </TabsTrigger>
          <TabsTrigger value="insights" className="font-mono">
            Insights
          </TabsTrigger>
          <TabsTrigger value="realtime" className="font-mono">
            Real-time
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              icon={Users}
              title="Total Sessions"
              value={data.sessions.totalSessions.toLocaleString()}
              change={"+12%"}
              changeType="positive"
            />
            <MetricCard
              icon={Clock}
              title="Avg Session Duration"
              value={formatDuration(data.sessions.averageDuration)}
              change="+5%"
              changeType="positive"
            />
            <MetricCard
              icon={MousePointer}
              title="Avg Page Views"
              value={data.sessions.averagePageViews.toFixed(1)}
              change="-2%"
              changeType="negative"
            />
            <MetricCard
              icon={TrendingUp}
              title="Bounce Rate"
              value={`${(data.sessions.bounceRate * 100).toFixed(1)}%`}
              change="-8%"
              changeType="positive"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Device Breakdown */}
            <Card className="bg-gray-950/50 border border-white/10">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Monitor className="w-5 h-5" />
                  Device Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(data.sessions.deviceBreakdown).map(
                    ([device, count]) => {
                      const percentage = (
                        (count / data.sessions.totalSessions) *
                        100
                      ).toFixed(1);
                      return (
                        <div
                          key={device}
                          className="flex items-center justify-between"
                        >
                          <div className="flex items-center gap-2">
                            {device === "Mobile" ? (
                              <Smartphone className="w-4 h-4" />
                            ) : (
                              <Monitor className="w-4 h-4" />
                            )}
                            <span className="text-gray-300">{device}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-white font-mono">
                              {count}
                            </span>
                            <span className="text-gray-400 text-sm">
                              ({percentage}%)
                            </span>
                          </div>
                        </div>
                      );
                    },
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Browser Breakdown */}
            <Card className="bg-gray-950/50 border border-white/10">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Chrome className="w-5 h-5" />
                  Browser Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(data.sessions.browserBreakdown).map(
                    ([browser, count]) => {
                      const percentage = (
                        (count / data.sessions.totalSessions) *
                        100
                      ).toFixed(1);
                      return (
                        <div
                          key={browser}
                          className="flex items-center justify-between"
                        >
                          <span className="text-gray-300">{browser}</span>
                          <div className="flex items-center gap-2">
                            <Progress
                              value={parseFloat(percentage)}
                              className="w-20 h-2"
                            />
                            <span className="text-white font-mono w-12 text-right">
                              {percentage}%
                            </span>
                          </div>
                        </div>
                      );
                    },
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Behavior Tab */}
        <TabsContent value="behavior" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Popular Tools */}
            <Card className="bg-gray-950/50 border border-white/10">
              <CardHeader>
                <CardTitle className="text-white">Most Popular Tools</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data.tools.popularTools.slice(0, 5).map((tool, index) => (
                    <div
                      key={tool.tool}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 bg-cyan-600 rounded text-white text-xs font-bold flex items-center justify-center">
                          {index + 1}
                        </div>
                        <div>
                          <div className="text-white font-medium">
                            {tool.tool}
                          </div>
                          <div className="text-gray-400 text-sm">
                            {tool.category}
                          </div>
                        </div>
                      </div>
                      <Badge variant="secondary" className="font-mono">
                        {tool.usage.toLocaleString()}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Tool Performance */}
            <Card className="bg-gray-950/50 border border-white/10">
              <CardHeader>
                <CardTitle className="text-white">Tool Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-gray-800/50 rounded-lg">
                    <span className="text-gray-300">Completion Rate</span>
                    <div className="flex items-center gap-2">
                      <Progress
                        value={data.tools.completionRate * 100}
                        className="w-20 h-2"
                      />
                      <span className="text-white font-mono">
                        {(data.tools.completionRate * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-800/50 rounded-lg">
                    <span className="text-gray-300">Error Rate</span>
                    <div className="flex items-center gap-2">
                      <Progress
                        value={data.tools.errorRate * 100}
                        className="w-20 h-2"
                      />
                      <span className="text-white font-mono">
                        {(data.tools.errorRate * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-800/50 rounded-lg">
                    <span className="text-gray-300">Avg Processing Time</span>
                    <span className="text-white font-mono">
                      {formatDuration(data.tools.averageProcessingTime)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <MetricCard
              icon={Zap}
              title="Avg Page Load"
              value={`${data.performance.averagePageLoad.toFixed(0)}ms`}
              change="-15ms"
              changeType="positive"
            />
            <MetricCard
              icon={AlertTriangle}
              title="Error Count"
              value={data.performance.errorCount.toLocaleString()}
              change="+3"
              changeType="negative"
            />
            <MetricCard
              icon={Activity}
              title="Performance Score"
              value="85"
              change="+2"
              changeType="positive"
            />
          </div>
        </TabsContent>

        {/* Conversions Tab */}
        <TabsContent value="conversions" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <MetricCard
              icon={Target}
              title="Total Conversions"
              value={data.conversions.totalConversions.toLocaleString()}
              change="+24"
              changeType="positive"
            />
            <MetricCard
              icon={Route}
              title="Conversion Rate"
              value={`${(data.conversions.conversionRate * 100).toFixed(2)}%`}
              change="+0.5%"
              changeType="positive"
            />
          </div>
        </TabsContent>

        {/* Insights Tab */}
        <TabsContent value="insights" className="space-y-6">
          <AnalyticsInsights timeRange={selectedTimeRange} />
        </TabsContent>

        {/* Real-time Tab */}
        <TabsContent value="realtime" className="space-y-6">
          <RealTimeAnalyticsDashboard />
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Helper Components
interface MetricCardProps {
  icon: React.ElementType;
  title: string;
  value: string;
  change?: string;
  changeType?: "positive" | "negative";
}

const MetricCard = ({
  icon: Icon,
  title,
  value,
  change,
  changeType,
}: MetricCardProps) => (
  <Card className="bg-gray-950/50 border border-white/10">
    <CardContent className="p-4">
      <div className="flex items-center justify-between mb-2">
        <Icon className="w-5 h-5 text-cyan-400" />
        {change && (
          <Badge
            variant="secondary"
            className={cn(
              "text-xs font-mono",
              changeType === "positive"
                ? "text-green-400 bg-green-900/30"
                : "text-red-400 bg-red-900/30",
            )}
          >
            {change}
          </Badge>
        )}
      </div>
      <div className="text-2xl font-bold text-white font-mono">{value}</div>
      <div className="text-sm text-gray-400">{title}</div>
    </CardContent>
  </Card>
);

// Helper Functions
function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms.toFixed(0)}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${(ms / 60000).toFixed(1)}m`;
}

export default EnhancedAnalyticsTab;
