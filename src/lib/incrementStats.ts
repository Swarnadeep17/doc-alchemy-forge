
import { db } from "@/lib/firebase";
import { ref, runTransaction } from "firebase/database";

/**
 * Increments a numeric stat in Realtime Database atomically.
 * pathParts = array representing the stat path, e.g. ["overall", "visits"] or ["tools", "PDF", "merge", "visits"]
 */
export async function incrementStat(pathParts: string[]) {
  const statRef = ref(db, `/stats/${pathParts.join("/")}`);

  return runTransaction(statRef, (currentVal) => {
    if (typeof currentVal === "number") {
      return currentVal + 1;
    }
    return 1; // If stat doesn't exist, create it as 1
  });
}
