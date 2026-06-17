"use client";

import { motion } from "framer-motion";
import { ArrowUpRight, Sparkles } from "lucide-react";
import { FadeIn, SectionWrapper } from "@/components/shared/section-wrapper";
import { investmentMetrics } from "@/data/homepage";

export function InvestmentIntelligenceSection() {
  return (
    <SectionWrapper className="champagne-glow">
      <FadeIn>
        <div className="mb-16 max-w-2xl">
          <p className="text-xs font-medium uppercase tracking-widest text-accent">
            Investment Intelligence
          </p>
          <h2 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">
            Invest with
            <br />
            institutional clarity
          </h2>
        </div>
      </FadeIn>

      <div className="grid gap-6 lg:grid-cols-2">
        {investmentMetrics.map((metric, index) => (
          <FadeIn key={metric.id} delay={index * 0.1}>
            <motion.div
              whileHover={{ y: -2 }}
              className="group flex items-start justify-between rounded-3xl border border-border bg-white p-8 transition-all duration-300 hover:shadow-xl hover:shadow-black/5"
            >
              <div>
                <p className="text-sm text-muted">{metric.label}</p>
                <p className="mt-2 text-2xl font-semibold tracking-tight">
                  {metric.value}
                </p>
                <div className="mt-4 flex items-start gap-2">
                  <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                  <p className="text-sm text-muted">{metric.insight}</p>
                </div>
              </div>
              <ArrowUpRight className="h-5 w-5 text-muted-foreground opacity-0 transition-all group-hover:opacity-100 group-hover:text-accent" />
            </motion.div>
          </FadeIn>
        ))}
      </div>
    </SectionWrapper>
  );
}
