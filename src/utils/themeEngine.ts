import { oklch as culoriOklch, formatCss } from 'culori';

export type OklchColor = { l: number; c: number; h: number };

export interface SemanticTokens {
  background: OklchColor;
  foreground: OklchColor;
  surface: OklchColor;
  surfaceForeground: OklchColor;
  primary: OklchColor;
  primaryForeground: OklchColor;
  secondary: OklchColor;
  secondaryForeground: OklchColor;
  muted: OklchColor;
  mutedForeground: OklchColor;
  border: OklchColor;
  input: OklchColor;
  ring: OklchColor;
  success: OklchColor;
  warning: OklchColor;
  error: OklchColor;
  info: OklchColor;
  hover: OklchColor;
  active: OklchColor;
  disabled: OklchColor;
}

export function hexToOklch(hex: string): OklchColor {
  const c = culoriOklch(hex);
  return { l: c?.l ?? 0, c: c?.c ?? 0, h: c?.h ?? 0 };
}

export function oklchToHex(color: OklchColor): string {
  return formatCss({ mode: 'oklch', l: color.l, c: color.c, h: color.h }) || '#000000';
}

/**
 * Derives a full semantic color theme from a single accent color using OKLCH transformations.
 * Light/Dark modes produce colors that maintain contrast and perceptually balanced relationships.
 */
export function generateTheme(mode: 'light' | 'dark', accent: OklchColor, tintLevel: number = 0): SemanticTokens {
  const isLight = mode === 'light';
  
  // Use the accent's hue for the entire theme
  const h = accent.h;
  
  // Tint level scales from 0 (completely neutral) to 100 (highly accented)
  const tintScale = tintLevel / 100;
  
  // Neutrals get a subtle tint of the accent color based on tintLevel
  const bgC = accent.c * 0.05 * tintScale;
  const surfaceC = accent.c * 0.08 * tintScale;
  const textC = accent.c * 0.1 * tintScale;

  if (isLight) {
    return {
      background: { l: 0.99 - (0.02 * tintScale), c: bgC, h },
      foreground: { l: 0.15, c: textC, h },
      
      surface: { l: 0.96 - (0.02 * tintScale), c: surfaceC, h },
      surfaceForeground: { l: 0.20, c: textC, h },
      
      primary: { l: accent.l, c: accent.c, h },
      // Ensure primary foreground contrasts with primary background
      primaryForeground: accent.l > 0.65 ? { l: 0.15, c: textC, h } : { l: 0.98, c: bgC, h },
      
      secondary: { l: 0.92 - (0.02 * tintScale), c: surfaceC * 1.5, h },
      secondaryForeground: { l: 0.25, c: textC, h },
      
      muted: { l: 0.94 - (0.02 * tintScale), c: bgC * 1.5, h },
      mutedForeground: { l: 0.45, c: textC, h },
      
      border: { l: 0.88 - (0.02 * tintScale), c: bgC, h },
      input: { l: 0.88 - (0.02 * tintScale), c: bgC, h },
      ring: { l: accent.l + 0.1, c: accent.c * 0.8, h },
      
      // Status colors use standard hues but balanced L and C
      success: { l: 0.65, c: 0.15, h: 145 },
      warning: { l: 0.75, c: 0.15, h: 85 },
      error: { l: 0.60, c: 0.18, h: 25 },
      info: { l: 0.65, c: 0.15, h: 245 },
      
      // Interactive states derived from primary - slightly darker in light mode
      hover: { l: Math.max(0.1, accent.l - 0.08), c: accent.c, h },
      active: { l: Math.max(0.1, accent.l - 0.12), c: accent.c, h },
      disabled: { l: 0.92, c: bgC, h },
    };
  } else {
    // Dark mode
    return {
      background: { l: 0.12 + (0.02 * tintScale), c: bgC, h },
      foreground: { l: 0.92, c: textC, h },
      
      surface: { l: 0.18 + (0.02 * tintScale), c: surfaceC, h },
      surfaceForeground: { l: 0.88, c: textC, h },
      
      primary: { l: accent.l, c: accent.c, h },
      primaryForeground: accent.l > 0.65 ? { l: 0.10, c: textC, h } : { l: 0.95, c: bgC, h },
      
      secondary: { l: 0.25 + (0.02 * tintScale), c: surfaceC * 1.5, h },
      secondaryForeground: { l: 0.82, c: textC, h },
      
      muted: { l: 0.22 + (0.02 * tintScale), c: bgC * 1.5, h },
      mutedForeground: { l: 0.65, c: textC, h },
      
      border: { l: 0.28 + (0.02 * tintScale), c: bgC, h },
      input: { l: 0.28 + (0.02 * tintScale), c: bgC, h },
      ring: { l: accent.l - 0.1, c: accent.c * 0.8, h },
      
      success: { l: 0.55, c: 0.15, h: 145 },
      warning: { l: 0.65, c: 0.15, h: 85 },
      error: { l: 0.55, c: 0.18, h: 25 },
      info: { l: 0.55, c: 0.15, h: 245 },
      
      // Interactive states derived from primary - slightly lighter in dark mode
      hover: { l: Math.min(0.95, accent.l + 0.08), c: accent.c, h },
      active: { l: Math.min(0.95, accent.l + 0.12), c: accent.c, h },
      disabled: { l: 0.25, c: bgC, h },
    };
  }
}

export function oklchToString(color: OklchColor): string {
  const l = Math.max(0, Math.min(1, color.l));
  const c = Math.max(0, color.c);
  return `oklch(${l.toFixed(4)} ${c.toFixed(4)} ${color.h.toFixed(2)})`;
}

export function formatCssTokens(tokens: SemanticTokens): Record<string, string> {
  const cssTokens: Record<string, string> = {};
  for (const [key, value] of Object.entries(tokens)) {
    // Convert camelCase to kebab-case
    const cssVarName = `--color-${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`;
    cssTokens[cssVarName] = oklchToString(value);
  }
  return cssTokens;
}

export function applyThemeToDocument(tokens: SemanticTokens) {
  const cssTokens = formatCssTokens(tokens);
  const root = document.documentElement;
  for (const [key, value] of Object.entries(cssTokens)) {
    root.style.setProperty(key, value);
  }
  
  // Update brand colors for backward compatibility with existing UI
  root.style.setProperty('--brand-bg', oklchToString(tokens.background));
  root.style.setProperty('--brand-ink', oklchToString(tokens.foreground));
  root.style.setProperty('--brand-accent', oklchToString(tokens.primary));
}
