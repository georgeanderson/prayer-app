import type { Metadata } from "next";
import { LocalList } from "@/components/LocalList";

export const metadata: Metadata = {
  title: "My requests",
};

export default function MyRequestsPage() {
  return (
    <>
      <header className="page-intro">
        <h1>My requests</h1>
        <p className="lede">
          Requests posted from this browser. You can mark them answered when the time comes.
        </p>
      </header>
      <LocalList mode="owned" />
    </>
  );
}
