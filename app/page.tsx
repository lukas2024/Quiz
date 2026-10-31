import AuthGate from "@/components/AuthGate";
import AuthProvider from "@/components/AuthProvider";
import StudySession from "@/components/StudySession";
import { questions } from "@/data/questions";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-8 px-4 py-12">
      <h1 className="text-4xl font-bold">Fiszki</h1>
      <AuthProvider>
        <AuthGate>
          <StudySession questions={questions} />
        </AuthGate>
      </AuthProvider>
    </main>
  );
}
