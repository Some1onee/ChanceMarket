"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CatalogPagination({
  page,
  pageSize,
  total,
}: {
  page: number;
  pageSize: number;
  total: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const totalPages = Math.max(Math.ceil(total / pageSize), 1);

  if (totalPages <= 1) return null;

  function goTo(next: number) {
    const params = new URLSearchParams(searchParams.toString());
    if (next <= 1) params.delete("page");
    else params.set("page", String(next));
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <nav aria-label="Pagination" className="flex items-center justify-center gap-3 pt-8">
      <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => goTo(page - 1)}>
        <ChevronLeft aria-hidden /> Previous
      </Button>
      <span className="text-sm text-muted-foreground">
        Page {page} of {totalPages}
      </span>
      <Button
        variant="outline"
        size="sm"
        disabled={page >= totalPages}
        onClick={() => goTo(page + 1)}
      >
        Next <ChevronRight aria-hidden />
      </Button>
    </nav>
  );
}
