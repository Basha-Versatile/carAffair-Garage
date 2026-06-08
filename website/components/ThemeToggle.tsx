"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Sun, Moon, Monitor } from "lucide-react";
import { cn } from "@/lib/cn";

const modes = ["light", "dark", "system"] as const;
const icons = { light: Sun, dark: Moon, system: Monitor };

export default function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <button
        className={cn(
          "h-9 w-9 rounded-full glass-card flex items-center justify-center",
          className
        )}
        aria-label="Toggle theme"
      >
        <Monitor className="h-4 w-4 text-[var(--text-tertiary)]" />
      </button>
    );
  }

  const current = (theme ?? "system") as (typeof modes)[number];
  const Icon = icons[current] ?? Monitor;

  const cycle = () => {
    const idx = modes.indexOf(current);
    setTheme(modes[(idx + 1) % modes.length]);
  };

  return (
    <button
      onClick={cycle}
      className={cn(
        "h-9 w-9 rounded-full glass-card flex items-center justify-center",
        "hover:bg-(--glass-hover) transition-all cursor-pointer",
        className
      )}
      aria-label={`Theme: ${current}`}
    >
      <Icon className="h-4 w-4 text-[var(--text-secondary)]" />
    </button>
  );
}
