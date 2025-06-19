// src/constants/tiers.ts

// Define UserRole type if it's not globally available or imported from AuthContext
// For simplicity here, assuming it might be defined elsewhere or should be added if not.
// If AuthContext exports UserRole, it should be imported:
// import { UserRole } from '../context/AuthContext';

// If UserRole is not easily importable, define it locally for this file's scope:
export type UserRole = "anonymous" | "free" | "premium" | "admin" | "superadmin";

export const TIER_LIMITS = {
  anonymous: 20 * 1024 * 1024,  // 20 MB
  free:       20 * 1024 * 1024,  // 20 MB
  premium:   100 * 1024 * 1024,  // 100 MB
  admin:     100 * 1024 * 1024,  // 100 MB
  superadmin:100 * 1024 * 1024,  // 100 MB
} as const;

export const PREMIUM_FEATURES = ['OCR', 'ADVANCED_WATERMARK'] as const;

// Ensure UserRole type is correctly sourced for this function.
export function hasFeature(role: UserRole, feature: typeof PREMIUM_FEATURES[number] | string): boolean {
  // Check if the feature is one of the defined premium features
  const isPremiumFeature = (PREMIUM_FEATURES as readonly string[]).includes(feature);

  if (isPremiumFeature) {
    return ['premium', 'admin', 'superadmin'].includes(role);
  }
  return true; // Non-premium features are available to all
}
