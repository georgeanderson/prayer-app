import type { Metadata } from "next";
import { RequestForm } from "@/components/RequestForm";

export const metadata: Metadata = {
  title: "Share a request",
};

export default function NewRequestPage() {
  return (
    <>
      <header className="page-intro">
        <h1>Share a request</h1>
        <p className="lede">
          Your name is optional. What you write is visible to anyone using this app.
        </p>
      </header>
      <RequestForm />
    </>
  );
}
