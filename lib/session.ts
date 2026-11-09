import { cookies } from "next/headers";
import { db, hashToken, newId, nowIso, isoIn, audit } from "@/lib/db";
import {
  randomToken,
  randomDigits,
  hashPassword,
  verifyPassword,
  dummyVerify,
  verifyTotp,
  safeEqual,
} from "@/lib/crypto";
import { ApiError } from "@/lib/http";
import type { Plan } from "@/lib/entitlements";

export const SESSION_COOKIE = "promptly_session";
export const DEVICE_COOKIE = "promptly_device";
export const GUEST_COOKIE = "promptly_guest";
export const PENDING_COOKIE = "promptly_pending";

const SESSION_MS = 30 * 24 * 60 * 60 * 1000;
const DEVICE_MS = 180 * 24 * 60 * 60 * 1000;
const GUEST_MS = 30 * 24 * 60 * 60 * 1000;
const CODE_MS = 10 * 60 * 1000;
export const MAX_CODE_ATTEMPTS = 5;
const MAX_FAILED_LOGINS = 6;
const LOCK_MS = 15 * 60 * 1000;

export interface UserRow {
  id: string;
  email: string;
  email_norm: string;
  display_name: string;
  plan: Plan;
  plan_status: string;
  is_admin: number;
  totp_confirmed: number;
  created_at: string;
}

export type Viewer =
  | { kind: "anon" }
  | { kind: "guest"; guestId: string }
  | { kind: "user"; user: UserRow; deviceId: string };

export interface IssuedCookie {
  name: string;
  value: string;
  maxAge: number;
}

/** Reads a cookie straight from a Request (route handlers). */
export function cookieFromRequest(req: Request, name: string): string | undefined {
  const header = req.headers.get("cookie");
  if (!header) return undefined;
  for (const part of header.split(";")) {
    const idx = part.indexOf("=");
    if (idx < 0) continue;
    if (part.slice(0, idx).trim() === name) {
      return decodeURIComponent(part.slice(idx + 1).trim());
    }
  }
  return undefined;
}

/** Reads a cookie in a server component (async cookie store in Next 15). */
export async function readCookie(name: string): Promise<string | undefined> {
  const store = await cookies();
  return store.get(name)?.value;
}

const USER_COLUMNS =
  "u.id, u.email, u.email_norm, u.display_name, u.plan, u.plan_status, u.is_admin, u.totp_confirmed, u.created_at";

export async function getActor(): Promise<Viewer> {
  const sessionToken = await readCookie(SESSION_COOKIE);
  if (sessionToken) {
    const row = db()
      .prepare(
        `SELECT ${USER_COLUMNS}, s.device_id AS device_id
         FROM sessions s JOIN users u ON u.id = s.user_id
         WHERE s.token_hash = ? AND s.expires_at > ?`
      )
      .get(hashToken(sessionToken), nowIso()) as (UserRow & { device_id: string }) | null;
    if (row) {
      db().prepare("UPDATE devices SET last_seen_at = ? WHERE id = ?").run(nowIso(), row.device_id);
      const { device_id, ...user } = row;
      return { kind: "user", user: user as UserRow, deviceId: device_id };
    }
  }

  const guestToken = await readCookie(GUEST_COOKIE);
  if (guestToken) {
    const guest = db()
      .prepare("SELECT id FROM guests WHERE token_hash = ? AND expires_at > ?")
      .get(hashToken(guestToken), nowIso()) as { id: string } | null;
    if (guest) return { kind: "guest", guestId: guest.id };
  }

  return { kind: "anon" };
}

export function accessOf(viewer: Viewer) {
  if (viewer.kind === "user") return { kind: "user" as const, plan: viewer.user.plan };
  if (viewer.kind === "guest") return { kind: "guest" as const, plan: "free" as Plan };
  return { kind: "anon" as const, plan: "free" as Plan };
}

export function requireUser(viewer: Viewer): { user: UserRow; deviceId: string } {
  if (viewer.kind !== "user") {
    throw new ApiError(401, "sign_in_required", "Sign in to continue.");
  }
  return { user: viewer.user, deviceId: viewer.deviceId };
}

export function requireAdmin(viewer: Viewer): UserRow {
  const { user } = requireUser(viewer);
  if (!user.is_admin || user.totp_confirmed !== 1) {
    throw new ApiError(403, "admin_only", "Not available.");
  }
  return user;
}

export function isAdminEmail(email: string): boolean {
  const list = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
  return list.includes(email.trim().toLowerCase());
}

function createSession(userId: string, deviceId: string): IssuedCookie {
  const token = randomToken();
  db()
    .prepare(
      "INSERT INTO sessions (id, user_id, device_id, token_hash, created_at, expires_at) VALUES (?, ?, ?, ?, ?, ?)"
    )
    .run(newId(), userId, deviceId, hashToken(token), nowIso(), isoIn(SESSION_MS));
  return { name: SESSION_COOKIE, value: token, maxAge: Math.floor(SESSION_MS / 1000) };
}

/**
 * Creates a device row. A provisional device (`verified: false`) has a token
 * that is never handed to the browser, so it can never be recognised as a
 * trusted device before its 4-digit code (and TOTP, for admins) is confirmed.
 */
function createDevice(
  userId: string,
  label: string,
  verified = true
): { deviceId: string; cookie: IssuedCookie; label: string } {
  const id = newId();
  const token = randomToken();
  db()
    .prepare(
      "INSERT INTO devices (id, user_id, token_hash, label, verified, created_at, last_seen_at) VALUES (?, ?, ?, ?, ?, ?, ?)"
    )
    .run(id, userId, hashToken(token), label, verified ? 1 : 0, nowIso(), nowIso());
  return {
    deviceId: id,
    label,
    cookie: { name: DEVICE_COOKIE, value: token, maxAge: Math.floor(DEVICE_MS / 1000) },
  };
}

/** Replaces a provisional device with a real, cookie-bearing one. */
function promoteDevice(provisionalId: string): { deviceId: string; cookie: IssuedCookie } {
  const row = db()
    .prepare("SELECT user_id, label FROM devices WHERE id = ?")
    .get(provisionalId) as { user_id: string; label: string } | null;
  if (!row) throw new ApiError(400, "no_pending", "Start signing in again.");
  db().prepare("DELETE FROM devices WHERE id = ?").run(provisionalId);
  const created = createDevice(row.user_id, row.label);
  return { deviceId: created.deviceId, cookie: created.cookie };
}

export function deviceLabel(userAgent: string | null): string {
  const ua = (userAgent ?? "").toLowerCase();
  const device = ua.includes("iphone")
    ? "iPhone"
    : ua.includes("ipad")
      ? "iPad"
      : ua.includes("android")
        ? "Android"
        : ua.includes("mac")
          ? "Mac"
          : ua.includes("windows")
            ? "Windows"
            : "Unknown device";
  const browser = ua.includes("edg/")
    ? "Edge"
    : ua.includes("chrome")
      ? "Chrome"
      : ua.includes("safari")
        ? "Safari"
        : ua.includes("firefox")
          ? "Firefox"
          : "Browser";
  return `${device} · ${browser}`;
}

export function findUserByEmail(emailNorm: string): UserRow | null {
  return db()
    .prepare(`SELECT ${USER_COLUMNS.replace(/u\./g, "")} FROM users u WHERE u.email_norm = ?`)
    .get(emailNorm) as UserRow | null;
}

export function getUser(id: string): UserRow | null {
  return db()
    .prepare(`SELECT ${USER_COLUMNS.replace(/u\./g, "")} FROM users u WHERE u.id = ?`)
    .get(id) as UserRow | null;
}

export interface SignUpInput {
  email: string;
  emailNorm: string;
  password: string;
  displayName: string;
  userAgent: string | null;
}

export function createAccount(input: SignUpInput): { user: UserRow; cookies: IssuedCookie[] } {
  const existing = db().prepare("SELECT id FROM users WHERE email_norm = ?").get(input.emailNorm);
  if (existing) {
    throw new ApiError(409, "email_taken", "That email already has an account.");
  }

  const id = newId();
  const salt = randomToken(16);
  const admin = isAdminEmail(input.emailNorm) ? 1 : 0;
  db()
    .prepare(
      `INSERT INTO users (id, email, email_norm, salt, password_hash, display_name, plan, plan_status, is_admin, created_at)
       VALUES (?, ?, ?, ?, ?, ?, 'free', 'inactive', ?, ?)`
    )
    .run(
      id,
      input.email,
      input.emailNorm,
      salt,
      hashPassword(input.password, salt),
      input.displayName,
      admin,
      nowIso()
    );

  const user = getUser(id);
  if (!user) throw new ApiError(500, "internal_error", "Something went wrong.");
  const device = createDevice(id, deviceLabel(input.userAgent));
  const session = createSession(id, device.deviceId);
  audit(id, "account.created", `admin=${admin}`);
  return { user, cookies: [session, device.cookie] };
}

export interface PendingResult {
  status: "signed_in" | "verify_device" | "totp_required";
  cookies: IssuedCookie[];
  devCode?: string;
}

function exposeDevCode(): boolean {
  return process.env.NODE_ENV !== "production" && process.env.DEV_SHOW_DEVICE_CODE === "true";
}

export function completePasswordLogin(
  user: UserRow,
  userAgent: string | null,
  deviceToken: string | undefined
): PendingResult {
  if (deviceToken) {
    const device = db()
      .prepare("SELECT id FROM devices WHERE token_hash = ? AND user_id = ? AND verified = 1")
      .get(hashToken(deviceToken), user.id) as { id: string } | null;
    if (device) {
      db().prepare("UPDATE devices SET last_seen_at = ? WHERE id = ?").run(nowIso(), device.id);
      audit(user.id, "auth.signed_in", "trusted device");
      return { status: "signed_in", cookies: [createSession(user.id, device.id)] };
    }
  }

  // Abandoned challenges do not accumulate forever.
  db()
    .prepare("DELETE FROM devices WHERE verified = 0 AND created_at < ?")
    .run(isoIn(-24 * 60 * 60 * 1000));

  // Provisional device: no cookie is set until the code is verified.
  const device = createDevice(user.id, deviceLabel(userAgent), false);
  const code = issueDeviceCode(user.id, device.deviceId, "device");
  audit(user.id, "auth.device_challenge", "new device");
  return {
    status: "verify_device",
    cookies: [
      { name: PENDING_COOKIE, value: code.pendingId, maxAge: Math.floor(CODE_MS / 1000) },
    ],
    devCode: exposeDevCode() ? code.code : undefined,
  };
}

export function issueDeviceCode(
  userId: string,
  deviceId: string,
  stage: "device" | "totp"
): { pendingId: string; code: string } {
  // Any older challenge for this stage is retired so only one can succeed.
  db()
    .prepare("UPDATE device_codes SET attempts = ? WHERE user_id = ? AND stage = ?")
    .run(MAX_CODE_ATTEMPTS, userId, stage);
  const pendingId = newId();
  const code = stage === "device" ? randomDigits(4) : randomToken(8);
  // For the TOTP stage the code is the authenticator value, so only the row id
  // is hashed here; verification reads the secret and checks the TOTP directly.
  const stored = stage === "device" ? hashToken(code) : hashToken(pendingId);
  db()
    .prepare(
      "INSERT INTO device_codes (id, user_id, device_id, stage, code_hash, attempts, expires_at, created_at) VALUES (?, ?, ?, ?, ?, 0, ?, ?)"
    )
    .run(pendingId, userId, deviceId, stage, stored, isoIn(CODE_MS), nowIso());
  return { pendingId, code };
}

interface PendingRow {
  id: string;
  user_id: string;
  device_id: string;
  stage: string;
  code_hash: string;
  attempts: number;
  expires_at: string;
}

function loadPending(pendingId: string | undefined): PendingRow {
  if (!pendingId) throw new ApiError(400, "no_pending", "Start signing in again.");
  const row = db()
    .prepare(
      "SELECT id, user_id, device_id, stage, code_hash, attempts, expires_at FROM device_codes WHERE id = ?"
    )
    .get(pendingId) as PendingRow | null;
  if (!row) throw new ApiError(400, "no_pending", "Start signing in again.");
  if (new Date(row.expires_at).getTime() < Date.now()) {
    db().prepare("DELETE FROM device_codes WHERE id = ?").run(row.id);
    throw new ApiError(400, "code_expired", "That code expired. Start again.");
  }
  if (row.attempts >= MAX_CODE_ATTEMPTS) {
    db().prepare("DELETE FROM device_codes WHERE id = ?").run(row.id);
    throw new ApiError(429, "too_many_attempts", "Too many attempts. Start again.");
  }
  return row;
}

function burnAttempt(row: PendingRow) {
  db().prepare("UPDATE device_codes SET attempts = attempts + 1 WHERE id = ?").run(row.id);
}

export function verifyDeviceCode(pendingId: string | undefined, code: string): PendingResult {
  const row = loadPending(pendingId);
  if (row.stage !== "device") throw new ApiError(400, "wrong_stage", "Start again.");

  if (!safeEqual(hashToken(code), row.code_hash)) {
    burnAttempt(row);
    audit(row.user_id, "auth.device_code_failed");
    throw new ApiError(401, "bad_code", "That code is not right.");
  }

  const user = getUser(row.user_id);
  if (!user) throw new ApiError(401, "bad_code", "That code is not right.");

  if (user.is_admin === 1) {
    if (user.totp_confirmed !== 1) {
      throw new ApiError(
        403,
        "totp_setup_required",
        "Confirm an authenticator on a trusted device before signing in elsewhere."
      );
    }
    const totp = issueDeviceCode(user.id, row.device_id, "totp");
    db().prepare("DELETE FROM device_codes WHERE id = ?").run(row.id);
    return {
      status: "totp_required",
      cookies: [
        { name: PENDING_COOKIE, value: totp.pendingId, maxAge: Math.floor(CODE_MS / 1000) },
      ],
    };
  }

  db().prepare("DELETE FROM device_codes WHERE id = ?").run(row.id);
  const device = promoteDevice(row.device_id);
  const session = createSession(user.id, device.deviceId);
  audit(user.id, "auth.device_verified");
  return { status: "signed_in", cookies: [session, device.cookie] };
}

export function verifySecondFactor(pendingId: string | undefined, code: string): PendingResult {
  const row = loadPending(pendingId);
  if (row.stage !== "totp") throw new ApiError(400, "wrong_stage", "Start again.");

  const stored = db()
    .prepare("SELECT totp_secret FROM users WHERE id = ?")
    .get(row.user_id) as { totp_secret: string | null } | null;
  if (!stored?.totp_secret || !verifyTotp(stored.totp_secret, code)) {
    burnAttempt(row);
    audit(row.user_id, "auth.totp_failed");
    throw new ApiError(401, "bad_code", "That code is not right.");
  }

  db().prepare("DELETE FROM device_codes WHERE id = ?").run(row.id);
  const device = promoteDevice(row.device_id);
  const session = createSession(row.user_id, device.deviceId);
  audit(row.user_id, "auth.totp_verified");
  return { status: "signed_in", cookies: [session, device.cookie] };
}

export function checkPassword(
  emailNorm: string,
  password: string,
  deviceToken: string | undefined,
  userAgent: string | null
): PendingResult {
  const row = db()
    .prepare(
      "SELECT id, salt, password_hash, failed_logins, locked_until FROM users WHERE email_norm = ?"
    )
    .get(emailNorm) as
    | { id: string; salt: string; password_hash: string; failed_logins: number; locked_until: string | null }
    | null;

  if (!row) {
    dummyVerify();
    throw new ApiError(401, "bad_credentials", "Email or password is incorrect.");
  }
  if (row.locked_until && new Date(row.locked_until).getTime() > Date.now()) {
    throw new ApiError(429, "locked", "Too many attempts. Try again in a few minutes.");
  }
  if (!verifyPassword(password, row.salt, row.password_hash)) {
    const failed = row.failed_logins + 1;
    db()
      .prepare("UPDATE users SET failed_logins = ?, locked_until = ? WHERE id = ?")
      .run(failed, failed >= MAX_FAILED_LOGINS ? isoIn(LOCK_MS) : null, row.id);
    audit(row.id, "auth.bad_password");
    throw new ApiError(401, "bad_credentials", "Email or password is incorrect.");
  }

  db()
    .prepare("UPDATE users SET failed_logins = 0, locked_until = NULL, is_admin = ? WHERE id = ?")
    .run(isAdminEmail(emailNorm) ? 1 : 0, row.id);

  const user = getUser(row.id);
  if (!user) throw new ApiError(401, "bad_credentials", "Email or password is incorrect.");
  return completePasswordLogin(user, userAgent, deviceToken);
}

export function mergeGuestProgress(userId: string, guestId: string | undefined) {
  if (!guestId) return;
  const rows = db()
    .prepare("SELECT lesson_id, score, completed_at FROM guest_progress WHERE guest_id = ?")
    .all(guestId) as { lesson_id: string; score: number; completed_at: string }[];
  const insert = db().prepare(
    `INSERT INTO progress (id, user_id, lesson_id, score, completed_at) VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(user_id, lesson_id) DO UPDATE SET score = MAX(score, excluded.score)`
  );
  for (const row of rows) {
    insert.run(newId(), userId, row.lesson_id, row.score, row.completed_at);
  }
  db().prepare("DELETE FROM guest_progress WHERE guest_id = ?").run(guestId);
  db().prepare("DELETE FROM guests WHERE id = ?").run(guestId);
}

export function createGuest(): { cookie: IssuedCookie } {
  const id = newId();
  const token = randomToken();
  db()
    .prepare("INSERT INTO guests (id, token_hash, created_at, expires_at) VALUES (?, ?, ?, ?)")
    .run(id, hashToken(token), nowIso(), isoIn(GUEST_MS));
  return { cookie: { name: GUEST_COOKIE, value: token, maxAge: Math.floor(GUEST_MS / 1000) } };
}

export function signOut(sessionToken: string | undefined): IssuedCookie[] {
  if (sessionToken) {
    db().prepare("DELETE FROM sessions WHERE token_hash = ?").run(hashToken(sessionToken));
  }
  return [
    { name: SESSION_COOKIE, value: "", maxAge: 0 },
    { name: PENDING_COOKIE, value: "", maxAge: 0 },
  ];
}

export interface DeviceInfo {
  id: string;
  label: string;
  created_at: string;
  last_seen_at: string;
}

export function listDevices(userId: string): DeviceInfo[] {
  return db()
    .prepare<DeviceInfo>(
      "SELECT id, label, created_at, last_seen_at FROM devices WHERE user_id = ? AND verified = 1 ORDER BY last_seen_at DESC"
    )
    .all(userId);
}

export function revokeDevice(userId: string, deviceId: string): boolean {
  const owned = db()
    .prepare("SELECT id FROM devices WHERE id = ? AND user_id = ?")
    .get(deviceId, userId) as { id: string } | null;
  if (!owned) return false;
  db().prepare("DELETE FROM sessions WHERE device_id = ?").run(deviceId);
  db().prepare("DELETE FROM devices WHERE id = ? AND user_id = ?").run(deviceId, userId);
  audit(userId, "device.revoked");
  return true;
}

export function signOutEverywhere(userId: string): void {
  db().prepare("DELETE FROM sessions WHERE user_id = ?").run(userId);
  audit(userId, "auth.signed_out_everywhere");
}
