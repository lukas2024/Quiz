| Krok | Co zaproponował agent | Co zrobiłem | Dlaczego |
|---|---|---|---|
| 1 | Usunąć AGENTS.md wygenerowany przez Next.js | Zostawiłem i dołączyłem przez @AGENTS.md w CLAUDE.md | Plik ostrzega agenta o zmianach w tej wersji Next.js, których agent może nie znać |
| 1 | Od razu git add -A i commit, git status dopiero po fakcie | Odrzuciłem, kazałem najpierw pokazać git status | Chcę przejrzeć listę plików, zanim trafią do historii |
| 2 | Zgłosił, że w 4 z 5 pytań poprawna jest druga odpowiedź | Przestawiłem pozycje poprawnych odpowiedzi w danych; losowanie kolejności zostawiam na później | Uczeń mógłby zgadywać po pozycji zamiast znać odpowiedź |
| 3 | Dopisać do .gitignore wyjątek !.env.local.example, bo reguła .env* ignorowała też plik przykładowy | Zaakceptowałem pod warunkiem pokazania wyniku git check-ignore; dodatkowo zażądałem, żeby komunikaty błędów podawały tylko nazwę zmiennej, nigdy jej wartość | Plik z nazwami zmiennych ma być w repo, a prawdziwe klucze nie mogą wyciec ani do historii gita, ani na ekran |
| 4 | Wgrać pytania skryptem z firebase-admin i gcloud (dane logowania poza projektem) | Wybrałem ręczne dodanie 5 pytań w konsoli Firebase | Przy 5 pytaniach to prostsze i nie wymaga nowych narzędzi ani dodatkowych uprawnień; skrypt dodam, gdy pytań będzie więcej |
| 4 | Opcjonalna reguła sprawdzająca, czy isCorrect zgadza się z correctIndex pytania | Włączyłem | Bez niej uczeń mógłby przez konsolę przeglądarki zapisać fałszywe poprawne odpowiedzi i zawyżyć metrykę |
| 4 | Ponad plan: sprawdzanie zakresu selectedIndex w regułach i odrzucanie pytań z powtórzonymi odpowiedziami | Zaakceptowałem oba | Blokują zapis śmieciowych danych; agent zgłosił je otwarcie |
| 4 | (przegląd) W podglądzie handleAnswer brakowało obsługi błędu zapisu (.catch) | Poprosiłem agenta o pełny fragment - .catch był, podgląd w terminalu był ucięty | Przy wątpliwości sprawdzam pełny plik, nie wklejkę z terminala |
