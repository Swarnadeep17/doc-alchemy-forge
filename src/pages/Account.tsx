
import React from "react";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Account = () => {
  const { user, loading } = useAuth();
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

  return (
    <div className="max-w-md mx-auto mt-16">
      <Card>
        <CardHeader>
          <CardTitle>Account Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
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
