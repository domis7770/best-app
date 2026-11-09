import { readFileSync } from "node:fs";
import { fail } from "@/lib/http";
import { getActor } from "@/lib/session";
import { db, uploadFilePath } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const viewer = await getActor();
    if (viewer.kind !== "user") {
      return fail(401, "sign_in_required", "Sign in to view that file.");
    }

    const { id } = await ctx.params;
    if (!/^[a-f0-9]{32}$/.test(id)) {
      return fail(404, "not_found", "Not found.");
    }

    // Ownership is part of the query, not a separate check.
    const row = db()
      .prepare("SELECT id, user_id, name, mime FROM uploads WHERE id = ? AND user_id = ?")
      .get(id, viewer.user.id) as { id: string; name: string; mime: string } | null;
    if (!row) return fail(404, "not_found", "Not found.");

    let body: Buffer;
    try {
      body = readFileSync(uploadFilePath(id));
    } catch {
      return fail(404, "not_found", "Not found.");
    }

    return new Response(new Uint8Array(body), {
      status: 200,
      headers: {
        "Content-Type": row.mime,
        "Content-Length": String(body.length),
        "Content-Disposition": `inline; filename="${row.name.replace(/"/g, "")}"`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (err) {
    console.error("[promptly] upload read failed:", err instanceof Error ? err.message : err);
    return fail(500, "internal_error", "Something went wrong.");
  }
}
