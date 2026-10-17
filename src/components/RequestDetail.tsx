"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { categoryLabel } from "@/lib/categories";
import { displayName } from "@/lib/format";
import type { Prayer } from "@/lib/types";
import { validatePraise } from "@/lib/validate";
import { useBrowserStore } from "@/components/BrowserStore";
import { PrayerActions } from "@/components/PrayerActions";
import { TimeAgo } from "@/components/TimeAgo";

export function RequestDetail({
  initialPrayer,
  justPosted,
  keySaved,
}: {
  initialPrayer: Prayer;
  justPosted: boolean;
  keySaved: boolean;
}) {
  const [prayer, setPrayer] = useState(initialPrayer);
  const [praise, setPraise] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [focusAnswered, setFocusAnswered] = useState(false);
  const bannerRef = useRef<HTMLDivElement>(null);
  const answeredRef = useRef<HTMLElement>(null);
  const { ready, isOwned, ownerToken } = useBrowserStore();
  const name = displayName(prayer.name);
  const category = categoryLabel(prayer.category);
  const mine = ready && isOwned(prayer.id);

  useEffect(() => {
    if (justPosted) bannerRef.current?.focus();
  }, [justPosted]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const response = await fetch(`/api/requests/${initialPrayer.id}`, { cache: "no-store" });
        if (!response.ok) return;
        const data = (await response.json()) as { request?: Prayer };
        if (!cancelled && data.request) setPrayer(data.request);
      } catch {
        // Keep the server-rendered request when the refresh fails.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [initialPrayer.id]);

  useEffect(() => {
    if (focusAnswered) answeredRef.current?.focus();
  }, [focusAnswered, prayer.answered]);

  async function onAnswer(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const token = ownerToken(prayer.id);
    if (!token) {
      setError("This browser does not have the key for this request.");
      return;
    }
    const parsed = validatePraise(praise);
    if (!parsed.ok) {
      setError(parsed.error);
      return;
    }

    setPending(true);
    setError(null);
    try {
      const response = await fetch(`/api/requests/${prayer.id}/answer`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ownerToken: token, praise: parsed.value }),
      });
      const data = (await response.json().catch(() => null)) as {
        error?: string;
        request?: Prayer;
      } | null;
      if (!response.ok || !data?.request) {
        setError(data?.error ?? "Could not update this request.");
        return;
      }
      setPrayer(data.request);
      setFocusAnswered(true);
    } catch {
      setError("Could not update this request. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <article>
      <p className="back">
        <Link href="/">Back to requests</Link>
      </p>
      {justPosted ? (
        <div
          className={keySaved ? "banner" : "banner banner-warn"}
          role="status"
          tabIndex={-1}
          ref={bannerRef}
        >
          {keySaved
            ? "Your request is shared. The key to mark it answered is saved in this browser."
            : "Your request is shared, but this browser blocked local storage, so you may not be able to mark it answered from here."}
        </div>
      ) : null}
      <header className="detail-header">
        <h1>{name}</h1>
        <p className="byline">
          {category ? <span className="chip">{category}</span> : null}
          {prayer.answered ? <span className="badge">Answered</span> : null}
          {mine ? <span className="chip">Your request</span> : null}
          <span>
            Posted <TimeAgo iso={prayer.createdAt} />
          </span>
        </p>
      </header>
      <p className="prayer-text">{prayer.body}</p>
      <PrayerActions prayer={prayer} />
      {prayer.answered ? (
        <section
          className="answered-panel"
          aria-labelledby="answered-title"
          tabIndex={-1}
          ref={answeredRef}
        >
          <h2 id="answered-title">Answered</h2>
          {prayer.answeredAt ? (
            <p className="meta">
              Updated <TimeAgo iso={prayer.answeredAt} />
            </p>
          ) : null}
          {prayer.praise ? (
            <blockquote className="praise-text">
              <p>{prayer.praise}</p>
            </blockquote>
          ) : (
            <p>Marked answered, with no written update.</p>
          )}
        </section>
      ) : mine ? (
        <form className="answer-form" onSubmit={onAnswer}>
          <h2>Mark as answered</h2>
          <p className="hint">
            When this prayer has been answered, close it and share an optional update.
          </p>
          <div className="field">
            <label htmlFor="praise">
              Praise update <span className="optional">(optional)</span>
            </label>
            <textarea
              id="praise"
              name="praise"
              value={praise}
              onChange={(event) => setPraise(event.target.value)}
              maxLength={1000}
              rows={4}
            />
            <p className="hint">{praise.length} / 1000</p>
          </div>
          {error ? (
            <p className="form-error" role="alert">
              {error}
            </p>
          ) : null}
          <button className="btn btn-primary" type="submit" disabled={pending}>
            {pending ? "Saving…" : "Mark as answered"}
          </button>
        </form>
      ) : null}
    </article>
  );
}
