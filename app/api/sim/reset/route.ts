import { handler, assertSameOrigin, json } from "@/lib/http";
import { getActor, requireUser } from "@/lib/session";
import { resetState } from "@/lib/sim";

export const dynamic = "force-dynamic";

export const POST = handler(async (req) => {
  assertSameOrigin(req);
  const { user } = requireUser(await getActor());
  return json({ state: resetState(user.id) });
});
