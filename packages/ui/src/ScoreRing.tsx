type ScoreRingProps = {
  value: number;
  size?: number;
};

function bandColor(value: number): string {
  if (value >= 80) return "var(--score-high)";
  if (value >= 50) return "var(--score-mid)";
  return "var(--score-low)";
}

export function ScoreRing({ value, size = 120 }: ScoreRingProps) {
  const clamped = Math.max(0, Math.min(100, Math.round(value)));
  const r = 52;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (circumference * clamped) / 100;
  const band = clamped >= 80 ? "high" : clamped >= 50 ? "mid" : "low";
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      role="img"
      aria-label={`Recovery score ${clamped} out of 100, ${band}`}
    >
      <circle
        cx="60"
        cy="60"
        r={r}
        fill="none"
        stroke="var(--surface-container)"
        strokeWidth="10"
      />
      <circle
        cx="60"
        cy="60"
        r={r}
        fill="none"
        stroke={bandColor(clamped)}
        strokeWidth="10"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        transform="rotate(-90 60 60)"
      />
      <text
        x="60"
        y="60"
        textAnchor="middle"
        dominantBaseline="central"
        fontSize="24"
        fontWeight="800"
        fill="var(--ink-900)"
      >
        {clamped}
      </text>
    </svg>
  );
}
