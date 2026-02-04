"use client";

import * as React from "react";
import { createContext, useContext, useEffect, useState } from "react";

type Theme = "dark";

interface ThemeProviderProps {
  children: React.ReactNode;
}

interface ThemeProviderState {
  theme: Theme;
  resolvedTheme: "dark";
}

const ThemeProviderContext = createContext<ThemeProviderState | undefined>(undefined);

export function ThemeProvider({
  children,
}: ThemeProviderProps) {
  const [mounted, setMounted] = useState(false);

  // Initialize after mount
  useEffect(() => {
    setMounted(true);
  }, []);

  // Apply dark theme always
  useEffect(() => {
    if (!mounted) return;

    const root = document.documentElement;
    root.classList.add("dark");
  }, [mounted]);

  return (
    <ThemeProviderContext.Provider value={{ theme: "dark", resolvedTheme: "dark" }}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeProviderContext);
  if (!context) {
    return { theme: "dark" as const, resolvedTheme: "dark" as const };
  }
  return context;
}
