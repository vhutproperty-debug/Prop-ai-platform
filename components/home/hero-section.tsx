"use client";

import { motion } from "framer-motion";
import { Camera, Mic, Sparkles } from "lucide-react";
import { AISearchBar } from "@/components/home/ai-search-bar";
import { Badge } from "@/components/ui/badge";

export function HeroSection() {
  return (
    <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background pt-20">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(201,169,98,0.06)_0%,transparent_60%)]" />
        <div className="absolute -top-1/2 left-1/2 h-[800px] w-[800px] -translate-x-1/2 rounded-full bg-accent/5 blur-3xl" />
        <motion.div
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent/20 to-transparent"
        />
      </div>

      <div className="container-premium relative z-10 flex flex-col items-center text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <Badge variant="accent" className="mb-8 px-4 py-1.5 text-xs tracking-wide">
            <Sparkles className="mr-1.5 inline h-3 w-3" />
            AI-First Real Estate for Mumbai
          </Badge>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="text-balance max-w-5xl text-5xl font-semibold leading-[1.05] tracking-tight sm:text-6xl md:text-7xl lg:text-8xl"
        >
          Find your next
          <br />
          <span className="bg-gradient-to-r from-foreground via-foreground to-accent bg-clip-text text-transparent">
            Mumbai address
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="mt-6 max-w-xl text-lg text-muted sm:text-xl"
        >
          Ask anything. Compare everything. Invest with intelligence.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="mt-12 w-full max-w-3xl"
        >
          <AISearchBar variant="hero" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 1.2 }}
          className="mt-6 flex items-center gap-6 text-muted-foreground"
        >
          <button
            type="button"
            className="flex items-center gap-2 text-sm transition-colors hover:text-foreground"
            aria-label="Voice search"
          >
            <Mic className="h-4 w-4" />
            Voice
          </button>
          <span className="h-4 w-px bg-border" />
          <button
            type="button"
            className="flex items-center gap-2 text-sm transition-colors hover:text-foreground"
            aria-label="Image search"
          >
            <Camera className="h-4 w-4" />
            Image
          </button>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 1 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="flex flex-col items-center gap-2"
        >
          <span className="text-xs tracking-widest text-muted-foreground uppercase">
            Scroll
          </span>
          <div className="h-8 w-px bg-gradient-to-b from-muted-foreground/50 to-transparent" />
        </motion.div>
      </motion.div>
    </section>
  );
}
