"use client";

import { useEffect, useState } from "react";
import { FirebaseError } from "firebase/app";
import { useAuth } from "@/components/AuthProvider";
import { fetchAttempts } from "@/lib/attempts";
import {
  computeProgress,
  formatRetryRate,
  type ProgressStats,
} from "@/lib/progress";

type LoadState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; stats: ProgressStats };

// Tylko własne komunikaty i kod błędu, nigdy error.message.
function loadErrorMessage(error: unknown): string {
  const code = error instanceof FirebaseError ? error.code : null;
  switch (code) {
    case "permission-denied":
      return "Brak uprawnień do odczytu historii odpowiedzi.";
    case "unavailable":
      return "Brak połączenia z bazą. Spróbuj ponownie.";
    case null:
      return "Nie udało się wczytać postępów.";
    default:
      return `Nie udało się wczytać postępów (kod: ${code}).`;
  }
}

export default function ProgressView() {
  const { state: authState } = useAuth();
  const uid = authState.status === "signed-in" ? authState.user.uid : null;

  const [loadState, setLoadState] = useState<LoadState>({ status: "loading" });
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!uid) return;
    let cancelled = false;
    fetchAttempts(uid)
      .then((attempts) => {
        if (!cancelled) {
          setLoadState({ status: "ready", stats: computeProgress(attempts) });
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setLoadState({ status: "error", message: loadErrorMessage(error) });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [uid, reloadKey]);

  function reload() {
    setLoadState({ status: "loading" });
    setReloadKey((key) => key + 1);
  }

  switch (loadState.status) {
    case "loading":
      return <p className="text-zinc-500">Ładowanie postępów…</p>;

    case "error":
      return (
        <div className="flex flex-col items-center gap-3">
          <p role="alert" className="text-red-700 dark:text-red-400">
            {loadState.message}
          </p>
          <button
            type="button"
            className="rounded-lg bg-zinc-900 px-5 py-2 text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
            onClick={reload}
          >
            Spróbuj ponownie
          </button>
        </div>
      );

    case "ready": {
      const { stats } = loadState;
      const rate = formatRetryRate(stats);
      return (
        <dl className="grid w-full max-w-xl grid-cols-[1fr_auto] gap-x-6 gap-y-4">
          <dt className="font-semibold">Skuteczność powtórek</dt>
          <dd className={rate ? "text-right text-2xl font-bold" : "text-right text-sm text-zinc-500"}>
            {rate ?? "Za mało danych - odpowiedz jeszcze raz na pytania z błędem"}
          </dd>

          <dt>Odpowiedzi łącznie</dt>
          <dd className="text-right font-semibold">{stats.totalAnswers}</dd>

          <dt>Pytania z błędem bez powtórki</dt>
          <dd className="text-right font-semibold">{stats.pendingRetry}</dd>
        </dl>
      );
    }
  }
}
