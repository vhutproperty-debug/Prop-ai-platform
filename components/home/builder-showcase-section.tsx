"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";
import { FadeIn, SectionWrapper } from "@/components/shared/section-wrapper";
import { builders } from "@/data/homepage";

export function BuilderShowcaseSection() {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % builders.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const activeBuilder = builders[activeIndex];

  return (
    <SectionWrapper id="builders" className="bg-white">
      <FadeIn>
        <div className="mb-16 flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
          <div>
            <p className="text-xs font-medium uppercase tracking-widest text-accent">
              Builder Showcase
            </p>
            <h2 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">
              Trusted by the best
            </h2>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() =>
                setActiveIndex(
                  (prev) => (prev - 1 + builders.length) % builders.length
                )
              }
              className="flex h-10 w-10 items-center justify-center rounded-full border border-border transition-colors hover:bg-foreground/5"
              aria-label="Previous builder"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() =>
                setActiveIndex((prev) => (prev + 1) % builders.length)
              }
              className="flex h-10 w-10 items-center justify-center rounded-full border border-border transition-colors hover:bg-foreground/5"
              aria-label="Next builder"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </FadeIn>

      <FadeIn delay={0.1}>
        <div className="relative overflow-hidden rounded-3xl bg-surface-dark p-8 sm:p-12 lg:p-16">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_right,rgba(201,169,98,0.08)_0%,transparent_60%)]" />

          <div className="relative grid items-center gap-12 lg:grid-cols-2">
            <motion.div
              key={activeBuilder.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-white/10 text-3xl font-semibold text-accent backdrop-blur-sm">
                {activeBuilder.logo}
              </div>
              <h3 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                {activeBuilder.name}
              </h3>
              <p className="mt-3 text-lg text-white/50">{activeBuilder.tagline}</p>

              <div className="mt-8 flex flex-wrap gap-8">
                <div>
                  <p className="text-3xl font-semibold text-white">
                    {activeBuilder.projectCount}
                  </p>
                  <p className="text-sm text-white/40">Projects in Mumbai</p>
                </div>
                <div>
                  <p className="text-3xl font-semibold text-white">
                    {activeBuilder.established}
                  </p>
                  <p className="text-sm text-white/40">Est.</p>
                </div>
                <div>
                  <p className="flex items-center gap-1 text-3xl font-semibold text-white">
                    {activeBuilder.rating}
                    <Star className="h-5 w-5 fill-accent text-accent" />
                  </p>
                  <p className="text-sm text-white/40">Rating</p>
                </div>
              </div>

              <Link
                href={`/builders/${activeBuilder.slug}`}
                className="mt-8 inline-flex items-center text-sm text-accent transition-colors hover:text-accent/80"
              >
                Explore {activeBuilder.name} projects →
              </Link>
            </motion.div>

            <div className="flex flex-wrap gap-3">
              {builders.map((builder, index) => (
                <button
                  key={builder.id}
                  type="button"
                  onClick={() => setActiveIndex(index)}
                  className={`flex h-16 w-16 items-center justify-center rounded-2xl text-lg font-semibold transition-all duration-300 ${
                    index === activeIndex
                      ? "bg-accent text-surface-dark scale-110"
                      : "bg-white/5 text-white/40 hover:bg-white/10 hover:text-white/70"
                  }`}
                  aria-label={`View ${builder.name}`}
                >
                  {builder.logo}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-8 flex justify-center gap-1.5">
            {builders.map((_, index) => (
              <button
                key={index}
                type="button"
                onClick={() => setActiveIndex(index)}
                className={`h-1 rounded-full transition-all duration-300 ${
                  index === activeIndex
                    ? "w-8 bg-accent"
                    : "w-4 bg-white/20 hover:bg-white/40"
                }`}
                aria-label={`Go to builder ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </FadeIn>
    </SectionWrapper>
  );
}
