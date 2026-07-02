import { formatHex, parse } from 'culori';

export function getHexColor(cssVar: string, fallback: string): string {
  if (!cssVar) return fallback;
  
  // Try to parse with culori, which supports oklch
  try {
    const parsed = parse(cssVar);
    if (parsed) {
      const hex = formatHex(parsed);
      if (hex) return hex;
    }
  } catch (e) {
    // ignore
  }
  
  // If it's already a hex or supported format, just return it
  if (cssVar.startsWith('#')) return cssVar;
  
  return fallback;
}
