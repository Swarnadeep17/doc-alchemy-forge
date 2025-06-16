
import React, { useRef, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Globe, Phone } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const {
    loginWithEmail,
    loginWithGoogle,
    loginWithPhone,
    loading,
  } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Phone states
  const [showPhoneInputs, setShowPhoneInputs] = useState(false);
  const [phone, setPhone] = useState("");
  const [phoneConfirm, setPhoneConfirm] = useState<any>(null);
  const [phoneCode, setPhoneCode] = useState("");
  const recaptchaRef = useRef<HTMLDivElement>(null);

  const navigate = useNavigate();

  // Email/password login
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    try {
      await loginWithEmail(email, password);
      toast({ title: "Login successful!" });
      navigate("/");
    } catch (err: any) {
      setError(err.message || "Login failed.");
      toast({ title: "Login failed", description: err.message });
    }
  };

  // Google login
  const handleGoogleLogin = async () => {
    try {
      await loginWithGoogle();
      toast({ title: "Logged in with Google!" });
      navigate("/");
    } catch (err: any) {
      toast({ title: "Google Login Failed", description: err.message });
    }
  };

  // Phone login
  const handlePhoneStart = async () => {
    try {
      const result = await loginWithPhone(phone, "recaptcha-login");
      setPhoneConfirm(result);
    } catch (err: any) {
      toast({ title: "Phone auth error", description: err.message });
    }
  };
  const handlePhoneVerify = async () => {
    try {
      await loginWithPhone(phone, "recaptcha-login", phoneCode);
      toast({ title: "Logged in with Phone!" });
      navigate("/");
    } catch (err: any) {
      toast({ title: "Verification error", description: err.message });
    }
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-black via-gray-900 to-black flex items-center justify-center px-2 py-8">
      <form onSubmit={handleSubmit} className="w-full max-w-md mx-auto bg-gray-900/95 shadow-xl rounded-xl p-8 border border-cyan-300/20">
        <h2 className="text-3xl font-bold text-white mb-6 text-center font-mono tracking-widest uppercase">
          Login
        </h2>
        <div className="space-y-4">
          <div>
            <label className="block mb-1 font-mono text-xs text-white/70">Email</label>
            <Input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              autoComplete="email"
              required
              disabled={loading}
              className="bg-black/30 border-cyan-600/30 text-white placeholder:text-gray-300"
            />
          </div>
          <div>
            <label className="block mb-1 font-mono text-xs text-white/70">Password</label>
            <Input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoComplete="current-password"
              required
              disabled={loading}
              className="bg-black/30 border-cyan-600/30 text-white placeholder:text-gray-300"
            />
          </div>
          {error && <div className="text-red-400 font-mono text-xs">{error}</div>}
          <Button
            type="submit"
            disabled={loading}
            className="w-full mt-2 bg-black hover:bg-gray-800 text-white font-bold shadow transition-all uppercase"
          >
            {loading ? "Logging In..." : "Login"}
          </Button>
        </div>

        <div className="flex gap-2 my-6 items-center justify-center">
          <span className="block border-b w-16 border-gray-200/30" />
          <span className="font-medium text-gray-400">or</span>
          <span className="block border-b w-16 border-gray-200/30" />
        </div>

        <Button
          onClick={e => { e.preventDefault(); handleGoogleLogin(); }}
          disabled={loading}
          variant="outline"
          className="w-full flex items-center mb-2 border border-white/70 text-black bg-white font-bold uppercase hover:bg-gray-200 hover:text-black transition-all"
        >
          <Globe className="mr-2" /> Login with Google
        </Button>
        <Button
          onClick={e => { e.preventDefault(); setShowPhoneInputs(state => !state); }}
          disabled={loading}
          type="button"
          variant="outline"
          className="w-full flex items-center border border-white/70 bg-white text-black font-bold uppercase hover:bg-gray-200 hover:text-black transition-all"
        >
          <Phone className="mr-2" /> Login with Phone
        </Button>

        {/* Phone login */}
        {showPhoneInputs && (
          <div className="mt-4">
            <Input
              placeholder="Phone Number (+1...)"
              value={phone}
              disabled={loading || phoneConfirm}
              onChange={e => setPhone(e.target.value)}
              type="tel"
              className="bg-black/30 border-cyan-600/30 text-white placeholder:text-gray-400"
            />
            {!phoneConfirm ? (
              <Button
                className="mt-2 w-full bg-black hover:bg-gray-800 text-white font-bold shadow transition-all uppercase"
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
                  className="bg-black/30 border-cyan-600/30 text-white placeholder:text-gray-400"
                />
                <Button
                  className="w-full bg-black hover:bg-gray-800 text-white font-bold shadow transition-all uppercase"
                  variant="secondary"
                  disabled={loading}
                  onClick={handlePhoneVerify}
                  type="button"
                >
                  Verify & Login
                </Button>
              </div>
            )}
            <div id="recaptcha-login" ref={recaptchaRef}></div>
          </div>
        )}
      </form>
    </div>
  );
};

export default Login;
