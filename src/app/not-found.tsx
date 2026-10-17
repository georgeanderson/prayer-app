import Link from "next/link";

export default function NotFound() {
  return (
    <div className="empty">
      <h1>That page is not here</h1>
      <p>The request may have been removed, or the link is wrong.</p>
      <Link className="btn btn-primary" href="/">
        Back to requests
      </Link>
    </div>
  );
}
