/**
 * Vyn Therapy design tokens — single source of truth (Phase 1).
 * Web apps consume the matching CSS variables in `tokens.css`.
 */
export const colors = {
  brand: {
    900: "#0B3D36",
    700: "#0E5F54",
    500: "#12836F",
    300: "#5CB8A3",
    100: "#DCF2EA",
    50: "#EEFAF5",
  },
  accent: {
    600: "#D9622B",
    500: "#F97316",
    100: "#FFEDD5",
  },
  ink: {
    900: "#101828",
    700: "#344054",
    500: "#667085",
    300: "#D0D5DD",
    100: "#F2F4F7",
    50: "#F9FAFB",
  },
  score: {
    low: "#E5484D",
    mid: "#F5A524",
    high: "#18A957",
  },
  danger: "#D92D20",
  white: "#FFFFFF",
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  full: 9999,
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 40,
} as const;

export const fontFamily =
  '"Inter", "Segoe UI", system-ui, -apple-system, "Helvetica Neue", Arial, sans-serif';

export const typeScale = {
  display: 32,
  h1: 24,
  h2: 20,
  h3: 16,
  body: 15,
  caption: 13,
} as const;
