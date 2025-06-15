import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

const AdminDashboard = () => {
  const { user, createPromoCode } = useAuth();
  const [targetRole, setTargetRole] = useState<"premium" | "admin">("premium");
  const [creating, setCreating] = useState(false);
  const [lastCode, setLastCode] = useState<string | null>(null);

  if (!user || (user.role !== "admin" && user.role !== "superadmin")) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black flex flex-col items-center justify-center px-2">
        <div className="w-full max-w-xl mx-auto bg-gray-900/95 border border-red-500/30 shadow-xl rounded-xl p-10 text-center">
          <h1 className="text-2xl font-bold text-red-500 mb-2 font-mono tracking-widest">Unauthorized</h1>
          <div className="text-white/80">You do not have access to this page.</div>
        </div>
      </div>
    );
  }

  const handleCreateCode = async () => {
    setCreating(true);
    try {
      const code = await createPromoCode(targetRole);
      setLastCode(code);
      toast({ title: "Promo code created!", description: code });
    } catch (err: any) {
      toast({ title: "Error", description: err.message });
    }
    setCreating(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black flex flex-col items-center justify-center px-2 py-8 w-full">
      <div className="w-full max-w-lg mx-auto bg-gray-900/95 border border-cyan-400/30 shadow-lg rounded-xl p-10">
        <h1 className="text-3xl text-white font-bold font-mono mb-6 tracking-widest uppercase text-center">Admin Dashboard</h1>
        <div className="bg-white/10 rounded-lg shadow p-8 mb-8">
          <h2 className="text-xl text-cyan-300 font-semibold mb-4 font-mono uppercase">Create Promo Code</h2>
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1">
              <label className="block mb-2 font-mono text-xs text-white/70">Target Role</label>
              <select
                value={targetRole}
                onChange={e => setTargetRole(e.target.value as any)}
                className="border bg-black/30 border-cyan-600/30 text-white rounded p-2 w-full"
                disabled={creating}
              >
                <option value="premium">Premium</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <Button
              onClick={handleCreateCode}
              disabled={creating}
              className="bg-cyan-700 hover:bg-cyan-600 text-white font-semibold mt-4 md:mt-0 shadow transition-all uppercase"
            >
              {creating ? "Creating..." : "Generate Code"}
            </Button>
          </div>
          {lastCode && (
            <div className="mt-4 bg-cyan-900/80 p-3 rounded font-mono break-all text-cyan-200 border border-cyan-500/20">
              Code: <span className="text-cyan-300 font-semibold">{lastCode}</span>
            </div>
          )}
        </div>
        {/* Add more admin UI: stats, charts, code list, etc, in next steps */}
      </div>
    </div>
  );
};

export default AdminDashboard;
