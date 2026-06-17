"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { FadeIn } from "@/components/shared/section-wrapper";
import { Button } from "@/components/ui/button";

export function CTASection() {
  return (
    <section className="relative overflow-hidden bg-surface-dark py-32 sm:py-40">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(201,169,98,0.1)_0%,transparent_70%)]" />
      </div>

      <div className="container-premium relative z-10 text-center">
        <FadeIn>
          <h2 className="text-balance mx-auto max-w-3xl text-4xl font-semibold tracking-tight text-white sm:text-5xl md:text-6xl lg:text-7xl">
            The future of Mumbai real estate starts here
          </h2>
        </FadeIn>

        <FadeIn delay={0.2}>
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="mt-12 inline-block"
          >
            <Button variant="accent" size="lg" className="gap-3 px-10 text-base">
              Start Exploring with AI
              <ArrowRight className="h-4 w-4" />
            </Button>
          </motion.div>
        </FadeIn>
      </div>
    </section>
  );
}
