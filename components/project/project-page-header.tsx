import Link from "next/link";

export function ProjectPageHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/80 bg-background/90 backdrop-blur-xl">
      <div className="container-premium flex h-16 items-center justify-between">
        <Link href="/" className="text-lg font-semibold tracking-tight">
          Prop<span className="text-accent">AI</span>
        </Link>
        <nav className="hidden items-center gap-6 text-sm text-muted md:flex">
          <a href="#overview" className="transition-colors hover:text-foreground">
            Overview
          </a>
          <a
            href="#configurations"
            className="transition-colors hover:text-foreground"
          >
            Configurations
          </a>
          <a href="#amenities" className="transition-colors hover:text-foreground">
            Amenities
          </a>
          <a href="#gallery" className="transition-colors hover:text-foreground">
            Gallery
          </a>
          <a href="#enquire" className="transition-colors hover:text-foreground">
            Enquire
          </a>
        </nav>
      </div>
    </header>
  );
}
