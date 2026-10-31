import type { Question } from "@/types/question";

type QuestionCardProps = {
  question: Question;
  questionNumber: number;
  totalQuestions: number;
  selectedIndex: number | null;
  isLast: boolean;
  onSelect: (index: number) => void;
  onNext: () => void;
};

export default function QuestionCard({
  question,
  questionNumber,
  totalQuestions,
  selectedIndex,
  isLast,
  onSelect,
  onNext,
}: QuestionCardProps) {
  const answered = selectedIndex !== null;
  const isCorrect = selectedIndex === question.correctIndex;

  function optionClass(index: number): string {
    const base =
      "w-full rounded-lg border px-4 py-3 text-left transition-colors disabled:cursor-default";
    if (!answered) {
      return `${base} border-zinc-300 hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800`;
    }
    if (index === question.correctIndex) {
      return `${base} border-green-600 bg-green-100 text-green-900 dark:bg-green-950 dark:text-green-100`;
    }
    if (index === selectedIndex) {
      return `${base} border-red-600 bg-red-100 text-red-900 dark:bg-red-950 dark:text-red-100`;
    }
    return `${base} border-zinc-300 opacity-60 dark:border-zinc-700`;
  }

  return (
    <section className="flex w-full max-w-xl flex-col gap-4">
      <p className="text-sm text-zinc-500">
        {question.subject} · Pytanie {questionNumber} z {totalQuestions}
      </p>
      <h2 className="text-xl font-semibold">{question.text}</h2>

      <ul className="flex flex-col gap-2">
        {question.options.map((option, index) => (
          <li key={option}>
            <button
              type="button"
              className={optionClass(index)}
              disabled={answered}
              onClick={() => onSelect(index)}
            >
              {option}
            </button>
          </li>
        ))}
      </ul>

      {answered && (
        <div className="flex flex-col gap-3">
          <p
            role="status"
            className={isCorrect ? "text-green-700 dark:text-green-400" : "text-red-700 dark:text-red-400"}
          >
            {isCorrect
              ? "Dobrze!"
              : `Źle, poprawna odpowiedź to: ${question.options[question.correctIndex]}`}
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
