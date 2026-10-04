/**
 * AI Recovery Coach (Phase 10, Groq-powered).
 *
 * The model only ever sees: profile summary, latest plan, recent scores,
 * and approved KB excerpts. Guardrails live in the system prompt AND in a
 * post-generation banned-language scan (see coach.test.ts eval set).
 */

export type CoachContext = {
  name: string;
  goals: string[];
  painAreas: string[];
  minutesPerSession: number;
  daysPerWeek: number;
  planSummary: string;
  recentScores: { date: string; score: number; band: string }[];
  kbExcerpts: { title: string; body: string; source: string }[];
};

export type CoachMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

const SYSTEM_RULES = [
  "You are Vyn, a recovery companion for desk-based knowledge workers.",
  "Give practical recovery guidance (movement, habits, products) tailored to the user's profile and plan.",
  "You are NOT a medical professional: never diagnose, never name conditions, never say what the user 'has'.",
  "If the user reports sharp pain, numbness, dizziness, or worsening symptoms, urge them to see a healthcare professional and stop the routine.",
  "Cite the provided knowledge-base excerpts when you use them.",
  "Keep replies under 120 words unless asked for more.",
];

export function buildCoachMessages(
  ctx: CoachContext,
  history: CoachMessage[],
  message: string,
): CoachMessage[] {
  const context = [
    `User: ${ctx.name || "there"}.`,
    `Goals: ${ctx.goals.join(", ") || "general recovery"}.`,
    `Pain areas: ${ctx.painAreas.join(", ") || "none stated"}.`,
    `Availability: ${ctx.daysPerWeek} days/week, ${ctx.minutesPerSession} min/session.`,
    `Current plan: ${ctx.planSummary || "none yet"}.`,
    `Recent scores: ${
      ctx.recentScores.length > 0
        ? ctx.recentScores.map((s) => `${s.date}=${s.score}`).join(", ")
        : "none yet"
    }.`,
    ctx.kbExcerpts.length > 0
      ? `Knowledge base:\n${ctx.kbExcerpts
          .map((d) => `- ${d.title} (${d.source}): ${d.body.slice(0, 400)}`)
          .join("\n")}`
      : "Knowledge base: none matched — answer from general recovery principles.",
  ].join("\n");
  return [
    { role: "system", content: [...SYSTEM_RULES, context].join("\n") },
    ...history.slice(-10),
    { role: "user", content: message },
  ];
}

const BANNED = [
  "you have",
  "you suffer from",
  "diagnos",
  "herniat",
  "fracture",
  "torn",
];

/** Post-generation safety scan; returns hit phrases (empty = clean). */
export function scanReply(text: string): string[] {
  const lower = text.toLowerCase();
  return BANNED.filter((p) => lower.includes(p));
}

/**
 * Keyword OR-query for KB grounding (Phase 10): natural sentences rarely
 * share ALL terms with a doc, so match ANY significant word and rank.
 * Returns null when nothing usable remains.
 */
export function keywordQuery(message: string): string | null {
  const words = message
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length >= 4)
    .filter((w, i, all) => all.indexOf(w) === i)
    .slice(0, 10);
  return words.length > 0 ? words.join(" | ") : null;
}

export const COACH_FALLBACK =
  "I can't help with that specifically — it sounds like something for a " +
  "healthcare professional. I can help with routines, recovery habits, or " +
  "choosing the right program for your plan. What would help most?";

export async function callGroq(
  apiKey: string,
  model: string,
  messages: CoachMessage[],
): Promise<string> {
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.6,
      max_tokens: 400,
    }),
  });
  if (!res.ok) throw new Error(`groq ${res.status}`);
  const body = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const content = body.choices?.[0]?.message?.content?.trim();
  if (!content) throw new Error("groq empty reply");
  return content;
}
