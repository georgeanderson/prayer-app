import { getPrayer } from "@/lib/db";
import { jsonError, jsonOk } from "@/lib/responses";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const prayer = getPrayer(id);
  if (!prayer) return jsonError("That request could not be found.", 404);
  return jsonOk({ request: prayer });
}
