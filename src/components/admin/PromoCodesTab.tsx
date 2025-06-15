
import React, { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { ref, onValue, remove } from "firebase/database";
import { useAuth } from "@/context/AuthContext";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Trash2, Plus } from "lucide-react";

interface PromoCodeRecord {
  code: string;
  targetRole: "premium" | "admin";
  createdBy: string;
  createdAt: any;
  expiresAt: any;
  redeemed: boolean;
  redeemedBy?: string;
  redeemedAt?: any;
  type?: "permanent" | "one_time" | "expires_in";
  usesLeft?: number; // to manage one-time/permanent/limited
}

const EXPIRE_OPTIONS = [
  { value: "permanent", label: "Permanent" },
  { value: "one_time", label: "One-Time" },
  { value: "expires_in", label: "Expires In..." },
];

const EXPIRE_IN_PRESETS = [
  { value: 60 * 60 * 24, label: "1 day" },
  { value: 60 * 60 * 24 * 7, label: "7 days" },
  { value: 60 * 60 * 24 * 30, label: "30 days" }
];

const PromoCodesTab = () => {
  const { user, createPromoCode } = useAuth();
  const [promoCodes, setPromoCodes] = useState<Record<string, PromoCodeRecord>>({});
  const [loading, setLoading] = useState(true);
  const [creatingFor, setCreatingFor] = useState<"premium" | "admin">("premium");
  const [creating, setCreating] = useState(false);
  const [mode, setMode] = useState<"permanent" | "one_time" | "expires_in">("permanent");
  const [expireSeconds, setExpireSeconds] = useState(60 * 60 * 24 * 7);

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
      let expiresAt: number | undefined;
      let type: "permanent" | "one_time" | "expires_in" = mode;

      if (mode === "expires_in") {
        expiresAt = Date.now() + expireSeconds * 1000;
      }
      if (mode === "one_time") {
        // could also track usesLeft = 1
      }
      const code = await createPromoCode(creatingFor, { expiresAt, type });
      toast({ title: "Promo Code Created", description: code });
    } catch (err: any) {
      toast({ title: "Error", description: err.message });
    }
    setCreating(false);
  };

  const handleDeleteCode = async (code: string) => {
    if (!window.confirm("Delete code " + code + "?")) return;
    await remove(ref(db, `promoCodes/${code}`));
    toast({ title: "Deleted", description: "Promo code removed" });
  };

  // Prepare promoCodes as sorted array (newest first)
  const promoList: PromoCodeRecord[] = Object.values(promoCodes || {}).sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));

  return (
    <div className="animate-fade-in">
      <Card className="mb-8 bg-gray-900/70 border-cyan-400/20 shadow-lg">
        <CardHeader>
          <CardTitle className="text-white text-lg"><Plus className="inline-block mr-2 text-cyan-400" />Create Promo Code</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 items-center md:items-end">
            {/* Target Role Selector */}
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
            {/* Type Selector */}
            <div>
              <label className="block mb-1 font-mono text-xs text-white/70">Type</label>
              <select
                value={mode}
                onChange={e => setMode(e.target.value as any)}
                disabled={creating}
                className="border bg-black/30 border-cyan-600/30 text-white rounded p-2"
              >
                {EXPIRE_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            {/* Expire in selector */}
            {mode === "expires_in" && (
              <div>
                <label className="block mb-1 font-mono text-xs text-white/70">Expires In</label>
                <select
                  value={expireSeconds}
                  onChange={e => setExpireSeconds(Number(e.target.value))}
                  className="border bg-black/30 border-cyan-600/30 text-white rounded p-2"
                >
                  {EXPIRE_IN_PRESETS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            )}
            <Button
              onClick={handleCreatePromo}
              className="bg-cyan-600 text-white font-bold shadow-lg transition-all uppercase mt-2 md:mt-0"
              disabled={creating}
            >
              {creating ? "Creating..." : "Generate Code"}
            </Button>
          </div>
        </CardContent>
      </Card>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm bg-gray-900/90 border border-cyan-200/10 rounded shadow">
          <thead>
            <tr>
              <th className="py-2 px-3 text-left font-mono text-cyan-400">Code</th>
              <th className="py-2 px-3 text-left font-mono text-cyan-400">Target Role</th>
              <th className="py-2 px-3 text-left font-mono text-cyan-400">Type</th>
              <th className="py-2 px-3 text-left font-mono text-cyan-400">Created</th>
              <th className="py-2 px-3 text-left font-mono text-cyan-400">Status</th>
              <th className="py-2 px-3 text-left font-mono text-cyan-400">Redeemed By</th>
              <th className="py-2 px-3 text-left font-mono text-cyan-400">Expires</th>
              <th className="py-2 px-3"></th>
            </tr>
          </thead>
          <tbody>
            {promoList.map(code => (
              <tr key={code.code} className="border-b border-white/5 hover:bg-cyan-950/15 transition">
                <td className="py-2 px-3 font-mono text-white/90">{code.code}</td>
                <td className="py-2 px-3 text-white/90">{code.targetRole}</td>
                <td className="py-2 px-3 text-white/90">{code.type ?? "permanent"}</td>
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
                <td className="py-2 px-1 text-right">
                  <Button
                    variant="ghost"
                    size="icon"
                    title="Delete code"
                    className="hover:bg-red-500/30 hover:text-red-500"
                    onClick={() => handleDeleteCode(code.code)}
                  >
                    <Trash2 size={18} />
                  </Button>
                </td>
              </tr>
            ))}
            {!promoList.length && (
              <tr>
                <td colSpan={8} className="text-center text-cyan-400 py-6">No promo codes found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PromoCodesTab;
