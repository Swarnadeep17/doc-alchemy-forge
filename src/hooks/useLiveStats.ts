
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { ref, onValue } from "firebase/database";

// Types for stats
interface ToolStats {
  visits: number;
  downloads: number;
}

interface Stats {
  overall: {
    visits: number;
    downloads: number;
  };
  tools: {
    [category: string]: {
      [tool: string]: ToolStats;
    };
  };
}

export function useLiveStats() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const statsRef = ref(db, "/stats");
    const unsubscribe = onValue(statsRef, (snapshot) => {
      setStats(snapshot.val());
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { stats, loading };
}
