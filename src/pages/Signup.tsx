
import React, { useRef, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Globe, Phone } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

const Signup = () => {
  const {
    signupWithEmail,
    loginWithGoogle,
    loginWithPhone,
    loading,
  } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [promoCode, setPromoCode] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Phone states
  const [showPhoneInputs, setShowPhoneInputs] = useState(false);
  const [phone, setPhone] = useState("");
  const [phoneConfirm, setPhoneConfirm] = useState<any>(null);
  const [phoneCode, setPhoneCode] = useState("");
  const recaptchaRef = useRef<HTMLDivElement>(null);

  const navigate = useNavigate();

  // Email/password signup
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

  // Google signup
  const handleGoogleSignup = async () => {
    try {
      await loginWithGoogle();
      toast({ title: "Signed up with Google!" });
      navigate("/");
    } catch (err: any) {
      toast({ title: "Google Signup Failed", description: err.message });
    }
  };

  // Phone signup
  const handlePhoneStart = async () => {
    try {
      const result = await loginWithPhone(phone, "recaptcha-signup");
      setPhoneConfirm(result);
    } catch (err: any) {
      toast({ title: "Phone auth error", description: err.message });
    }
  };
  const handlePhoneVerify = async () => {
    try {
      await loginWithPhone(phone, "recaptcha-signup", phoneCode);
      toast({ title: "Signed up with Phone!" });
      navigate("/");
    } catch (err: any) {
      toast({ title: "Verification error", description: err.message });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black via-gray-900 to-black">
      <form onSubmit={handleSubmit} className="bg-white rounded-lg p-8 shadow-xl w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-center">Sign Up</h2>
        <div className="space-y-4">

          {/* Email signup block */}
          <div>
            <label className="block mb-1 font-mono text-xs">Email</label>
            <Input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              autoComplete="email"
              required
              disabled={loading}
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
              disabled={loading}
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
              disabled={loading}
            />
          </div>
          <div>
            <label className="block mb-1 font-mono text-xs">Promo Code (optional)</label>
            <Input
              type="text"
              value={promoCode}
              onChange={e => setPromoCode(e.target.value.toUpperCase())}
              placeholder="Enter promo code if you have one"
              disabled={loading}
            />
          </div>
          {error && <div className="text-red-500 font-mono text-xs">{error}</div>}
          <Button type="submit" disabled={loading} className="w-full mt-2">
            {loading ? "Signing Up..." : "Sign Up"}
          </Button>
        </div>

        {/* Divider */}
        <div className="flex gap-2 my-6 items-center justify-center">
          <span className="block border-b w-16 border-gray-200/50" />
          <span className="font-medium text-gray-400">or</span>
          <span className="block border-b w-16 border-gray-200/50" />
        </div>

        {/* Google signup button */}
        <Button
          onClick={e => { e.preventDefault(); handleGoogleSignup(); }}
          disabled={loading}
          variant="outline"
          className="w-full flex items-center"
        >
          <Globe className="mr-2" /> Sign Up with Google
        </Button>

        {/* Phone signup button */}
        <Button
          onClick={e => { e.preventDefault(); setShowPhoneInputs(state => !state); }}
          disabled={loading}
          type="button"
          variant="outline"
          className="w-full flex items-center mt-2"
        >
          <Phone className="mr-2" /> Sign Up with Phone
        </Button>

        {/* Phone input block, reused from login */}
        {showPhoneInputs && (
          <div className="mt-4">
            <Input
              placeholder="Phone Number (+1...)"
              value={phone}
              disabled={loading || phoneConfirm}
              onChange={e => setPhone(e.target.value)}
              type="tel"
            />
            {!phoneConfirm ? (
              <Button
                className="mt-2 w-full"
                variant="secondary"
                disabled={loading}
                onClick={handlePhoneStart}
                type="button"
              >
                Send Code
              </Button>
            ) : (
              <div className="flex flex-col gap-2 mt-2">
                <Input
                  placeholder="SMS Code"
                  value={phoneCode}
                  disabled={loading}
                  onChange={e => setPhoneCode(e.target.value)}
                />
                <Button
                  className="w-full"
                  variant="secondary"
                  disabled={loading}
                  onClick={handlePhoneVerify}
                  type="button"
                >
                  Verify & Sign Up
                </Button>
              </div>
            )}
            <div id="recaptcha-signup" ref={recaptchaRef}></div>
          </div>
        )}
      </form>
    </div>
  );
};

export default Signup;

