"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { FadeIn, SectionWrapper } from "@/components/shared/section-wrapper";
import { Badge } from "@/components/ui/badge";
import { featuredProjects } from "@/data/homepage";
import { formatPrice } from "@/lib/utils";

export function FeaturedProjectsSection() {
  return (
    <SectionWrapper id="projects">
      <FadeIn>
        <div className="mb-16 flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
          <div>
            <p className="text-xs font-medium uppercase tracking-widest text-accent">
              Featured Projects
            </p>
            <h2 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">
              Mumbai&apos;s finest
            </h2>
          </div>
          <Link
            href="#"
            className="group flex items-center gap-2 text-sm text-muted transition-colors hover:text-foreground"
          >
            View all projects
            <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </Link>
        </div>
      </FadeIn>

      <div className="grid gap-6 lg:grid-cols-12">
        {featuredProjects.map((project, index) => {
          const isLarge = index === 0 || index === 3;

          return (
            <FadeIn
              key={project.id}
              delay={index * 0.1}
              className={isLarge ? "lg:col-span-7" : "lg:col-span-5"}
            >
              <Link href={`/projects/${project.slug}`} className="group block">
                <motion.article
                  whileHover={{ y: -4 }}
                  transition={{ duration: 0.4, ease: [0.21, 0.47, 0.32, 0.98] }}
                  className="relative overflow-hidden rounded-3xl bg-foreground/5"
                >
                  <div
                    className={`relative overflow-hidden ${isLarge ? "aspect-[16/10]" : "aspect-[4/3]"}`}
                  >
                    <Image
                      src={project.image}
                      alt={project.name}
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                      sizes="(max-width: 768px) 100vw, 50vw"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                  </div>

                  <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8">
                    <div className="flex items-center gap-2">
                      <Badge variant="dark">{project.builder}</Badge>
                      <Badge variant="dark">{project.status}</Badge>
                    </div>
                    <h3 className="mt-3 text-2xl font-semibold text-white sm:text-3xl">
                      {project.name}
                    </h3>
                    <p className="mt-1 text-sm text-white/70">
                      {project.locality} · {project.configuration}
                    </p>
                    <p className="mt-3 text-sm font-medium text-accent">
                      From {formatPrice(project.priceFrom)}
                    </p>
                  </div>

                  <div className="absolute right-6 top-6 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 opacity-0 backdrop-blur-sm transition-all duration-300 group-hover:opacity-100">
                    <ArrowUpRight className="h-4 w-4 text-white" />
                  </div>
                </motion.article>
              </Link>
            </FadeIn>
          );
        })}
      </div>
    </SectionWrapper>
  );
}
