import { Database } from "bun:sqlite";
import { mkdirSync, writeFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { createHash, randomUUID } from "node:crypto";

const dataDir = resolve(process.cwd(), process.env.DATA_DIR ?? "./data");
const uploadDir = resolve(dataDir, "uploads");

function ensureDirs() {
  mkdirSync(uploadDir, { recursive: true, mode: 0o700 });
}

const SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  email_norm TEXT NOT NULL UNIQUE,
  salt TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  display_name TEXT NOT NULL,
  plan TEXT NOT NULL DEFAULT 'free',
  plan_status TEXT NOT NULL DEFAULT 'inactive',
  stripe_customer_id TEXT,
  totp_secret TEXT,
  totp_confirmed INTEGER NOT NULL DEFAULT 0,
  is_admin INTEGER NOT NULL DEFAULT 0,
  failed_logins INTEGER NOT NULL DEFAULT 0,
  locked_until TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS devices (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL,
  label TEXT NOT NULL,
  verified INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  last_seen_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_devices_user ON devices(user_id);

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  device_id TEXT NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);

CREATE TABLE IF NOT EXISTS device_codes (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  device_id TEXT NOT NULL,
  stage TEXT NOT NULL,
  code_hash TEXT NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_codes_user ON device_codes(user_id, stage);

CREATE TABLE IF NOT EXISTS guests (
  id TEXT PRIMARY KEY,
  token_hash TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS progress (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  lesson_id TEXT NOT NULL,
  score INTEGER NOT NULL,
  completed_at TEXT NOT NULL,
  UNIQUE(user_id, lesson_id)
);

CREATE TABLE IF NOT EXISTS guest_progress (
  guest_id TEXT NOT NULL REFERENCES guests(id) ON DELETE CASCADE,
  lesson_id TEXT NOT NULL,
  score INTEGER NOT NULL,
  completed_at TEXT NOT NULL,
  PRIMARY KEY (guest_id, lesson_id)
);

CREATE TABLE IF NOT EXISTS sim_runs (
  user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  round INTEGER NOT NULL DEFAULT 0,
  cash INTEGER NOT NULL DEFAULT 0,
  reach INTEGER NOT NULL DEFAULT 0,
  trust INTEGER NOT NULL DEFAULT 0,
  history TEXT NOT NULL DEFAULT '[]',
  finished_at TEXT,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS rate_limits (
  key TEXT NOT NULL,
  window_start INTEGER NOT NULL,
  count INTEGER NOT NULL,
  PRIMARY KEY (key, window_start)
);

CREATE TABLE IF NOT EXISTS webhook_events (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  received_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS audit_log (
  id TEXT PRIMARY KEY,
  actor_id TEXT,
  action TEXT NOT NULL,
  detail TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS uploads (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  mime TEXT NOT NULL,
  size INTEGER NOT NULL,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_uploads_user ON uploads(user_id);
`;

type Global = typeof globalThis & { __promptlyDb?: Database; __promptlyPepper?: string };
const g = globalThis as Global;

export function db(): Database {
  if (!g.__promptlyDb) {
    ensureDirs();
    const handle = new Database(resolve(dataDir, "promptly.sqlite"));
    handle.exec("PRAGMA journal_mode = WAL");
    handle.exec("PRAGMA foreign_keys = ON");
    handle.exec(SCHEMA);
    g.__promptlyDb = handle;
  }
  return g.__promptlyDb;
}

/**
 * Peppers every stored token hash. Production must supply APP_SECRET; in
 * development a stable secret is generated once inside the data directory.
 */
export function pepper(): string {
  if (g.__promptlyPepper) return g.__promptlyPepper;
  const fromEnv = process.env.APP_SECRET?.trim();
  if (fromEnv) {
    if (process.env.NODE_ENV === "production" && fromEnv.length < 16) {
      throw new Error("APP_SECRET is too short for production.");
    }
    g.__promptlyPepper = fromEnv;
    return fromEnv;
  }
  if (process.env.NODE_ENV === "production") {
    throw new Error("APP_SECRET must be set in production.");
  }
  ensureDirs();
  const file = resolve(dataDir, "dev-secret");
  if (!existsSync(file)) writeFileSync(file, randomUUID() + randomUUID(), { mode: 0o600 });
  const { readFileSync } = require("node:fs") as typeof import("node:fs");
  g.__promptlyPepper = readFileSync(file, "utf8").trim();
  return g.__promptlyPepper;
}

export function hashToken(token: string): string {
  return createHash("sha256").update(`${pepper()}:${token}`).digest("hex");
}

export function newId(): string {
  return randomUUID();
}

export function nowIso(): string {
  return new Date().toISOString();
}

export function isoIn(ms: number): string {
  return new Date(Date.now() + ms).toISOString();
}

export function uploadFilePath(id: string): string {
  if (!/^[a-f0-9]{32}$/.test(id)) throw new Error("bad upload id");
  return resolve(uploadDir, id);
}

export function uploadsDir(): string {
  ensureDirs();
  return uploadDir;
}

export function audit(actorId: string | null, action: string, detail?: string) {
  db()
    .prepare("INSERT INTO audit_log (id, actor_id, action, detail, created_at) VALUES (?, ?, ?, ?, ?)")
    .run(newId(), actorId, action, detail ?? null, nowIso());
}
