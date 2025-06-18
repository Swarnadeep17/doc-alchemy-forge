import React, { useEffect, useState } from "react";
import { useIsMobile } from "../../hooks/use-mobile";
import { db } from "../../lib/firebase";
import { ref, get, update } from "firebase/database";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";
import { Search } from "lucide-react";
import { toast } from "../../hooks/use-toast";
import { useAuth } from "../../context/AuthContext";
import { cn } from "../../lib/utils";

export type UserRole = "anonymous" | "free" | "premium" | "admin" | "superadmin";
type AdminRole = Extract<UserRole, "admin" | "superadmin">;

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
  const { user } = useAuth() as { user: AuthUserRecord | null };
  const currentUser = user;
  
  const isAdminUser = (user: AuthUserRecord | null): user is AuthUserRecord & { role: AdminRole } => {
    return !!user && (user.role === 'admin' || user.role === 'superadmin');
  };
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<AuthUserRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [adminNames, setAdminNames] = useState<Record<string, string>>({});

  const getAvailableRoles = (currentUserRole: UserRole): UserRole[] => {
    if (!currentUser) return [];
    
    switch(currentUserRole) {
      case "superadmin":
        return ["free", "premium", "admin", "superadmin"];
      case "admin":
        return ["free", "premium"];
      case "anonymous":
        return [];
      default:
        return ["free"];
    }
  };

  const canModifyUser = (targetUser: AuthUserRecord): boolean => {
    if (!isAdminUser(currentUser)) return false;
    if (targetUser.role === "superadmin") return false;
    if (currentUser.role === "admin" && targetUser.role === "admin") return false;
    return true;
  };

  const handleSearch = async () => {
    if (!search.trim()) {
      toast({ title: "Invalid Search", description: "Please enter a search term.", variant: "destructive" });
      return;
    }
    setLoading(true);
    setResults([]);
    try {
      if (!isAdminUser(currentUser)) {
        throw new Error("Unauthorized access");
      }
      const keyword = search.trim().toLowerCase();
      const snap = await get(ref(db, "users"));
      if (!snap.exists()) {
        setResults([]);
        return;
      }
      const allUsers = snap.val() as Record<string, AuthUserRecord>;
      const filtered = Object.entries(allUsers)
        .filter(([uid, user]) => {
          if (!canModifyUser(user)) return false;
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
    } catch (error: any) {
      toast({ title: "Update Failed", description: error.message || "Failed to update user role.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const isMobile = useIsMobile();
  
  return (
    <div className={cn("animate-fade-in space-y-4", isMobile && "px-4")}>
      <div className={cn(isMobile ? "mb-3" : "mb-4")}>
        <h2 className={cn("font-semibold text-white", isMobile ? "text-xl" : "text-2xl")}>User Management</h2>
        <p className={cn("text-gray-400", isMobile ? "text-xs mt-1" : "text-sm mt-1")}>
          {isMobile ? "Manage user roles" : "Search for users and manage their roles and permissions."}
        </p>
      </div>
      <Card className="bg-gray-950/50 border border-white/10">
        <CardContent className={cn("flex flex-col", isMobile ? "p-4 gap-3" : "py-6 gap-2")}>
          <div className="flex gap-2 items-center">
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") handleSearch(); }}
              placeholder={isMobile ? "Search users..." : "Search users by email, name, or UID"}
              className={cn(
                "flex-1 text-white bg-gray-900 border-white/20 focus:border-cyan-400 focus:ring-cyan-400",
                isMobile ? "text-sm h-10" : "h-11"
              )}
              disabled={loading}
              autoFocus
            />
            <Button 
              onClick={handleSearch} 
              disabled={loading || !search.trim()} 
              className={cn(
                "bg-cyan-600 hover:bg-cyan-700 text-white",
                isMobile ? "h-10 w-10 p-0" : "px-4 h-11"
              )}
            >
              <Search className={cn(isMobile ? "h-4 w-4" : "h-5 w-5")} />
            </Button>
          </div>
        </CardContent>
      </Card>
      <Card className="bg-gray-950/50 border border-white/10">
        <CardContent className="p-0">
          <div className={cn("overflow-x-auto", isMobile && "overflow-x-visible")}>
            {isMobile ? (
              <div className="space-y-3 p-3">
                {results.map((user) => (
                  <Card key={user.uid} className="bg-gray-900/50 border border-white/5 p-3 hover:bg-gray-800/50 transition-colors">
                    <CardContent className="p-4">
                      <div className="flex flex-col gap-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-medium text-gray-200 text-sm">{user.displayName || user.email}</p>
                            <p className="text-xs text-gray-400 mt-0.5">{user.displayName ? user.email : user.uid}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={cn(
                              "px-2 py-1 rounded-md text-xs font-bold font-mono uppercase border",
                              roleStyles[user.role]
                            )}>
                              {user.role}
                            </span>
                            {user.lastModifiedBy && (
                              <span className="text-xs text-gray-400 ml-auto">
                                {adminNames[user.lastModifiedBy] || user.lastModifiedBy}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {getAvailableRoles(currentUser.role).map((role) => (
                            <Button
                              key={role}
                              size="sm"
                              variant={user.role === role ? "default" : "outline"}
                              className={cn(
                                "font-mono text-xs",
                                user.role !== role && "border-gray-600 text-gray-300 hover:bg-white/10 hover:text-white",
                                user.role === role && "bg-cyan-600 hover:bg-cyan-700"
                              )}
                              onClick={() => handleRoleChange(user.uid, role)}
                              disabled={user.role === role || loading}
                            >
                              {role}
                            </Button>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {results.length === 0 && (
                  <div className="text-center text-gray-500 py-8">
                    Search for a user to begin.
                  </div>
                )}
              </div>
            ) : (
              <div className="w-full">
                <Table className="min-w-full">
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
                  <TableRow key={user.uid} className="border-b-white/10 hover:bg-white/5">
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
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UsersTab;
