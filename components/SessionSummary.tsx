type SessionSummaryProps = {
  correctCount: number;
  totalQuestions: number;
  onRestart: () => void;
};

export default function SessionSummary({
  correctCount,
  totalQuestions,
  onRestart,
}: SessionSummaryProps) {
  return (
    <section className="flex flex-col items-center gap-4">
      <h2 className="text-xl font-semibold">Koniec sesji</h2>
      <p className="text-3xl font-bold">
        Wynik: {correctCount}/{totalQuestions}
      </p>
      <button
        type="button"
        className="rounded-lg bg-zinc-900 px-5 py-2 text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
        onClick={onRestart}
      >
        Zacznij od nowa
      </button>
    </section>
  );
}
