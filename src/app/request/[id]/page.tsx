import type { Metadata } from "next";
import { cache } from "react";
import { notFound } from "next/navigation";
import { RequestDetail } from "@/components/RequestDetail";
import { getPrayer } from "@/lib/db";
import { displayName } from "@/lib/format";

export const dynamic = "force-dynamic";

const loadPrayer = cache((id: string) => getPrayer(id));

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ posted?: string; key?: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const prayer = loadPrayer(id);
  if (!prayer) return { title: "Request" };
  const name = displayName(prayer.name);
  return { title: name === "Anonymous" ? "Anonymous request" : `Request from ${name}` };
}

export default async function RequestPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const query = await searchParams;
  const prayer = loadPrayer(id);
  if (!prayer) notFound();

  return (
    <RequestDetail
      initialPrayer={prayer}
      justPosted={query.posted === "1"}
      keySaved={query.key !== "0"}
    />
  );
}
