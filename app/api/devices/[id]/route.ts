import { handler, assertSameOrigin, json, ApiError } from "@/lib/http";
import { getActor, requireUser, revokeDevice } from "@/lib/session";

export const dynamic = "force-dynamic";

export const DELETE = handler(async (req, ctx: { params: Promise<{ id: string }> }) => {
  assertSameOrigin(req);
  const { user } = requireUser(await getActor());
  const { id } = await ctx.params;
  if (!/^[0-9a-fA-F-]{36}$/.test(id)) {
    throw new ApiError(404, "not_found", "Not found.");
  }
  if (!revokeDevice(user.id, id)) {
    throw new ApiError(404, "not_found", "Not found.");
  }
  return json({ ok: true });
});
