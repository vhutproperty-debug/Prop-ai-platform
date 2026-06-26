"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navLinks = [
  { label: "Search", href: "#search" },
  { label: "Projects", href: "#projects" },
  { label: "Localities", href: "#localities" },
  { label: "Insights", href: "#insights" },
];

export function SiteHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [menuOpen]);

  return (
    <>
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.21, 0.47, 0.32, 0.98] }}
        className={cn(
          "fixed inset-x-0 top-0 z-50 transition-all duration-500",
          scrolled || menuOpen
            ? "border-b border-border bg-white/90 shadow-sm backdrop-blur-xl"
            : "bg-transparent"
        )}
      >
        <div className="container-premium flex h-16 items-center justify-between sm:h-20">
          <Link href="/" className="group flex items-center gap-2">
            <span className="text-lg font-semibold tracking-tight sm:text-xl">
              Prop<span className="text-accent">AI</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-8 md:flex">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm text-muted transition-colors duration-300 hover:text-foreground"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <Button variant="ghost" size="sm" className="hidden sm:inline-flex">
              Sign In
            </Button>
            <Button variant="default" size="sm" className="hidden sm:inline-flex">
              Get Started
            </Button>
            <button
              type="button"
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-border md:hidden"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              onClick={() => setMenuOpen((open) => !open)}
            >
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </motion.header>

      {menuOpen ? (
        <div className="fixed inset-0 z-40 bg-white pt-16 md:hidden">
          <nav className="container-premium flex flex-col gap-2 py-6">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="rounded-2xl px-4 py-4 text-lg font-medium hover:bg-foreground/5"
              >
                {link.label}
              </Link>
            ))}
            <div className="mt-4 flex flex-col gap-3 border-t border-border pt-6">
              <Button variant="ghost" className="w-full justify-center">
                Sign In
              </Button>
              <Button variant="default" className="w-full justify-center">
                Get Started
              </Button>
            </div>
          </nav>
        </div>
      ) : null}
    </>
  );
}
