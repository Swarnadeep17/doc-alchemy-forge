// src/components/admin/RealTimeAnalyticsDashboard.tsx

import React, { useEffect, useState } from "react";
import {
  useRealTimeAnalytics,
  useLiveUserCount,
} from "@/hooks/useEnhancedAnalytics";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Activity,
  Users,
  AlertTriangle,
  Zap,
  TrendingUp,
  Clock,
  MousePointer,
  Wifi,
  WifiOff,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const RealTimeAnalyticsDashboard: React.FC = () => {
  const realTimeData = useRealTimeAnalytics();
  const liveUserCount = useLiveUserCount();
  const [connectionStatus, setConnectionStatus] = useState<
    "connected" | "disconnected" | "connecting"
  >("connecting");
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  useEffect(() => {
    if (realTimeData) {
      setConnectionStatus("connected");
      setLastUpdate(new Date());
    }
  }, [realTimeData]);

  useEffect(() => {
    // Monitor connection status
    const handleOnline = () => setConnectionStatus("connected");
    const handleOffline = () => setConnectionStatus("disconnected");

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (!realTimeData) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400 mx-auto"></div>
            <p className="mt-2 text-cyan-400 text-sm">
              Connecting to real-time data...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Connection Status Header */}
      <div className="flex items-center justify-between p-4 bg-gray-900/50 rounded-lg border border-gray-700">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "w-3 h-3 rounded-full",
              connectionStatus === "connected"
                ? "bg-green-400 animate-pulse"
                : connectionStatus === "connecting"
                  ? "bg-yellow-400 animate-pulse"
                  : "bg-red-400",
            )}
          />
          <span className="text-white font-mono text-sm uppercase">
            {connectionStatus === "connected"
              ? "LIVE"
              : connectionStatus === "connecting"
                ? "CONNECTING"
                : "OFFLINE"}
          </span>
          {connectionStatus === "connected" ? (
            <Wifi className="w-4 h-4 text-green-400" />
          ) : (
            <WifiOff className="w-4 h-4 text-red-400" />
          )}
        </div>
        <div className="text-gray-400 text-xs font-mono">
          Last update: {lastUpdate.toLocaleTimeString()}
        </div>
      </div>

      {/* Real-time Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <RealTimeMetricCard
          icon={Users}
          title="Active Users"
          value={liveUserCount}
          change="+2"
          changeType="positive"
          pulse={true}
        />
        <RealTimeMetricCard
          icon={Activity}
          title="Tools in Use"
          value={realTimeData.liveToolUsage.length}
          change="+1"
          changeType="positive"
        />
        <RealTimeMetricCard
          icon={AlertTriangle}
          title="Recent Errors"
          value={realTimeData.recentErrors.length}
          change="0"
          changeType="neutral"
        />
        <RealTimeMetricCard
          icon={TrendingUp}
          title="Activity Score"
          value={calculateActivityScore(realTimeData, liveUserCount)}
          change="+5%"
          changeType="positive"
        />
      </div>

      {/* Live Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Live Tool Usage */}
        <Card className="bg-gray-950/50 border border-white/10">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-cyan-400" />
              Live Tool Usage
              <Badge
                variant="secondary"
                className="bg-cyan-900/30 text-cyan-300"
              >
                {realTimeData.liveToolUsage.length} active
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="max-h-64 overflow-y-auto">
            <div className="space-y-2">
              {realTimeData.liveToolUsage.length > 0 ? (
                realTimeData.liveToolUsage.map((usage, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 bg-gray-800/30 rounded animate-fade-in"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                      <span className="text-gray-300 font-mono text-sm">
                        {usage.tool}
                      </span>
                    </div>
                    <span className="text-gray-400 text-xs">
                      {getRelativeTime(usage.timestamp)}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <MousePointer className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No active tool usage</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Errors */}
        <Card className="bg-gray-950/50 border border-white/10">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-400" />
              Recent Errors
              <Badge
                variant="secondary"
                className={cn(
                  realTimeData.recentErrors.length > 0
                    ? "bg-red-900/30 text-red-300"
                    : "bg-gray-800 text-gray-400",
                )}
              >
                {realTimeData.recentErrors.length} errors
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="max-h-64 overflow-y-auto">
            <div className="space-y-2">
              {realTimeData.recentErrors.length > 0 ? (
                realTimeData.recentErrors.map((error, index) => (
                  <div
                    key={index}
                    className="p-2 bg-red-900/20 border border-red-400/30 rounded animate-fade-in"
                  >
                    <div className="text-red-300 text-sm font-mono">
                      {error.message}
                    </div>
                    <div className="text-gray-400 text-xs mt-1">
                      {getRelativeTime(error.timestamp)}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <Zap className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No recent errors</p>
                  <p className="text-xs mt-1">System running smoothly</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Indicators */}
      <Card className="bg-gray-950/50 border border-white/10">
        <CardHeader>
          <CardTitle className="text-white">System Health</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-300">Error Rate</span>
                <span className="text-white font-mono">
                  {calculateErrorRate(realTimeData)}%
                </span>
              </div>
              <Progress
                value={calculateErrorRate(realTimeData)}
                className="h-2"
              />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-300">Activity Level</span>
                <span className="text-white font-mono">
                  {getActivityLevel(realTimeData, liveUserCount)}
                </span>
              </div>
              <Progress
                value={getActivityLevelPercentage(realTimeData, liveUserCount)}
                className="h-2"
              />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-300">System Status</span>
                <span
                  className={cn(
                    "text-sm font-mono",
                    realTimeData.recentErrors.length === 0
                      ? "text-green-400"
                      : "text-yellow-400",
                  )}
                >
                  {realTimeData.recentErrors.length === 0
                    ? "HEALTHY"
                    : "MONITORING"}
                </span>
              </div>
              <Progress
                value={realTimeData.recentErrors.length === 0 ? 100 : 75}
                className="h-2"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Helper Components
interface RealTimeMetricCardProps {
  icon: React.ElementType;
  title: string;
  value: number | string;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  pulse?: boolean;
}

const RealTimeMetricCard: React.FC<RealTimeMetricCardProps> = ({
  icon: Icon,
  title,
  value,
  change,
  changeType,
  pulse,
}) => (
  <Card className="bg-gray-950/50 border border-white/10">
    <CardContent className="p-4">
      <div className="flex items-center justify-between mb-2">
        <Icon
          className={cn("w-5 h-5 text-cyan-400", pulse && "animate-pulse")}
        />
        {change && (
          <Badge
            variant="secondary"
            className={cn(
              "text-xs font-mono",
              changeType === "positive"
                ? "text-green-400 bg-green-900/30"
                : changeType === "negative"
                  ? "text-red-400 bg-red-900/30"
                  : "text-gray-400 bg-gray-800/30",
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
function getRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;

  if (diff < 60000) return `${Math.floor(diff / 1000)}s ago`;
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  return `${Math.floor(diff / 3600000)}h ago`;
}

function calculateActivityScore(
  realTimeData: any,
  liveUserCount: number,
): number {
  const toolUsageScore = Math.min(realTimeData.liveToolUsage.length * 10, 50);
  const userScore = Math.min(liveUserCount * 5, 30);
  const errorPenalty = realTimeData.recentErrors.length * 5;

  return Math.max(0, Math.min(100, toolUsageScore + userScore - errorPenalty));
}

function calculateErrorRate(realTimeData: any): number {
  const totalEvents =
    realTimeData.liveToolUsage.length + realTimeData.recentErrors.length;
  if (totalEvents === 0) return 0;
  return (realTimeData.recentErrors.length / totalEvents) * 100;
}

function getActivityLevel(realTimeData: any, liveUserCount: number): string {
  const score = calculateActivityScore(realTimeData, liveUserCount);
  if (score >= 80) return "HIGH";
  if (score >= 50) return "MEDIUM";
  if (score >= 20) return "LOW";
  return "IDLE";
}

function getActivityLevelPercentage(
  realTimeData: any,
  liveUserCount: number,
): number {
  return calculateActivityScore(realTimeData, liveUserCount);
}

export default RealTimeAnalyticsDashboard;
