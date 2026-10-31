import {
  addDoc,
  collection,
  serverTimestamp,
  type WithFieldValue,
} from "firebase/firestore";
import { getFirebaseDb } from "@/lib/firebase";
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
