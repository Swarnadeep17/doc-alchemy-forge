
import React from "react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Profile = () => {
  const { user, logout, loading } = useAuth();
  const navigate = useNavigate();

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

  const handleLogout = async () => {
    try {
      await logout();
      toast({ title: "You have been logged out." });
      navigate("/login");
    } catch (err: any) {
      toast({ title: "Logout error", description: err.message });
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col justify-center items-center bg-gradient-to-br from-black via-gray-900 to-black px-2 py-8">
      <Card className="w-full max-w-md mx-auto border-cyan-400/30 shadow-lg bg-gray-900/95">
        <CardHeader>
          <CardTitle className="text-white font-mono tracking-widest uppercase text-2xl mb-2">Your Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-white/90 text-base">
            <div><span className="font-bold">Email:</span> {user.email ?? "—"}</div>
            <div><span className="font-bold">Display Name:</span> {user.displayName ?? "—"}</div>
            <div><span className="font-bold">Phone:</span> {user.phoneNumber ?? "—"}</div>
            <div><span className="font-bold">Role:</span> {user.role}</div>
            {user.promoCodeRedeemed && (
              <div>
                <span className="font-bold">Promo Code:</span> {user.promoCodeRedeemed}
              </div>
            )}
          </div>
          <Button
            className="mt-8 w-full bg-black hover:bg-gray-800 text-white font-bold shadow transition-all uppercase"
            variant="destructive"
            onClick={handleLogout}
          >
            Logout
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Profile;
