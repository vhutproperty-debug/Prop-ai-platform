import type { ProjectPageData } from "@/types/project-page";
import { buildBreadcrumbListSchema } from "@/lib/schema/breadcrumb";
import { buildFaqPageSchema } from "@/lib/schema/faq-page";
import { buildRealEstateListingSchema } from "@/lib/schema/real-estate-listing";

export function buildProjectPageSchemas(project: ProjectPageData) {
  const schemas: Record<string, unknown>[] = [
    buildRealEstateListingSchema(project),
    buildBreadcrumbListSchema(project),
  ];

  const faqSchema = buildFaqPageSchema(project.faqs, project.projectName);
  if (faqSchema) schemas.push(faqSchema);

  return schemas;
}

export { buildRealEstateListingSchema } from "@/lib/schema/real-estate-listing";
export { buildBreadcrumbListSchema } from "@/lib/schema/breadcrumb";
export { buildFaqPageSchema } from "@/lib/schema/faq-page";
