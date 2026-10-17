import { isCategoryId } from "@/lib/categories";

export type FieldName = "name" | "body" | "category" | "praise";

export type ValidationResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: string; field?: FieldName };

const NAME_MAX = 60;
const BODY_MIN = 10;
const BODY_MAX = 2000;
const PRAISE_MAX = 1000;

function cleanMultiline(input: string): string {
  return input
    .replace(/\u0000/g, "")
    .replace(/\r\n/g, "\n")
    .trim()
    .replace(/\n{3,}/g, "\n\n");
}

function cleanName(input: string): string {
  return input.replace(/[\u0000\r\n\t]/g, " ").replace(/\s+/g, " ").trim();
}

export function validateNewRequest(input: {
  name?: unknown;
  body?: unknown;
  category?: unknown;
  company_website?: unknown;
}): ValidationResult<{ name: string | null; body: string; category: string | null }> {
  if (typeof input.company_website === "string" && input.company_website.trim() !== "") {
    return { ok: false, error: "Could not post that request." };
  }

  let name: string | null = null;
  if (typeof input.name === "string") {
    const cleaned = cleanName(input.name);
    if (cleaned.length > NAME_MAX) {
      return {
        ok: false,
        field: "name",
        error: `Please keep the name under ${NAME_MAX} characters.`,
      };
    }
    name = cleaned.length > 0 ? cleaned : null;
  } else if (input.name != null && input.name !== "") {
    return { ok: false, field: "name", error: "Name should be text." };
  }

  if (typeof input.body !== "string") {
    return { ok: false, field: "body", error: "Write the request you want people to pray for." };
  }
  const body = cleanMultiline(input.body);
  if (body.length < BODY_MIN) {
    return {
      ok: false,
      field: "body",
      error: `Please write at least ${BODY_MIN} characters so people know how to pray.`,
    };
  }
  if (body.length > BODY_MAX) {
    return {
      ok: false,
      field: "body",
      error: `Please keep the request under ${BODY_MAX} characters.`,
    };
  }

  let category: string | null = null;
  if (typeof input.category === "string" && input.category.trim() !== "") {
    if (!isCategoryId(input.category)) {
      return { ok: false, field: "category", error: "Choose a category from the list." };
    }
    category = input.category;
  } else if (input.category != null && input.category !== "") {
    return { ok: false, field: "category", error: "Choose a category from the list." };
  }

  return { ok: true, value: { name, body, category } };
}

export function validatePraise(input: unknown): ValidationResult<string | null> {
  if (input == null || input === "") return { ok: true, value: null };
  if (typeof input !== "string") {
    return { ok: false, field: "praise", error: "The update should be text." };
  }
  const praise = cleanMultiline(input);
  if (praise.length > PRAISE_MAX) {
    return {
      ok: false,
      field: "praise",
      error: `Please keep the update under ${PRAISE_MAX} characters.`,
    };
  }
  return { ok: true, value: praise.length > 0 ? praise : null };
}
