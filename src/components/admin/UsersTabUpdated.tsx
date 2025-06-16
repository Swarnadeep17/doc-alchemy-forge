import { useEffect, useState } from "react";
import { db } from "../../lib/firebase";
import { ref, get, update } from "firebase/database";
import { Card, CardContent } from "../ui/card";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Search } from "lucide-react";
import { toast } from "../../hooks/use-toast";
import { useAuth } from "../../context/AuthContext";

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

interface AdminNameRecord {
  email?: string | null;
  displayName?: string | null;
}

const UsersTab = () => {
  const { user: currentUser } = useAuth();
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<AuthUserRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [adminNames, setAdminNames] = useState<Record<string, string>>({});

  // Helper function to check what roles current user can assign
  const getAvailableRoles = (currentUserRole: UserRole): UserRole[] => {
    if (currentUserRole === "superadmin") {
      return ["free", "premium", "admin"];
    } else if (currentUserRole === "admin") {
      return ["free", "premium"];
    }
    return [];
  };

  const handleSearch = async () => {
    if (!search.trim()) {
      toast({ 
        title: "Invalid Search", 
        description: "Please enter a search term",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    setResults([]);
    
    try {
      if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'superadmin')) {
        throw new Error("Unauthorized access");
      }

      const keyword = search.trim().toLowerCase();
      
      const snap = await get(ref(db, "users"));
      if (!snap.exists()) {
        setResults([]);
        return;
      }

      const data = snap.val();
      const allUsers: Record<string, AuthUserRecord> = typeof data === 'object' && data !== null ? data : {};
      const filtered: AuthUserRecord[] = Object.entries(allUsers)
        .filter(([uid, user]) => {
          // Skip if the user is a superadmin (they can't be modified)
          if (user.role === "superadmin" as UserRole) return false;
          
          // For admin users, only show users they can modify (free and premium)
          if (currentUser.role === "admin" && (user.role === "admin" || user.role === "superadmin")) {
            return false;
          }

          return (
            (user.email && user.email.toLowerCase().includes(keyword)) ||
            (user.displayName && user.displayName.toLowerCase().includes(keyword)) ||
            uid.toLowerCase().includes(keyword)
          );
        })
        .map(([uid, user]) => ({ ...user, uid }));

      setResults(filtered);
      
      if (filtered.length === 0) {
        toast({ 
          title: "No Results", 
          description: "No users found matching your search criteria",
          variant: "destructive"
        });
      }
    } catch (error: any) {
      console.error("Error searching users:", error);
      toast({ 
        title: "Search Failed", 
        description: error.message || "Permission denied. Please check your admin privileges.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch admin names for the "Last Modified By" column
  useEffect(() => {
    const fetchAdminNames = async () => {
      const adminIds = [...new Set(results.map(u => u.lastModifiedBy).filter(Boolean))];
      
      const names: Record<string, string> = {};
      for (const adminId of adminIds) {
        try {
          const adminRef = ref(db, `users/${adminId}`);
          const adminSnap = await get(adminRef);
          const adminData = adminSnap.exists() ? (adminSnap.val() as AdminNameRecord) : null;
          names[adminId] = adminData?.email || adminData?.displayName || adminId;
        } catch (error) {
          names[adminId] = adminId;
        }
      }
      setAdminNames(names);
    };

    if (results.length > 0) {
      fetchAdminNames();
    }
  }, [results]);

  const handleRoleChange = async (uid: string, newRole: UserRole) => {
    if (!currentUser) return;
    
    // Check permissions based on current user role
    const canChangeRole = (currentUserRole: UserRole, targetRole: UserRole): boolean => {
      if (currentUserRole === "superadmin") {
        // Superadmin can change to admin, premium, free (but not superadmin)
        return ["admin", "premium", "free"].includes(targetRole);
      } else if (currentUserRole === "admin") {
        // Admin can change to premium, free (but not admin or superadmin)
        return ["premium", "free"].includes(targetRole);
      }
      return false;
    };

    if (!canChangeRole(currentUser.role, newRole)) {
      toast({ 
        title: "Permission Denied", 
        description: `You cannot assign ${newRole} role.`,
        variant: "destructive"
      });
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
      setResults(res => res.map(u => (u.uid === uid ? { 
        ...u, 
        role: newRole, 
        lastModifiedBy: currentUser.uid,
        lastModifiedAt: Date.now()
      } : u)));
    } catch (error: any) {
      console.error("Error updating user role:", error);
      toast({ 
        title: "Update Failed", 
        description: error.message || "Failed to update user role.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
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
          <div className="text-xs text-white/60 pl-1">
            Search finds users by email, display name, or UID.
            {currentUser?.role === "admin" && (
              <div className="mt-1 text-yellow-400">
                As an Admin, you can change users to Free or Premium roles only.
              </div>
            )}
            {currentUser?.role === "superadmin" && (
              <div className="mt-1 text-green-400">
                As a Superadmin, you can change users to Free, Premium, or Admin roles.
              </div>
            )}
          </div>
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
              <th className="py-2 px-3 text-left font-mono text-cyan-400">Last Modified By</th>
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
                <td className="py-2 px-3 text-white/80 text-xs">
                  {user.lastModifiedBy ? (
                    <div>
                      <div>{adminNames[user.lastModifiedBy] || user.lastModifiedBy}</div>
                      {user.lastModifiedAt && (
                        <div className="text-white/50">
                          {new Date(user.lastModifiedAt).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  ) : "—"}
                </td>
                <td className="py-2 px-3">
                  {user.role === "superadmin" ? (
                    <span className="text-purple-400 font-extrabold">Superadmin</span>
                  ) : (
                    <div className="flex flex-wrap gap-1">
                      {currentUser && getAvailableRoles(currentUser.role).map((role) => (
                        <Button
                          key={role}
                          size="sm"
                          variant="outline"
                          className={`font-mono text-xs ${
                            role === "free" ? "border-gray-500" :
                            role === "premium" ? "border-cyan-500" :
                            role === "admin" ? "border-blue-500" : "border-gray-400"
                          }`}
                          onClick={() => handleRoleChange(user.uid!, role)}
                          disabled={user.role === role || loading}
                        >
                          {role.charAt(0).toUpperCase() + role.slice(1)}
                        </Button>
                      ))}
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {!results.length && (
              <tr>
                <td colSpan={6} className="text-center text-cyan-400 py-7">Search users above to view and edit roles.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UsersTab;
