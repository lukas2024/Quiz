import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestContext,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  type Firestore,
} from "firebase/firestore";
import { afterAll, beforeAll, beforeEach, describe, it, vi } from "vitest";
import { questions } from "../data/questions";

// --- Bezpieczeństwo: tylko emulator, nigdy prawdziwa baza ---------------------
// Projekt "demo-*" Firebase traktuje jako czysto lokalny.
const PROJECT_ID = "demo-fiszki";

if (!PROJECT_ID.startsWith("demo-")) {
  throw new Error("Testy reguł muszą używać projektu demo-*.");
}
if (!process.env.FIRESTORE_EMULATOR_HOST) {
  throw new Error(
    "Brak FIRESTORE_EMULATOR_HOST. Uruchom testy przez `npm run test:rules` (emulator).",
  );
}

vi.setConfig({ testTimeout: 15_000, hookTimeout: 30_000 });

// --- Dane testowe ---------------------------------------------------------
const ALICE = "alice";
const BOB = "bob";

const hp1 = questions.find((question) => question.id === "hp-1");
if (!hp1) throw new Error("Brak pytania hp-1 w data/questions.ts.");
// hp-1: correctIndex = 0, 4 odpowiedzi

/** Poprawny dokument odpowiedzi dla hp-1, z możliwością nadpisania pól. */
function attempt(overrides: Record<string, unknown> = {}) {
  return {
    questionId: "hp-1",
    selectedIndex: 0,
    isCorrect: true,
    createdAt: serverTimestamp(),
    ...overrides,
  };
}

// context.firestore() zwraca instancję w typach API "compat"; funkcje modularne
// (doc, getDoc, ...) przyjmują ją w działaniu, bo same pobierają z niej
// instancję modularną. Rzutowanie dotyczy tylko typów TypeScript.
function db(context: RulesTestContext): Firestore {
  return context.firestore() as unknown as Firestore;
}

// --- Środowisko -----------------------------------------------------------
let testEnv: RulesTestEnvironment;

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: {
      // Prawdziwy plik reguł z katalogu projektu (npm uruchamia skrypt z korzenia).
      rules: readFileSync(resolve(process.cwd(), "firestore.rules"), "utf8"),
    },
  });
});

beforeEach(async () => {
  await testEnv.clearFirestore();
  await testEnv.withSecurityRulesDisabled(async (context) => {
    const admin = db(context);
    await setDoc(doc(admin, "questions/hp-1"), {
      subject: hp1.subject,
      text: hp1.text,
      options: hp1.options,
      correctIndex: hp1.correctIndex,
    });
    const seeded = {
      questionId: "hp-1",
      selectedIndex: 0,
      isCorrect: true,
      createdAt: Timestamp.now(),
    };
    await setDoc(doc(admin, `users/${ALICE}/attempts/x`), seeded);
    await setDoc(doc(admin, `users/${BOB}/attempts/x`), seeded);
  });
});

afterAll(async () => {
  await testEnv?.cleanup();
});

// --- Testy ----------------------------------------------------------------
describe("questions", () => {
  it("1. niezalogowany czyta questions/hp-1 -> odmowa", async () => {
    const anon = db(testEnv.unauthenticatedContext());
    await assertFails(getDoc(doc(anon, "questions/hp-1")));
  });

  it("2. zalogowany czyta questions/hp-1 -> zgoda", async () => {
    const alice = db(testEnv.authenticatedContext(ALICE));
    await assertSucceeds(getDoc(doc(alice, "questions/hp-1")));
  });

  it("3. zalogowany tworzy questions/hp-6 -> odmowa", async () => {
    const alice = db(testEnv.authenticatedContext(ALICE));
    await assertFails(
      setDoc(doc(alice, "questions/hp-6"), {
        subject: "Historia Polski",
        text: "Pytanie testowe",
        options: ["A", "B"],
        correctIndex: 0,
      }),
    );
  });
});

describe("users/{uid}/attempts – dostęp", () => {
  it("4. zalogowany czyta swoje users/{uid}/attempts/x -> zgoda", async () => {
    const alice = db(testEnv.authenticatedContext(ALICE));
    await assertSucceeds(getDoc(doc(alice, `users/${ALICE}/attempts/x`)));
  });

  it("5. zalogowany czyta cudze users/{inne}/attempts/x -> odmowa", async () => {
    const alice = db(testEnv.authenticatedContext(ALICE));
    await assertFails(getDoc(doc(alice, `users/${BOB}/attempts/x`)));
  });

  it("6. zalogowany tworzy odpowiedź w cudzym users/{inne}/attempts -> odmowa", async () => {
    // Dane w pełni poprawne: odmowa może wynikać tylko z cudzego uid.
    const alice = db(testEnv.authenticatedContext(ALICE));
    await assertFails(
      addDoc(collection(alice, `users/${BOB}/attempts`), attempt()),
    );
  });
});

describe("users/{uid}/attempts – odczyt całej kolekcji (historia)", () => {
  it("12. zalogowany pobiera swoją kolekcję attempts -> zgoda", async () => {
    const alice = db(testEnv.authenticatedContext(ALICE));
    await assertSucceeds(getDocs(collection(alice, `users/${ALICE}/attempts`)));
  });

  it("13. zalogowany pobiera cudzą kolekcję attempts -> odmowa", async () => {
    const alice = db(testEnv.authenticatedContext(ALICE));
    await assertFails(getDocs(collection(alice, `users/${BOB}/attempts`)));
  });
});

describe("isValidAttempt", () => {
  it("7. poprawna odpowiedź -> zgoda", async () => {
    const alice = db(testEnv.authenticatedContext(ALICE));
    await assertSucceeds(
      addDoc(collection(alice, `users/${ALICE}/attempts`), attempt()),
    );
  });

  it("8. fałszywe isCorrect -> odmowa", async () => {
    // Indeks 1 jest błędny w hp-1, a uczeń twierdzi, że poprawny.
    const alice = db(testEnv.authenticatedContext(ALICE));
    await assertFails(
      addDoc(
        collection(alice, `users/${ALICE}/attempts`),
        attempt({ selectedIndex: 1, isCorrect: true }),
      ),
    );
  });

  it("9. selectedIndex poza zakresem -> odmowa", async () => {
    // isCorrect zgodne z indeksem (false), więc odmowę daje sam zakres.
    const alice = db(testEnv.authenticatedContext(ALICE));
    await assertFails(
      addDoc(
        collection(alice, `users/${ALICE}/attempts`),
        attempt({ selectedIndex: 4, isCorrect: false }),
      ),
    );
  });

  it("10. edycja własnej odpowiedzi -> odmowa", async () => {
    // Zmiana spójna (indeks 1 = błędna), więc odmowę daje sam zakaz edycji.
    const alice = db(testEnv.authenticatedContext(ALICE));
    await assertFails(
      updateDoc(doc(alice, `users/${ALICE}/attempts/x`), {
        selectedIndex: 1,
        isCorrect: false,
      }),
    );
  });

  it("11. usunięcie własnej odpowiedzi -> odmowa", async () => {
    const alice = db(testEnv.authenticatedContext(ALICE));
    await assertFails(deleteDoc(doc(alice, `users/${ALICE}/attempts/x`)));
  });
});
