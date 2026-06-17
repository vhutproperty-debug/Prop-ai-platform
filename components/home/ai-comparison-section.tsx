"use client";

import { motion } from "framer-motion";
import { BarChart3, Map, Shield, TrendingUp } from "lucide-react";
import { FadeIn, SectionWrapper } from "@/components/shared/section-wrapper";
import { comparisonFeatures } from "@/data/homepage";

const iconMap = {
  compare: BarChart3,
  map: Map,
  trending: TrendingUp,
  shield: Shield,
};

export function AIComparisonSection() {
  return (
    <SectionWrapper dark>
      <FadeIn>
        <div className="mb-16 mx-auto max-w-2xl text-center">
          <p className="text-xs font-medium uppercase tracking-widest text-accent">
            AI Comparison
          </p>
          <h2 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">
            Decisions, not guesswork
          </h2>
          <p className="mt-4 text-white/50">
            Compare properties, localities, and builders with AI-powered
            intelligence across 50+ data points.
          </p>
        </div>
      </FadeIn>

      <div className="grid gap-6 sm:grid-cols-2">
        {comparisonFeatures.map((feature, index) => {
          const Icon = iconMap[feature.icon as keyof typeof iconMap];

          return (
            <FadeIn key={feature.id} delay={index * 0.1}>
              <motion.div
                whileHover={{ y: -4 }}
                transition={{ duration: 0.3 }}
                className="group rounded-3xl border border-white/10 bg-surface-elevated p-8 transition-colors hover:border-accent/20"
              >
                <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-muted transition-colors group-hover:bg-accent/20">
                  <Icon className="h-5 w-5 text-accent" />
                </div>
                <h3 className="text-xl font-semibold">{feature.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-white/50">
                  {feature.description}
                </p>
              </motion.div>
            </FadeIn>
          );
        })}
      </div>
    </SectionWrapper>
  );
}
