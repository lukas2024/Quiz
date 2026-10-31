import type { Metadata } from "next";
import Link from "next/link";
import AuthGate from "@/components/AuthGate";
import ProgressView from "@/components/ProgressView";

export const metadata: Metadata = {
  title: "Postępy – Fiszki",
};

export default function ProgressPage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-8 px-4 py-12">
      <h1 className="text-4xl font-bold">Postępy</h1>
      <AuthGate>
        <Link href="/" className="text-sm underline hover:no-underline">
          ← Wróć do nauki
        </Link>
        <ProgressView />
      </AuthGate>
    </main>
  );
}
