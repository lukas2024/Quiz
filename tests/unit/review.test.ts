import { describe, expect, it } from "vitest";
import {
  createQueue,
  enqueueRetry,
  findLastWrongIds,
  firstAttemptScore,
  orderQuestionsForSession,
  type AttemptSummary,
  type SessionAnswer,
} from "../../lib/review";
import type { Question } from "../../types/question";

function q(id: string): Question {
  return {
    id,
    subject: "Historia Polski",
    text: `Pytanie ${id}`,
    options: ["A", "B", "C", "D"],
    correctIndex: 0,
  };
}

const QUESTIONS = ["hp-1", "hp-2", "hp-3", "hp-4", "hp-5"].map(q);
const T10 = Date.UTC(2026, 9, 31, 10, 0);
const T11 = Date.UTC(2026, 9, 31, 11, 0);

function attempt(
  questionId: string,
  isCorrect: boolean,
  createdAtMs: number,
): AttemptSummary {
  return { questionId, isCorrect, createdAtMs };
}

const ids = (questions: Question[]) => questions.map((question) => question.id);

describe("orderQuestionsForSession", () => {
  it("1. brak prób -> kolejność bez zmian", () => {
    expect(ids(orderQuestionsForSession(QUESTIONS, []))).toEqual([
      "hp-1", "hp-2", "hp-3", "hp-4", "hp-5",
    ]);
  });

  it("2. hp-3 ostatnio błędne -> hp-3 na początek", () => {
    const attempts = [attempt("hp-3", false, T10), attempt("hp-1", true, T10)];
    expect(ids(orderQuestionsForSession(QUESTIONS, attempts))).toEqual([
      "hp-3", "hp-1", "hp-2", "hp-4", "hp-5",
    ]);
  });

  it("3. hp-4 i hp-2 błędne -> w grupie trudnych kolejność według ID", () => {
    const attempts = [attempt("hp-4", false, T10), attempt("hp-2", false, T11)];
    expect(ids(orderQuestionsForSession(QUESTIONS, attempts))).toEqual([
      "hp-2", "hp-4", "hp-1", "hp-3", "hp-5",
    ]);
  });

  it("4. hp-3 błędna o 10:00, poprawna o 11:00 -> nie na początek", () => {
    const attempts = [attempt("hp-3", false, T10), attempt("hp-3", true, T11)];
    expect(ids(orderQuestionsForSession(QUESTIONS, attempts))).toEqual([
      "hp-1", "hp-2", "hp-3", "hp-4", "hp-5",
    ]);
  });

  it("5. hp-3 poprawna o 10:00, błędna o 11:00 -> na początek", () => {
    const attempts = [attempt("hp-3", true, T10), attempt("hp-3", false, T11)];
    expect(ids(orderQuestionsForSession(QUESTIONS, attempts))[0]).toBe("hp-3");
  });

  it("6. odwrócona kolejność prób w tablicy -> ten sam wynik co w 4", () => {
    const attempts = [attempt("hp-3", true, T11), attempt("hp-3", false, T10)];
    expect(ids(orderQuestionsForSession(QUESTIONS, attempts))).toEqual([
      "hp-1", "hp-2", "hp-3", "hp-4", "hp-5",
    ]);
  });

  it("7. próba dla nieistniejącego hp-9 -> pomijana", () => {
    const attempts = [attempt("hp-9", false, T10)];
    expect(ids(orderQuestionsForSession(QUESTIONS, attempts))).toEqual([
      "hp-1", "hp-2", "hp-3", "hp-4", "hp-5",
    ]);
  });

  it("8. remis czasu: poprawna i błędna dla hp-2 -> hp-2 na początek", () => {
    const correctFirst = [attempt("hp-2", true, T10), attempt("hp-2", false, T10)];
    const wrongFirst = [attempt("hp-2", false, T10), attempt("hp-2", true, T10)];
    expect(ids(orderQuestionsForSession(QUESTIONS, correctFirst))[0]).toBe("hp-2");
    expect(ids(orderQuestionsForSession(QUESTIONS, wrongFirst))[0]).toBe("hp-2");
  });

  it("9. pusta lista pytań -> []", () => {
    expect(orderQuestionsForSession([], [attempt("hp-1", false, T10)])).toEqual([]);
  });

  it("10. nie zmienia tablic wejściowych", () => {
    const questions = [...QUESTIONS];
    const attempts = [attempt("hp-5", false, T10), attempt("hp-1", true, T11)];
    const questionsBefore = structuredClone(questions);
    const attemptsBefore = structuredClone(attempts);

    orderQuestionsForSession(questions, attempts);

    expect(questions).toEqual(questionsBefore);
    expect(attempts).toEqual(attemptsBefore);
  });
});

describe("enqueueRetry", () => {
  it("11. błąd przy pierwszym podejściu -> powtórka na końcu kolejki", () => {
    const queue = createQueue(QUESTIONS);
    const result = enqueueRetry(queue, queue[1], false);

    expect(result).toHaveLength(6);
    expect(result[5]).toEqual({
      question: QUESTIONS[1],
      isRepeat: true,
      dueFromHistory: false,
    });
    expect(result.slice(0, 5)).toEqual(queue);
  });

  it("12. poprawna odpowiedź -> kolejka bez zmian", () => {
    const queue = createQueue(QUESTIONS);
    expect(enqueueRetry(queue, queue[1], true)).toEqual(queue);
  });

  it("13. błąd w powtórce -> pytanie nie wraca drugi raz", () => {
    const first = createQueue(QUESTIONS);
    const withRepeat = enqueueRetry(first, first[1], false);
    const afterRepeat = enqueueRetry(withRepeat, withRepeat[5], false);

    expect(afterRepeat).toEqual(withRepeat);
    expect(afterRepeat.filter((item) => item.question.id === "hp-2")).toHaveLength(2);
  });

  it("14. błędy w hp-1, potem hp-3 -> powtórki w kolejności błędów", () => {
    const queue = createQueue(QUESTIONS);
    const afterFirst = enqueueRetry(queue, queue[0], false);
    const afterSecond = enqueueRetry(afterFirst, afterFirst[2], false);

    expect(
      afterSecond.map((item) => `${item.question.id}${item.isRepeat ? "*" : ""}`),
    ).toEqual(["hp-1", "hp-2", "hp-3", "hp-4", "hp-5", "hp-1*", "hp-3*"]);
  });
});

describe("firstAttemptScore", () => {
  const firstAttempts = (wrongId: string): SessionAnswer[] =>
    QUESTIONS.map((question) => ({
      questionId: question.id,
      isCorrect: question.id !== wrongId,
      isRepeat: false,
    }));

  it("15. błąd w hp-2, powtórka poprawna -> 4/5", () => {
    const answers: SessionAnswer[] = [
      ...firstAttempts("hp-2"),
      { questionId: "hp-2", isCorrect: true, isRepeat: true },
    ];
    expect(firstAttemptScore(answers, QUESTIONS.length)).toEqual({
      correct: 4,
      total: 5,
    });
  });

  it("16. błąd w hp-2 i drugi błąd w powtórce -> nadal 4/5", () => {
    const answers: SessionAnswer[] = [
      ...firstAttempts("hp-2"),
      { questionId: "hp-2", isCorrect: false, isRepeat: true },
    ];
    expect(firstAttemptScore(answers, QUESTIONS.length)).toEqual({
      correct: 4,
      total: 5,
    });
  });
});

describe("findLastWrongIds (do powtórki z poprzedniej sesji)", () => {
  const sorted = (set: Set<string>) => [...set].sort();

  it("17. brak prób -> pusty zbiór", () => {
    expect(findLastWrongIds([]).size).toBe(0);
  });

  it("18. ostatnia odpowiedź błędna -> ID w zbiorze, poprawna -> nie", () => {
    const attempts = [attempt("hp-3", false, T10), attempt("hp-1", true, T10)];
    expect(sorted(findLastWrongIds(attempts))).toEqual(["hp-3"]);
  });

  it("19. błędna o 10:00, poprawna o 11:00 -> ID nie ma", () => {
    const attempts = [attempt("hp-3", false, T10), attempt("hp-3", true, T11)];
    expect(findLastWrongIds(attempts).has("hp-3")).toBe(false);
  });

  it("20. poprawna o 10:00, błędna o 11:00 (odwrotnie w tablicy) -> ID jest", () => {
    const attempts = [attempt("hp-3", false, T11), attempt("hp-3", true, T10)];
    expect(findLastWrongIds(attempts).has("hp-3")).toBe(true);
  });

  it("21. remis czasu -> wygrywa błędna, w obu kolejnościach", () => {
    const correctFirst = [attempt("hp-2", true, T10), attempt("hp-2", false, T10)];
    const wrongFirst = [attempt("hp-2", false, T10), attempt("hp-2", true, T10)];
    expect(findLastWrongIds(correctFirst).has("hp-2")).toBe(true);
    expect(findLastWrongIds(wrongFirst).has("hp-2")).toBe(true);
  });

  it("22. zgodność z orderQuestionsForSession: zbiór = początek kolejności", () => {
    const attempts = [
      attempt("hp-4", false, T10),
      attempt("hp-2", false, T10),
      attempt("hp-2", true, T11),
      attempt("hp-5", true, T10),
      attempt("hp-5", false, T11),
    ];
    const due = findLastWrongIds(attempts);
    const ordered = ids(orderQuestionsForSession(QUESTIONS, attempts));

    expect(sorted(due)).toEqual(["hp-4", "hp-5"]);
    expect(ordered.slice(0, due.size).sort()).toEqual(sorted(due));
    expect(ordered.slice(due.size).some((id) => due.has(id))).toBe(false);
  });
});

describe("createQueue i enqueueRetry z dueFromHistory", () => {
  it("23. createQueue oznacza tylko pytania z dueIds; bez dueIds żadnego", () => {
    const queue = createQueue(QUESTIONS, new Set(["hp-2", "hp-4"]));
    expect(
      queue.filter((item) => item.dueFromHistory).map((item) => item.question.id),
    ).toEqual(["hp-2", "hp-4"]);
    expect(queue.every((item) => !item.isRepeat)).toBe(true);
    expect(createQueue(QUESTIONS).some((item) => item.dueFromHistory)).toBe(false);
  });

  it("24. błąd w pytaniu z poprzedniej sesji -> powtórka w sesji, nie 'do powtórki'", () => {
    const queue = createQueue(QUESTIONS, new Set(["hp-2"]));
    const result = enqueueRetry(queue, queue[1], false);
    expect(result[5]).toEqual({
      question: QUESTIONS[1],
      isRepeat: true,
      dueFromHistory: false,
    });
    expect(result[1].dueFromHistory).toBe(true);
  });
});
