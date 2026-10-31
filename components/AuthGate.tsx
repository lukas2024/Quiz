"use client";

import type { ReactNode } from "react";
import { useAuth } from "@/components/AuthProvider";
import LoginScreen from "@/components/LoginScreen";

export default function AuthGate({ children }: { children: ReactNode }) {
  const { state, actionError, signIn, signOut } = useAuth();

  const errorMessage = actionError && (
    <p role="alert" className="text-red-700 dark:text-red-400">
      {actionError}
    </p>
  );

  switch (state.status) {
    case "loading":
      return <p className="text-zinc-500">Ładowanie…</p>;

    case "error":
      return (
        <p role="alert" className="text-red-700 dark:text-red-400">
          {state.message}
        </p>
      );

    case "signed-out":
      return (
        <LoginScreen
          onSignIn={() => void signIn()}
          errorMessage={actionError}
        />
      );

    case "signed-in":
      return (
        <div className="flex w-full flex-col items-center gap-8">
          <div className="flex w-full max-w-xl items-center justify-between gap-4 border-b border-zinc-200 pb-3 dark:border-zinc-800">
            <p className="text-sm">
              Zalogowano jako{" "}
              <span className="font-semibold">
                {state.user.displayName ?? state.user.email ?? "uczeń"}
              </span>
            </p>
            <button
              type="button"
              className="text-sm underline hover:no-underline"
              onClick={() => void signOut()}
            >
              Wyloguj
            </button>
          </div>
          {errorMessage}
          {children}
        </div>
      );
  }
}
