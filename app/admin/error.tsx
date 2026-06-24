"use client";

import Link from "next/link";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Admin]", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="max-w-lg rounded-3xl border border-border bg-white p-10 text-center">
        <h1 className="text-2xl font-semibold">Admin error</h1>
        <p className="mt-3 text-muted">
          Something went wrong in the admin panel. Please try again.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Button type="button" variant="accent" onClick={reset}>
            Try again
          </Button>
          <Button asChild variant="outline">
            <Link href="/admin/dashboard">Dashboard</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
