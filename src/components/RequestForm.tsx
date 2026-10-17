"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CATEGORIES } from "@/lib/categories";
import type { Prayer } from "@/lib/types";
import { validateNewRequest } from "@/lib/validate";
import { useBrowserStore } from "@/components/BrowserStore";

export function RequestForm() {
  const router = useRouter();
  const { rememberOwned } = useBrowserStore();
  const nameRef = useRef<HTMLInputElement>(null);
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const categoryRef = useRef<HTMLSelectElement>(null);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [body, setBody] = useState("");
  const [company, setCompany] = useState("");
  const [pending, setPending] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [field, setField] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = validateNewRequest({
      name,
      body,
      category,
      company_website: company,
    });
    if (!parsed.ok) {
      setFormError(parsed.field ? null : parsed.error);
      setFieldError(parsed.field ? parsed.error : null);
      setField(parsed.field ?? null);
      if (parsed.field === "name") nameRef.current?.focus();
      if (parsed.field === "body") bodyRef.current?.focus();
      if (parsed.field === "category") categoryRef.current?.focus();
      return;
    }

    setPending(true);
    setFormError(null);
    setFieldError(null);
    setField(null);
    try {
      const response = await fetch("/api/requests", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: parsed.value.name,
          body: parsed.value.body,
          category: parsed.value.category,
          company_website: company,
        }),
      });
      const data = (await response.json().catch(() => null)) as {
        error?: string;
        field?: string;
        request?: Prayer;
        ownerToken?: string;
      } | null;
      if (!response.ok || !data?.request || !data.ownerToken) {
        setField(data?.field ?? null);
        if (data?.field) setFieldError(data.error ?? "Could not post that request.");
        else setFormError(data?.error ?? "Could not post that request.");
        return;
      }
      const saved = rememberOwned(data.request.id, data.ownerToken);
      router.push(`/request/${data.request.id}?posted=1${saved ? "" : "&key=0"}`);
    } catch {
      setFormError("Could not post that request. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="form" onSubmit={onSubmit} noValidate>
      {formError ? (
        <p className="form-error" role="alert">
          {formError}
        </p>
      ) : null}
      <div className="field">
        <label htmlFor="name">
          Name <span className="optional">(optional)</span>
        </label>
        <input
          ref={nameRef}
          id="name"
          name="name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          maxLength={60}
          autoComplete="off"
          aria-invalid={field === "name"}
          aria-describedby="name-help"
        />
        <p id="name-help" className="hint">
          Leave this blank to post anonymously.
        </p>
        {field === "name" && fieldError ? (
          <p className="form-error" role="alert">
            {fieldError}
          </p>
        ) : null}
      </div>
      <div className="field">
        <label htmlFor="category">
          Category <span className="optional">(optional)</span>
        </label>
        <select
          ref={categoryRef}
          id="category"
          name="category"
          value={category}
          onChange={(event) => setCategory(event.target.value)}
          aria-invalid={field === "category"}
        >
          <option value="">No category</option>
          {CATEGORIES.map((item) => (
            <option key={item.id} value={item.id}>
              {item.label}
            </option>
          ))}
        </select>
        {field === "category" && fieldError ? (
          <p className="form-error" role="alert">
            {fieldError}
          </p>
        ) : null}
      </div>
      <div className="field">
        <label htmlFor="body">Request</label>
        <textarea
          ref={bodyRef}
          id="body"
          name="body"
          value={body}
          onChange={(event) => setBody(event.target.value)}
          required
          maxLength={2000}
          rows={7}
          aria-invalid={field === "body"}
          aria-describedby="body-help"
        />
        <p id="body-help" className="hint">
          At least 10 characters. Anyone who opens this app can read it. {body.length} / 2000
        </p>
        {field === "body" && fieldError ? (
          <p className="form-error" role="alert">
            {fieldError}
          </p>
        ) : null}
      </div>
      <div className="hp" aria-hidden="true">
        <label htmlFor="company_website">Company website</label>
        <input
          id="company_website"
          name="company_website"
          value={company}
          onChange={(event) => setCompany(event.target.value)}
          tabIndex={-1}
          autoComplete="off"
        />
      </div>
      <button className="btn btn-primary" type="submit" disabled={pending}>
        {pending ? "Posting…" : "Post request"}
      </button>
      <p className="hint">
        No account is needed. This browser keeps a private key so you can mark the request
        answered later.
      </p>
    </form>
  );
}
