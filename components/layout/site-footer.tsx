import Link from "next/link";
import { Button } from "@/components/ui/button";

const footerLinks = {
  Product: [
    { label: "AI Search", href: "#search" },
    { label: "Projects", href: "#projects" },
    { label: "Localities", href: "#localities" },
    { label: "Market Insights", href: "#insights" },
  ],
  Advisors: [
    { label: "Property Advisor", href: "#" },
    { label: "Investment Advisor", href: "#" },
    { label: "Rental Advisor", href: "#" },
    { label: "Interior Advisor", href: "#" },
  ],
  Company: [
    { label: "About", href: "#" },
    { label: "Builders", href: "#builders" },
    { label: "Partners", href: "#" },
    { label: "Contact", href: "#" },
  ],
};

export function SiteFooter() {
  return (
    <footer className="border-t border-white/10 bg-surface-dark text-white">
      <div className="container-premium py-20">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <Link href="/" className="text-2xl font-semibold tracking-tight">
              Prop<span className="text-accent">AI</span>
            </Link>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/50">
              Mumbai&apos;s AI-first real estate operating system. Intelligence,
              not listings.
            </p>
            <Button variant="accent" size="sm" className="mt-6">
              Start Exploring
            </Button>
          </div>

          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h4 className="mb-4 text-xs font-medium uppercase tracking-widest text-white/40">
                {category}
              </h4>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-white/60 transition-colors hover:text-white"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-16 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 sm:flex-row">
          <p className="text-xs text-white/40">
            © {new Date().getFullYear()} Prop AI. All rights reserved.
          </p>
          <div className="flex gap-6">
            <Link href="#" className="text-xs text-white/40 hover:text-white/70">
              Privacy
            </Link>
            <Link href="#" className="text-xs text-white/40 hover:text-white/70">
              Terms
            </Link>
            <Link href="#" className="text-xs text-white/40 hover:text-white/70">
              RERA Disclaimer
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
