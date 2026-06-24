import Link from "next/link";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-white">
        <div className="container-premium flex h-16 items-center justify-between">
          <Link href="/admin/leads" className="text-lg font-semibold">
            Prop<span className="text-accent">AI</span> Admin
          </Link>
          <nav className="flex items-center gap-6 text-sm text-muted">
            <Link href="/admin/leads" className="hover:text-foreground">
              Leads
            </Link>
            <Link href="/" className="hover:text-foreground">
              View Site
            </Link>
          </nav>
        </div>
      </header>
      <main className="container-premium py-10">{children}</main>
    </div>
  );
}
