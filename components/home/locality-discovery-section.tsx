"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import { FadeIn, SectionWrapper } from "@/components/shared/section-wrapper";
import { localities } from "@/data/homepage";

function ScoreBar({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="text-white/50">{label}</span>
        <span className="font-medium text-white/80">{value}</span>
      </div>
      <div className="h-1 overflow-hidden rounded-full bg-white/10">
        <motion.div
          initial={{ width: 0 }}
          whileInView={{ width: `${value}%` }}
          viewport={{ once: true }}
          transition={{ duration: 1, delay: 0.2, ease: [0.21, 0.47, 0.32, 0.98] }}
          className="h-full rounded-full bg-accent"
        />
      </div>
    </div>
  );
}

export function LocalityDiscoverySection() {
  return (
    <SectionWrapper id="localities" dark>
      <FadeIn>
        <div className="mb-16 max-w-2xl">
          <p className="text-xs font-medium uppercase tracking-widest text-accent">
            Locality Explorer
          </p>
          <h2 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">
            Every neighbourhood,
            <br />
            decoded by AI
          </h2>
        </div>
      </FadeIn>

      <div className="grid gap-6 md:grid-cols-2">
        {localities.map((locality, index) => (
          <FadeIn key={locality.id} delay={index * 0.1}>
            <Link href={`/localities/${locality.slug}`} className="group block">
              <motion.article
                whileHover={{ y: -4 }}
                transition={{ duration: 0.4 }}
                className="overflow-hidden rounded-3xl border border-white/10 bg-surface-elevated"
              >
                <div className="relative aspect-[16/9] overflow-hidden">
                  <Image
                    src={locality.image}
                    alt={locality.name}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-surface-dark via-surface-dark/40 to-transparent" />
                  <div className="absolute bottom-4 left-6">
                    <h3 className="text-2xl font-semibold">{locality.name}</h3>
                    <p className="text-sm text-white/50">
                      ₹{locality.avgPricePerSqft.toLocaleString("en-IN")} / sq.ft
                    </p>
                  </div>
                </div>

                <div className="space-y-3 p-6">
                  <ScoreBar label="Investment" value={locality.investmentScore} />
                  <ScoreBar label="Rental" value={locality.rentalScore} />
                  <ScoreBar label="Growth" value={locality.growthScore} />
                  <ScoreBar label="Walkability" value={locality.walkability} />
                  <ScoreBar label="Connectivity" value={locality.connectivity} />

                  <div className="mt-4 flex items-start gap-2 rounded-2xl bg-accent-muted p-4">
                    <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                    <p className="text-sm leading-relaxed text-white/70">
                      {locality.aiRecommendation}
                    </p>
                  </div>
                </div>
              </motion.article>
            </Link>
          </FadeIn>
        ))}
      </div>
    </SectionWrapper>
  );
}
