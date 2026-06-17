"use client";

import { motion } from "framer-motion";
import { ArrowDown, ArrowUp, Minus, Sparkles, TrendingUp } from "lucide-react";
import { FadeIn, SectionWrapper } from "@/components/shared/section-wrapper";
import { marketInsights } from "@/data/homepage";
import { cn, formatPercent } from "@/lib/utils";

function TrendIcon({ trend }: { trend: "up" | "down" | "stable" }) {
  if (trend === "up") return <ArrowUp className="h-3 w-3" />;
  if (trend === "down") return <ArrowDown className="h-3 w-3" />;
  return <Minus className="h-3 w-3" />;
}

function MiniChart() {
  const points = [30, 45, 38, 52, 48, 65, 58, 72, 68, 85, 78, 92];

  return (
    <div className="relative h-32 w-full">
      <svg viewBox="0 0 300 100" className="h-full w-full" preserveAspectRatio="none">
        <defs>
          <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(201,169,98,0.3)" />
            <stop offset="100%" stopColor="rgba(201,169,98,0)" />
          </linearGradient>
        </defs>
        <motion.path
          d={`M0,${100 - points[0]} ${points.map((p, i) => `L${(i / (points.length - 1)) * 300},${100 - p}`).join(" ")} L300,100 L0,100 Z`}
          fill="url(#chartGradient)"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1 }}
        />
        <motion.polyline
          points={points
            .map((p, i) => `${(i / (points.length - 1)) * 300},${100 - p}`)
            .join(" ")}
          fill="none"
          stroke="#c9a962"
          strokeWidth="2"
          initial={{ pathLength: 0 }}
          whileInView={{ pathLength: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1.5, ease: [0.21, 0.47, 0.32, 0.98] }}
        />
      </svg>
    </div>
  );
}

export function AIInsightsSection() {
  return (
    <SectionWrapper id="insights">
      <FadeIn>
        <div className="mb-16 max-w-2xl">
          <p className="text-xs font-medium uppercase tracking-widest text-accent">
            AI Market Insights
          </p>
          <h2 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">
            Mumbai market,
            <br />
            in real time
          </h2>
        </div>
      </FadeIn>

      <div className="grid gap-6 lg:grid-cols-12">
        <FadeIn className="lg:col-span-8">
          <div className="overflow-hidden rounded-3xl border border-border bg-white p-8">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <p className="text-sm text-muted">Price Trend — Mumbai</p>
                <p className="mt-1 text-3xl font-semibold tracking-tight">
                  ₹38,500 <span className="text-base font-normal text-muted">/ sq.ft</span>
                </p>
              </div>
              <div className="flex items-center gap-1 rounded-full bg-green-50 px-3 py-1 text-sm text-green-700">
                <TrendingUp className="h-3.5 w-3.5" />
                +4.2% YoY
              </div>
            </div>
            <MiniChart />
            <p className="mt-4 text-xs text-muted-foreground">
              Jan 2025 — Jun 2026 · AI-analyzed from 12,000+ transactions
            </p>
          </div>
        </FadeIn>

        <FadeIn delay={0.1} className="lg:col-span-4">
          <div className="flex h-full flex-col justify-between rounded-3xl bg-surface-dark p-8 text-white">
            <div>
              <Sparkles className="h-5 w-5 text-accent" />
              <p className="mt-4 text-sm text-white/50">AI Generated Insight</p>
              <p className="mt-2 text-lg leading-relaxed">
                South Mumbai luxury segment showing strongest momentum. Worli
                and Lower Parel leading with 12%+ appreciation driven by
                infrastructure completion.
              </p>
            </div>
            <p className="mt-6 text-xs text-white/30">
              Updated 2 hours ago
            </p>
          </div>
        </FadeIn>

        <div className="grid gap-4 sm:grid-cols-2 lg:col-span-12 lg:grid-cols-4">
          {marketInsights.map((insight, index) => (
            <FadeIn key={insight.id} delay={0.1 + index * 0.05}>
              <div className="rounded-3xl border border-border bg-white p-6 transition-shadow duration-300 hover:shadow-lg hover:shadow-black/5">
                <p className="text-sm text-muted">{insight.title}</p>
                <p className="mt-2 text-2xl font-semibold tracking-tight">
                  {insight.value}
                </p>
                <div
                  className={cn(
                    "mt-3 inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium",
                    insight.trend === "up" && "bg-green-50 text-green-700",
                    insight.trend === "down" && "bg-red-50 text-red-700",
                    insight.trend === "stable" && "bg-gray-50 text-gray-600"
                  )}
                >
                  <TrendIcon trend={insight.trend} />
                  {formatPercent(insight.change)}
                </div>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </SectionWrapper>
  );
}
