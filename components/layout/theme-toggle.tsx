"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/components/layout/theme-provider";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { resolved, setTheme } = useTheme();
  return (
    <Button
      variant="ghost"
      size="icon-sm"
      aria-label={resolved === "dark" ? "Switch to light theme" : "Switch to dark theme"}
      onClick={() => setTheme(resolved === "dark" ? "light" : "dark")}
    >
      {resolved === "dark" ? <Sun aria-hidden /> : <Moon aria-hidden />}
    </Button>
  );
}
