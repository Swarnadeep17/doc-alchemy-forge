import { initializeApp, type FirebaseApp } from "firebase/app";
import { getDatabase, type Database } from "firebase/database";
import { getAuth, type Auth } from "firebase/auth";

interface FirebaseServices {
  app: FirebaseApp;
  db: Database;
  auth: Auth;
  analytics?: any;
  performance?: any;
  prefetchData?: (paths: string[]) => Promise<void>;
}

/**
 * Firebase configuration object
 * Note: In production, these values should come from environment variables
 */
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyAwgqYEEUWu0aGminZCl11c_yKYfUu-9MU",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "docenclave-d5a43.firebaseapp.com",
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL || "https://docenclave-d5a43-default-rtdb.firebaseio.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "docenclave-d5a43",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "docenclave-d5a43.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "13497976521",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:13497976521:web:fd2f8c357e3bdebfaf6f18",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-YMT8E4PJN0"
};

/**
 * Initializes Firebase services with error handling
 * @returns Promise that resolves with initialized Firebase services
 * @throws Error if Firebase initialization fails
 */
let app: FirebaseApp;
let db: Database;
let auth: Auth;

const initializeFirebase = async (): Promise<FirebaseServices> => {
  try {
    // Initialize core Firebase services if not already done
    if (!app) {
      app = initializeApp(firebaseConfig);
      db = getDatabase(app);
      auth = getAuth(app);
    }

    // Configure database for optimized performance
    if (typeof window !== 'undefined') {
      try {
        const { enableLogging, ref, onValue } = await import("firebase/database");
        
        // Enable logging in development
        enableLogging(process.env.NODE_ENV === 'development');
        
        // Monitor connection state
        const connectedRef = ref(db, '.info/connected');
        onValue(connectedRef, (snap) => {
          if (snap.val() === true) {
            console.log('Connected to Firebase Realtime Database');
          } else {
            console.log('Disconnected from Firebase Realtime Database');
          }
        });
      } catch (err) {
        console.warn('Failed to configure database:', err);
      }
    }

    // Initialize optional services dynamically
    let analytics, performance;
    
    if (typeof window !== 'undefined') {
      try {
        analytics = await import("firebase/analytics")
          .then(({ getAnalytics }) => getAnalytics(app));
        
        const perfModule = await import("firebase/performance");
        performance = perfModule.getPerformance(app);
        
        // Initialize custom performance traces
        const trace = perfModule.trace(performance, 'firebase_initialization');
        trace.start();
        // Simulate some work for the trace
        await new Promise(resolve => setTimeout(resolve, 50));
        trace.stop();
      } catch (optionalError) {
        console.warn('Optional Firebase services failed to initialize:', optionalError);
      }
    }

    /**
     * Preloads frequently accessed data paths to improve performance
     * @param paths Array of database paths to preload
     */
    const prefetchData = async (paths: string[]) => {
      if (typeof window === 'undefined') return;
      
      try {
        const { get, ref } = await import("firebase/database");
        await Promise.all(
          paths.map(path => get(ref(db, path)))
        );
      } catch (err) {
        console.warn('Data prefetch failed:', err);
      }
    };

    return {
      app,
      db,
      auth,
      analytics,
      performance,
      prefetchData
    };
  } catch (error) {
    console.error('Firebase initialization error:', error);
    throw new Error('Failed to initialize Firebase services');
  }
};

export { initializeFirebase, app, db, auth };
export type { FirebaseServices };
