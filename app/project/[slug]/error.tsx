"use client";

import Link from "next/link";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

interface ProjectErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ProjectError({ error, reset }: ProjectErrorProps) {
  useEffect(() => {
    console.error("[ProjectPage]", error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="max-w-lg rounded-[2rem] border border-border bg-card p-10 text-center">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-accent">
          Project page
        </p>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight">
          Something went wrong
        </h1>
        <p className="mt-4 text-muted">
          We could not load this project right now. Please try again or return
          to the homepage.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <Button type="button" variant="accent" onClick={reset}>
            Try again
          </Button>
          <Button asChild variant="outline">
            <Link href="/">Back to home</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
