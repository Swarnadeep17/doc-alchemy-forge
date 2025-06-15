
import React, { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { ref, onValue } from "firebase/database";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

type UserRole = "anonymous" | "free" | "premium" | "admin" | "superadmin";

interface AuthUserRecord {
  email?: string | null;
  displayName?: string | null;
  phoneNumber?: string | null;
  role: UserRole;
  promoCodeRedeemed?: string;
  upgradedAt?: any;
}

const roleLabels: Record<UserRole, string> = {
  anonymous: "Anonymous",
  free: "Free",
  premium: "Premium",
  admin: "Admin",
  superadmin: "Superadmin",
};

const UsersTab = () => {
  const [users, setUsers] = useState<Record<string, AuthUserRecord>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const usersRef = ref(db, "users");
    const unsub = onValue(usersRef, (snap) => {
      setUsers(snap.val() || {});
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const roleCounts: Record<UserRole, number> = {
    anonymous: 0, free: 0, premium: 0, admin: 0, superadmin: 0
  };
  Object.values(users).forEach(u => { roleCounts[u.role] = (roleCounts[u.role] || 0) + 1; });

  return (
    <div>
      <div className="flex flex-wrap gap-4 mb-8">
        {Object.entries(roleCounts).map(([role, count]) => (
          <Card key={role} className="flex-1 min-w-[140px] bg-gray-900 border-cyan-400/20 shadow">
            <CardHeader>
              <CardTitle className="text-white text-base font-mono">{roleLabels[role as UserRole]}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl text-cyan-400 font-mono">{count}</div>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm bg-gray-900/60 border border-cyan-200/10 rounded">
          <thead>
            <tr>
              <th className="py-2 px-3 text-left font-mono text-cyan-400">Email</th>
              <th className="py-2 px-3 text-left font-mono text-cyan-400">Display Name</th>
              <th className="py-2 px-3 text-left font-mono text-cyan-400">Phone</th>
              <th className="py-2 px-3 text-left font-mono text-cyan-400">Role</th>
              <th className="py-2 px-3 text-left font-mono text-cyan-400">Promo Code</th>
              <th className="py-2 px-3 text-left font-mono text-cyan-400">Upgraded At</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(users).map(([uid, user]) => (
              <tr key={uid} className="border-b border-white/5">
                <td className="py-2 px-3 text-white/90">{user.email ?? "—"}</td>
                <td className="py-2 px-3 text-white/80">{user.displayName ?? "—"}</td>
                <td className="py-2 px-3 text-white/80">{user.phoneNumber ?? "—"}</td>
                <td className="py-2 px-3">
                  <span className="px-2 py-1 rounded text-xs font-semibold"
                    style={{background: "#0e7490", color: "#fff"}}>{roleLabels[user.role]}</span>
                </td>
                <td className="py-2 px-3 text-white/80">{user.promoCodeRedeemed ?? "—"}</td>
                <td className="py-2 px-3 text-white/80">
                  {user.upgradedAt ? new Date(user.upgradedAt).toLocaleString() : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {loading && <div className="text-center text-cyan-400 py-8">Loading users...</div>}
      </div>
    </div>
  );
};

export default UsersTab;
