import type { ProjectPageData } from "@/types/project-page";
import { absoluteUrl, projectCanonicalUrl } from "@/lib/seo/urls";

export function buildBreadcrumbListSchema(project: ProjectPageData) {
  const items: Array<{
    "@type": "ListItem";
    position: number;
    name: string;
    item?: string;
  }> = [
    {
      "@type": "ListItem",
      position: 1,
      name: "Home",
      item: absoluteUrl("/"),
    },
  ];

  if (project.location) {
    items.push({
      "@type": "ListItem",
      position: 2,
      name: project.location.name,
      item: absoluteUrl(`/localities/${project.location.slug}`),
    });
  }

  items.push({
    "@type": "ListItem",
    position: items.length + 1,
    name: project.projectName,
    item: projectCanonicalUrl(project.slug),
  });

  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items,
  };
}
