import {
  addDoc,
  collection,
  getDocs,
  serverTimestamp,
  Timestamp,
  type WithFieldValue,
} from "firebase/firestore";
import { getFirebaseDb } from "@/lib/firebase";
import type { AttemptSummary } from "@/lib/review";
import type { AnswerRecord, AttemptDoc } from "@/types/question";

/**
 * Zapisuje odpowiedź w users/{uid}/attempts.
 * createdAt ustawia serwer (reguły wymagają createdAt == request.time).
 */
export async function saveAttempt(
  uid: string,
  record: AnswerRecord,
): Promise<void> {
  const attempt: WithFieldValue<AttemptDoc> = {
    questionId: record.questionId,
    selectedIndex: record.selectedIndex,
    isCorrect: record.isCorrect,
    createdAt: serverTimestamp(),
  };
  await addDoc(collection(getFirebaseDb(), "users", uid, "attempts"), attempt);
}

/**
 * Pobiera historię odpowiedzi ucznia jako AttemptSummary.
 * "estimate" daje przybliżony czas dla zapisów jeszcze niepotwierdzonych
 * przez serwer, więc widać też odpowiedzi z właśnie zakończonej sesji.
 * Niepoprawne dokumenty są pomijane.
 */
export async function fetchAttempts(uid: string): Promise<AttemptSummary[]> {
  const snapshot = await getDocs(
    collection(getFirebaseDb(), "users", uid, "attempts"),
  );
  const attempts: AttemptSummary[] = [];

  for (const doc of snapshot.docs) {
    const data: Record<string, unknown> = doc.data({
      serverTimestamps: "estimate",
    });
    const { questionId, isCorrect, createdAt } = data;
    if (
      typeof questionId === "string" &&
      typeof isCorrect === "boolean" &&
      createdAt instanceof Timestamp
    ) {
      attempts.push({ questionId, isCorrect, createdAtMs: createdAt.toMillis() });
    }
  }

  return attempts;
}
