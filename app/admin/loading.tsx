export default function AdminLoading() {
  return (
    <div className="space-y-6">
      <div className="h-10 w-48 animate-pulse rounded-2xl bg-foreground/10" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-28 animate-pulse rounded-3xl border border-border bg-white" />
        ))}
      </div>
      <div className="h-96 animate-pulse rounded-3xl border border-border bg-white" />
    </div>
  );
}
