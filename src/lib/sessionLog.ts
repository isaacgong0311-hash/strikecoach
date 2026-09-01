/**
 * The per-question record of one drill session, handed from the drill screen
 * to the summary screen. Kept in its own module (rather than inline in the
 * screens) so the encode/decode round-trip is unit-testable — it crosses a
 * router-param boundary, where everything is a string and anything malformed
 * has to degrade instead of throwing.
 */

export interface SessionEntry {
  /** The question as asked, e.g. "What is the maximum loss for this Iron Condor?" */
  prompt: string;
  /** The correct choice text, so the recap teaches even where the user missed. */
  answer: string;
  correct: boolean;
}

export function encodeSessionLog(entries: SessionEntry[]): string {
  // Positional tuples rather than objects — this rides in a URL param, and
  // the key names would triple its length for no benefit.
  return JSON.stringify(entries.map((e) => [e.prompt, e.answer, e.correct ? 1 : 0]));
}

/** Never throws: a missing, truncated, or hand-edited param yields []. */
export function decodeSessionLog(raw: string | undefined | null): SessionEntry[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.flatMap((row): SessionEntry[] => {
      if (!Array.isArray(row) || row.length < 3) return [];
      const [prompt, answer, correct] = row;
      if (typeof prompt !== 'string' || typeof answer !== 'string') return [];
      return [{ prompt, answer, correct: correct === 1 || correct === true }];
    });
  } catch {
    return [];
  }
}

export function summarize(entries: SessionEntry[]): { correct: number; total: number; pct: number } {
  const total = entries.length;
  const correct = entries.filter((e) => e.correct).length;
  return { correct, total, pct: total > 0 ? Math.round((correct / total) * 100) : 0 };
}
