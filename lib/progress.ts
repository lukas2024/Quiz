// Czysta funkcja licząca metrykę postępów. Bez Firebase i bez Reacta.

import type { AttemptSummary } from "@/lib/review";

export type ProgressStats = {
  /** Wszystkie odpowiedzi ucznia. */
  totalAnswers: number;
  /** Pytania: pierwsza odpowiedź błędna i jest drugie podejście. */
  retried: number;
  /** Z nich: drugie podejście poprawne. */
  retriedCorrect: number;
  /** retriedCorrect / retried; null, gdy retried = 0. */
  retrySuccessRate: number | null;
  /** Pytania: pierwsza odpowiedź błędna i brak drugiego podejścia. */
  pendingRetry: number;
};

/**
 * Kolejność prób jednego pytania: według czasu; przy remisie błędna
 * liczy się jako późniejsza (tak samo jak w orderQuestionsForSession).
 */
function byTime(a: AttemptSummary, b: AttemptSummary): number {
  if (a.createdAtMs !== b.createdAtMs) return a.createdAtMs - b.createdAtMs;
  return Number(a.isCorrect === false) - Number(b.isCorrect === false);
}

/**
 * Skuteczność powtórek: spośród pytań z błędną PIERWSZĄ odpowiedzią,
 * do których uczeń wrócił, jaka część DRUGIEGO podejścia była poprawna.
 */
export function computeProgress(
  attempts: readonly AttemptSummary[],
): ProgressStats {
  const byQuestion = new Map<string, AttemptSummary[]>();
  for (const attempt of attempts) {
    const list = byQuestion.get(attempt.questionId) ?? [];
    list.push(attempt);
    byQuestion.set(attempt.questionId, list);
  }

  let retried = 0;
  let retriedCorrect = 0;
  let pendingRetry = 0;

  for (const list of byQuestion.values()) {
    const [first, second] = [...list].sort(byTime);
    if (first.isCorrect) continue;
    if (!second) {
      pendingRetry += 1;
      continue;
    }
    retried += 1;
    if (second.isCorrect) retriedCorrect += 1;
  }

  return {
    totalAnswers: attempts.length,
    retried,
    retriedCorrect,
    retrySuccessRate: retried === 0 ? null : retriedCorrect / retried,
    pendingRetry,
  };
}

/** "75% (3 z 4)" albo null, gdy nie ma jeszcze żadnego powtórzonego pytania. */
export function formatRetryRate(stats: ProgressStats): string | null {
  if (stats.retrySuccessRate === null) return null;
  const percent = Math.round(stats.retrySuccessRate * 100);
  return `${percent}% (${stats.retriedCorrect} z ${stats.retried})`;
}
