import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { localities } from "@/data/homepage";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return localities.map((locality) => ({ slug: locality.slug }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const locality = localities.find((l) => l.slug === slug);
  if (!locality) return { title: "Locality Not Found" };

  return {
    title: `${locality.name} — Locality Intelligence`,
    description: locality.aiRecommendation,
  };
}

export default async function LocalityPage({ params }: PageProps) {
  const { slug } = await params;
  const locality = localities.find((l) => l.slug === slug);

  if (!locality) notFound();

  const scores = [
    { label: "Investment Score", value: locality.investmentScore },
    { label: "Rental Score", value: locality.rentalScore },
    { label: "Growth Score", value: locality.growthScore },
    { label: "Walkability", value: locality.walkability },
    { label: "Connectivity", value: locality.connectivity },
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="container-premium flex h-20 items-center">
          <Link href="/" className="text-xl font-semibold tracking-tight">
            Prop<span className="text-accent">AI</span>
          </Link>
        </div>
      </header>

      <main>
        <div className="relative aspect-[21/9] overflow-hidden">
          <Image
            src={locality.image}
            alt={locality.name}
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-8 left-8">
            <h1 className="text-4xl font-semibold text-white sm:text-5xl">
              {locality.name}
            </h1>
            <p className="mt-2 text-white/70">
              ₹{locality.avgPricePerSqft.toLocaleString("en-IN")} / sq.ft avg.
            </p>
          </div>
        </div>

        <div className="container-premium py-16">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {scores.map((score) => (
              <div
                key={score.label}
                className="rounded-3xl border border-border p-6"
              >
                <p className="text-sm text-muted">{score.label}</p>
                <p className="mt-2 text-3xl font-semibold">{score.value}</p>
              </div>
            ))}
          </div>

          <div className="mt-12 rounded-3xl bg-accent-muted p-8">
            <p className="text-sm font-medium text-accent">AI Recommendation</p>
            <p className="mt-3 text-lg leading-relaxed">
              {locality.aiRecommendation}
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
