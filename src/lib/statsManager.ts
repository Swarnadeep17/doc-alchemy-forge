// src/lib/statsManager.ts

import { db } from "../lib/firebase";
import { ref, runTransaction } from "firebase/database";

// --- Helper Functions ---

function getWeekKey(date: Date): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}

const increment = (path: string) => {
  return runTransaction(ref(db, path), (current) => (current || 0) + 1);
};


// --- Main Tracking Function ---

/**
 * Increments a stat and records time-based data.
 * Can now accept an optional 'options' object to track feature usage.
 * @param type - The type of stat to track ('visits' or 'downloads').
 * @param category - The tool category (e.g., 'PDF').
 * @param tool - The specific tool used (e.g., 'compress').
 * @param options - An object detailing specific features used (e.g., { compressionLevel: 'low' }).
 */
export async function trackStat(
  type: "visits" | "downloads",
  category: string,
  tool: string,
  options?: Record<string, string>
) {
  const now = new Date();
  const dayKey = now.toISOString().split('T')[0];
  const weekKey = getWeekKey(now);
  const monthKey = now.toISOString().slice(0, 7);

  const basePath = `/stats`;

  const updates = [
    // Overall stats
    increment(`${basePath}/overall/${type}`),
    
    // Tool-specific stats
    increment(`${basePath}/tools/${category}/${tool}/${type}`),
    
    // Time-based stats
    increment(`${basePath}/timeBased/daily/${dayKey}/${type}`),
    increment(`${basePath}/timeBased/weekly/${weekKey}/${type}`),
    increment(`${basePath}/timeBased/monthly/${monthKey}/${type}`),
  ];

  // --- NEW: Increment option-specific stats ---
  if (options && Object.keys(options).length > 0) {
    const optionUpdates = Object.entries(options).map(([optionName, optionValue]) => {
      return increment(`${basePath}/tools/${category}/${tool}/options/${optionName}/${optionValue}`);
    });
    updates.push(...optionUpdates);
  }
  // --- END NEW ---

  try {
    await Promise.all(updates);
  } catch (error) {
    console.error("Failed to track stats:", error);
  }
}