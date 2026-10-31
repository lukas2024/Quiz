export type Question = {
  id: string;
  subject: string;
  text: string;
  options: string[];
  correctIndex: number;
};

export type AnswerRecord = {
  questionId: string;
  selectedIndex: number;
  isCorrect: boolean;
};
