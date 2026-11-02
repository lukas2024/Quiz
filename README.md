# Quiz z powtórkami

Quiz jednokrotnego wyboru z historii Polski, który wraca do pytań z błędną odpowiedzią, aż padnie dobra odpowiedź.

Aplikacja: https://quiz-5gd2.vercel.app

## Problem i dla kogo

Dla ucznia, który powtarza historię Polski. Przy zwykłym quizie łatwo przejść dalej po błędzie i nigdy do niego nie wrócić. Tutaj pytanie z błędną odpowiedzią wraca, dopóki uczeń nie odpowie dobrze, a po błędzie aplikacja nie podpowiada poprawnej odpowiedzi.

## Jak działa

- Logowanie przez konto Google.
- Sesja nauki z pytaniami zapisanymi w Firestore (obecnie 5 pytań).
- Pytanie z błędną odpowiedzią wraca na koniec kolejki, aż padnie dobra odpowiedź. Sesja kończy się, gdy na wszystkie pytania padła dobra odpowiedź.
- Wynik sesji liczy tylko pierwsze podejście do każdego pytania, więc powtórki go nie zawyżają.
- W kolejnej sesji najpierw pojawiają się pytania, na które ostatnia odpowiedź była błędna, oznaczone plakietką „Do powtórki”.
- Strona Postępy pokazuje metrykę opisaną niżej.

## Metryka: Skuteczność powtórek

Odsetek pytań z błędną pierwszą odpowiedzią, na które przy następnej próbie padła dobra odpowiedź. Liczone są tylko pytania, do których już wrócono; wynik ma postać np. „75% (3 z 4)”.

Ograniczenie: następną próbą jest też powtórka w tej samej sesji, kilka minut po błędzie, więc metryka mierzy głównie pamięć krótkotrwałą. Możliwa poprawka (zapisana w [DECISIONS.md](DECISIONS.md)): liczyć drugie podejście dopiero po minimalnym odstępie czasu albo w kolejnej sesji.

## Stack

- Next.js (App Router), TypeScript, Tailwind CSS
- Firebase Authentication (Google) i Cloud Firestore
- Vercel
- Testy: vitest (logika powtórek i metryki) oraz emulator Firestore (reguły bezpieczeństwa z `firestore.rules`)

## Praca z agentem

Aplikację zbudowałem z Claude Code krok po kroku: najpierw plan, potem akceptacja, potem kod. Każdą zmianę przeglądałem w VS Code przed commitem. Decyzje, propozycje agenta i poprawione błędy są w [DECISIONS.md](DECISIONS.md). Trzy przykłady:

- **Krok 4, reguła `isCorrect`.** Przy zapisie odpowiedzi reguły Firestore pobierają dokument pytania (`get` na `/questions/{id}`) i sprawdzają, czy pole `isCorrect` jest zgodne z tym, czy `selectedIndex` równa się `correctIndex` pytania. Bez tego dałoby się z konsoli przeglądarki zapisać fałszywie poprawne odpowiedzi i zawyżyć metrykę. Test w emulatorze wykrył celowo usuniętą regułę.
- **Kroki 1 i 3, `git add` bez zgody.** Agent od razu dodawał pliki i robił commit, zanim przejrzałem listę zmian. Odrzuciłem to i dopisałem do `CLAUDE.md` regułę: gdy proszę o git status, agent pokazuje tylko status i czeka na akceptację listy.
- **Krok 7b, bez podpowiedzi po błędzie.** Po błędnej odpowiedzi aplikacja nie pokazuje poprawnej (usunąłem zielone podświetlenie i tekst z odpowiedzią), a pytanie wraca do skutku. Uczeń ma sobie przypomnieć odpowiedź, a nie kliknąć zapamiętaną podpowiedź.

## Uruchomienie lokalne

Wymagania:

- Node.js 20.9 lub nowszy
- projekt Firebase z włączonym logowaniem Google i bazą Firestore: kolekcja `questions` z pytaniami i reguły z pliku `firestore.rules`
- do testów reguł: Java 21 lub nowsza (wymaga jej emulator Firestore)

Kroki:

```bash
npm install
cp .env.local.example .env.local
```

W `.env.local` wpisz wartości konfiguracji ze swojego projektu Firebase (Ustawienia projektu → Twoje aplikacje). Plik `.env.local` jest ignorowany przez git.

```bash
npm run dev
```

Aplikacja działa pod adresem http://localhost:3000.

Testy:

```bash
npm run test:unit    # logika powtórek i metryki (vitest)
npm run test:rules   # reguły Firestore w emulatorze, projekt demo-fiszki
```

Testy reguł działają tylko na lokalnym emulatorze, nigdy na prawdziwej bazie.
