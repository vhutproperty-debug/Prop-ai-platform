export default function ProjectLoading() {
  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur-xl">
        <div className="container-premium flex h-16 items-center">
          <div className="h-5 w-24 animate-pulse rounded-full bg-foreground/10" />
        </div>
      </div>

      <div className="relative h-[420px] animate-pulse bg-surface-dark/80 sm:h-[520px]" />

      <div className="container-premium space-y-16 py-16">
        <div className="space-y-4">
          <div className="h-4 w-24 animate-pulse rounded-full bg-foreground/10" />
          <div className="h-10 w-2/3 max-w-xl animate-pulse rounded-2xl bg-foreground/10" />
          <div className="h-20 w-full max-w-3xl animate-pulse rounded-2xl bg-foreground/10" />
        </div>

        <div className="grid gap-6 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="h-28 animate-pulse rounded-3xl border border-border bg-card"
            />
          ))}
        </div>

        <div className="h-80 animate-pulse rounded-[2rem] border border-border bg-card" />
        <div className="h-96 animate-pulse rounded-[2rem] border border-border bg-card/40" />
      </div>
    </div>
  );
}
