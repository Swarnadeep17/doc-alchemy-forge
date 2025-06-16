
import React from "react";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, LogOut, Home, User, Mail, Phone, Shield } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";

const roleStyles: Record<string, { className: string; icon: string }> = {
  free: {
    className: "bg-gray-500 text-white",
    icon: "🆓"
  },
  premium: {
    className: "bg-gradient-to-br from-purple-500 via-blue-400 to-cyan-400 text-white",
    icon: "⭐"
  },
  admin: {
    className: "bg-gradient-to-br from-cyan-700 via-cyan-400 to-sky-300 text-white",
    icon: "🛡️"
  },
  superadmin: {
    className: "bg-gradient-to-r from-yellow-400 via-rose-400 to-fuchsia-500 text-white",
    icon: "👑"
  },
};

const Account = () => {
  const { user, logout, loading } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      toast({ title: "Logged out successfully" });
      navigate("/");
    } catch (error) {
      toast({ title: "Logout failed", description: "Please try again" });
    }
  };

  const handleHome = () => {
    navigate("/");
  };

  if (loading) return (
    <div className="flex justify-center items-center min-h-[30vh] bg-gradient-to-br from-black via-gray-900 to-black">
      <Loader2 className="animate-spin text-cyan-500" />
    </div>
  );

  if (!user) {
    // If not logged in, redirect to login
    navigate("/login");
    return null;
  }

  const userRole = user.role || "free";
  const roleStyle = roleStyles[userRole] || roleStyles["free"];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center w-full bg-gradient-to-br from-black via-gray-900 to-black px-2 py-8">
      <Card className="w-full max-w-lg mx-auto border-cyan-400/30 shadow-lg bg-gray-900/95">
        <CardHeader className="text-center">
          <div className="flex justify-between items-start mb-4">
            <Button
              variant="ghost"
              onClick={handleHome}
              className="text-cyan-400 hover:bg-cyan-500/10"
            >
              <Home className="w-4 h-4 mr-2" />
              Home
            </Button>
            <Button
              variant="ghost"
              onClick={handleLogout}
              className="text-red-400 hover:bg-red-500/10"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
          <CardTitle className="text-white font-mono tracking-widest uppercase text-2xl mb-4">Account Details</CardTitle>
          
          {/* Role Badge */}
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-bold font-mono uppercase ${roleStyle.className}`}>
            <span className="text-lg">{roleStyle.icon}</span>
            {userRole}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* User Info Cards */}
          <div className="grid gap-3">
            <div className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-lg">
              <User className="w-5 h-5 text-cyan-400" />
              <div>
                <div className="text-xs text-white/60 uppercase font-mono">User ID</div>
                <div className="text-white/90 font-mono text-sm">{user.uid}</div>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-lg">
              <Mail className="w-5 h-5 text-cyan-400" />
              <div>
                <div className="text-xs text-white/60 uppercase font-mono">Email</div>
                <div className="text-white/90">{user.email || "Not provided"}</div>
              </div>
            </div>
            
            {user.displayName && (
              <div className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-lg">
                <User className="w-5 h-5 text-cyan-400" />
                <div>
                  <div className="text-xs text-white/60 uppercase font-mono">Display Name</div>
                  <div className="text-white/90">{user.displayName}</div>
                </div>
              </div>
            )}
            
            {user.phoneNumber && (
              <div className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-lg">
                <Phone className="w-5 h-5 text-cyan-400" />
                <div>
                  <div className="text-xs text-white/60 uppercase font-mono">Phone</div>
                  <div className="text-white/90">{user.phoneNumber}</div>
                </div>
              </div>
            )}
            
            {user.promoCodeRedeemed && (
              <div className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-lg">
                <Shield className="w-5 h-5 text-cyan-400" />
                <div>
                  <div className="text-xs text-white/60 uppercase font-mono">Promo Code Used</div>
                  <div className="text-white/90 font-mono">{user.promoCodeRedeemed}</div>
                </div>
              </div>
            )}
          </div>

          {/* Admin Dashboard Link */}
          {(user.role === "admin" || user.role === "superadmin") && (
            <Button
              className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-mono uppercase tracking-widest"
              onClick={() => navigate("/admin-dashboard")}
            >
              <Shield className="w-4 h-4 mr-2" />
              Admin Dashboard
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Account;
