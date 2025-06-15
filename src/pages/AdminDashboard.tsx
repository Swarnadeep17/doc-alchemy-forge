
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
      <div className="max-w-2xl mx-auto mt-32 bg-white p-10 rounded shadow text-center">
        <h1 className="text-xl font-bold">Unauthorized</h1>
        <div>You do not have access to this page.</div>
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
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black flex flex-col items-center">
      <h1 className="text-3xl text-white font-bold mt-12 mb-6 font-mono">Admin Dashboard</h1>
      <div className="bg-white/90 rounded-lg shadow p-8 max-w-lg w-full mb-8">
        <h2 className="text-xl font-semibold mb-4">Create Promo Code</h2>
        <div className="flex gap-4 items-end">
          <div>
            <label className="block mb-2 font-mono text-xs text-gray-600">Target Role</label>
            <select
              value={targetRole}
              onChange={e => setTargetRole(e.target.value as any)}
              className="border p-2 rounded"
              disabled={creating}
            >
              <option value="premium">Premium</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <Button onClick={handleCreateCode} disabled={creating}>
            {creating ? "Creating..." : "Generate Code"}
          </Button>
        </div>
        {lastCode && (
          <div className="mt-4 bg-gray-100 p-3 rounded font-mono break-all">
            Code: <span className="text-cyan-700 font-semibold">{lastCode}</span>
          </div>
        )}
      </div>
      {/* Add more admin UI: stats, charts, code list, etc, in next steps */}
    </div>
  );
};

export default AdminDashboard;
