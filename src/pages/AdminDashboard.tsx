
import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import AnalyticsTab from "@/components/admin/AnalyticsTab";
import PromoCodesTab from "@/components/admin/PromoCodesTab";
import UsersTab from "@/components/admin/UsersTab";

const TABS = [
  { key: "analytics", label: "Analytics" },
  { key: "promocodes", label: "Promo Codes" },
  { key: "users", label: "Users" },
];

const AdminDashboard = () => {
  const { user } = useAuth();
  const [selectedTab, setSelectedTab] = useState("analytics");
  // improved: Don't show dashboard/unauthorized till user is loaded.
  const [checkedAuth, setCheckedAuth] = useState(false);

  useEffect(() => {
    if (user !== undefined) setCheckedAuth(true);
  }, [user]);

  if (!checkedAuth) {
    // loading spinner for better UX
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <span className="text-cyan-400 animate-pulse text-xl font-mono font-bold">Loading...</span>
      </div>
    );
  }

  if (!user || (user.role !== "admin" && user.role !== "superadmin")) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black flex flex-col items-center justify-center px-2">
        <div className="w-full max-w-xl mx-auto bg-gray-900/95 border border-red-500/30 shadow-xl rounded-xl p-10 text-center animate-fade-in">
          <h1 className="text-2xl font-bold text-red-500 mb-2 font-mono tracking-widest">Unauthorized</h1>
          <div className="text-white/80">You do not have access to this page.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black flex flex-col items-center justify-center px-2 py-8 w-full">
      <div className="w-full max-w-6xl mx-auto bg-gray-900/95 border border-cyan-400/30 shadow-lg rounded-xl p-10 animate-fade-in">
        <h1 className="text-3xl text-white font-bold font-mono mb-6 tracking-widest uppercase text-center">Admin Dashboard</h1>
        <div className="flex gap-2 mb-8 justify-center">
          {TABS.map(tab => (
            <button
              key={tab.key}
              className={`px-6 py-2 rounded font-mono font-semibold text-base uppercase transition-all
                ${selectedTab === tab.key
                  ? "bg-cyan-500 text-black shadow"
                  : "bg-black text-white hover:bg-gray-800"}
              `}
              onClick={() => setSelectedTab(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="mt-4">
          {selectedTab === "analytics" && <AnalyticsTab />}
          {selectedTab === "promocodes" && <PromoCodesTab />}
          {selectedTab === "users" && <UsersTab />}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
