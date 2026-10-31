"use client";

import { useCallback, useEffect, useState } from "react";
import { FirebaseError } from "firebase/app";
import { useAuth } from "@/components/AuthProvider";
import StudySession from "@/components/StudySession";
import { fetchAttempts, saveAttempt } from "@/lib/attempts";
import { fetchQuestions } from "@/lib/questions";
import { orderQuestionsForSession, type AttemptSummary } from "@/lib/review";
import type { AnswerRecord, Question } from "@/types/question";

type LoadState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; questions: Question[]; historyFailed: boolean };

/** Historia odpowiedzi albo null, gdy odczyt się nie udał. */
async function fetchHistory(uid: string | null): Promise<AttemptSummary[] | null> {
  if (!uid) return [];
  try {
    return await fetchAttempts(uid);
  } catch {
    return null;
  }
}

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

  // Każda sesja (także po „Zacznij od nowa”) pobiera pytania i świeżą historię,
  // żeby błędy z poprzedniej sesji trafiły na początek.
  useEffect(() => {
    let cancelled = false;
    Promise.all([fetchQuestions(), fetchHistory(uid)])
      .then(([questions, history]) => {
        if (cancelled) return;
        setLoadState({
          status: "ready",
          questions: history
            ? orderQuestionsForSession(questions, history)
            : questions,
          historyFailed: history === null,
        });
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setLoadState({ status: "error", message: loadErrorMessage(error) });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [reloadKey, uid]);

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

  // Ponowna próba po błędzie i nowa sesja działają tak samo: wczytaj od nowa.
  function reload() {
    setLoadState({ status: "loading" });
    setSaveError(null);
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
            onClick={reload}
          >
            Spróbuj ponownie
          </button>
        </div>
      );

    case "ready":
      return (
        <div className="flex w-full flex-col items-center gap-4">
          {loadState.historyFailed && (
            <p role="status" className="text-sm text-amber-700 dark:text-amber-400">
              Nie udało się wczytać historii odpowiedzi – pytania w zwykłej
              kolejności.
            </p>
          )}
          {saveError && (
            <p role="alert" className="text-sm text-red-700 dark:text-red-400">
              {saveError}
            </p>
          )}
          <StudySession
            key={reloadKey}
            questions={loadState.questions}
            onAnswer={handleAnswer}
            onRestart={reload}
          />
        </div>
      );
  }
}
