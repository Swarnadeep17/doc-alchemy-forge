// src/pages/AdminDashboard.tsx

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import AnalyticsTab from "@/components/admin/AnalyticsTab";
import EnhancedAnalyticsTab from "@/components/admin/EnhancedAnalyticsTab";
import ToolDetailTab from "@/components/admin/ToolDetailTab"; // <-- IMPORT NEW TAB
import PromoCodesTab from "@/components/admin/PromoCodesTab";
import UsersTab from "@/components/admin/UsersTab";
import { Button } from "@/components/ui/button";
import {
  LogOut,
  Home,
  BarChart2,
  Ticket,
  Users,
  TestTube2,
  TrendingUp,
} from "lucide-react"; // <-- IMPORT NEW ICON
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";

const TABS = [
  { key: "analytics", label: "Overview", icon: BarChart2 },
  { key: "enhanced-analytics", label: "Enhanced Analytics", icon: TrendingUp },
  { key: "tool-details", label: "Tool Details", icon: TestTube2 }, // <-- ADD NEW TAB
  { key: "promocodes", label: "Promo Codes", icon: Ticket },
  { key: "users", label: "Users", icon: Users },
] as const;

type TabKey = (typeof TABS)[number]["key"];

const AdminDashboard = () => {
  const { user, logout, loading } = useAuth();
  const [selectedTab, setSelectedTab] = useState<TabKey>("analytics");
  const navigate = useNavigate();

  useEffect(() => {
    if (
      !loading &&
      (!user || (user.role !== "admin" && user.role !== "superadmin"))
    ) {
      toast({
        title: "Access Denied",
        description: "You must be an admin to view this page.",
        variant: "destructive",
      });
      navigate("/");
    }
  }, [user, loading, navigate]);

  const handleLogout = async () => {
    try {
      await logout();
      toast({ title: "Logged out successfully" });
      navigate("/");
    } catch (error) {
      toast({ title: "Logout failed", description: "Please try again" });
    }
  };

  if (
    loading ||
    !user ||
    (user.role !== "admin" && user.role !== "superadmin")
  ) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <span className="text-cyan-400 animate-pulse text-xl font-mono font-bold">
          Verifying Access...
        </span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black w-full py-8 px-4">
      <div className="w-full max-w-7xl mx-auto bg-gray-900/95 border border-cyan-400/30 shadow-2xl shadow-cyan-500/10 rounded-xl p-6 md:p-10 animate-fade-in">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl text-white font-bold font-mono tracking-widest uppercase">
              Admin Dashboard
            </h1>
            <p className="text-cyan-400 text-sm font-mono mt-1">{user.email}</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => navigate("/")}
              className="border-cyan-500 text-cyan-400 hover:bg-cyan-500/10 font-mono"
            >
              <Home className="w-4 h-4 mr-2" /> Home
            </Button>
            <Button
              variant="outline"
              onClick={handleLogout}
              className="border-red-500 text-red-400 hover:bg-red-500/10 font-mono"
            >
              <LogOut className="w-4 h-4 mr-2" /> Logout
            </Button>
          </div>
        </header>

        <div className="flex gap-2 mb-8 justify-center border-b border-white/10 pb-4 overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 font-mono font-semibold text-base uppercase transition-all flex-shrink-0
                ${
                  selectedTab === tab.key
                    ? "bg-cyan-500 text-black shadow-lg shadow-cyan-500/30"
                    : "bg-black/30 text-white/80 hover:bg-gray-800/70"
                }
              `}
              onClick={() => setSelectedTab(tab.key)}
            >
              <tab.icon className="w-5 h-5" />
              {tab.label}
            </button>
          ))}
        </div>

        <main className="mt-4">
          {selectedTab === "analytics" && <AnalyticsTab />}
          {selectedTab === "enhanced-analytics" && <EnhancedAnalyticsTab />}
          {selectedTab === "tool-details" && <ToolDetailTab />}
          {selectedTab === "promocodes" && <PromoCodesTab />}
          {selectedTab === "users" && <UsersTab />}
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
