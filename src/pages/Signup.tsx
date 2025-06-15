
import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const Signup = () => {
  const { signupWithEmail, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [promoCode, setPromoCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await signupWithEmail(email, password, promoCode || undefined);
      toast({
        title: "Signup successful!",
        description: promoCode ? "Promo code applied if valid." : undefined,
      });
      // Optionally: redirect or reset form here
    } catch (err: any) {
      toast({
        title: "Signup error",
        description: err.message,
      });
    }
    setIsSubmitting(false);
  };

  return (
    <div className="max-w-md mx-auto mt-16 p-8 bg-white/95 rounded-xl shadow-lg">
      <h2 className="text-2xl font-semibold mb-6 text-center">Sign Up</h2>
      <form className="flex flex-col gap-4" onSubmit={handleSignup}>
        <Input
          placeholder="Email"
          value={email}
          type="email"
          disabled={loading || isSubmitting}
          onChange={e => setEmail(e.target.value)}
          required
        />
        <Input
          placeholder="Password"
          value={password}
          type="password"
          disabled={loading || isSubmitting}
          onChange={e => setPassword(e.target.value)}
          required
        />
        <Input
          placeholder="Promo Code (optional)"
          value={promoCode}
          type="text"
          disabled={loading || isSubmitting}
          onChange={e => setPromoCode(e.target.value)}
        />
        <Button type="submit" disabled={loading || isSubmitting}>
          {loading || isSubmitting ? <Loader2 className="animate-spin" /> : "Sign Up"}
        </Button>
      </form>
    </div>
  );
};

export default Signup;
