"use client";

import type { ReactNode } from "react";
import { useAuth } from "@/components/AuthProvider";

const buttonClass =
  "rounded-lg bg-zinc-900 px-5 py-2 text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300";

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
        <div className="flex flex-col items-center gap-3">
          <button type="button" className={buttonClass} onClick={() => void signIn()}>
            Zaloguj przez Google
          </button>
          {errorMessage}
        </div>
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
