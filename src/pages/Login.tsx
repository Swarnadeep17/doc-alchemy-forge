
import React, { useRef, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Phone, Google } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const Login = () => {
  const { loginWithEmail, loginWithGoogle, loginWithPhone, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [showPhoneInputs, setShowPhoneInputs] = useState(false);
  const [phoneConfirm, setPhoneConfirm] = useState<any>(null);
  const [code, setCode] = useState("");

  const recaptchaRef = useRef<HTMLDivElement>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await loginWithEmail(email, password);
      toast({ title: "Login successful!" });
    } catch (err: any) {
      toast({ title: "Login error", description: err.message });
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await loginWithGoogle();
      toast({ title: "Login successful!" });
    } catch (err: any) {
      toast({ title: "Google Login Failed", description: err.message });
    }
  };

  // Phone Flow
  const handlePhoneStart = async () => {
    try {
      const result = await loginWithPhone(phone, "recaptcha-container");
      setPhoneConfirm(result);
    } catch (err: any) {
      toast({ title: "Phone auth error", description: err.message });
    }
  };
  const handlePhoneVerify = async () => {
    try {
      await loginWithPhone(phone, "recaptcha-container", code);
      toast({ title: "Login successful!" });
    } catch (err: any) {
      toast({ title: "Verification error", description: err.message });
    }
  };

  return (
    <div className="max-w-md mx-auto mt-16 p-8 bg-white/95 rounded-xl shadow-lg">
      <h2 className="text-2xl font-semibold mb-6 text-center">Login</h2>
      <form className="flex flex-col gap-4" onSubmit={handleLogin}>
        <Input
          placeholder="Email"
          value={email}
          type="email"
          disabled={loading}
          onChange={e => setEmail(e.target.value)}
        />
        <Input
          placeholder="Password"
          value={password}
          type="password"
          disabled={loading}
          onChange={e => setPassword(e.target.value)}
        />
        <Button type="submit" disabled={loading}>
          {loading ? <Loader2 className="animate-spin" /> : "Login"}
        </Button>
      </form>
      <div className="flex gap-2 my-6 items-center justify-center">
        <span className="block border-b w-16 border-gray-200/50" />
        <span className="font-medium text-gray-400">or</span>
        <span className="block border-b w-16 border-gray-200/50" />
      </div>
      <Button
        onClick={handleGoogleLogin}
        disabled={loading}
        variant="outline"
        className="w-full flex items-center"
      >
        <Google className="mr-2" /> Continue with Google
      </Button>
      <Button
        onClick={() => setShowPhoneInputs(true)}
        disabled={loading}
        type="button"
        variant="outline"
        className="w-full flex items-center mt-2"
      >
        <Phone className="mr-2" /> Continue with Phone
      </Button>
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
            >
              Send Code
            </Button>
          ) : (
            <div className="flex flex-col gap-2 mt-2">
              <Input
                placeholder="SMS Code"
                value={code}
                disabled={loading}
                onChange={e => setCode(e.target.value)}
              />
              <Button
                className="w-full"
                variant="secondary"
                disabled={loading}
                onClick={handlePhoneVerify}
              >
                Verify & Login
              </Button>
            </div>
          )}
          <div id="recaptcha-container" ref={recaptchaRef}></div>
        </div>
      )}
    </div>
  );
};

export default Login;
