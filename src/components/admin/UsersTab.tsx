import React, { useEffect, useMemo, useState } from "react";
import { db } from "@/lib/firebase";
import { ref, get, update } from "firebase/database";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Edit } from "lucide-react";
import { toast } from "@/hooks/use-toast";

type UserRole = "anonymous" | "free" | "premium" | "admin" | "superadmin";

interface AuthUserRecord {
  email?: string | null;
  displayName?: string | null;
  phoneNumber?: string | null;
  role: UserRole;
  promoCodeRedeemed?: string;
  upgradedAt?: any;
  uid?: string;
}

const UsersTab = () => {
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<AuthUserRecord[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    setLoading(true);
    setResults([]);
    // Fetch all users and filter by keyword (could optimize for large datasets)
    const snap = await get(ref(db, "users"));
    const allUsers: Record<string, AuthUserRecord> = snap.val() || {};
    const filtered: AuthUserRecord[] = Object.entries(allUsers)
      .filter(([uid, user]) => {
        const keyword = search.trim().toLowerCase();
        if (!keyword) return false;
        return (
          (user.email && user.email.toLowerCase().includes(keyword)) ||
          (user.displayName && user.displayName.toLowerCase().includes(keyword)) ||
          uid.toLowerCase().includes(keyword)
        );
      })
      .map(([uid, user]) => ({ ...user, uid }));
    setResults(filtered);
    setLoading(false);
  };

  const handleRoleChange = async (uid: string, newRole: "premium" | "admin") => {
    setLoading(true);
    await update(ref(db, `users/${uid}`), { role: newRole, upgradedAt: Date.now() });
    toast({ title: "User role updated", description: `User is now ${newRole}` });
    setResults(res => res.map(u => (u.uid === uid ? { ...u, role: newRole } : u)));
    setLoading(false);
  };

  return (
    <div className="animate-fade-in">
      <Card className="max-w-2xl mx-auto mb-6 bg-gray-900/70 shadow-lg">
        <CardContent className="py-6 flex flex-col gap-2">
          <div className="flex gap-2 items-center">
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") handleSearch(); }}
              placeholder="Search users by email, name, or UID"
              className="flex-1 text-white bg-gray-900 border-cyan-500/40 focus:border-cyan-400"
              disabled={loading}
              autoFocus
            />
            <Button onClick={handleSearch} disabled={loading || !search.trim()} className="bg-cyan-600 hover:bg-cyan-700 text-white px-4">
              <Search />
            </Button>
          </div>
          <div className="text-xs text-white/60 pl-1">Search finds users by email, display name, or UID.</div>
        </CardContent>
      </Card>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm bg-gray-900/90 border border-cyan-200/10 rounded shadow">
          <thead>
            <tr>
              <th className="py-2 px-3 text-left font-mono text-cyan-400">Email</th>
              <th className="py-2 px-3 text-left font-mono text-cyan-400">Display Name</th>
              <th className="py-2 px-3 text-left font-mono text-cyan-400">Phone</th>
              <th className="py-2 px-3 text-left font-mono text-cyan-400">Role</th>
              <th className="py-2 px-3 text-left font-mono text-cyan-400">Change Role</th>
            </tr>
          </thead>
          <tbody>
            {results.map((user) => (
              <tr key={user.uid} className="border-b border-white/5">
                <td className="py-2 px-3 text-white/90">{user.email ?? "—"}</td>
                <td className="py-2 px-3 text-white/80">{user.displayName ?? "—"}</td>
                <td className="py-2 px-3 text-white/80">{user.phoneNumber ?? "—"}</td>
                <td className="py-2 px-3 text-cyan-400 font-bold font-mono uppercase">{user.role}</td>
                <td className="py-2 px-3">
                  {user.role === "superadmin" ? (
                    <span className="text-purple-400 font-extrabold">Superadmin</span>
                  ) : user.role === "admin" ? (
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-blue-300 font-mono"
                      disabled
                    >
                      Admin
                    </Button>
                  ) : (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-cyan-500 font-mono mr-2"
                        onClick={() => handleRoleChange(user.uid!, "premium")}
                        disabled={user.role === "premium" || loading}
                      >
                        Set as Premium
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-blue-500 font-mono"
                        onClick={() => handleRoleChange(user.uid!, "admin")}
                        disabled={user.role !== "free" && user.role !== "premium"}
                      >
                        Set as Admin
                      </Button>
                    </>
                  )}
                </td>
              </tr>
            ))}
            {!results.length && (
              <tr>
                <td colSpan={5} className="text-center text-cyan-400 py-7">Search users above to view and edit roles.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UsersTab;
