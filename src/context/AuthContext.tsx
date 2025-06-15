
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
import { ref, set, get, update, push, serverTimestamp } from "firebase/database";
import { toast } from "@/hooks/use-toast";

type UserRole = "anonymous" | "free" | "premium" | "admin" | "superadmin";

export interface AuthUser {
  uid: string;
  email?: string | null;
  phoneNumber?: string | null;
  displayName?: string | null;
  role: UserRole;
  promoCodeRedeemed?: string;
}

// EXTENDED: Promo code can be used for premium or admin, created by superadmin only
export interface PromoCodeRecord {
  code: string;
  type: "premium" | "admin";
  createdBy: string; // uid
  createdAt: any;
  expiresAt?: any; // optional, for future logic
  redeemed: boolean;
  redeemedBy?: string;
  redeemedAt?: any;
}

interface AuthContextProps {
  user: AuthUser | null;
  loading: boolean;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  signupWithEmail: (email: string, password: string, promoCode?: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  loginWithPhone: (phone: string, recaptchaContainerId: string, code?: string) => Promise<any>;
  verifyPhone: (confirmationResult: any, code: string) => Promise<void>;
  logout: () => Promise<void>;
  upgradeWithPromoCode: (promoCode: string) => Promise<void>;
  createPromoCode: (type: "premium" | "admin") => Promise<string>;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [phoneConfResult, setPhoneConfResult] = useState<any>(null);

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

  // Email/password signup (Free only, no code allowed)
  const signupWithEmail = async (email: string, password: string, promoCode?: string) => {
    setLoading(true);
    if (promoCode) {
      setLoading(false);
      throw new Error("Promo codes not allowed for sign up. Use upgrade function after registration.");
    }
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await set(ref(db, `users/${cred.user.uid}`), {
      email,
      role: "free",
      promoCodeRedeemed: null,
    });
    setLoading(false);
  };

  // Google signin (free only)
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

  // Phone signin (not changed)
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

  // Logout
  const logout = async () => {
    await signOut(auth);
    setUser(null);
  };

  // UPGRADES: By promo code (strict role & creator logic)
  // Only applicable after signup; no downgrades
  const upgradeWithPromoCode = async (promoCode: string) => {
    if (!user) throw new Error("Not logged in");
    setLoading(true);

    const codeRef = ref(db, `promoCodes/${promoCode}`);
    const codeSnap = await get(codeRef);

    if (!codeSnap.exists()) {
      setLoading(false);
      toast({ title: "Invalid promo code.", description: "Code not found." });
      throw new Error("Promo code not found.");
    }

    const codeData: PromoCodeRecord = codeSnap.val();
    if (codeData.redeemed) {
      setLoading(false);
      toast({ title: "This code has already been used." });
      throw new Error("Code already used.");
    }

    // Only allow upgrades by the right code type/role
    let newRole: UserRole;
    if (codeData.type === "admin") {
      if (user.role !== "superadmin") {
        setLoading(false);
        throw new Error("Only Superadmins can upgrade to Admin.");
      }
      newRole = "admin";
    } else if (codeData.type === "premium") {
      if (user.role !== "free") {
        setLoading(false);
        throw new Error("Premium code can only be redeemed by Free users.");
      }
      newRole = "premium";
    } else {
      setLoading(false);
      throw new Error("Invalid promo code type.");
    }

    await update(ref(db, `users/${user.uid}`), {
      role: newRole,
      promoCodeRedeemed: promoCode,
      upgradedAt: serverTimestamp(),
    });
    await update(codeRef, {
      redeemed: true,
      redeemedBy: user.uid,
      redeemedAt: serverTimestamp(),
    });

    setUser({ ...user, role: newRole, promoCodeRedeemed: promoCode });
    setLoading(false);
    toast({ title: `Upgraded to ${newRole}!` });
  };

  // Only Superadmin (your account) can create promo codes
  // type: "premium" or "admin"
  const createPromoCode = async (codeType: "premium" | "admin") => {
    if (!user || user.role !== "superadmin") throw new Error("Only Superadmin can create promo codes.");
    // Generate unique code (simple: random)
    const code = Math.random().toString(36).substring(2, 10).toUpperCase();
    const codeRef = ref(db, `promoCodes/${code}`);

    await set(codeRef, {
      code,
      type: codeType,
      createdBy: user.uid,
      createdAt: serverTimestamp(),
      redeemed: false,
    });
    return code;
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
        upgradeWithPromoCode,
        createPromoCode,
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

