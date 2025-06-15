
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
    <div className="flex justify-center items-center h-32">
      <Loader2 className="animate-spin" />
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
    <div className="max-w-md mx-auto mt-16">
      <Card>
        <CardHeader>
          <CardTitle>Your Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
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
          <Button className="mt-6 w-full" variant="destructive" onClick={handleLogout}>
            Logout
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Profile;
