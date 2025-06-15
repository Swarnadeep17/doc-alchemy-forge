import React, { createContext, useContext, useEffect, useState } from "react";
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  signInWithPopup,
  GoogleAuthProvider,
  signInWithPhoneNumber,
  RecaptchaVerifier,
  User as FirebaseUser,
} from "firebase/auth";
import { db, app } from "@/lib/firebase";
import { ref, set, get, update, serverTimestamp } from "firebase/database";
import { toast } from "@/hooks/use-toast";

// User Roles
export type UserRole = "anonymous" | "free" | "premium" | "admin" | "superadmin";

export interface AuthUser {
  uid: string;
  email?: string | null;
  role: UserRole;
  promoCodeRedeemed?: string;
  displayName?: string | null;
  phoneNumber?: string | null;
}

export interface PromoCodeRecord {
  code: string;
  targetRole: "premium" | "admin";
  createdBy: string;
  createdAt: any;
  expiresAt: any;
  redeemed: boolean;
  redeemedBy?: string;
  redeemedAt?: any;
}

interface CreatePromoCodeOptions {
  targetRole: "premium" | "admin";
  expiresAt?: number;
  type?: "permanent" | "one_time" | "expires_in";
}

interface AuthContextProps {
  user: AuthUser | null;
  loading: boolean;
  // Auth flows:
  loginWithEmail: (email: string, password: string, promoCode?: string) => Promise<void>;
  signupWithEmail: (email: string, password: string, promoCode?: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  loginWithPhone: (phone: string, recaptchaContainerId: string, code?: string) => Promise<any>;
  verifyPhone: (confirmationResult: any, code: string) => Promise<void>;
  logout: () => Promise<void>;
  // Promo codes:
  createPromoCode: (options: CreatePromoCodeOptions) => Promise<string>;
  redeemPromoCode: (code: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [phoneConfResult, setPhoneConfResult] = useState<any>(null);

  const auth = getAuth(app);

  // --- Get user role
  const fetchRole = async (fbUser: FirebaseUser): Promise<UserRole> => {
    if (!fbUser) return "anonymous";
    const snap = await get(ref(db, `users/${fbUser.uid}/role`));
    return snap.exists() ? snap.val() : "free";
  };

  // --- Format user object
  const formatUser = async (fbUser: FirebaseUser | null): Promise<AuthUser | null> => {
    if (!fbUser) return null;
    const role = await fetchRole(fbUser);
    return {
      uid: fbUser.uid,
      email: fbUser.email,
      displayName: fbUser.displayName,
      phoneNumber: fbUser.phoneNumber,
      role,
    };
  };

  // --- Auth state observer
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

  // --- Auth flows
  const loginWithEmail = async (email: string, password: string, promoCode?: string) => {
    setLoading(true);
    await signInWithEmailAndPassword(auth, email, password);
    setLoading(false);
  };

  const signupWithEmail = async (email: string, password: string, promoCode?: string) => {
    setLoading(true);
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    // Default role and promoCode
    let newRole = "free";
    let promoCodeRedeemed = null;

    if (promoCode) {
      // Try to apply promo
      const codeRef = ref(db, `promoCodes/${promoCode}`);
      const codeSnap = await get(codeRef);

      if (codeSnap.exists()) {
        const codeData: PromoCodeRecord = codeSnap.val();
        // Only apply unused and unexpired codes
        if (!codeData.redeemed && (!codeData.expiresAt || Date.now() < codeData.expiresAt)) {
          // Set proper role and mark code as redeemed
          if (codeData.targetRole === "premium") newRole = "premium";
          if (codeData.targetRole === "admin") newRole = "admin";
          promoCodeRedeemed = promoCode;
          // Mark as redeemed in promoCodes DB
          await update(codeRef, {
            redeemed: true,
            redeemedBy: cred.user.uid,
            redeemedAt: serverTimestamp(),
          });
        }
      }
    }

    await set(ref(db, `users/${cred.user.uid}`), {
      email,
      role: newRole,
      promoCodeRedeemed,
    });
    setLoading(false);
  };

  const loginWithGoogle = async () => {
    setLoading(true);
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    // Initialize user in DB if not exists
    const userRef = ref(db, `users/${result.user.uid}`);
    const snap = await get(userRef);
    if (!snap.exists()) {
      await set(userRef, {
        email: result.user.email,
        role: "free",
        promoCodeRedeemed: null,
      });
    }
    setLoading(false);
  };

  const loginWithPhone = async (
    phone: string,
    recaptchaContainerId: string,
    code?: string
  ): Promise<any> => {
    setLoading(true);
    if (!code) {
      const verifier = new RecaptchaVerifier(
        auth,
        recaptchaContainerId,
        { size: "invisible" }
      );
      const confirmationResult = await signInWithPhoneNumber(auth, phone, verifier);
      setPhoneConfResult(confirmationResult);
      setLoading(false);
      toast({ title: "Enter the code sent to your phone." });
      return confirmationResult;
    } else {
      if (!phoneConfResult) throw new Error("No confirmation available for verification");
      await phoneConfResult.confirm(code);
      setPhoneConfResult(null);
      setLoading(false);
      return;
    }
  };

  const verifyPhone = async (confirmationResult: any, code: string) => {
    setLoading(true);
    await confirmationResult.confirm(code);
    setLoading(false);
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
  };

  // --- Promo Code Management ---

  // Only SuperAdmin can create codes (for Admin or Premium upgrades)
  const createPromoCode = async (options: CreatePromoCodeOptions) => {
    if (!user || user.role !== "superadmin")
      throw new Error("Only Superadmins can create promo codes.");

    const code = Math.random().toString(36).substring(2, 10).toUpperCase();
    const expiresAt = options.expiresAt || Date.now() + 24 * 60 * 60 * 1000;
    const codeRef = ref(db, `promoCodes/${code}`);

    await set(codeRef, {
      code,
      targetRole: options.targetRole,
      createdBy: user.uid,
      createdAt: serverTimestamp(),
      expiresAt,
      redeemed: false,
      redeemedBy: null,
      redeemedAt: null,
    });

    toast({ title: `Promo code created: ${code}`, description: `For ${options.targetRole} (expires in 24h)` });
    return code;
  };

  // Redeem promo code to become Admin or Premium
  const redeemPromoCode = async (code: string) => {
    if (!user) throw new Error("Not logged in");
    setLoading(true);

    const codeRef = ref(db, `promoCodes/${code}`);
    const codeSnap = await get(codeRef);

    if (!codeSnap.exists()) {
      setLoading(false);
      toast({ title: "Invalid promo code.", description: "Code not found." });
      throw new Error("Promo code not found.");
    }

    const codeData: PromoCodeRecord = codeSnap.val();
    if (codeData.redeemed || (codeData.expiresAt && Date.now() > codeData.expiresAt)) {
      setLoading(false);
      toast({ title: "Promo code expired or already used." });
      throw new Error("Promo code expired or already used.");
    }

    // Only allow upgrades as per code:
    let newRole: UserRole | undefined;
    if (codeData.targetRole === "admin" && user.role === "free") {
      newRole = "admin";
    } else if (codeData.targetRole === "premium" && user.role === "free") {
      newRole = "premium";
    } else {
      setLoading(false);
      toast({ title: "Cannot upgrade with this code." });
      throw new Error("Invalid upgrade path.");
    }

    await update(ref(db, `users/${user.uid}`), {
      role: newRole,
      promoCodeRedeemed: code,
      upgradedAt: serverTimestamp(),
    });
    await update(codeRef, {
      redeemed: true,
      redeemedBy: user.uid,
      redeemedAt: serverTimestamp(),
    });

    setUser({ ...user, role: newRole, promoCodeRedeemed: code });
    setLoading(false);
    toast({ title: `Upgraded to ${newRole}!` });
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
        createPromoCode,
        redeemPromoCode,
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

// NOTES FOR FURTHER FEATURES:
// - UI for promo code management must limit creation to superadmin.
// - Admin analytics dashboard can read from DB paths:
//   /stats (usage), /users (roles and counts), /promoCodes (tracking usage, by code, by redeemer)
// - For testing: create an initial superadmin user by manually editing the first user's role in DB.
