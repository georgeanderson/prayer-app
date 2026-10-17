import { recordPrayer } from "@/lib/db";
import { isUuid } from "@/lib/ids";
import { asObject, jsonError, jsonOk, readJson } from "@/lib/responses";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const body = asObject(await readJson(request));
  if (!body) return jsonError("Send a JSON object.", 400);

  const clientId = body.clientId;
  if (typeof clientId !== "string" || !isUuid(clientId)) {
    return jsonError("A browser id is required.", 400);
  }

  try {
    const result = recordPrayer(id, clientId);
    if (!result) return jsonError("That request could not be found.", 404);
    return jsonOk(result);
  } catch (error) {
    console.error(error);
    return jsonError("Could not record that prayer.", 500);
  }
}
