import { NextResponse } from "next/server";

const headers = { "Cache-Control": "no-store" };

export function jsonOk(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers });
}

export function jsonError(error: string, status: number, field?: string) {
  return NextResponse.json(field ? { error, field } : { error }, { status, headers });
}

export async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

export function asObject(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}
