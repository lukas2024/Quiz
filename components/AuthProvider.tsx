"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { FirebaseError } from "firebase/app";
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut as firebaseSignOut,
  type User,
} from "firebase/auth";
import { getFirebaseAuth, getMissingFirebaseConfig } from "@/lib/firebase";

export type AppUser = {
  uid: string;
  displayName: string | null;
  email: string | null;
};

export type AuthState =
  | { status: "loading" }
  | { status: "signed-out" }
  | { status: "signed-in"; user: AppUser }
  | { status: "error"; message: string };

type AuthContextValue = {
  state: AuthState;
  actionError: string | null;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function toAppUser(user: User): AppUser {
  return {
    uid: user.uid,
    displayName: user.displayName,
    email: user.email,
  };
}

// Pokazujemy tylko własne komunikaty i kod błędu, nigdy error.message,
// żeby żadna wartość konfiguracji nie trafiła na ekran.
function signInErrorMessage(code: string): string {
  switch (code) {
    case "auth/popup-blocked":
      return "Przeglądarka zablokowała okno logowania. Zezwól na wyskakujące okna.";
    case "auth/unauthorized-domain":
      return "Ta domena nie jest dodana w Firebase (Authorized domains).";
    case "auth/operation-not-allowed":
      return "Logowanie przez Google nie jest włączone w Firebase.";
    case "auth/network-request-failed":
      return "Brak połączenia z siecią. Spróbuj ponownie.";
    default:
      return `Logowanie nie powiodło się (kod: ${code}).`;
  }
}

const IGNORED_SIGN_IN_ERRORS = new Set([
  "auth/popup-closed-by-user",
  "auth/cancelled-popup-request",
]);

// Zmienne NEXT_PUBLIC_* są wpisane przy buildzie, więc wynik jest stały
// i taki sam na serwerze i w przeglądarce.
const MISSING_CONFIG = getMissingFirebaseConfig();
const CONFIG_OK = MISSING_CONFIG.length === 0;

export default function AuthProvider({ children }: { children: ReactNode }) {
  const [sessionState, setSessionState] = useState<AuthState>({
    status: "loading",
  });
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    if (!CONFIG_OK) return;
    const unsubscribe = onAuthStateChanged(getFirebaseAuth(), (user) => {
      setSessionState(
        user
          ? { status: "signed-in", user: toAppUser(user) }
          : { status: "signed-out" },
      );
    });
    return unsubscribe;
  }, []);

  const signIn = useCallback(async () => {
    setActionError(null);
    try {
      await signInWithPopup(getFirebaseAuth(), new GoogleAuthProvider());
    } catch (error) {
      if (error instanceof FirebaseError) {
        if (IGNORED_SIGN_IN_ERRORS.has(error.code)) return;
        setActionError(signInErrorMessage(error.code));
      } else {
        setActionError("Logowanie nie powiodło się.");
      }
    }
  }, []);

  const signOut = useCallback(async () => {
    setActionError(null);
    try {
      await firebaseSignOut(getFirebaseAuth());
    } catch {
      setActionError("Wylogowanie nie powiodło się. Spróbuj ponownie.");
    }
  }, []);

  const value = useMemo((): AuthContextValue => {
    const state: AuthState = CONFIG_OK
      ? sessionState
      : {
          status: "error",
          message: `Brak konfiguracji Firebase: ${MISSING_CONFIG.join(", ")}`,
        };
    return { state, actionError, signIn, signOut };
  }, [sessionState, actionError, signIn, signOut]);

  return <AuthContext value={value}>{children}</AuthContext>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth musi być użyty wewnątrz AuthProvider.");
  }
  return context;
}
