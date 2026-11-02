import type { Metadata } from "next";
import AuthGate from "@/components/AuthGate";
import ProgressView from "@/components/ProgressView";

export const metadata: Metadata = {
  title: "Postępy – Quiz z historii Polski",
};

export default function ProgressPage() {
  return (
    <AuthGate>
      <h1 className="text-2xl font-bold">Postępy</h1>
      <ProgressView />
    </AuthGate>
  );
}
