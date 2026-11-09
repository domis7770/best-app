import { randomBytes } from "node:crypto";
import { writeFileSync } from "node:fs";
import {
  handler,
  assertSameOrigin,
  json,
  clientKey,
  ApiError,
} from "@/lib/http";
import { allow } from "@/lib/ratelimit";
import { getActor, requireUser } from "@/lib/session";
import { db, newId, nowIso, audit, uploadFilePath } from "@/lib/db";

export const dynamic = "force-dynamic";

const MAX_BYTES = 2 * 1024 * 1024;

function sniff(buf: Buffer): { mime: string; ext: string } | null {
  if (buf.length > 8 && buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) {
    return { mime: "image/png", ext: "png" };
  }
  if (buf.length > 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) {
    return { mime: "image/jpeg", ext: "jpg" };
  }
  if (
    buf.length > 12 &&
    buf.subarray(0, 4).toString("ascii") === "RIFF" &&
    buf.subarray(8, 12).toString("ascii") === "WEBP"
  ) {
    return { mime: "image/webp", ext: "webp" };
  }
  return null;
}

export const POST = handler(async (req) => {
  assertSameOrigin(req);
  const { user } = requireUser(await getActor());
  if (!allow("upload", clientKey(req, user.id))) {
    throw new ApiError(429, "rate_limited", "Too many uploads. Try again later.");
  }

  const length = Number(req.headers.get("content-length") ?? "0");
  if (Number.isFinite(length) && length > MAX_BYTES + 64 * 1024) {
    throw new ApiError(413, "payload_too_large", "Images must be under 2 MB.");
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    throw new ApiError(400, "invalid_input", "Could not read that upload.");
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    throw new ApiError(400, "invalid_input", "Choose a file first.");
  }
  if (file.size > MAX_BYTES) {
    throw new ApiError(413, "payload_too_large", "Images must be under 2 MB.");
  }

  const buf = Buffer.from(await file.arrayBuffer());
  if (buf.length > MAX_BYTES) {
    throw new ApiError(413, "payload_too_large", "Images must be under 2 MB.");
  }
  const kind = sniff(buf);
  if (!kind) {
    throw new ApiError(415, "unsupported_type", "PNG, JPEG or WebP only.");
  }

  const id = randomBytes(16).toString("hex");
  const name = (file.name || `image.${kind.ext}`).replace(/[^\w.\- ]/g, "").slice(0, 120) || "image";

  writeFileSync(uploadFilePath(id), buf, { mode: 0o600 });

  db()
    .prepare(
      "INSERT INTO uploads (id, user_id, name, mime, size, created_at) VALUES (?, ?, ?, ?, ?, ?)"
    )
    .run(id, user.id, name, kind.mime, buf.length, nowIso());
  audit(user.id, "upload.created", kind.mime);

  return json({ id, name, mime: kind.mime, size: buf.length }, { status: 201 });
});
