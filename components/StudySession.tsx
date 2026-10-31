"use client";

import { useState } from "react";
import type { AnswerRecord, Question } from "@/types/question";
import QuestionCard from "@/components/QuestionCard";
import SessionSummary from "@/components/SessionSummary";

type StudySessionProps = {
  questions: Question[];
  onAnswer?: (record: AnswerRecord) => void;
};

export default function StudySession({
  questions,
  onAnswer,
}: StudySessionProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [answers, setAnswers] = useState<AnswerRecord[]>([]);

  if (questions.length === 0) {
    return <p className="text-zinc-500">Brak pytań</p>;
  }

  if (currentIndex >= questions.length) {
    const correctCount = answers.filter((answer) => answer.isCorrect).length;
    return (
      <SessionSummary
        correctCount={correctCount}
        totalQuestions={questions.length}
        onRestart={() => {
          setCurrentIndex(0);
          setSelectedIndex(null);
          setAnswers([]);
        }}
      />
    );
  }

  const question = questions[currentIndex];

  function handleSelect(index: number) {
    if (selectedIndex !== null) return;
    const record: AnswerRecord = {
      questionId: question.id,
      selectedIndex: index,
      isCorrect: index === question.correctIndex,
    };
    setSelectedIndex(index);
    setAnswers((prev) => [...prev, record]);
    onAnswer?.(record);
  }

  function handleNext() {
    setSelectedIndex(null);
    setCurrentIndex((prev) => prev + 1);
  }

  return (
    <QuestionCard
      key={question.id}
      question={question}
      questionNumber={currentIndex + 1}
      totalQuestions={questions.length}
      selectedIndex={selectedIndex}
      isLast={currentIndex === questions.length - 1}
      onSelect={handleSelect}
      onNext={handleNext}
    />
  );
}
