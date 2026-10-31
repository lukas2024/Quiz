"use client";

import { useCallback, useEffect, useState } from "react";
import { FirebaseError } from "firebase/app";
import { useAuth } from "@/components/AuthProvider";
import StudySession from "@/components/StudySession";
import { saveAttempt } from "@/lib/attempts";
import { fetchQuestions } from "@/lib/questions";
import type { AnswerRecord, Question } from "@/types/question";

type LoadState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; questions: Question[] };

// Tylko własne komunikaty i kod błędu, nigdy error.message.
function errorCode(error: unknown): string | null {
  return error instanceof FirebaseError ? error.code : null;
}

function loadErrorMessage(error: unknown): string {
  const code = errorCode(error);
  switch (code) {
    case "permission-denied":
      return "Brak uprawnień do odczytu pytań. Sprawdź reguły Firestore.";
    case "unavailable":
      return "Brak połączenia z bazą. Spróbuj ponownie.";
    case null:
      return "Nie udało się wczytać pytań.";
    default:
      return `Nie udało się wczytać pytań (kod: ${code}).`;
  }
}

function saveErrorMessage(error: unknown): string {
  const code = errorCode(error);
  return code
    ? `Nie udało się zapisać odpowiedzi (kod: ${code}).`
    : "Nie udało się zapisać odpowiedzi.";
}

export default function QuestionsLoader() {
  const { state: authState } = useAuth();
  const uid = authState.status === "signed-in" ? authState.user.uid : null;

  const [loadState, setLoadState] = useState<LoadState>({ status: "loading" });
  const [reloadKey, setReloadKey] = useState(0);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchQuestions()
      .then((questions) => {
        if (!cancelled) setLoadState({ status: "ready", questions });
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setLoadState({ status: "error", message: loadErrorMessage(error) });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  // Zapis idzie w tle: addDoc kończy się dopiero po potwierdzeniu serwera,
  // więc nie blokujemy na nim nauki.
  const handleAnswer = useCallback(
    (record: AnswerRecord) => {
      if (!uid) return;
      saveAttempt(uid, record)
        .then(() => setSaveError(null))
        .catch((error: unknown) => setSaveError(saveErrorMessage(error)));
    },
    [uid],
  );

  function retry() {
    setLoadState({ status: "loading" });
    setReloadKey((key) => key + 1);
  }

  switch (loadState.status) {
    case "loading":
      return <p className="text-zinc-500">Ładowanie pytań…</p>;

    case "error":
      return (
        <div className="flex flex-col items-center gap-3">
          <p role="alert" className="text-red-700 dark:text-red-400">
            {loadState.message}
          </p>
          <button
            type="button"
            className="rounded-lg bg-zinc-900 px-5 py-2 text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
            onClick={retry}
          >
            Spróbuj ponownie
          </button>
        </div>
      );

    case "ready":
      return (
        <div className="flex w-full flex-col items-center gap-4">
          {saveError && (
            <p role="alert" className="text-sm text-red-700 dark:text-red-400">
              {saveError}
            </p>
          )}
          <StudySession
            questions={loadState.questions}
            onAnswer={handleAnswer}
          />
        </div>
      );
  }
}
