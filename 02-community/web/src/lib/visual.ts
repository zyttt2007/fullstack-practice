export function gradientParts(token?: string) {
  if (token && token.startsWith('gradient:')) {
    const parts = token.split(':');
    return { hue: Number(parts[1]) || 24, glyph: parts[2] || '' };
  }
  return null;
}

export function gradientBg(hue: number, from = 62, to = 42) {
  return `linear-gradient(135deg, hsl(${hue} 58% ${from}%), hsl(${hue} 62% ${to}%))`;
}

export function isUrl(s?: string) {
  return !!s && /^https?:\/\//.test(s);
}

export function formatDate(s?: string) {
  if (!s) return '';
  return s.slice(0, 10).replace(/-/g, '.');
}

export function excerpt(content = '', len = 100) {
  const plain = content
    .replace(/```[\s\S]*?```/g, '')
    .replace(/[#>*_`~\-\[\]()|]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  return plain.length > len ? `${plain.slice(0, len)}…` : plain;
}

export const AVATAR_PRESETS = [
  'gradient:24:满',
  'gradient:18:李',
  'gradient:32:陈',
  'gradient:96:果',
  'gradient:210:白',
  'gradient:340:桃',
];
