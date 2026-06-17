import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { builders } from "@/data/homepage";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return builders.map((builder) => ({ slug: builder.slug }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const builder = builders.find((b) => b.slug === slug);
  if (!builder) return { title: "Builder Not Found" };

  return {
    title: `${builder.name} — Builder Profile`,
    description: builder.tagline,
  };
}

export default async function BuilderPage({ params }: PageProps) {
  const { slug } = await params;
  const builder = builders.find((b) => b.slug === slug);

  if (!builder) notFound();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="container-premium flex h-20 items-center">
          <Link href="/" className="text-xl font-semibold tracking-tight">
            Prop<span className="text-accent">AI</span>
          </Link>
        </div>
      </header>

      <main className="container-premium py-16">
        <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-surface-dark text-3xl font-semibold text-accent">
          {builder.logo}
        </div>
        <h1 className="mt-8 text-4xl font-semibold tracking-tight sm:text-5xl">
          {builder.name}
        </h1>
        <p className="mt-4 text-lg text-muted">{builder.tagline}</p>

        <div className="mt-12 flex flex-wrap gap-12 border-t border-border pt-12">
          <div>
            <p className="text-3xl font-semibold">{builder.projectCount}</p>
            <p className="text-sm text-muted">Projects in Mumbai</p>
          </div>
          <div>
            <p className="text-3xl font-semibold">{builder.established}</p>
            <p className="text-sm text-muted">Established</p>
          </div>
          <div>
            <p className="text-3xl font-semibold">{builder.rating}</p>
            <p className="text-sm text-muted">Rating</p>
          </div>
        </div>
      </main>
    </div>
  );
}
