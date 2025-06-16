import { db } from "../lib/firebase";
import { ref, runTransaction, serverTimestamp } from "firebase/database";

interface TimeBasedStat {
  count: number;
  timestamp: number;
}

/**
 * Increments a stat and records time-based data
 */
export async function trackStat(
  type: "visits" | "downloads",
  category: string,
  tool: string
) {
  const now = Date.now();
  const date = new Date();
  
  // Create time period keys
  const dayKey = date.toISOString().split('T')[0];
  const weekKey = getWeekKey(date);
  const monthKey = date.toISOString().slice(0, 7); // YYYY-MM

  const updates = [
    // Overall stats
    incrementOverallStat(type),
    
    // Tool-specific stats
    incrementToolStat(category, tool, type),
    
    // Time-based stats
    incrementTimePeriodStat(type, 'daily', dayKey),
    incrementTimePeriodStat(type, 'weekly', weekKey),
    incrementTimePeriodStat(type, 'monthly', monthKey),
    
    // Tool-specific time-based stats
    incrementToolTimePeriodStat(category, tool, type, 'daily', dayKey),
    incrementToolTimePeriodStat(category, tool, type, 'weekly', weekKey),
    incrementToolTimePeriodStat(category, tool, type, 'monthly', monthKey),
  ];

  await Promise.all(updates);
}

// Helper function to get week key (YYYY-Www)
function getWeekKey(date: Date): string {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - (d.getDay() + 6) % 7);
  const week = Math.floor((d.getTime() - new Date(d.getFullYear(), 0, 4).getTime()) / 86400000 / 7);
  return `${d.getFullYear()}-W${String(week).padStart(2, '0')}`;
}

// Increment overall stat counter
async function incrementOverallStat(type: string) {
  const ref = ref(db, `/stats/overall/${type}`);
  return runTransaction(ref, (current) => (current || 0) + 1);
}

// Increment tool-specific stat counter
async function incrementToolStat(category: string, tool: string, type: string) {
  const ref = ref(db, `/stats/tools/${category}/${tool}/${type}`);
  return runTransaction(ref, (current) => (current || 0) + 1);
}

// Increment time period stat
async function incrementTimePeriodStat(type: string, period: string, key: string) {
  const ref = ref(db, `/stats/timeBased/${period}/${key}/${type}`);
  return runTransaction(ref, (current) => (current || 0) + 1);
}

// Increment tool-specific time period stat
async function incrementToolTimePeriodStat(
  category: string,
  tool: string,
  type: string,
  period: string,
  key: string
) {
  const ref = ref(db, `/stats/toolsTimeBased/${category}/${tool}/${period}/${key}/${type}`);
  return runTransaction(ref, (current) => (current || 0) + 1);
}

// Get stats for a specific time period
export async function getTimeBasedStats(
  period: 'daily' | 'weekly' | 'monthly',
  startDate: Date,
  endDate: Date
) {
  const ref = ref(db, `/stats/timeBased/${period}`);
  // Implementation for fetching time-based stats
  // This would be used by the analytics component
}

// Clean up old stats (can be run periodically)
export async function cleanupOldStats(daysToKeep: number = 365) {
  const cutoff = Date.now() - (daysToKeep * 24 * 60 * 60 * 1000);
  // Implementation for cleaning up old stats
  // This would help manage database size
}
