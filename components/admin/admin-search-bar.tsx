"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

interface AdminSearchBarProps {
  defaultValue?: string;
  placeholder?: string;
}

export function AdminSearchBar({
  defaultValue = "",
  placeholder = "Search...",
}: AdminSearchBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const search = String(formData.get("search") ?? "").trim();
    const params = new URLSearchParams(searchParams.toString());

    if (search) params.set("search", search);
    else params.delete("search");
    params.set("page", "1");

    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <form onSubmit={handleSubmit} className="relative w-full min-w-0 flex-1 md:max-w-md">
      <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
      <Input
        name="search"
        defaultValue={defaultValue}
        placeholder={placeholder}
        className="pl-11"
      />
    </form>
  );
}
