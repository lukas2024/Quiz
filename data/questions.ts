import type { Question } from "@/types/question";

export const questions: Question[] = [
  {
    id: "hp-1",
    subject: "Historia Polski",
    text: "W którym roku odbył się chrzest Polski?",
    options: ["966", "1000", "1025", "1138"],
    correctIndex: 0,
  },
  {
    id: "hp-2",
    subject: "Historia Polski",
    text: "Kto był pierwszym koronowanym królem Polski?",
    options: [
      "Mieszko I",
      "Kazimierz Wielki",
      "Bolesław Chrobry",
      "Władysław Łokietek",
    ],
    correctIndex: 2,
  },
  {
    id: "hp-3",
    subject: "Historia Polski",
    text: "W którym roku odbyła się bitwa pod Grunwaldem?",
    options: ["1385", "1410", "1466", "1525"],
    correctIndex: 1,
  },
  {
    id: "hp-4",
    subject: "Historia Polski",
    text: "Jaki akt w 1569 r. utworzył Rzeczpospolitą Obojga Narodów?",
    options: [
      "Pokój toruński",
      "Konfederacja warszawska",
      "Artykuły henrykowskie",
      "Unia lubelska",
    ],
    correctIndex: 3,
  },
  {
    id: "hp-5",
    subject: "Historia Polski",
    text: "W którym roku uchwalono Konstytucję 3 maja?",
    options: ["1772", "1795", "1791", "1807"],
    correctIndex: 2,
  },
];
