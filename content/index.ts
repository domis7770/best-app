import type { LabTemplate, Lesson, Track } from "./types";
import { FOUNDATIONS } from "./foundations";
import { WORK } from "./work";
import { LAB } from "./lab";

export type { LabTemplate, Lesson, Track } from "./types";
export { LAB } from "./lab";
export { ROUNDS } from "./simulator";
export type { SimRound } from "./simulator";

export const TRACKS: Track[] = [
  {
    id: "foundations",
    name: "AI foundations",
    tagline: "How models actually work, in seven short lessons.",
    icon: "◆",
    accent: "mint",
  },
  {
    id: "work",
    name: "AI at work",
    tagline: "Five workflows you can use on Monday morning.",
    icon: "▲",
    accent: "violet",
  },
  {
    id: "lab",
    name: "Prompt & code lab",
    tagline: "Six templates with prompts, code and a ship checklist.",
    icon: "◈",
    accent: "amber",
  },
  {
    id: "sim",
    name: "Build with AI",
    tagline: "Run a business for five rounds. Every choice moves cash, reach and trust.",
    icon: "●",
    accent: "coral",
  },
];

export const LESSONS: Lesson[] = [...FOUNDATIONS, ...WORK];

export const GUEST_LESSON_IDS = ["fnd-1", "fnd-2"];

export function lessonsForTrack(trackId: string): Lesson[] {
  return LESSONS.filter((lesson) => lesson.trackId === trackId);
}

export function findLesson(id: string): Lesson | undefined {
  return LESSONS.find((lesson) => lesson.id === id);
}

export function findTrack(id: string): Track | undefined {
  return TRACKS.find((track) => track.id === id);
}

export function findLab(id: string): LabTemplate | undefined {
  return LAB.find((template) => template.id === id);
}

export function trackLessonIds(trackId: string): string[] {
  return lessonsForTrack(trackId).map((lesson) => lesson.id);
}
