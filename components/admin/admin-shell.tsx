import Link from "next/link";
import { AdminSidebar } from "@/components/admin/admin-sidebar";

export function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="border-b border-border bg-white lg:hidden">
          <div className="flex h-16 items-center justify-between px-4">
            <Link href="/admin/dashboard" className="text-lg font-semibold">
              Prop<span className="text-accent">AI</span> Admin
            </Link>
            <Link href="/" className="text-sm text-muted">
              Site
            </Link>
          </div>
        </header>
        <main className="flex-1 p-6 lg:p-10">{children}</main>
      </div>
    </div>
  );
}
