/**
 * Small, restrained design system. Deliberately avoids the generic-AI-app look
 * (no purple/blue gradients, no glow, no bubble shadows) in favor of a flat,
 * high-contrast, terminal-adjacent style that fits a quant/trading tool.
 */

export const color = {
  bg: '#F5F4F0',
  surface: '#FFFFFF',
  border: '#DDD9CF',
  ink: '#14140F',
  inkMuted: '#5B584C',
  inkFaint: '#8B8778',
  accent: '#1F5E3C', // deep green — profit / primary action
  accentInk: '#FFFFFF',
  loss: '#8A2A1E', // deep brick red — loss
  profit: '#1F5E3C',
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
  mono: 'Menlo', // monospace for numbers/prices — deliberate, ties to the quant aesthetic
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
