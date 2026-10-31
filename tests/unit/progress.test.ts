import { describe, expect, it } from "vitest";
import { computeProgress, formatRetryRate } from "../../lib/progress";
import type { AttemptSummary } from "../../lib/review";

const H = 60 * 60 * 1000;
const T0 = Date.UTC(2026, 9, 31, 10, 0);

/** Kolejne próby jednego pytania co godzinę: a("hp-1", false, true). */
function a(questionId: string, ...results: boolean[]): AttemptSummary[] {
  return results.map((isCorrect, i) => ({
    questionId,
    isCorrect,
    createdAtMs: T0 + i * H,
  }));
}

describe("computeProgress", () => {
  it("1. brak prób -> zera, rate null, formatRetryRate null", () => {
    const stats = computeProgress([]);
    expect(stats).toEqual({
      totalAnswers: 0,
      retried: 0,
      retriedCorrect: 0,
      retrySuccessRate: null,
      pendingRetry: 0,
    });
    expect(formatRetryRate(stats)).toBeNull();
  });

  it("2. hp-1 poprawna -> poza metryką, totalAnswers 1", () => {
    const stats = computeProgress(a("hp-1", true));
    expect(stats.totalAnswers).toBe(1);
    expect(stats.retried).toBe(0);
    expect(stats.pendingRetry).toBe(0);
    expect(stats.retrySuccessRate).toBeNull();
  });

  it("3. hp-1 błędna, potem poprawna -> 100% (1 z 1)", () => {
    const stats = computeProgress(a("hp-1", false, true));
    expect(formatRetryRate(stats)).toBe("100% (1 z 1)");
    expect(stats.pendingRetry).toBe(0);
  });

  it("4. hp-1 błędna, potem błędna -> 0% (0 z 1), nie 'za mało danych'", () => {
    const stats = computeProgress(a("hp-1", false, false));
    expect(stats.retrySuccessRate).toBe(0);
    expect(formatRetryRate(stats)).toBe("0% (0 z 1)");
  });

  it("5. hp-1 błędna, bez kolejnego podejścia -> pendingRetry 1, rate null", () => {
    const stats = computeProgress(a("hp-1", false));
    expect(stats.pendingRetry).toBe(1);
    expect(stats.retried).toBe(0);
    expect(stats.retrySuccessRate).toBeNull();
  });

  it("6. hp-1 błędna, błędna, poprawna -> 0 z 1 (liczy się tylko 2. podejście)", () => {
    const stats = computeProgress(a("hp-1", false, false, true));
    expect(stats.retried).toBe(1);
    expect(stats.retriedCorrect).toBe(0);
    expect(stats.totalAnswers).toBe(3);
  });

  it("7. hp-1 poprawna, błędna, poprawna -> poza metryką i poza pendingRetry", () => {
    const stats = computeProgress(a("hp-1", true, false, true));
    expect(stats.retried).toBe(0);
    expect(stats.pendingRetry).toBe(0);
  });

  it("8. przypadek 3 z odwróconą kolejnością w tablicy -> ten sam wynik", () => {
    const stats = computeProgress(a("hp-1", false, true).reverse());
    expect(formatRetryRate(stats)).toBe("100% (1 z 1)");
  });

  it("9. przykład z zadania -> 75% (3 z 4), pendingRetry 1", () => {
    const attempts = [
      ...a("hp-1", false, true),
      ...a("hp-2", false, true),
      ...a("hp-3", false, true),
      ...a("hp-4", false, false),
      ...a("hp-5", false),
    ];
    const stats = computeProgress(attempts);
    expect(formatRetryRate(stats)).toBe("75% (3 z 4)");
    expect(stats.pendingRetry).toBe(1);
    expect(stats.totalAnswers).toBe(9);
  });

  it("10. zaokrąglenie: 2 z 3 -> 67% (2 z 3)", () => {
    const attempts = [
      ...a("hp-1", false, true),
      ...a("hp-2", false, true),
      ...a("hp-3", false, false),
    ];
    expect(formatRetryRate(computeProgress(attempts))).toBe("67% (2 z 3)");
  });

  it("11. remis czasu: poprawna i błędna -> błędna druga, pytanie poza metryką", () => {
    const tie: AttemptSummary[] = [
      { questionId: "hp-1", isCorrect: false, createdAtMs: T0 },
      { questionId: "hp-1", isCorrect: true, createdAtMs: T0 },
    ];
    const stats = computeProgress(tie);
    expect(stats.retried).toBe(0);
    expect(stats.pendingRetry).toBe(0);
  });

  it("12. nie zmienia tablicy wejściowej", () => {
    const attempts = a("hp-1", true, false).reverse();
    const before = structuredClone(attempts);
    computeProgress(attempts);
    expect(attempts).toEqual(before);
  });
});
