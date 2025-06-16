// src/components/admin/PromoCodesTab.tsx

import React, { useEffect, useState, useMemo } from "react";
import { db } from "@/lib/firebase";
import { ref, onValue, remove, get, serverTimestamp } from "firebase/database";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Trash2, Plus, Users, Ticket, Check, X } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

interface PromoCodeRecord {
  code: string;
  targetRole: "premium" | "admin";
  createdBy: string;
  createdAt: number;
  expiresAt?: number;
  redeemed: boolean;
  redeemedBy?: string;
  redeemedAt?: number;
  type: "permanent" | "one_time" | "expires_in";
}

const PromoCodesTab = () => {
  const { user, createPromoCode } = useAuth();
  const [promoCodes, setPromoCodes] = useState<Record<string, PromoCodeRecord>>({});
  const [loading, setLoading] = useState(true);
  const [creatingFor, setCreatingFor] = useState<"premium" | "admin">("premium");
  const [creating, setCreating] = useState(false);
  const [mode, setMode] = useState<"permanent" | "one_time" | "expires_in">("one_time");
  const [expireSeconds, setExpireSeconds] = useState(60 * 60 * 24 * 7); // 7 days
  const [userNames, setUserNames] = useState<Record<string, string>>({});

  useEffect(() => {
    const promoCodesRef = ref(db, "promoCodes");
    const unsub = onValue(promoCodesRef, (snap) => {
      setLoading(false);
      setPromoCodes(snap.val() || {});
    });
    return () => unsub();
  }, []);

  const promoList = useMemo(() => {
    return Object.values(promoCodes).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  }, [promoCodes]);
  
  const kpiStats = useMemo(() => {
    const total = promoList.length;
    const redeemed = promoList.filter(p => p.redeemed).length;
    const active = total - redeemed;
    return { total, redeemed, active };
  }, [promoList]);

  useEffect(() => {
    const fetchUserNames = async () => {
      const userIds = [...new Set(promoList.map(code => code.createdBy).filter(Boolean))];
      const names: Record<string, string> = {};
      for (const userId of userIds) {
        try {
          const userSnap = await get(ref(db, `users/${userId}`));
          if (userSnap.exists()) names[userId] = userSnap.val().email || userSnap.val().displayName || userId;
          else names[userId] = userId;
        } catch (error) { names[userId] = userId; }
      }
      setUserNames(names);
    };
    if (promoList.length > 0) fetchUserNames();
  }, [promoList]);

  const handleCreatePromo = async () => {
    if (!user) return;
    setCreating(true);
    try {
      await createPromoCode({
        targetRole: creatingFor,
        type: mode,
        ...(mode === "expires_in" && { expiresAt: Date.now() + expireSeconds * 1000 }),
      });
      // Toast is now handled inside createPromoCode context function
    } catch (err: any) {
      toast({ title: "Error Creating Code", description: err.message, variant: "destructive" });
    }
    setCreating(false);
  };
  
  const handleDeleteCode = async (code: string) => {
    if (!window.confirm(`Are you sure you want to delete the code "${code}"? This cannot be undone.`)) return;
    await remove(ref(db, `promoCodes/${code}`));
    toast({ title: "Deleted", description: `Promo code ${code} removed.` });
  };

  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-white">Promo Code Management</h2>
        <p className="text-sm text-gray-400 mt-1">Generate and manage promotional codes for user role upgrades.</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KPICard icon={Ticket} title="Total Codes" value={kpiStats.total.toLocaleString()} />
        <KPICard icon={Check} title="Redeemed" value={kpiStats.redeemed.toLocaleString()} />
        <KPICard icon={Users} title="Active" value={kpiStats.active.toLocaleString()} />
      </div>

      <Card className="bg-gray-950/50 border border-white/10">
        <CardHeader><CardTitle className="text-lg text-white">Generate New Code</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
            <div>
              <label className="block mb-2 font-mono text-xs text-gray-300">Target Role</label>
              <select value={creatingFor} onChange={e => setCreatingFor(e.target.value as any)} disabled={creating} className="w-full border bg-gray-900 border-white/20 text-white rounded p-2 focus:ring-cyan-400 focus:border-cyan-400">
                <option value="premium">Premium</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div>
              <label className="block mb-2 font-mono text-xs text-gray-300">Code Type</label>
              <select value={mode} onChange={e => setMode(e.target.value as any)} disabled={creating} className="w-full border bg-gray-900 border-white/20 text-white rounded p-2 focus:ring-cyan-400 focus:border-cyan-400">
                <option value="one_time">One-Time Use</option>
                <option value="permanent">Permanent</option>
                <option value="expires_in">Expires In...</option>
              </select>
            </div>
            {mode === "expires_in" && (
              <div>
                <label className="block mb-2 font-mono text-xs text-gray-300">Expires In</label>
                <select value={expireSeconds} onChange={e => setExpireSeconds(Number(e.target.value))} className="w-full border bg-gray-900 border-white/20 text-white rounded p-2 focus:ring-cyan-400 focus:border-cyan-400">
                  <option value={60 * 60 * 24}>1 day</option>
                  <option value={60 * 60 * 24 * 7}>7 days</option>
                  <option value={60 * 60 * 24 * 30}>30 days</option>
                </select>
              </div>
            )}
            <Button onClick={handleCreatePromo} className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold" disabled={creating}>
              <Plus className="w-4 h-4 mr-2"/> {creating ? "Creating..." : "Generate"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gray-950/50 border border-white/10">
        <CardHeader><CardTitle className="text-lg text-white">Existing Codes</CardTitle></CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-b-white/10">
                  <TableHead className="text-gray-300 uppercase text-xs tracking-wider">Code</TableHead>
                  <TableHead className="text-gray-300 uppercase text-xs tracking-wider">Status</TableHead>
                  <TableHead className="text-gray-300 uppercase text-xs tracking-wider">Details</TableHead>
                  <TableHead className="text-gray-300 uppercase text-xs tracking-wider">Created</TableHead>
                  <TableHead className="text-right"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {promoList.map(code => (
                  <TableRow key={code.code} className="border-b-white/10">
                    <TableCell className="font-mono text-cyan-300">{code.code}</TableCell>
                    <TableCell>
                      {code.redeemed
                        ? <StatusBadge text="Used" icon={X} color="red" />
                        : (code.expiresAt && Date.now() > code.expiresAt)
                          ? <StatusBadge text="Expired" icon={X} color="red" />
                          : <StatusBadge text="Active" icon={Check} color="green" />
                      }
                    </TableCell>
                    <TableCell>
                      <p className="text-sm text-gray-200">For: <span className="font-semibold capitalize">{code.targetRole}</span></p>
                      <p className="text-xs text-gray-400">Type: <span className="capitalize">{code.type.replace('_', '-')}</span></p>
                      {code.expiresAt && <p className="text-xs text-gray-400">Expires: {new Date(code.expiresAt).toLocaleString()}</p>}
                    </TableCell>
                    <TableCell className="text-xs">
                      <p className="text-gray-300">{userNames[code.createdBy] || '...'}</p>
                      <p className="text-gray-400">{new Date(code.createdAt).toLocaleDateString()}</p>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" title="Delete code" className="hover:bg-red-900/50 text-gray-400 hover:text-red-400" onClick={() => handleDeleteCode(code.code)}>
                        <Trash2 size={16} />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {!promoList.length && (
                  <TableRow className="border-none hover:bg-transparent">
                    <TableCell colSpan={5} className="h-24 text-center text-gray-500">No promo codes found.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// --- Helper Components ---
const KPICard = ({ icon: Icon, title, value }) => (
    <Card className="bg-gray-900 border border-white/10">
        <CardContent className="p-4">
            <div className="flex items-center gap-4">
                <div className="p-3 bg-gray-800 rounded-lg"><Icon className="w-6 h-6 text-cyan-400" /></div>
                <div>
                    <p className="text-sm text-gray-400">{title}</p>
                    <p className="text-2xl font-bold text-white">{value}</p>
                </div>
            </div>
        </CardContent>
    </Card>
);

const StatusBadge = ({text, icon: Icon, color}) => (
    <span className={cn(
        "inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-semibold",
        color === 'green' && 'bg-green-900/60 text-green-300',
        color === 'red' && 'bg-red-900/60 text-red-400'
    )}>
        <Icon className="w-3 h-3" /> {text}
    </span>
);

export default PromoCodesTab;