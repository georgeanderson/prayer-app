"use client";

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="empty">
      <h1>Something went wrong</h1>
      <p>The page could not be loaded.</p>
      <button className="btn btn-primary" type="button" onClick={() => reset()}>
        Try again
      </button>
    </div>
  );
}
