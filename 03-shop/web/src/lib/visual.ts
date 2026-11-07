export function gradientParts(token?: string) {
  if (token && token.startsWith('gradient:')) {
    const parts = token.split(':');
    return { hue: Number(parts[1]) || 16, glyph: parts[2] || '' };
  }
  return null;
}

export function gradientBg(hue: number, from = 70, to = 50) {
  return `linear-gradient(150deg, hsl(${hue} 32% ${from}%), hsl(${hue} 36% ${to}%))`;
}

export function isUrl(s?: string) {
  return !!s && /^https?:\/\//.test(s);
}

export function formatDate(s?: string) {
  if (!s) return '';
  return s.slice(0, 16).replace(/-/g, '.').replace(' ', ' ');
}

export const fmtPrice = (n: number) => `¥${Number(n).toFixed(2)}`;

export const AVATAR_PRESETS = [
  'gradient:16:禾',
  'gradient:14:瓷',
  'gradient:45:舟',
  'gradient:100:叶',
  'gradient:340:花',
];
