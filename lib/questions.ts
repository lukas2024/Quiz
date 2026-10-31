import { collection, getDocs } from "firebase/firestore";
import { getFirebaseDb } from "@/lib/firebase";
import type { Question } from "@/types/question";

function isStringArray(value: unknown): value is string[] {
  return (
    Array.isArray(value) &&
    (value as unknown[]).every((item: unknown) => typeof item === "string")
  );
}

/**
 * Firestore nie wymusza schematu, więc każdy dokument sprawdzamy,
 * zanim uznamy go za Question. Zwraca null dla niepoprawnych danych.
 */
export function parseQuestion(
  id: string,
  data: Record<string, unknown>,
): Question | null {
  const { subject, text, options, correctIndex } = data;

  if (typeof subject !== "string" || subject.length === 0) return null;
  if (typeof text !== "string" || text.length === 0) return null;
  if (!isStringArray(options) || options.length < 2) return null;
  // Odpowiedzi muszą być unikalne (służą też jako klucze w liście).
  if (new Set(options).size !== options.length) return null;
  if (
    typeof correctIndex !== "number" ||
    !Number.isInteger(correctIndex) ||
    correctIndex < 0 ||
    correctIndex >= options.length
  ) {
    return null;
  }

  return { id, subject, text, options, correctIndex };
}

/** Pobiera pytania z kolekcji questions, w kolejności ID dokumentów. */
export async function fetchQuestions(): Promise<Question[]> {
  const snapshot = await getDocs(collection(getFirebaseDb(), "questions"));
  const questions: Question[] = [];

  for (const doc of snapshot.docs) {
    const question = parseQuestion(doc.id, doc.data());
    if (question) {
      questions.push(question);
    } else {
      // Tylko ID dokumentu, bez jego treści.
      console.warn(`Pominięto pytanie o niepoprawnym formacie: ${doc.id}`);
    }
  }

  return questions;
}
