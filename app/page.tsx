import Link from "next/link";
import AuthGate from "@/components/AuthGate";
import QuestionsLoader from "@/components/QuestionsLoader";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-8 px-4 py-12">
      <h1 className="text-4xl font-bold">Fiszki</h1>
      <AuthGate>
        <Link href="/postepy" className="text-sm underline hover:no-underline">
          Postępy
        </Link>
        <QuestionsLoader />
      </AuthGate>
    </main>
  );
}
