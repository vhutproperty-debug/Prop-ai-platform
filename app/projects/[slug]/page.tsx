import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { featuredProjects } from "@/data/homepage";
import { formatPrice } from "@/lib/utils";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return featuredProjects.map((project) => ({ slug: project.slug }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const project = featuredProjects.find((p) => p.slug === slug);
  if (!project) return { title: "Project Not Found" };

  return {
    title: `${project.name} — ${project.locality}`,
    description: project.tagline,
  };
}

export default async function ProjectPage({ params }: PageProps) {
  const { slug } = await params;
  const project = featuredProjects.find((p) => p.slug === slug);

  if (!project) notFound();

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
            src={project.image}
            alt={project.name}
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        </div>

        <div className="container-premium py-16">
          <p className="text-sm text-accent">{project.builder}</p>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight sm:text-5xl">
            {project.name}
          </h1>
          <p className="mt-4 text-lg text-muted">{project.tagline}</p>

          <div className="mt-8 flex flex-wrap gap-8 border-t border-border pt-8">
            <div>
              <p className="text-sm text-muted">Location</p>
              <p className="mt-1 font-medium">{project.locality}</p>
            </div>
            <div>
              <p className="text-sm text-muted">Configuration</p>
              <p className="mt-1 font-medium">{project.configuration}</p>
            </div>
            <div>
              <p className="text-sm text-muted">Price Range</p>
              <p className="mt-1 font-medium">
                {formatPrice(project.priceFrom)} — {formatPrice(project.priceTo)}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted">Status</p>
              <p className="mt-1 font-medium capitalize">{project.status}</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
