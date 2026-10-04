import React from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { bandColor, bandLabel, colors, fontFamily } from "../theme";
import { scoreBandFor } from "@vyn/tokens";

export function Logo({ size = 56 }: { size?: number }) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.24,
        backgroundColor: colors.brand[900],
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text
        style={{
          color: colors.brand[100],
          fontSize: size * 0.52,
          fontWeight: "800",
          fontFamily,
        }}
      >
        V
      </Text>
      <View
        style={{
          position: "absolute",
          width: 10,
          height: 10,
          borderRadius: 5,
          backgroundColor: colors.accent[500],
          top: size * 0.2,
        }}
      />
    </View>
  );
}

export function ScoreRing({
  value,
  size = 120,
}: {
  value: number;
  size?: number;
}) {
  const clamped = Math.max(0, Math.min(100, Math.round(value)));
  const band = scoreBandFor(clamped);
  const stroke = bandColor(band);
  const r = 52;
  const c = 2 * Math.PI * r;
  const offset = c - (c * clamped) / 100;
  const s = size / 120;
  return (
    <View style={{ alignItems: "center" }}>
      <Svg width={size} height={size} viewBox="0 0 120 120">
        <Circle
          cx="60"
          cy="60"
          r={r}
          fill="none"
          stroke={colors.surface.container}
          strokeWidth={10}
        />
        <Circle
          cx="60"
          cy="60"
          r={r}
          fill="none"
          stroke={stroke}
          strokeWidth={10}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          rotation="-90"
          origin="60, 60"
        />
      </Svg>
      <View
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text style={{ fontSize: 24 * s, fontWeight: "800", fontFamily }}>
          {clamped}
        </Text>
      </View>
      <Text
        style={{
          marginTop: 4,
          fontSize: 12,
          fontWeight: "700",
          color: stroke,
          fontFamily,
        }}
      >
        {bandLabel[band]}
      </Text>
    </View>
  );
}

export function StreakPill({ count }: { count: number }) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        backgroundColor: colors.accent[100],
        borderRadius: 999,
        paddingVertical: 6,
        paddingHorizontal: 12,
        alignSelf: "flex-start",
      }}
    >
      <Text style={{ fontSize: 16 }}>🔥</Text>
      <Text
        style={{
          fontWeight: "700",
          color: colors.accent[600],
          fontFamily,
        }}
      >
        {count}-day streak
      </Text>
    </View>
  );
}

export function StreakDots({
  days = 7,
  active = 7,
}: {
  days?: number;
  active?: number;
}) {
  return (
    <View style={{ flexDirection: "row", gap: 6 }}>
      {Array.from({ length: days }).map((_, i) => (
        <View
          key={i}
          style={{
            width: 12,
            height: 12,
            borderRadius: 6,
            backgroundColor:
              i < active ? colors.brand[500] : colors.secondary.container,
          }}
        />
      ))}
    </View>
  );
}

export function MetricPod({
  label,
  value,
  unit,
  tone = "high",
}: {
  label: string;
  value: string;
  unit?: string;
  tone?: "high" | "mid" | "low";
}) {
  const strip =
    tone === "high"
      ? colors.score.high
      : tone === "mid"
        ? colors.score.mid
        : colors.score.low;
  return (
    <View style={rnStyles.metricPod}>
      <View style={[rnStyles.metricStrip, { backgroundColor: strip }]} />
      <Text style={rnStyles.metricLabel}>{label}</Text>
      <Text style={rnStyles.metricValue}>
        {value}
        {unit ? <Text style={rnStyles.metricUnit}> {unit}</Text> : null}
      </Text>
    </View>
  );
}

export function RegionBar({
  label,
  percent,
  caption,
}: {
  label: string;
  percent: number;
  caption?: string;
}) {
  const band = scoreBandFor(percent);
  return (
    <View style={{ marginBottom: 12 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
        <Text style={{ fontWeight: "600", fontFamily }}>{label}</Text>
        <Text
          style={{
            backgroundColor: colors.surface.low,
            borderRadius: 999,
            paddingHorizontal: 8,
            fontWeight: "700",
            fontFamily,
          }}
        >
          {percent}%
        </Text>
      </View>
      <View style={rnStyles.regionTrack}>
        <View
          style={{
            width: `${percent}%`,
            height: "100%",
            backgroundColor: bandColor(band),
            borderRadius: 999,
          }}
        />
      </View>
      {caption ? (
        <Text style={{ fontSize: 11, color: colors.ink[500], fontFamily }}>
          {caption}
        </Text>
      ) : null}
    </View>
  );
}

export function RoutineHeroCard({
  title,
  meta,
  cta,
  onCta,
}: {
  title: string;
  meta: string;
  cta: string;
  onCta?: () => void;
}) {
  return (
    <View style={rnStyles.routineHero}>
      <Text style={rnStyles.routineKicker}>PRESCRIBED ROUTINE</Text>
      <Text style={rnStyles.routineTitle}>{title}</Text>
      <Text style={rnStyles.routineMeta}>{meta}</Text>
      <Pressable style={rnStyles.routineCta} onPress={onCta}>
        <Text style={rnStyles.routineCtaText}>{cta}</Text>
      </Pressable>
    </View>
  );
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
}: {
  options: readonly T[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <View style={rnStyles.segmented}>
      {options.map((o) => {
        const selected = o === value;
        return (
          <Pressable
            key={o}
            onPress={() => onChange(o)}
            style={[rnStyles.segment, selected && rnStyles.segmentActive]}
          >
            <Text
              style={[
                rnStyles.segmentText,
                selected && rnStyles.segmentTextActive,
              ]}
            >
              {o}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function OnboardingProgress({
  step,
  total,
}: {
  step: number;
  total: number;
}) {
  const pct = Math.round((step / total) * 100);
  return (
    <View style={{ marginBottom: 12 }}>
      <Text
        style={{
          fontSize: 11,
          fontWeight: "700",
          color: colors.ink[500],
          fontFamily,
        }}
      >
        Step {step}/{total}
      </Text>
      <View style={rnStyles.progressTrack}>
        <View style={[rnStyles.progressFill, { width: `${pct}%` }]} />
      </View>
      <Text
        style={{
          fontSize: 11,
          color: colors.ink[500],
          marginTop: 6,
          fontFamily,
        }}
      >
        HIPAA-aware · Your data stays private
      </Text>
    </View>
  );
}

export function QrScannerModal({
  visible,
  onClose,
  onSimulate,
}: {
  visible: boolean;
  onClose: () => void;
  onSimulate?: () => void;
}) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={rnStyles.qrBackdrop} onPress={onClose}>
        <Pressable style={rnStyles.qrCard} onPress={() => {}}>
          <View style={rnStyles.qrViewfinder}>
            <View style={rnStyles.qrLaser} />
            <Text style={rnStyles.qrHint}>Point camera at QR</Text>
          </View>
          <Text style={rnStyles.qrTitle}>Scan hardware QR code</Text>
          <Text style={rnStyles.qrSub}>
            Unlocks instant guides &amp; paired protocols.
          </Text>
          <Pressable style={rnStyles.qrBtn} onPress={onSimulate ?? onClose}>
            <Text style={rnStyles.qrBtnText}>Simulate successful scan</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const rnStyles = StyleSheet.create({
  metricPod: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.ink[100],
    overflow: "hidden",
    paddingBottom: 10,
  },
  metricStrip: { height: 4 },
  metricLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.ink[500],
    paddingHorizontal: 12,
    paddingTop: 8,
    fontFamily,
  },
  metricValue: {
    fontSize: 20,
    fontWeight: "700",
    paddingHorizontal: 12,
    fontFamily,
  },
  metricUnit: { fontSize: 13, color: colors.ink[500], fontFamily },
  regionTrack: {
    height: 8,
    borderRadius: 999,
    backgroundColor: colors.surface.container,
    overflow: "hidden",
    marginTop: 6,
  },
  routineHero: {
    backgroundColor: colors.brand[900],
    borderRadius: 24,
    padding: 20,
  },
  routineKicker: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
    color: colors.primary.fixed,
    fontFamily,
  },
  routineTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#fff",
    marginTop: 4,
    fontFamily,
  },
  routineMeta: {
    fontSize: 13,
    color: "#fff",
    opacity: 0.85,
    marginTop: 4,
    fontFamily,
  },
  routineCta: {
    marginTop: 16,
    backgroundColor: colors.brand[500],
    borderRadius: 8,
    padding: 12,
    alignItems: "center",
  },
  routineCtaText: { color: "#fff", fontWeight: "600", fontFamily },
  segmented: {
    flexDirection: "row",
    backgroundColor: colors.surface.container,
    borderRadius: 12,
    padding: 6,
    gap: 4,
  },
  segment: {
    flex: 1,
    borderRadius: 8,
    padding: 10,
    alignItems: "center",
  },
  segmentActive: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "rgba(18,131,111,0.2)",
  },
  segmentText: { color: colors.ink[500], fontWeight: "600", fontFamily },
  segmentTextActive: { color: colors.ink[900], fontWeight: "700" },
  progressTrack: {
    height: 6,
    borderRadius: 999,
    backgroundColor: colors.ink[100],
    marginTop: 8,
    overflow: "hidden",
  },
  progressFill: { height: "100%", backgroundColor: colors.brand[500] },
  qrBackdrop: {
    flex: 1,
    backgroundColor: "rgba(41,48,65,0.8)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  qrCard: {
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 20,
    width: "100%",
    maxWidth: 340,
    alignItems: "center",
  },
  qrViewfinder: {
    width: 192,
    height: 192,
    borderRadius: 16,
    backgroundColor: colors.brand[900],
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    overflow: "hidden",
  },
  qrLaser: {
    position: "absolute",
    left: 16,
    right: 16,
    top: "50%",
    height: 2,
    backgroundColor: colors.accent[500],
  },
  qrHint: { color: "#fff", fontSize: 13, fontFamily },
  qrTitle: { fontWeight: "700", fontSize: 16, fontFamily },
  qrSub: {
    fontSize: 13,
    color: colors.ink[500],
    marginVertical: 8,
    textAlign: "center",
    fontFamily,
  },
  qrBtn: {
    width: "100%",
    backgroundColor: colors.brand[500],
    borderRadius: 8,
    padding: 12,
    alignItems: "center",
  },
  qrBtnText: { color: "#fff", fontWeight: "600", fontFamily },
});
