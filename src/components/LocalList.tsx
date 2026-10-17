"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Prayer } from "@/lib/types";
import { useBrowserStore } from "@/components/BrowserStore";
import { PrayerCard } from "@/components/PrayerCard";

export function LocalList({ mode }: { mode: "saved" | "owned" }) {
  const { ready, savedIds, ownedIds } = useBrowserStore();
  const ids = mode === "saved" ? savedIds : ownedIds;
  const idKey = ids.join(",");
  const [result, setResult] = useState<{
    key: string;
    prayers: Prayer[];
    error: string | null;
  } | null>(null);

  useEffect(() => {
    if (!ready || !idKey) return;

    let cancelled = false;
    (async () => {
      try {
        const response = await fetch(`/api/requests?ids=${encodeURIComponent(idKey)}`, {
          cache: "no-store",
        });
        const data = (await response.json().catch(() => null)) as {
          error?: string;
          requests?: Prayer[];
        } | null;
        if (!response.ok) {
          throw new Error(data?.error ?? "Could not load these requests.");
        }
        if (!cancelled) {
          setResult({ key: idKey, prayers: data?.requests ?? [], error: null });
        }
      } catch (err) {
        if (!cancelled) {
          setResult({
            key: idKey,
            prayers: [],
            error: err instanceof Error ? err.message : "Could not load these requests.",
          });
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [ready, idKey]);

  if (!ready || (idKey && result === null)) {
    return (
      <p className="hint" role="status">
        Loading…
      </p>
    );
  }

  const error = result?.key === idKey ? result.error : null;
  if (error) {
    return (
      <p className="form-error" role="alert">
        {error}
      </p>
    );
  }

  const shown = (result?.prayers ?? []).filter((prayer) => ids.includes(prayer.id));
  if (shown.length === 0) {
    if (mode === "saved") {
      return (
        <div className="empty">
          <h2>Nothing saved yet</h2>
          <p>When a request stays with you, save it and it will wait here on this device.</p>
          <Link className="btn btn-primary" href="/">
            Browse requests
          </Link>
        </div>
      );
    }
    return (
      <div className="empty">
        <h2>No requests from this browser</h2>
        <p>Requests you post here show up in this list, where you can mark them answered.</p>
        <Link className="btn btn-primary" href="/new">
          Share a request
        </Link>
      </div>
    );
  }

  return (
    <div className="stack">
      {shown.map((prayer) => (
        <PrayerCard key={prayer.id} prayer={prayer} />
      ))}
    </div>
  );
}
