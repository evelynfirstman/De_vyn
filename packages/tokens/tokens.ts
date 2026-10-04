/**
 * Vyn Therapy design tokens — single source of truth (Phase 1 + UI_UX screens).
 * Source: docs/Vyn Therapy UI_UX/vyn_therapy/DESIGN.md + 11 code.html screens.
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
  // --- UI_UX M3 tonal surfaces (from DESIGN.md + screens) ---
  surface: {
    base: "#F9F9FF",
    dim: "#D2DAF0",
    lowest: "#FFFFFF",
    low: "#F1F3FF",
    container: "#E9EDFF",
    high: "#E0E8FF",
    highest: "#DBE2F9",
    on: "#141B2C",
    onVariant: "#3E4945",
    tint: "#006B5A",
    variant: "#DBE2F9",
  },
  inverse: {
    surface: "#293041",
    onSurface: "#EDF0FF",
    primary: "#78D8C0",
  },
  outline: {
    DEFAULT: "#6E7A75",
    variant: "#BDC9C4",
  },
  primary: {
    DEFAULT: "#006857",
    on: "#FFFFFF",
    container: "#12836F",
    onContainer: "#F2FFF9",
    fixed: "#94F4DC",
    fixedDim: "#78D8C0",
    onFixed: "#00201A",
    onFixedVariant: "#005143",
    ghost: "#EEFAF5",
    subtle: "#DCF2EA",
    hero: "#0B3D36",
    hover: "#0E5F54",
    splashMid: "#0D4E45",
  },
  secondary: {
    DEFAULT: "#3A665E",
    on: "#FFFFFF",
    container: "#BCECE2",
    onContainer: "#406C64",
    fixedDim: "#A1D0C6",
    onFixed: "#00201C",
    onFixedVariant: "#204E47",
  },
  tertiary: {
    DEFAULT: "#994100",
    on: "#FFFFFF",
    container: "#C05400",
    onContainer: "#FFFBFF",
    fixed: "#FFDBCA",
    fixedDim: "#FFB690",
    onFixed: "#341100",
    onFixedVariant: "#783200",
  },
  error: {
    DEFAULT: "#BA1A1A",
    on: "#FFFFFF",
    container: "#FFDAD6",
    onContainer: "#93000A",
  },
  // Onboarding / screen-specific neutrals observed in code.html
  neutral: {
    800: "#1D2939",
    600: "#475467",
    200: "#EAECF0",
    border: "#E4E7EC",
    mintLight: "#F0F9F6",
    strainBg: "#F8FAFC",
    bezel: "#18201E",
  },
} as const;

/** Recovery score bands per DESIGN.md: <50 Rest · 50–79 Easy · 80–100 Ready. */
export const scoreBands = {
  low: { max: 49, color: colors.score.low, label: "Rest" },
  mid: { min: 50, max: 79, color: colors.score.mid, label: "Easy day" },
  high: { min: 80, color: colors.score.high, label: "Ready" },
} as const;

export function scoreBandFor(value: number): "low" | "mid" | "high" {
  if (value >= 80) return "high";
  if (value >= 50) return "mid";
  return "low";
}

export const radius = {
  sm: 4,
  DEFAULT: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 40,
  gutter: 24,
  gutterSm: 16,
  gutterLg: 32,
  marginMobile: 16,
  marginDesktop: 48,
} as const;

export const elevation = {
  level1:
    "0px 1px 3px rgba(16, 24, 40, 0.05), 0px 1px 2px rgba(16, 24, 40, 0.03)",
  level2:
    "0px 8px 16px -4px rgba(11, 61, 54, 0.06), 0px 4px 6px -2px rgba(11, 61, 54, 0.03)",
  level3:
    "0px 20px 24px -4px rgba(16, 24, 40, 0.08), 0px 8px 8px -4px rgba(16, 24, 40, 0.03)",
  cardSelected: "0 4px 14px -2px rgba(18, 131, 111, 0.12)",
  stickyBar: "0 -4px 20px rgba(0, 0, 0, 0.06)",
  nav: "0 -2px 12px rgba(0, 0, 0, 0.03)",
} as const;

export const fontFamily =
  '"Plus Jakarta Sans", "Inter", "Segoe UI", system-ui, -apple-system, "Helvetica Neue", Arial, sans-serif';

export const typeScale = {
  displayHero: 48,
  displayHeroMobile: 32,
  display: 32,
  h1: 24,
  h2: 20,
  h3: 16,
  titleMd: 16,
  bodyLg: 18,
  body: 15,
  bodySm: 13,
  labelLg: 14,
  labelMd: 12,
  labelCaps: 11,
  caption: 13,
} as const;
