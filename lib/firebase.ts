import {
  type FirebaseOptions,
  getApp,
  getApps,
  initializeApp,
} from "firebase/app";
import { type Auth, getAuth } from "firebase/auth";

// Next.js podmienia process.env.NEXT_PUBLIC_* tylko przy odczycie wprost,
// dlatego każda zmienna jest wypisana jawnie (bez process.env[name]).
const config = {
  NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN:
    process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  NEXT_PUBLIC_FIREBASE_APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

/** Zwraca tylko NAZWY brakujących zmiennych, nigdy ich wartości. */
export function getMissingFirebaseConfig(): string[] {
  return Object.entries(config)
    .filter(([, value]) => !value)
    .map(([name]) => name);
}

function toFirebaseOptions(): FirebaseOptions {
  const missing = getMissingFirebaseConfig();
  if (missing.length > 0) {
    throw new Error(`Brak konfiguracji Firebase: ${missing.join(", ")}`);
  }
  return {
    apiKey: config.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: config.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: config.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    appId: config.NEXT_PUBLIC_FIREBASE_APP_ID,
  };
}

let auth: Auth | null = null;

/** Inicjalizuje Firebase leniwie, przy pierwszym wywołaniu w przeglądarce. */
export function getFirebaseAuth(): Auth {
  if (auth) return auth;
  const app = getApps().length > 0 ? getApp() : initializeApp(toFirebaseOptions());
  auth = getAuth(app);
  return auth;
}
