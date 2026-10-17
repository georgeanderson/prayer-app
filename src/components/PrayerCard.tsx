"use client";

import Link from "next/link";
import { categoryLabel } from "@/lib/categories";
import { displayName, excerpt } from "@/lib/format";
import type { Prayer } from "@/lib/types";
import { useBrowserStore } from "@/components/BrowserStore";
import { PrayerActions } from "@/components/PrayerActions";
import { TimeAgo } from "@/components/TimeAgo";

export function PrayerCard({ prayer }: { prayer: Prayer }) {
  const { ready, isOwned } = useBrowserStore();
  const name = displayName(prayer.name);
  const category = categoryLabel(prayer.category);
  const mine = ready && isOwned(prayer.id);

  return (
    <article className={prayer.answered ? "card is-answered" : "card"}>
      <p className="byline">
        <span className="name">{name}</span>
        {category ? <span className="chip">{category}</span> : null}
        {prayer.answered ? <span className="badge">Answered</span> : null}
        {mine ? <span className="chip">Your request</span> : null}
        <TimeAgo iso={prayer.createdAt} />
      </p>
      <h2>
        <Link href={`/request/${prayer.id}`}>
          {excerpt(prayer.body)}
          <span className="sr-only"> — open request from {name}</span>
        </Link>
      </h2>
      {prayer.answered && prayer.praise ? (
        <p className="praise-snippet">
          <span className="praise-label">Update</span>
          {excerpt(prayer.praise, 140)}
        </p>
      ) : null}
      <PrayerActions prayer={prayer} />
    </article>
  );
}
