import Link from "next/link";
import { Button } from "@/components/ui/button";

interface AdminPageHeaderProps {
  title: string;
  description?: string;
  createHref?: string;
  createLabel?: string;
  action?: React.ReactNode;
}

export function AdminPageHeader({
  title,
  description,
  createHref,
  createLabel = "Create",
  action,
}: AdminPageHeaderProps) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
        {description ? (
          <p className="mt-1 text-sm text-muted">{description}</p>
        ) : null}
      </div>
      <div className="flex items-center gap-3">
        {action}
        {createHref ? (
          <Button asChild variant="accent">
            <Link href={createHref}>{createLabel}</Link>
          </Button>
        ) : null}
      </div>
    </div>
  );
}
