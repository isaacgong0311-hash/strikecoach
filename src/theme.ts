/**
 * Small, restrained design system — deliberately the exact palette from
 * strikelab.dev (globals.css --paper/--ink/--accent/--coral), not a
 * from-scratch invention. StrikeCoach is content built on the same options
 * math as StrikeLab's PayoffDiagram component; it should look like it
 * belongs to the same product family, not a generic new app.
 */

export const color = {
  bg: '#F2F2F0', // --paper
  surface: '#FFFFFF', // --paper-2
  surfaceAlt: '#F8F8F7', // --paper-3
  border: '#B0B0A9', // --line-2
  ink: '#1C1917', // --ink
  inkMuted: '#44403C', // --ink-2
  inkFaint: '#57534E', // --ink-3
  accent: '#15803D', // --accent
  accentInk: '#FFFFFF',
  loss: '#AD3A0A', // --coral
  lossTint: '#FDE9E4', // --coral-tint
  profit: '#15803D',
  profitTint: '#E4F3EA', // same tint construction as --coral-tint, applied to --accent
  warn: '#8A5A1E',
} as const;

export const space = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

export const radius = {
  sm: 4,
  md: 8,
} as const;

export const type = {
  // Matches StrikeLab's --font-mono: every price/score/stat is monospace
  // there too — same reason (numbers should feel measured, not decorative).
  mono: 'Courier New',
  display: {
    fontSize: 28,
    fontWeight: '700' as const,
    letterSpacing: -0.5,
  },
  title: {
    fontSize: 20,
    fontWeight: '600' as const,
  },
  body: {
    fontSize: 15,
    fontWeight: '400' as const,
  },
  label: {
    fontSize: 12,
    fontWeight: '600' as const,
    letterSpacing: 0.6,
  },
} as const;
