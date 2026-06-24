import type { ProjectPageFaq } from "@/types/project-page";

export function buildFaqPageSchema(
  faqs: ProjectPageFaq[],
  projectName: string
) {
  if (!faqs.length) return null;

  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    name: `${projectName} — Frequently Asked Questions`,
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
}
