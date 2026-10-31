| Krok | Co zaproponował agent | Co zrobiłem | Dlaczego |
|---|---|---|---|
| 1 | Usunąć AGENTS.md wygenerowany przez Next.js | Zostawiłem i dołączyłem przez @AGENTS.md w CLAUDE.md | Plik ostrzega agenta o zmianach w tej wersji Next.js, których agent może nie znać |
| 1 | Od razu git add -A i commit, git status dopiero po fakcie | Odrzuciłem, kazałem najpierw pokazać git status | Chcę przejrzeć listę plików, zanim trafią do historii |
| 2 | Zgłosił, że w 4 z 5 pytań poprawna jest druga odpowiedź | Przestawiłem pozycje poprawnych odpowiedzi w danych; losowanie kolejności zostawiam na później | Uczeń mógłby zgadywać po pozycji zamiast znać odpowiedź |
| 3 | Dopisać do .gitignore wyjątek !.env.local.example, bo reguła .env* ignorowała też plik przykładowy | Zaakceptowałem pod warunkiem pokazania wyniku git check-ignore; dodatkowo zażądałem, żeby komunikaty błędów podawały tylko nazwę zmiennej, nigdy jej wartość | Plik z nazwami zmiennych ma być w repo, a prawdziwe klucze nie mogą wyciec ani do historii gita, ani na ekran |
