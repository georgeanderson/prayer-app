"use client";

import { useEffect, useState } from "react";
import { CATEGORIES } from "@/lib/categories";
import type { Prayer } from "@/lib/types";
import { PrayerCard } from "@/components/PrayerCard";

type Status = "all" | "open" | "answered";

const STATUS_OPTIONS: Array<{ value: Status; label: string }> = [
  { value: "all", label: "All" },
  { value: "open", label: "Open" },
  { value: "answered", label: "Answered" },
];

export function Feed({ initialPrayers }: { initialPrayers: Prayer[] }) {
  const [prayers, setPrayers] = useState(initialPrayers);
  const [status, setStatus] = useState<Status>("all");
  const [category, setCategory] = useState("all");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const response = await fetch("/api/requests", { cache: "no-store" });
        if (!response.ok) return;
        const data = (await response.json()) as { requests?: Prayer[] };
        if (!cancelled && Array.isArray(data.requests)) setPrayers(data.requests);
      } catch {
        // Keep the server-rendered list when the refresh fails.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const visible = prayers.filter((prayer) => {
    if (status === "open" && prayer.answered) return false;
    if (status === "answered" && !prayer.answered) return false;
    if (category !== "all" && prayer.category !== category) return false;
    return true;
  });

  return (
    <div>
      <div className="filters">
        <div className="segment" role="group" aria-label="Filter by status">
          {STATUS_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              aria-pressed={status === option.value}
              onClick={() => setStatus(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
        <div className="filter-category">
          <label htmlFor="category-filter">Category</label>
          <select
            id="category-filter"
            value={category}
            onChange={(event) => setCategory(event.target.value)}
          >
            <option value="all">All categories</option>
            {CATEGORIES.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      <p className="result-count" aria-live="polite">
        {visible.length} {visible.length === 1 ? "request" : "requests"}
      </p>
      {visible.length === 0 ? (
        <div className="empty">
          <h2>No requests match</h2>
          <p>Try a different filter, or share what you would like prayer for.</p>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => {
              setStatus("all");
              setCategory("all");
            }}
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="stack">
          {visible.map((prayer) => (
            <PrayerCard key={prayer.id} prayer={prayer} />
          ))}
        </div>
      )}
    </div>
  );
}
