import AuthGate from "@/components/AuthGate";
import QuestionsLoader from "@/components/QuestionsLoader";

export default function Home() {
  return (
    <AuthGate>
      <h1 className="sr-only">Nauka</h1>
      <QuestionsLoader />
    </AuthGate>
  );
}
