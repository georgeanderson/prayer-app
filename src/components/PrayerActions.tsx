"use client";

import { useState } from "react";
import { displayName } from "@/lib/format";
import type { Prayer } from "@/lib/types";
import { useBrowserStore } from "@/components/BrowserStore";

export function PrayerActions({ prayer }: { prayer: Prayer }) {
  const { ready, isPrayed, isSaved, markPrayed, toggleSaved, ensureClientId } = useBrowserStore();
  const [override, setOverride] = useState<{ id: string; count: number } | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const name = displayName(prayer.name);
  const prayed = ready && isPrayed(prayer.id);
  const saved = ready && isSaved(prayer.id);
  const count = Math.max(
    prayer.prayedCount,
    override?.id === prayer.id ? override.count : 0,
  );

  async function pray() {
    if (prayed || pending) return;
    setPending(true);
    setError(null);
    try {
      const clientId = ensureClientId();
      const response = await fetch(`/api/requests/${prayer.id}/pray`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ clientId }),
      });
      const data = (await response.json().catch(() => null)) as {
        error?: string;
        prayedCount?: number;
      } | null;
      if (!response.ok || typeof data?.prayedCount !== "number") {
        setError(data?.error ?? "Could not record that. Please try again.");
        return;
      }
      setOverride({ id: prayer.id, count: data.prayedCount });
      markPrayed(prayer.id);
    } catch {
      setError("Could not record that. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="actions">
      <p className="count" aria-live="polite" aria-atomic="true">
        {count === 0 ? (
          "Be the first to pray"
        ) : (
          <>
            <strong>{count}</strong> {count === 1 ? "person prayed" : "people prayed"}
          </>
        )}
      </p>
      <div className="action-buttons">
        <button
          type="button"
          className="btn btn-primary"
          onClick={pray}
          disabled={pending || prayed}
          aria-pressed={prayed}
          aria-busy={pending}
          aria-label={prayed ? `You prayed for ${name}` : `I prayed for ${name}`}
        >
          {pending ? "Saving…" : prayed ? "Prayed" : "I prayed"}
        </button>
        <button
          type="button"
          className="btn btn-ghost"
          onClick={() => toggleSaved(prayer.id)}
          aria-pressed={saved}
          aria-label={saved ? `Remove ${name} from your prayer list` : `Save ${name} to your prayer list`}
        >
          {saved ? "Saved" : "Save"}
        </button>
      </div>
      {error ? (
        <p className="form-error action-error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
