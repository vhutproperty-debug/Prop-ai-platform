"use client";

import { motion } from "framer-motion";
import { FadeIn, SectionWrapper } from "@/components/shared/section-wrapper";
import { whyPropAI } from "@/data/homepage";

export function WhyPropAISection() {
  return (
    <SectionWrapper dark>
      <FadeIn>
        <div className="mb-16 mx-auto max-w-2xl text-center">
          <p className="text-xs font-medium uppercase tracking-widest text-accent">
            Why Prop AI
          </p>
          <h2 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">
            Not a portal.
            <br />A platform.
          </h2>
        </div>
      </FadeIn>

      <div className="grid gap-px overflow-hidden rounded-3xl border border-white/10 bg-white/10 md:grid-cols-2">
        {whyPropAI.map((item, index) => (
          <FadeIn key={item.id} delay={index * 0.1}>
            <motion.div
              whileHover={{ backgroundColor: "rgba(255,255,255,0.04)" }}
              className="bg-surface-dark p-8 sm:p-12"
            >
              <span className="text-sm font-medium text-accent">
                0{index + 1}
              </span>
              <h3 className="mt-4 text-2xl font-semibold tracking-tight">
                {item.title}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-white/50">
                {item.description}
              </p>
            </motion.div>
          </FadeIn>
        ))}
      </div>
    </SectionWrapper>
  );
}
