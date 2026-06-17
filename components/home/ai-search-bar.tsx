"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowUp, ImageIcon, Mic, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { searchSuggestions } from "@/data/homepage";
import { cn } from "@/lib/utils";

interface AISearchBarProps {
  variant?: "hero" | "section";
}

export function AISearchBar({ variant = "section" }: AISearchBarProps) {
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const [suggestionIndex, setSuggestionIndex] = useState(0);
  const [displayText, setDisplayText] = useState("");

  useEffect(() => {
    if (focused || query) return;

    const suggestion = searchSuggestions[suggestionIndex];
    let charIndex = 0;

    const typeInterval = setInterval(() => {
      if (charIndex <= suggestion.text.length) {
        setDisplayText(suggestion.text.slice(0, charIndex));
        charIndex++;
      } else {
        clearInterval(typeInterval);
        setTimeout(() => {
          setSuggestionIndex((prev) => (prev + 1) % searchSuggestions.length);
        }, 2500);
      }
    }, 40);

    return () => clearInterval(typeInterval);
  }, [suggestionIndex, focused, query]);

  const isHero = variant === "hero";

  return (
    <div className="relative w-full">
      <div
        className={cn(
          "relative overflow-hidden rounded-3xl border transition-all duration-500",
          focused
            ? "border-accent/30 shadow-2xl shadow-accent/10"
            : "border-border shadow-xl shadow-black/5",
          isHero ? "bg-white/90 backdrop-blur-xl" : "bg-white"
        )}
      >
        <div className="flex items-center gap-3 px-5 py-4">
          <Sparkles className="h-5 w-5 shrink-0 text-accent" />
          <div className="relative flex-1">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => setTimeout(() => setFocused(false), 200)}
              placeholder={focused ? "Describe your ideal property..." : ""}
              className="w-full bg-transparent text-base text-foreground placeholder:text-muted-foreground focus:outline-none"
              aria-label="AI property search"
            />
            {!focused && !query && (
              <span className="pointer-events-none absolute inset-0 flex items-center text-base text-muted-foreground">
                {displayText}
                <motion.span
                  animate={{ opacity: [1, 0] }}
                  transition={{ duration: 0.8, repeat: Infinity }}
                  className="ml-0.5 inline-block h-5 w-0.5 bg-accent"
                />
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="hidden rounded-full p-2 text-muted-foreground transition-colors hover:bg-foreground/5 hover:text-foreground sm:block"
              aria-label="Voice search"
            >
              <Mic className="h-4 w-4" />
            </button>
            <button
              type="button"
              className="hidden rounded-full p-2 text-muted-foreground transition-colors hover:bg-foreground/5 hover:text-foreground sm:block"
              aria-label="Image search"
            >
              <ImageIcon className="h-4 w-4" />
            </button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              type="button"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-foreground text-background transition-colors hover:bg-foreground/90"
              aria-label="Search"
            >
              <ArrowUp className="h-4 w-4" />
            </motion.button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {focused && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="absolute left-0 right-0 top-full z-20 mt-3 overflow-hidden rounded-2xl border border-border bg-white shadow-2xl shadow-black/10"
          >
            <div className="p-2">
              {searchSuggestions.map((suggestion, index) => (
                <motion.button
                  key={suggestion.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  type="button"
                  onMouseDown={() => setQuery(suggestion.text)}
                  className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left transition-colors hover:bg-foreground/5"
                >
                  <Sparkles className="h-4 w-4 shrink-0 text-accent" />
                  <div>
                    <p className="text-sm text-foreground">{suggestion.text}</p>
                    <p className="text-xs text-muted-foreground">
                      {suggestion.category}
                    </p>
                  </div>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function AISearchSection() {
  return (
    <section id="search" className="section-padding bg-white">
      <div className="container-premium">
        <div className="mx-auto max-w-4xl text-center">
          <p className="text-xs font-medium uppercase tracking-widest text-accent">
            AI Search
          </p>
          <h2 className="mt-4 text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
            Search like you think
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-muted">
            No filters. No forms. Just describe what you&apos;re looking for in
            plain language.
          </p>
          <div className="mt-12">
            <AISearchBar variant="section" />
          </div>
        </div>
      </div>
    </section>
  );
}
