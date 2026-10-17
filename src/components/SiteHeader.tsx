"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Requests" },
  { href: "/list", label: "My list" },
  { href: "/mine", label: "My requests" },
];

function isCurrent(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="site-header">
      <div className="shell header-inner">
        <Link className="brand" href="/">
          <svg className="mark" viewBox="0 0 32 32" width="32" height="32" aria-hidden="true">
            <rect width="32" height="32" rx="8" fill="currentColor" />
            <path fill="var(--on-sage)" d="M9 8h3.2v6.2h7.6V8H23v16h-3.2v-6.6h-7.6V24H9V8z" />
          </svg>
          Hearth
        </Link>
        <nav className="nav" aria-label="Primary">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={isCurrent(pathname, link.href) ? "page" : undefined}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <Link className="btn btn-primary header-cta" href="/new">
          New request
        </Link>
      </div>
    </header>
  );
}
