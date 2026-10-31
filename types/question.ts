import type { Timestamp } from "firebase/firestore";

export type Question = {
  id: string;
  subject: string;
  text: string;
  options: string[];
  correctIndex: number;
};

export type AnswerRecord = {
  questionId: string;
  selectedIndex: number;
  isCorrect: boolean;
};

/** Dokument w users/{uid}/attempts/{attemptId}. */
export type AttemptDoc = AnswerRecord & {
  createdAt: Timestamp;
};
