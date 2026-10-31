"use client";

import type { ReactNode } from "react";
import AppHeader from "@/components/AppHeader";
import { useAuth } from "@/components/AuthProvider";
import LoginScreen from "@/components/LoginScreen";

function CenteredMessage({ children }: { children: ReactNode }) {
  return (
    <main className="flex flex-1 items-center justify-center px-4">
      {children}
    </main>
  );
}

export default function AuthGate({ children }: { children: ReactNode }) {
  const { state, actionError, signIn, signOut } = useAuth();

  switch (state.status) {
    case "loading":
      return (
        <CenteredMessage>
          <p className="text-zinc-500 dark:text-zinc-400">Ładowanie…</p>
        </CenteredMessage>
      );

    case "error":
      return (
        <CenteredMessage>
          <p role="alert" className="text-red-700 dark:text-red-400">
            {state.message}
          </p>
        </CenteredMessage>
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
        <>
          <AppHeader
            userName={state.user.displayName ?? state.user.email ?? "uczeń"}
            onSignOut={() => void signOut()}
          />
          <main className="mx-auto flex w-full max-w-[640px] flex-1 flex-col gap-4 px-4 py-4 sm:py-8">
            {actionError && (
              <p role="alert" className="text-sm text-red-700 dark:text-red-400">
                {actionError}
              </p>
            )}
            {children}
          </main>
        </>
      );
  }
}
