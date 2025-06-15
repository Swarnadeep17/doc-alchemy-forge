import React, { createContext, useContext, useEffect, useState } from "react";
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendSignInLinkToEmail,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithPhoneNumber,
  RecaptchaVerifier,
  User as FirebaseUser,
  updateProfile,
} from "firebase/auth";
import { db, app } from "@/lib/firebase";
import { ref, set, get, update } from "firebase/database";
import { toast } from "@/hooks/use-toast";

type UserRole = "anonymous" | "free" | "premium" | "admin";

export interface AuthUser {
  uid: string;
  email?: string | null;
  phoneNumber?: string | null;
  displayName?: string | null;
  role: UserRole;
  promoCodeRedeemed?: string;
}

interface AuthContextProps {
  user: AuthUser | null;
  loading: boolean;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  signupWithEmail: (email: string, password: string, promoCode?: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  loginWithPhone: (phone: string, recaptchaContainerId: string, code?: string) => Promise<void>;
  verifyPhone: (confirmationResult: any, code: string) => Promise<void>;
  logout: () => Promise<void>;
  upgradeToPremium: (promoCode: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [phoneConfResult, setPhoneConfResult] = useState<any>(null);

  // Important! getAuth() takes the app object, not a string
  const auth = getAuth(app);

  // Get custom role from db (by user uid)
  const fetchRole = async (fbUser: FirebaseUser): Promise<UserRole> => {
    if (!fbUser) return "anonymous";
    const userRef = ref(db, `users/${fbUser.uid}/role`);
    const snap = await get(userRef);
    if (snap.exists()) return snap.val();
    return "free";
  };

  const formatUser = async (fbUser: FirebaseUser | null): Promise<AuthUser | null> => {
    if (!fbUser) return null;
    const role = await fetchRole(fbUser);
    return {
      uid: fbUser.uid,
      email: fbUser.email,
      phoneNumber: fbUser.phoneNumber,
      displayName: fbUser.displayName,
      role,
      // Add more if needed
    };
  };

  // Auth state observer
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        const fUser = await formatUser(fbUser);
        setUser(fUser);
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return () => unsub();
    // eslint-disable-next-line
  }, []);

  // Email/password login
  const loginWithEmail = async (email: string, password: string) => {
    setLoading(true);
    await signInWithEmailAndPassword(auth, email, password);
    setLoading(false);
  };

  // Email/password signup
  const signupWithEmail = async (email: string, password: string, promoCode?: string) => {
    setLoading(true);
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    let role: UserRole = "free";
    let redeemedCode: string | undefined = undefined;
    if (promoCode) {
      const codeRef = ref(db, `promoCodes/${promoCode}`);
      const codeSnap = await get(codeRef);
      if (codeSnap.exists() && codeSnap.val().type === "premium") {
        role = "premium";
        redeemedCode = promoCode;
        await update(codeRef, { redeemedBy: (codeSnap.val().redeemedBy || []).concat(cred.user.uid) });
      }
    }
    await set(ref(db, `users/${cred.user.uid}`), {
      email,
      role,
      promoCodeRedeemed: redeemedCode || null,
    });
    setLoading(false);
  };

  // Google signin
  const loginWithGoogle = async () => {
    setLoading(true);
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    // Set role if not already in db
    const userRef = ref(db, `users/${result.user.uid}`);
    const userSnap = await get(userRef);
    if (!userSnap.exists()) {
      await set(userRef, {
        email: result.user.email,
        role: "free",
      });
    }
    setLoading(false);
  };

  // Phone signin (step 1: start)
  // MAKE SIGNATURE: always returns Promise<void>
  const loginWithPhone = async (phone: string, recaptchaContainerId: string, code?: string): Promise<void> => {
    setLoading(true);
    // Step 1: start phone signin (confirmation)
    if (!code) {
      const verifier = new RecaptchaVerifier(recaptchaContainerId, { size: 'invisible' }, auth);
      const confirmationResult = await signInWithPhoneNumber(auth, phone, verifier);
      setPhoneConfResult(confirmationResult);
      setLoading(false);
      toast({ title: "Enter the code sent to your phone." });
      // Don't return confirmationResult (to match Promise<void> type)
      return;
    } else {
      // If code present, complete sign in
      if (!phoneConfResult) throw new Error("No confirmation available for verification");
      await phoneConfResult.confirm(code);
      setPhoneConfResult(null);
    }
    setLoading(false);
  };

  // Phone sign in (step 2: verify)
  const verifyPhone = async (confirmationResult: any, code: string) => {
    setLoading(true);
    await confirmationResult.confirm(code);
    setLoading(false);
  };

  // Logout
  const logout = async () => {
    await signOut(auth);
    setUser(null);
  };

  // Upgrade to premium (for free user)
  const upgradeToPremium = async (promoCode: string) => {
    if (!user) throw new Error("Not logged in");
    const codeRef = ref(db, `promoCodes/${promoCode}`);
    const codeSnap = await get(codeRef);
    if (codeSnap.exists() && codeSnap.val().type === "premium") {
      await update(ref(db, `users/${user.uid}`), {
        role: "premium",
        promoCodeRedeemed: promoCode,
      });
      await update(codeRef, { redeemedBy: (codeSnap.val().redeemedBy || []).concat(user.uid) });
      setUser({ ...user, role: "premium", promoCodeRedeemed: promoCode });
      toast({ title: "Upgraded to premium!" });
    } else {
      toast({ title: "Invalid promo code.", description: "Enter a valid code." });
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        loginWithEmail,
        signupWithEmail,
        loginWithGoogle,
        loginWithPhone,
        verifyPhone,
        logout,
        upgradeToPremium,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
