// Czyste funkcje ustalające kolejność pytań i wynik sesji.
// Bez Firebase i bez Reacta, żeby dało się je testować jednostkowo.

import type { Question } from "@/types/question";

/** Skrót jednej odpowiedzi z historii ucznia (users/{uid}/attempts). */
export type AttemptSummary = {
  questionId: string;
  isCorrect: boolean;
  createdAtMs: number;
};

/** Pozycja w kolejce bieżącej sesji. */
export type SessionItem = {
  question: Question;
  /** Powtórka w tej samej sesji po błędzie przy pierwszym podejściu. */
  isRepeat: boolean;
  /** Ostatnia odpowiedź z historii (poprzednie sesje) była błędna. */
  dueFromHistory: boolean;
};

/** Odpowiedź udzielona w bieżącej sesji. */
export type SessionAnswer = {
  questionId: string;
  isCorrect: boolean;
  isRepeat: boolean;
};

/**
 * ID pytań, na które OSTATNIA odpowiedź w historii była błędna.
 * Ostatnia = największe createdAtMs (kolejność w tablicy nie ma znaczenia).
 * Remis czasu: wygrywa odpowiedź błędna.
 */
export function findLastWrongIds(
  attempts: readonly AttemptSummary[],
): Set<string> {
  const latest = new Map<string, AttemptSummary>();

  for (const attempt of attempts) {
    const current = latest.get(attempt.questionId);
    const isNewer =
      !current ||
      attempt.createdAtMs > current.createdAtMs ||
      (attempt.createdAtMs === current.createdAtMs && !attempt.isCorrect);
    if (isNewer) latest.set(attempt.questionId, attempt);
  }

  const ids = new Set<string>();
  for (const [questionId, attempt] of latest) {
    if (!attempt.isCorrect) ids.add(questionId);
  }
  return ids;
}

/**
 * Następna sesja: pytania z findLastWrongIds idą na początek; reszta po nich.
 * Obie grupy zachowują kolejność wejściową.
 */
export function orderQuestionsForSession(
  questions: readonly Question[],
  attempts: readonly AttemptSummary[],
): Question[] {
  const lastWrongIds = findLastWrongIds(attempts);
  const lastWrong = (question: Question) => lastWrongIds.has(question.id);

  return [
    ...questions.filter(lastWrong),
    ...questions.filter((question) => !lastWrong(question)),
  ];
}

/**
 * Ta sama sesja: kolejka startowa, każde pytanie jako pierwsze podejście.
 * dueIds (z findLastWrongIds) oznacza pytania do powtórki z poprzednich sesji.
 */
export function createQueue(
  questions: readonly Question[],
  dueIds: ReadonlySet<string> = new Set(),
): SessionItem[] {
  return questions.map((question) => ({
    question,
    isRepeat: false,
    dueFromHistory: dueIds.has(question.id),
  }));
}

/**
 * Ta sama sesja: błąd przy pierwszym podejściu dopisuje pytanie raz na koniec
 * kolejki jako powtórkę. Poprawna odpowiedź albo błąd w powtórce nic nie zmienia.
 */
export function enqueueRetry(
  queue: readonly SessionItem[],
  current: SessionItem,
  isCorrect: boolean,
): SessionItem[] {
  if (isCorrect || current.isRepeat) return [...queue];
  return [
    ...queue,
    { question: current.question, isRepeat: true, dueFromHistory: false },
  ];
}

/** Wynik sesji liczony tylko z pierwszych podejść; total = liczba pytań. */
export function firstAttemptScore(
  answers: readonly SessionAnswer[],
  totalQuestions: number,
): { correct: number; total: number } {
  const correct = answers.filter(
    (answer) => !answer.isRepeat && answer.isCorrect,
  ).length;
  return { correct, total: totalQuestions };
}
