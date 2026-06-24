"use client";

import { useState } from "react";
import { SectionHeader } from "@/components/project/section-header";
import { cn } from "@/lib/utils";
import type { ProjectPageFaq } from "@/types/project-page";

interface FaqSectionProps {
  faqs: ProjectPageFaq[];
}

export function FaqSection({ faqs }: FaqSectionProps) {
  const [openId, setOpenId] = useState<string | null>(faqs[0]?.id ?? null);

  if (!faqs.length) return null;

  return (
    <section id="faqs" className="section-padding border-b border-border bg-card/40">
      <div className="container-premium">
        <SectionHeader
          eyebrow="FAQs"
          title="Frequently asked questions"
          description="Answers to common buyer questions about this project."
        />

        <div className="mt-12 divide-y divide-border rounded-[2rem] border border-border bg-card">
          {faqs.map((faq) => {
            const isOpen = openId === faq.id;

            return (
              <div key={faq.id}>
                <button
                  type="button"
                  className="flex w-full items-start justify-between gap-4 px-6 py-5 text-left"
                  onClick={() => setOpenId(isOpen ? null : faq.id)}
                  aria-expanded={isOpen}
                >
                  <span className="text-lg font-medium">{faq.question}</span>
                  <span
                    className={cn(
                      "mt-1 text-accent transition-transform",
                      isOpen && "rotate-45"
                    )}
                    aria-hidden
                  >
                    +
                  </span>
                </button>
                {isOpen ? (
                  <div className="px-6 pb-5 text-muted leading-relaxed">
                    {faq.answer}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
