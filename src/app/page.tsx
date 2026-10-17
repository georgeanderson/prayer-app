import { Feed } from "@/components/Feed";
import { listPrayers } from "@/lib/db";

export const dynamic = "force-dynamic";

export default function HomePage() {
  const prayers = listPrayers();

  return (
    <>
      <header className="page-intro">
        <h1>Prayer requests</h1>
        <p className="lede">
          Read what people are carrying. Pray where you are, then let them know you did.
        </p>
      </header>
      <Feed initialPrayers={prayers} />
    </>
  );
}
