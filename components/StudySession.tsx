"use client";

import { useState } from "react";
import type { AnswerRecord, Question } from "@/types/question";
import QuestionCard from "@/components/QuestionCard";
import SessionSummary from "@/components/SessionSummary";
import {
  createQueue,
  enqueueRetry,
  firstAttemptScore,
  type SessionAnswer,
  type SessionItem,
} from "@/lib/review";

type StudySessionProps = {
  /** Pytania w kolejności, w jakiej mają się pojawić w tej sesji. */
  questions: Question[];
  onAnswer?: (record: AnswerRecord) => void;
  /** Gdy podane, rodzic przygotowuje nową sesję (np. nową kolejność). */
  onRestart?: () => void;
};

export default function StudySession({
  questions,
  onAnswer,
  onRestart,
}: StudySessionProps) {
  const [queue, setQueue] = useState<SessionItem[]>(() =>
    createQueue(questions),
  );
  const [position, setPosition] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [answers, setAnswers] = useState<SessionAnswer[]>([]);

  if (questions.length === 0) {
    return <p className="text-zinc-500 dark:text-zinc-400">Brak pytań</p>;
  }

  if (position >= queue.length) {
    const score = firstAttemptScore(answers, questions.length);
    return (
      <SessionSummary
        correctCount={score.correct}
        totalQuestions={score.total}
        onRestart={() => {
          if (onRestart) {
            onRestart();
            return;
          }
          setQueue(createQueue(questions));
          setPosition(0);
          setSelectedIndex(null);
          setAnswers([]);
        }}
      />
    );
  }

  const item = queue[position];
  const { question } = item;

  function handleSelect(index: number) {
    if (selectedIndex !== null) return;
    const isCorrect = index === question.correctIndex;
    setSelectedIndex(index);
    setAnswers((prev) => [
      ...prev,
      { questionId: question.id, isCorrect, isRepeat: item.isRepeat },
    ]);
    setQueue((prev) => enqueueRetry(prev, item, isCorrect));
    onAnswer?.({ questionId: question.id, selectedIndex: index, isCorrect });
  }

  function handleNext() {
    setSelectedIndex(null);
    setPosition((prev) => prev + 1);
  }

  return (
    <QuestionCard
      key={position}
      question={question}
      questionNumber={position + 1}
      totalQuestions={queue.length}
      isRepeat={item.isRepeat}
      selectedIndex={selectedIndex}
      isLast={position === queue.length - 1}
      onSelect={handleSelect}
      onNext={handleNext}
    />
  );
}
