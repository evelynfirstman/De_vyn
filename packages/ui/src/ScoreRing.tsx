type ScoreRingProps = {
  value: number;
  size?: number;
};

function bandColor(value: number): string {
  if (value >= 70) return "var(--score-high)";
  if (value >= 40) return "var(--score-mid)";
  return "var(--score-low)";
}

export function ScoreRing({ value, size = 120 }: ScoreRingProps) {
  const clamped = Math.max(0, Math.min(100, Math.round(value)));
  const r = 52;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (circumference * clamped) / 100;
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" role="img">
      <circle
        cx="60"
        cy="60"
        r={r}
        fill="none"
        stroke="var(--ink-100)"
        strokeWidth="12"
      />
      <circle
        cx="60"
        cy="60"
        r={r}
        fill="none"
        stroke={bandColor(clamped)}
        strokeWidth="12"
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
