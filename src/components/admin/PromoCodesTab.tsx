
import React, { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { ref, onValue } from "firebase/database";
import { useAuth } from "@/context/AuthContext";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

interface PromoCodeRecord {
  code: string;
  targetRole: "premium" | "admin";
  createdBy: string;
  createdAt: any;
  expiresAt: any;
  redeemed: boolean;
  redeemedBy?: string;
  redeemedAt?: any;
}

const PromoCodesTab = () => {
  const { user, createPromoCode } = useAuth();
  const [promoCodes, setPromoCodes] = useState<Record<string, PromoCodeRecord>>({});
  const [loading, setLoading] = useState(true);
  const [creatingFor, setCreatingFor] = useState<"premium" | "admin">("premium");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    const promoCodesRef = ref(db, "promoCodes");
    const unsub = onValue(promoCodesRef, (snap) => {
      setLoading(false);
      setPromoCodes(snap.val() || {});
    });
    return () => unsub();
  }, []);

  const handleCreatePromo = async () => {
    setCreating(true);
    try {
      const code = await createPromoCode(creatingFor);
      toast({ title: "Promo Code Created", description: code });
    } catch (err: any) {
      toast({ title: "Error", description: err.message });
    }
    setCreating(false);
  };

  // Prepare promoCodes as sorted array (newest first)
  const promoList: PromoCodeRecord[] = Object.values(promoCodes || {}).sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));

  return (
    <div>
      <Card className="mb-8 bg-gray-900 border-cyan-400/20 shadow">
        <CardHeader>
          <CardTitle className="text-white text-lg">Create Promo Code</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div>
              <label className="block mb-1 font-mono text-xs text-white/70">Target Role</label>
              <select
                value={creatingFor}
                onChange={e => setCreatingFor(e.target.value as any)}
                disabled={creating}
                className="border bg-black/30 border-cyan-600/30 text-white rounded p-2"
              >
                <option value="premium">Premium</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <Button
              onClick={handleCreatePromo}
              className="bg-black hover:bg-gray-800 text-white font-bold shadow transition-all uppercase"
              disabled={creating}
            >
              {creating ? "Creating..." : "Generate Code"}
            </Button>
          </div>
        </CardContent>
      </Card>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm bg-gray-900/60 border border-cyan-200/10 rounded">
          <thead>
            <tr>
              <th className="py-2 px-3 text-left font-mono text-cyan-400">Code</th>
              <th className="py-2 px-3 text-left font-mono text-cyan-400">Target Role</th>
              <th className="py-2 px-3 text-left font-mono text-cyan-400">Created</th>
              <th className="py-2 px-3 text-left font-mono text-cyan-400">Status</th>
              <th className="py-2 px-3 text-left font-mono text-cyan-400">Redeemed By</th>
              <th className="py-2 px-3 text-left font-mono text-cyan-400">Expires</th>
            </tr>
          </thead>
          <tbody>
            {promoList.map(code => (
              <tr key={code.code} className="border-b border-white/5">
                <td className="py-2 px-3 font-mono text-white/90">{code.code}</td>
                <td className="py-2 px-3 text-white/90">{code.targetRole}</td>
                <td className="py-2 px-3 text-white/90">
                  {code.createdAt ? new Date(code.createdAt).toLocaleString() : "—"}
                </td>
                <td className="py-2 px-3">
                  {code.redeemed
                    ? <span className="text-emerald-400 font-semibold">Used</span>
                    : code.expiresAt && Date.now() > code.expiresAt
                      ? <span className="text-red-400 font-semibold">Expired</span>
                      : <span className="text-cyan-400">Active</span>}
                </td>
                <td className="py-2 px-3 text-white/90">{code.redeemedBy ?? "—"}</td>
                <td className="py-2 px-3 text-white/90">
                  {code.expiresAt ? new Date(code.expiresAt).toLocaleString() : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PromoCodesTab;
