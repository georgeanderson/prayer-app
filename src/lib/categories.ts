export const CATEGORIES = [
  { id: "health", label: "Health" },
  { id: "family", label: "Family" },
  { id: "work", label: "Work" },
  { id: "guidance", label: "Guidance" },
  { id: "grief", label: "Grief" },
  { id: "gratitude", label: "Gratitude" },
  { id: "community", label: "Community" },
] as const;

export type CategoryId = (typeof CATEGORIES)[number]["id"];

export function isCategoryId(value: string): value is CategoryId {
  return CATEGORIES.some((category) => category.id === value);
}

export function categoryLabel(id: string | null): string | null {
  if (!id) return null;
  return CATEGORIES.find((category) => category.id === id)?.label ?? null;
}
