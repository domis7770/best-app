import { db } from "@/lib/db";

export interface Limit {
  limit: number;
  windowMs: number;
}

export const LIMITS = {
  signup: { limit: 6, windowMs: 60 * 60 * 1000 },
  loginNetwork: { limit: 20, windowMs: 15 * 60 * 1000 },
  loginEmail: { limit: 8, windowMs: 15 * 60 * 1000 },
  deviceCode: { limit: 15, windowMs: 10 * 60 * 1000 },
  totp: { limit: 10, windowMs: 10 * 60 * 1000 },
  guest: { limit: 12, windowMs: 60 * 60 * 1000 },
  progress: { limit: 240, windowMs: 60 * 1000 },
  checkout: { limit: 12, windowMs: 10 * 60 * 1000 },
  upload: { limit: 20, windowMs: 60 * 60 * 1000 },
} satisfies Record<string, Limit>;

export type LimitName = keyof typeof LIMITS;

/** Returns true when the caller is still under the limit. */
export function allow(bucket: LimitName, key: string): boolean {
  const { limit, windowMs } = LIMITS[bucket];
  const windowStart = Math.floor(Date.now() / windowMs) * windowMs;
  const row = db()
    .prepare(
      `INSERT INTO rate_limits (key, window_start, count) VALUES (?, ?, 1)
       ON CONFLICT(key, window_start) DO UPDATE SET count = count + 1
       RETURNING count`
    )
    .get(`${bucket}:${key}`, windowStart) as { count: number } | null;
  return (row?.count ?? limit + 1) <= limit;
}

export function sweep(): void {
  const cutoff = Date.now() - 24 * 60 * 60 * 1000;
  db().prepare("DELETE FROM rate_limits WHERE window_start < ?").run(cutoff);
}
