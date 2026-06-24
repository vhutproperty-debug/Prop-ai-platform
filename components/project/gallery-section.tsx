"use client";

import Image from "next/image";
import { useState } from "react";
import { SectionHeader } from "@/components/project/section-header";
import { cn } from "@/lib/utils";
import type { ProjectPageImage } from "@/types/project-page";

interface GallerySectionProps {
  gallery: ProjectPageImage[];
  projectName: string;
}

export function GallerySection({ gallery, projectName }: GallerySectionProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  if (!gallery.length) return null;

  const activeImage = gallery[activeIndex] ?? gallery[0];

  return (
    <section id="gallery" className="section-padding border-b border-border bg-card/40">
      <div className="container-premium">
        <SectionHeader
          eyebrow="Gallery"
          title="Project visuals"
          description={`Imagery and renders for ${projectName}.`}
        />

        <div className="mt-12 grid gap-6 lg:grid-cols-[minmax(0,1fr)_220px]">
          <div className="relative aspect-[16/10] overflow-hidden rounded-[2rem] border border-border bg-surface-dark">
            <Image
              src={activeImage.url}
              alt={activeImage.alt}
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 70vw"
              priority={activeIndex === 0}
            />
            {activeImage.caption ? (
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-6">
                <p className="text-sm text-white/90">{activeImage.caption}</p>
              </div>
            ) : null}
          </div>

          <div className="grid grid-cols-3 gap-3 lg:grid-cols-1">
            {gallery.map((image, index) => (
              <button
                key={image.id}
                type="button"
                onClick={() => setActiveIndex(index)}
                className={cn(
                  "relative aspect-[4/3] overflow-hidden rounded-2xl border transition-all",
                  index === activeIndex
                    ? "border-accent ring-2 ring-accent/30"
                    : "border-border hover:border-accent/40"
                )}
                aria-label={`View image ${index + 1}`}
                aria-pressed={index === activeIndex}
              >
                <Image
                  src={image.url}
                  alt={image.alt}
                  fill
                  className="object-cover"
                  sizes="120px"
                />
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
