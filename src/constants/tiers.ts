// src/constants/tiers.ts

// Assuming UserRole is imported or defined elsewhere (e.g., from AuthContext)
// For now, let's define it here if not easily importable without creating circular deps,
// or assume it will be imported from AuthContext.
// If AuthContext is in src/context/AuthContext.tsx, the import would be:
import type { UserRole } from '../context/AuthContext'; // Adjust path as needed

export const TIER_LIMITS: Record<UserRole, number> = {
  anonymous: 20 * 1024 * 1024,  // 20 MB
  free:       20 * 1024 * 1024,  // 20 MB
  premium:   100 * 1024 * 1024,  // 100 MB
  admin:     100 * 1024 * 1024,  // 100 MB
  superadmin:100 * 1024 * 1024,  // 100 MB
} as const;

// Define which features are considered premium
// This list should align with the feature matrix provided in the brief.
// For example: 'OCR', 'ADVANCED_WATERMARK', 'EXTRA_COMPRESSION_MH' (Medium/High)
const PREMIUM_FEATURES = [
  'OCR',
  'ADVANCED_WATERMARK',
  'EXTRA_COMPRESSION' // Representing Medium/High compression
] as const;

type PremiumFeature = typeof PREMIUM_FEATURES[number];

// Utility function to check if a user has access to a specific feature
export function hasFeature(role: UserRole, feature: PremiumFeature | string): boolean {
  // First, check if the feature string is one of the defined PremiumFeature types
  const isListedPremiumFeature = (PREMIUM_FEATURES as readonly string[]).includes(feature);

  if (isListedPremiumFeature) {
    // If it's a listed premium feature, only premium+ roles have access
    return ['premium', 'admin', 'superadmin'].includes(role);
  }
  // If it's not in the PREMIUM_FEATURES list, assume it's a free/standard feature
  return true;
}

// Example of how it might be used for specific compression levels if needed:
// export function hasCompressionLevelAccess(role: UserRole, level: 'low' | 'medium' | 'high'): boolean {
//   if (level === 'medium' || level === 'high') {
//     return hasFeature(role, 'EXTRA_COMPRESSION');
//   }
//   return true; // 'low' compression is free
// }
