"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";

const SECTION_LINKS = [
  { href: "#overview", label: "Overview" },
  { href: "#configurations", label: "Configurations" },
  { href: "#amenities", label: "Amenities" },
  { href: "#gallery", label: "Gallery" },
  { href: "#enquire", label: "Enquire" },
];

export function ProjectPageHeader() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-border/80 bg-background/90 backdrop-blur-xl">
        <div className="container-premium flex h-14 items-center justify-between sm:h-16">
          <Link href="/" className="text-lg font-semibold tracking-tight">
            Prop<span className="text-accent">AI</span>
          </Link>

          <nav className="hidden items-center gap-6 text-sm text-muted md:flex">
            {SECTION_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="transition-colors hover:text-foreground"
              >
                {link.label}
              </a>
            ))}
          </nav>

          <button
            type="button"
            className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-border md:hidden"
            aria-label={open ? "Close section menu" : "Open section menu"}
            onClick={() => setOpen((value) => !value)}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {open ? (
          <nav className="border-t border-border px-4 py-3 md:hidden">
            <div className="flex flex-col gap-1">
              {SECTION_LINKS.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="rounded-xl px-3 py-3 text-sm font-medium hover:bg-foreground/5"
                >
                  {link.label}
                </a>
              ))}
            </div>
          </nav>
        ) : null}
      </header>
    </>
  );
}
