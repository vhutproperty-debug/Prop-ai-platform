import { redirect } from "next/navigation";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export const dynamic = "force-dynamic";

export default async function LegacyProjectRedirect({ params }: PageProps) {
  const { slug } = await params;
  redirect(`/project/${slug}`);
}
