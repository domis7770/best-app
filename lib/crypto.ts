import {
  randomBytes,
  scryptSync,
  timingSafeEqual,
  createHmac,
  createHash,
} from "node:crypto";

const KEYLEN = 64;
const SCRYPT = { N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 };

export function randomToken(bytes = 32): string {
  return randomBytes(bytes).toString("base64url");
}

export function randomDigits(length = 4): string {
  let out = "";
  while (out.length < length) {
    const b = randomBytes(1)[0];
    if (b < 250) out += String(b % 10);
  }
  return out;
}

export function hashPassword(password: string, salt: string): string {
  return scryptSync(password.normalize("NFKC"), salt, KEYLEN, SCRYPT).toString("hex");
}

export function verifyPassword(password: string, salt: string, expected: string): boolean {
  const actual = hashPassword(password, salt);
  return safeEqual(actual, expected);
}

/** Constant-time string comparison that leaks nothing about length. */
export function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a, "utf8");
  const bb = Buffer.from(b, "utf8");
  const len = Math.max(ab.length, bb.length, 1);
  const pa = Buffer.alloc(len);
  const pb = Buffer.alloc(len);
  ab.copy(pa);
  bb.copy(pb);
  return timingSafeEqual(pa, pb) && ab.length === bb.length;
}

export function dummyVerify(): void {
  // Burn the same work as a real verification so login timing does not
  // reveal whether an account exists.
  hashPassword("dummy-password-value", "dummy-salt-value");
}

export function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

/** RFC 6238 TOTP: SHA-1, 6 digits, 30 second step, ±1 step drift. */
export function totpNow(secretBase32: string, at: number = Date.now()): string {
  const counter = Math.floor(at / 30000);
  return totpForCounter(secretBase32, counter);
}

function totpForCounter(secretBase32: string, counter: number): string {
  const key = base32Decode(secretBase32);
  const buf = Buffer.alloc(8);
  buf.writeUInt32BE(Math.floor(counter / 2 ** 32), 0);
  buf.writeUInt32BE(counter >>> 0, 4);
  const digest = createHmac("sha1", key).update(buf).digest();
  const offset = digest[digest.length - 1] & 0x0f;
  const code =
    ((digest[offset] & 0x7f) << 24) |
    (digest[offset + 1] << 16) |
    (digest[offset + 2] << 8) |
    digest[offset + 3];
  return String(code % 1_000_000).padStart(6, "0");
}

export function verifyTotp(secretBase32: string, token: string, at: number = Date.now()): boolean {
  if (!/^\d{6}$/.test(token)) return false;
  const counter = Math.floor(at / 30000);
  for (const drift of [-1, 0, 1]) {
    if (safeEqual(totpForCounter(secretBase32, counter + drift), token)) return true;
  }
  return false;
}

export function generateTotpSecret(): string {
  return base32Encode(randomBytes(20));
}

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

export function base32Encode(buf: Buffer): string {
  let bits = 0;
  let value = 0;
  let out = "";
  for (const byte of buf) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      out += ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) out += ALPHABET[(value << (5 - bits)) & 31];
  return out;
}

export function base32Decode(input: string): Buffer {
  const clean = input.toUpperCase().replace(/[^A-Z2-7]/g, "");
  let bits = 0;
  let value = 0;
  const out: number[] = [];
  for (const char of clean) {
    const idx = ALPHABET.indexOf(char);
    if (idx < 0) continue;
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      out.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }
  return Buffer.from(out);
}

export function otpAuthUri(secret: string, account: string, issuer = "Promptly"): string {
  const label = encodeURIComponent(`${issuer}:${account}`);
  const params = new URLSearchParams({
    secret,
    issuer,
    algorithm: "SHA1",
    digits: "6",
    period: "30",
  });
  return `otpauth://totp/${label}?${params.toString()}`;
}
