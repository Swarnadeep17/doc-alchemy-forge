// src/components/admin/UsersTab.tsx

import React, { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { ref, get, update } from "firebase/database";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";

export type UserRole = "anonymous" | "free" | "premium" | "admin" | "superadmin";

export interface AuthUserRecord {
  email?: string | null;
  displayName?: string | null;
  phoneNumber?: string | null;
  role: UserRole;
  promoCodeRedeemed?: string;
  upgradedAt?: number;
  lastModifiedBy?: string;
  lastModifiedAt?: number;
  uid?: string;
}

const roleStyles = {
  free: "bg-gray-700/70 text-gray-300 border-gray-600",
  premium: "bg-purple-800/50 text-purple-300 border-purple-600",
  admin: "bg-blue-800/50 text-blue-300 border-blue-600",
  superadmin: "bg-fuchsia-800/60 text-fuchsia-300 border-fuchsia-500",
  anonymous: "bg-gray-800/50 text-gray-500 border-gray-700",
};

const UsersTab = () => {
  const { user: currentUser } = useAuth();
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<AuthUserRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [adminNames, setAdminNames] = useState<Record<string, string>>({});

  const getAvailableRoles = (currentUserRole: UserRole): UserRole[] => {
    if (currentUserRole === "superadmin") return ["free", "premium", "admin"];
    if (currentUserRole === "admin") return ["free", "premium"];
    return [];
  };

  const handleSearch = async () => {
    if (!search.trim()) {
      toast({ title: "Invalid Search", description: "Please enter a search term.", variant: "destructive" });
      return;
    }
    setLoading(true);
    setResults([]);
    try {
      if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'superadmin')) throw new Error("Unauthorized access");
      const keyword = search.trim().toLowerCase();
      const snap = await get(ref(db, "users"));
      if (!snap.exists()) {
        setResults([]);
        return;
      }
      const allUsers = snap.val() as Record<string, AuthUserRecord>;
      const filtered = Object.entries(allUsers)
        .filter(([uid, user]) => {
          if (user.role === "superadmin") return false;
          if (currentUser.role === "admin" && (user.role === "admin" || user.role === "superadmin")) return false;
          return (
            (user.email && user.email.toLowerCase().includes(keyword)) ||
            (user.displayName && user.displayName.toLowerCase().includes(keyword)) ||
            uid.toLowerCase().includes(keyword)
          );
        })
        .map(([uid, user]) => ({ ...user, uid }));
      setResults(filtered);
      if (filtered.length === 0) toast({ title: "No Results", description: "No users found matching your search.", variant: "destructive" });
    } catch (error: any) {
      toast({ title: "Search Failed", description: error.message || "Permission denied.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchAdminNames = async () => {
      const adminIds = [...new Set(results.map(u => u.lastModifiedBy).filter(Boolean))];
      const names: Record<string, string> = {};
      for (const adminId of adminIds) {
        try {
          const adminSnap = await get(ref(db, `users/${adminId}`));
          if (adminSnap.exists()) {
            const adminData = adminSnap.val();
            names[adminId] = adminData.email || adminData.displayName || adminId;
          } else {
            names[adminId] = adminId;
          }
        } catch (error) { names[adminId] = adminId; }
      }
      setAdminNames(names);
    };
    if (results.length > 0) fetchAdminNames();
  }, [results]);

  const handleRoleChange = async (uid: string, newRole: UserRole) => {
    if (!currentUser) return;
    const canChangeRole = getAvailableRoles(currentUser.role).includes(newRole);
    if (!canChangeRole) {
      toast({ title: "Permission Denied", description: `You cannot assign ${newRole} role.`, variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      await update(ref(db, `users/${uid}`), {
        role: newRole,
        upgradedAt: Date.now(),
        lastModifiedBy: currentUser.uid,
        lastModifiedAt: Date.now()
      });
      toast({ title: "User role updated", description: `User is now ${newRole}` });
      setResults(res => res.map(u => (u.uid === uid ? { ...u, role: newRole, lastModifiedBy: currentUser.uid, lastModifiedAt: Date.now() } : u)));
    } catch (error: any) {
      toast({ title: "Update Failed", description: error.message || "Failed to update user role.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-white">User Management</h2>
        <p className="text-sm text-gray-400 mt-1">Search for users and manage their roles and permissions.</p>
      </div>
      <Card className="bg-gray-950/50 border border-white/10">
        <CardContent className="py-6 flex flex-col gap-2">
          <div className="flex gap-2 items-center">
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") handleSearch(); }}
              placeholder="Search users by email, name, or UID"
              className="flex-1 text-white bg-gray-900 border-white/20 focus:border-cyan-400 focus:ring-cyan-400"
              disabled={loading}
              autoFocus
            />
            <Button onClick={handleSearch} disabled={loading || !search.trim()} className="bg-cyan-600 hover:bg-cyan-700 text-white px-4">
              <Search />
            </Button>
          </div>
        </CardContent>
      </Card>
      <Card className="bg-gray-950/50 border border-white/10">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-b-white/10">
                  <TableHead className="text-gray-300 uppercase text-xs tracking-wider">User</TableHead>
                  <TableHead className="text-gray-300 uppercase text-xs tracking-wider">Role</TableHead>
                  <TableHead className="text-gray-300 uppercase text-xs tracking-wider">Last Modified</TableHead>
                  <TableHead className="text-gray-300 uppercase text-xs tracking-wider">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {results.map((user) => (
                  <TableRow key={user.uid} className="border-b-white/10">
                    <TableCell>
                      <p className="font-medium text-gray-200">{user.displayName || user.email}</p>
                      <p className="text-xs text-gray-400">{user.displayName ? user.email : user.uid}</p>
                    </TableCell>
                    <TableCell>
                      <span className={cn("px-2 py-1 rounded-md text-xs font-bold font-mono uppercase border", roleStyles[user.role])}>
                        {user.role}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs text-gray-400">
                      {user.lastModifiedBy ? (
                        <>
                          <p className="text-gray-300">{adminNames[user.lastModifiedBy] || user.lastModifiedBy}</p>
                          <p>{new Date(user.lastModifiedAt).toLocaleString()}</p>
                        </>
                      ) : "—"}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {getAvailableRoles(currentUser.role).map((role) => (
                          <Button
                            key={role}
                            size="sm"
                            variant={user.role === role ? "default" : "outline"}
                            className={cn("font-mono text-xs", user.role !== role && "border-gray-600 text-gray-300 hover:bg-white/10 hover:text-white", user.role === role && "bg-cyan-600 hover:bg-cyan-700")}
                            onClick={() => handleRoleChange(user.uid, role)}
                            disabled={user.role === role || loading}
                          >
                            {role}
                          </Button>
                        ))}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {!results.length && (
                  <TableRow className="border-none hover:bg-transparent">
                    <TableCell colSpan={4} className="h-24 text-center text-gray-500">
                      Search for a user to begin.
                    </TableCell>
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

export default UsersTab;