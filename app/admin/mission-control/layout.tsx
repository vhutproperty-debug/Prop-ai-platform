import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/session";

export default async function MissionControlLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  try {
    await requireRole("admin");
  } catch {
    redirect("/admin/dashboard");
  }

  return children;
}
