import { GUEST_LESSON_IDS } from "@/content";
import type { Lesson } from "@/content/types";

export type Plan = "free" | "plus" | "pro";

export interface Access {
  kind: "user" | "guest" | "anon";
  plan: Plan;
}

export const PLANS = {
  free: { name: "Free", price: 0, cadence: "", tagline: "Foundations and a first taste of work." },
  plus: { name: "Plus", price: 699, cadence: "/month", tagline: "The full curriculum, every work playbook." },
  pro: { name: "Pro", price: 1599, cadence: "/month", tagline: "Everything, including the prompt and code lab." },
} as const;

export const PLAN_ORDER: Plan[] = ["free", "plus", "pro"];

export function planRank(plan: Plan): number {
  return PLAN_ORDER.indexOf(plan);
}

export function atLeast(plan: Plan, required: Plan): boolean {
  return planRank(plan) >= planRank(required);
}

export function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2).replace(/\.00$/, "")}`;
}

/** Which plan a lesson requires: work track opens at Plus, everything else is free. */
export function requiredPlanFor(lesson: Lesson): Plan {
  if (lesson.trackId === "work" && lesson.id !== "wrk-1") return "plus";
  return "free";
}

export function canOpenLesson(access: Access, lesson: Lesson): boolean {
  if (access.kind === "guest") return GUEST_LESSON_IDS.includes(lesson.id);
  if (access.kind === "anon") return false;
  return atLeast(access.plan, requiredPlanFor(lesson));
}

export function lessonLockReason(access: Access, lesson: Lesson): string | null {
  if (canOpenLesson(access, lesson)) return null;
  if (access.kind === "anon") return "Create a free account to open this lesson.";
  if (access.kind === "guest") return "Guests get the first two lessons. Create an account to keep going.";
  if (requiredPlanFor(lesson) === "plus") return "This lesson is part of Plus.";
  return "Upgrade to open this lesson.";
}

export function simRoundsAllowed(access: Access): number {
  if (access.kind !== "user") return 0;
  if (access.plan === "free") return 2;
  return 5;
}

export function canUseLab(access: Access): boolean {
  return access.kind === "user" && access.plan === "pro";
}

export function canUseSimulator(access: Access): boolean {
  return access.kind !== "anon";
}

export interface PlanFeature {
  label: string;
  free: boolean | string;
  plus: boolean | string;
  pro: boolean | string;
}

export const PLAN_FEATURES: PlanFeature[] = [
  { label: "AI foundations (7 lessons)", free: true, plus: true, pro: true },
  { label: "AI at work (5 lessons)", free: "1 lesson", plus: true, pro: true },
  { label: "Build with AI simulator", free: "2 rounds", plus: "5 rounds", pro: "5 rounds" },
  { label: "Prompt & code lab (6 templates)", free: false, plus: false, pro: true },
];
