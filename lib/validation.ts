import { z } from "zod";

const email = z
  .string()
  .trim()
  .min(3)
  .max(200)
  .email("Enter a valid email address.");

const password = z
  .string()
  .min(10, "Use at least 10 characters.")
  .max(200, "That password is too long.");

export const signupSchema = z.object({
  email,
  password,
  displayName: z.string().trim().min(1, "Add a name.").max(60).default("Learner"),
});

export const loginSchema = z.object({
  email,
  password: z.string().min(1).max(200),
});

export const deviceCodeSchema = z.object({
  code: z.string().trim().regex(/^\d{4}$/, "Enter the 4-digit code."),
});

export const totpSchema = z.object({
  code: z.string().trim().regex(/^\d{6}$/, "Enter the 6-digit code."),
});

export const progressSchema = z.object({
  lessonId: z.string().trim().regex(/^[a-z0-9-]{1,40}$/),
  score: z.number().int().min(0).max(100),
});

export const simStepSchema = z.object({
  optionId: z.enum(["a", "b", "c"]),
});

export const checkoutSchema = z.object({
  plan: z.enum(["plus", "pro"]),
});

export const revokeSchema = z.object({
  deviceId: z.string().uuid(),
});

export const uploadMetaSchema = z.object({
  name: z.string().trim().min(1).max(120),
});

export function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

export function firstIssue(error: z.ZodError): string {
  return error.issues[0]?.message ?? "Check the form and try again.";
}
