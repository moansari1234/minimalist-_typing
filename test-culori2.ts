import { interpolate, formatHex } from 'culori';
const mix = interpolate(['#F8F7F4', '#2563EB'], 'oklch');
console.log(formatHex(mix(0.15)));
