
import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

const Signup = () => {
  const { signupWithEmail, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [promoCode, setPromoCode] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      await signupWithEmail(email, password, promoCode || undefined);
      toast({ title: "Signup successful!", description: promoCode ? "Promo code applied." : undefined });
      navigate("/");
    } catch (err: any) {
      setError(err.message || "Signup failed.");
      toast({ title: "Signup failed", description: err.message });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black via-gray-900 to-black">
      <form onSubmit={handleSubmit} className="bg-white rounded-lg p-8 shadow-xl w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-center">Sign Up</h2>
        <div className="space-y-4">
          <div>
            <label className="block mb-1 font-mono text-xs">Email</label>
            <Input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </div>
          <div>
            <label className="block mb-1 font-mono text-xs">Password</label>
            <Input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoComplete="new-password"
              required
            />
          </div>
          <div>
            <label className="block mb-1 font-mono text-xs">Confirm Password</label>
            <Input
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
              required
            />
          </div>
          <div>
            <label className="block mb-1 font-mono text-xs">Promo Code (optional)</label>
            <Input
              type="text"
              value={promoCode}
              onChange={e => setPromoCode(e.target.value.toUpperCase())}
              placeholder="Enter promo code if you have one"
            />
          </div>
          {error && <div className="text-red-500 font-mono text-xs">{error}</div>}
          <Button type="submit" disabled={loading} className="w-full mt-2">
            {loading ? "Signing Up..." : "Sign Up"}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default Signup;

