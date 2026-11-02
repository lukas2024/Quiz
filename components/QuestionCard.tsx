"use client";

import { useEffect } from "react";
import type { Question } from "@/types/question";

type QuestionCardProps = {
  question: Question;
  questionNumber: number;
  totalQuestions: number;
  isRepeat?: boolean;
  dueFromHistory?: boolean;
  selectedIndex: number | null;
  isLast: boolean;
  onSelect: (index: number) => void;
  onNext: () => void;
};

const letter = (index: number) => String.fromCharCode(65 + index);

function isTypingTarget(target: EventTarget | null): boolean {
  return (
    target instanceof HTMLElement &&
    (target.isContentEditable ||
      ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName))
  );
}

function isClickableTarget(target: EventTarget | null): boolean {
  return target instanceof HTMLElement && target.closest("button, a") !== null;
}

export default function QuestionCard({
  question,
  questionNumber,
  totalQuestions,
  isRepeat = false,
  dueFromHistory = false,
  selectedIndex,
  isLast,
  onSelect,
  onNext,
}: QuestionCardProps) {
  const answered = selectedIndex !== null;
  const isCorrect = selectedIndex === question.correctIndex;
  const shortcutCount = Math.min(question.options.length, 9);

  // Skróty: 1–n wybiera odpowiedź, Enter przechodzi dalej.
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.ctrlKey || event.metaKey || event.altKey || event.repeat) return;
      if (isTypingTarget(event.target)) return;

      if (!answered && /^[1-9]$/.test(event.key)) {
        const index = Number(event.key) - 1;
        if (index < shortcutCount) {
          event.preventDefault();
          onSelect(index);
        }
        return;
      }

      // Enter na przycisku w fokusie obsługuje sama przeglądarka (kliknięcie);
      // inaczej jedno naciśnięcie przeszłoby o dwa pytania.
      if (answered && event.key === "Enter" && !isClickableTarget(event.target)) {
        event.preventDefault();
        onNext();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [answered, shortcutCount, onSelect, onNext]);

  function optionClass(index: number): string {
    const base =
      "flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors disabled:cursor-default sm:px-4 sm:py-3";
    if (!answered) {
      return `${base} border-zinc-300 hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800`;
    }
    // Wyróżniamy tylko klikniętą opcję. Po błędzie poprawna opcja wygląda
    // jak pozostałe, żeby powtórka nie była klikaniem zapamiętanej podpowiedzi.
    if (index === selectedIndex) {
      return isCorrect
        ? `${base} border-green-600 bg-green-100 text-green-900 dark:bg-green-950 dark:text-green-100`
        : `${base} border-red-600 bg-red-100 text-red-900 dark:bg-red-950 dark:text-red-100`;
    }
    return `${base} border-zinc-300 opacity-60 dark:border-zinc-700`;
  }

  const progressPercent = Math.round((questionNumber / totalQuestions) * 100);

  // Powtórka w sesji ma pierwszeństwo – to bliższy powód.
  const repeatLabel = isRepeat
    ? "Powtórka – poprzednia odpowiedź na to pytanie była błędna"
    : dueFromHistory
      ? "Do powtórki – ostatnia odpowiedź była błędna"
      : null;

  return (
    <section className="flex w-full flex-col gap-3 sm:gap-4">
      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
          {question.subject}
        </p>
        <div className="flex items-center gap-3">
          <div
            role="progressbar"
            aria-label="Postęp quizu"
            aria-valuemin={0}
            aria-valuemax={totalQuestions}
            aria-valuenow={questionNumber}
            className="h-1.5 flex-1 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800"
          >
            <div
              className="h-full rounded-full bg-zinc-900 transition-[width] dark:bg-zinc-100"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <span className="shrink-0 text-sm tabular-nums text-zinc-500 dark:text-zinc-400">
            {questionNumber} z {totalQuestions}
          </span>
        </div>
      </div>

      {repeatLabel && (
        <p className="inline-flex items-center gap-1.5 self-start rounded-full border border-amber-300 bg-amber-100 px-2.5 py-0.5 text-sm font-medium text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100">
          <span aria-hidden="true">↻</span>
          {repeatLabel}
        </p>
      )}

      <h2 className="text-lg font-semibold sm:text-xl">{question.text}</h2>

      <ul className="flex flex-col gap-2">
        {question.options.map((option, index) => (
          <li key={option}>
            <button
              type="button"
              className={optionClass(index)}
              disabled={answered}
              onClick={() => onSelect(index)}
            >
              <span
                aria-hidden="true"
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-current text-sm font-semibold"
              >
                {letter(index)}
              </span>
              <span className="flex-1">{option}</span>
              {index === selectedIndex && (
                <span className="shrink-0 text-lg font-bold leading-none">
                  <span aria-hidden="true">{isCorrect ? "✓" : "✗"}</span>
                  <span className="sr-only">
                    {isCorrect ? " – poprawna odpowiedź" : " – błędna odpowiedź"}
                  </span>
                </span>
              )}
            </button>
          </li>
        ))}
      </ul>

      <p className="hidden text-xs text-zinc-500 sm:block dark:text-zinc-400">
        Skróty: 1–{shortcutCount} wybór odpowiedzi, Enter – dalej
      </p>

      {answered && (
        <div className="flex flex-col gap-3">
          <p
            role="status"
            className={isCorrect ? "text-green-700 dark:text-green-400" : "text-red-700 dark:text-red-400"}
          >
            {isCorrect ? "Dobrze!" : "Źle – to pytanie wróci na końcu quizu"}
          </p>
          <button
            type="button"
            className="self-start rounded-lg bg-zinc-900 px-5 py-2 text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
            onClick={onNext}
          >
            {isLast ? "Zobacz wynik" : "Dalej"}
          </button>
        </div>
      )}
    </section>
  );
}
