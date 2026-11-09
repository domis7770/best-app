export type BlockKind = "text" | "prompt" | "callout" | "compare";

export interface Block {
  kind: BlockKind;
  label?: string;
  body: string;
  body2?: string;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  answer: number;
  explain: string;
}

export interface Lesson {
  id: string;
  trackId: string;
  title: string;
  blurb: string;
  minutes: number;
  xp: number;
  blocks: Block[];
  quiz: QuizQuestion[];
  takeaways: string[];
}

export interface Track {
  id: string;
  name: string;
  tagline: string;
  icon: string;
  accent: string;
}

export interface LabTemplate {
  id: string;
  title: string;
  blurb: string;
  level: "Starter" | "Intermediate" | "Advanced";
  minutes: number;
  prompt: string;
  system?: string;
  code?: string;
  checklist: string[];
}
