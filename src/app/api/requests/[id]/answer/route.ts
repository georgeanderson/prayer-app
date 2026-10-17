import { markAnswered } from "@/lib/db";
import { isOwnerToken } from "@/lib/ids";
import { asObject, jsonError, jsonOk, readJson } from "@/lib/responses";
import { validatePraise } from "@/lib/validate";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const body = asObject(await readJson(request));
  if (!body) return jsonError("Send a JSON object.", 400);

  const ownerToken = body.ownerToken;
  if (typeof ownerToken !== "string" || !isOwnerToken(ownerToken)) {
    return jsonError("Only the browser that posted this request can mark it answered.", 403);
  }

  const praise = validatePraise(body.praise);
  if (!praise.ok) return jsonError(praise.error, 400, praise.field);

  try {
    const result = markAnswered(id, ownerToken, praise.value);
    if (!result.ok) return jsonError(result.error, result.status);
    return jsonOk({ request: result.prayer });
  } catch (error) {
    console.error(error);
    return jsonError("Could not update that request.", 500);
  }
}
