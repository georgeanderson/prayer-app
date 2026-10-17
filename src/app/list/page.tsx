import type { Metadata } from "next";
import { LocalList } from "@/components/LocalList";

export const metadata: Metadata = {
  title: "My prayer list",
};

export default function PrayerListPage() {
  return (
    <>
      <header className="page-intro">
        <h1>My prayer list</h1>
        <p className="lede">Requests you saved on this device, so you can come back to them.</p>
      </header>
      <LocalList mode="saved" />
    </>
  );
}
