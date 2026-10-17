import { isUuid } from "@/lib/ids";
import { createPrayer, listPrayers, listPrayersByIds } from "@/lib/db";
import { asObject, jsonError, jsonOk, readJson } from "@/lib/responses";
import { validateNewRequest } from "@/lib/validate";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  if (searchParams.has("ids")) {
    const ids = (searchParams.get("ids") ?? "")
      .split(",")
      .map((id) => id.trim())
      .filter(isUuid)
      .slice(0, 50);
    return jsonOk({ requests: listPrayersByIds(ids) });
  }
  return jsonOk({ requests: listPrayers() });
}

export async function POST(request: Request) {
  const body = asObject(await readJson(request));
  if (!body) return jsonError("Send a JSON object.", 400);

  const parsed = validateNewRequest(body);
  if (!parsed.ok) return jsonError(parsed.error, 400, parsed.field);

  try {
    const created = createPrayer(parsed.value);
    return jsonOk({ request: created.prayer, ownerToken: created.ownerToken }, 201);
  } catch (error) {
    console.error(error);
    return jsonError("Could not save that request.", 500);
  }
}
