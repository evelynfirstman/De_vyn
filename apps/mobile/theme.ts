import { colors, scoreBandFor } from "@vyn/tokens";

export { colors, scoreBandFor };
export const fontFamily = "PlusJakartaSans";

export const bandLabel: Record<"low" | "mid" | "high", string> = {
  low: "Low · Rest",
  mid: "Mid · Easy day",
  high: "High · Ready",
};

export function bandColor(band: "low" | "mid" | "high"): string {
  return band === "high"
    ? colors.score.high
    : band === "mid"
      ? colors.score.mid
      : colors.score.low;
}

export const radius = { btn: 8, card: 16, hero: 24, pill: 9999 } as const;
