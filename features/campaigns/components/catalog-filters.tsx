"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { LayoutGrid, List, Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { CategoryRow } from "@/lib/supabase/database.types";

const ALL = "__all__";

const TYPE_OPTIONS = [
  { value: "paid_prize_competition", label: "Prize competition" },
  { value: "skill_based_competition", label: "Skill competition" },
  { value: "hybrid_paid_with_free_route", label: "Paid + free route" },
  { value: "free_draw", label: "Free draw" },
  { value: "sweepstakes", label: "Sweepstakes" },
];

const SORT_OPTIONS = [
  { value: "ending_soon", label: "Ending soon" },
  { value: "newest", label: "Newest" },
  { value: "price_asc", label: "Entry price: low to high" },
  { value: "price_desc", label: "Entry price: high to low" },
  { value: "progress", label: "Most popular" },
];

export function CatalogFilters({
  categories,
  view,
}: {
  categories: CategoryRow[];
  view: "grid" | "list";
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [search, setSearch] = React.useState(searchParams.get("q") ?? "");

  const setParam = React.useCallback(
    (key: string, value: string | null) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value === null || value === "" || value === ALL) params.delete(key);
      else params.set(key, value);
      params.delete("page");
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  // Debounced search sync (350 ms).
  React.useEffect(() => {
    const current = searchParams.get("q") ?? "";
    if (search === current) return;
    const timer = setTimeout(() => setParam("q", search || null), 350);
    return () => clearTimeout(timer);
  }, [search, searchParams, setParam]);

  const hasFilters = ["q", "category", "type", "status", "sort"].some((key) =>
    searchParams.has(key),
  );

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative min-w-56 flex-1">
        <Search
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <label htmlFor="catalog-search" className="sr-only">
          Search competitions
        </label>
        <Input
          id="catalog-search"
          type="search"
          placeholder="Search prizes…"
          className="pl-9"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </div>

      <Select
        value={searchParams.get("category") ?? ALL}
        onValueChange={(value) => setParam("category", value)}
      >
        <SelectTrigger className="w-44" aria-label="Category">
          <SelectValue placeholder="Category" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>All categories</SelectItem>
          {categories.map((category) => (
            <SelectItem key={category.id} value={category.slug}>
              {category.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={searchParams.get("type") ?? ALL}
        onValueChange={(value) => setParam("type", value)}
      >
        <SelectTrigger className="w-44" aria-label="Campaign type">
          <SelectValue placeholder="Type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>All types</SelectItem>
          {TYPE_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={searchParams.get("status") ?? "open"}
        onValueChange={(value) => setParam("status", value === "open" ? null : value)}
      >
        <SelectTrigger className="w-32" aria-label="Availability">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="open">Open</SelectItem>
          <SelectItem value="ended">Ended</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={searchParams.get("sort") ?? "ending_soon"}
        onValueChange={(value) => setParam("sort", value === "ending_soon" ? null : value)}
      >
        <SelectTrigger className="w-52" aria-label="Sort by">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {SORT_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="ml-auto flex items-center gap-1 rounded-lg border border-border p-0.5">
        <Button
          variant={view === "grid" ? "secondary" : "ghost"}
          size="icon-sm"
          aria-label="Grid view"
          aria-pressed={view === "grid"}
          onClick={() => setParam("view", null)}
        >
          <LayoutGrid aria-hidden />
        </Button>
        <Button
          variant={view === "list" ? "secondary" : "ghost"}
          size="icon-sm"
          aria-label="List view"
          aria-pressed={view === "list"}
          onClick={() => setParam("view", "list")}
        >
          <List aria-hidden />
        </Button>
      </div>

      {hasFilters ? (
        <Button variant="ghost" size="sm" onClick={() => router.replace(pathname)}>
          <X aria-hidden /> Clear filters
        </Button>
      ) : null}
    </div>
  );
}
