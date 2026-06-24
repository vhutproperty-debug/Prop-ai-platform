import { FileText } from "lucide-react";
import { SectionHeader } from "@/components/project/section-header";
import { Button } from "@/components/ui/button";

interface BrochureSectionProps {
  brochure?: string;
  projectName: string;
}

export function BrochureSection({
  brochure,
  projectName,
}: BrochureSectionProps) {
  if (!brochure) return null;

  return (
    <section id="brochure" className="section-padding border-b border-border">
      <div className="container-premium">
        <div className="flex flex-col items-start justify-between gap-8 rounded-[2rem] border border-border bg-gradient-to-br from-card to-accent-muted/20 p-8 sm:flex-row sm:items-center sm:p-10">
          <div className="flex items-start gap-5">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/15 text-accent">
              <FileText className="h-6 w-6" />
            </div>
            <SectionHeader
              eyebrow="Brochure"
              title="Download project brochure"
              description={`Get detailed specifications and floor plans for ${projectName}.`}
            />
          </div>

          <Button asChild variant="accent" size="lg">
            <a href={brochure} target="_blank" rel="noopener noreferrer">
              View brochure
            </a>
          </Button>
        </div>
      </div>
    </section>
  );
}
