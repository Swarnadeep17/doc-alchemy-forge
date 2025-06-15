
import React from "react";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Account = () => {
  const { user, loading } = useAuth();
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

  return (
    <div className="min-h-screen flex flex-col items-center justify-center w-full bg-gradient-to-br from-black via-gray-900 to-black px-2 py-8">
      <Card className="w-full max-w-md mx-auto border-cyan-400/30 shadow-lg bg-gray-900/95">
        <CardHeader>
          <CardTitle className="text-white font-mono tracking-widest uppercase text-2xl mb-2">Account Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-white/90 text-base">
            <div>
              <span className="font-bold">User ID:</span> {user.uid}
            </div>
            <div>
              <span className="font-bold">Role:</span> {user.role}
            </div>
            <div>
              <span className="font-bold">Email:</span> {user.email ?? "—"}
            </div>
            <div>
              <span className="font-bold">Phone:</span> {user.phoneNumber ?? "—"}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Account;
