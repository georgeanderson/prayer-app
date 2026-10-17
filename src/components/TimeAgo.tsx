"use client";

import { useSyncExternalStore } from "react";
import { absoluteDate, relativeTime } from "@/lib/format";

function emptySubscribe() {
  return () => {};
}

export function TimeAgo({ iso }: { iso: string }) {
  const label = useSyncExternalStore(
    emptySubscribe,
    () => relativeTime(iso),
    () => absoluteDate(iso),
  );

  return <time dateTime={iso}>{label}</time>;
}
