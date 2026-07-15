"use client";

import { useRouter } from "next/navigation";
import { Check, Languages } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { brand, type Locale } from "@/lib/config/brand";
import { LOCALE_COOKIE, LOCALE_LABELS } from "@/lib/localization/constants";

export function LocaleSwitcher({ locale, label }: { locale: Locale; label: string }) {
  const router = useRouter();

  function selectLocale(next: Locale) {
    if (next === locale) return;
    document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
    router.refresh();
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label={label}>
          <Languages aria-hidden />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        {brand.locales.map((item) => (
          <DropdownMenuItem key={item} onSelect={() => selectLocale(item)}>
            <span className="flex-1">{LOCALE_LABELS[item]}</span>
            {item === locale ? <Check className="size-4" aria-hidden /> : null}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
