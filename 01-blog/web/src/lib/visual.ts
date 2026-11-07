/** 视觉工具：封面 / 头像用「渐变色 + 字符」生成，不依赖外部图片 */
export function gradientParts(token?: string) {
  if (token && token.startsWith('gradient:')) {
    const parts = token.split(':');
    return { hue: Number(parts[1]) || 150, glyph: parts[2] || '' };
  }
  return null;
}

export function gradientBg(hue: number, from = 78, to = 54) {
  return `linear-gradient(135deg, hsl(${hue} 33% ${from}%), hsl(${hue} 27% ${to}%))`;
}

export function isUrl(s?: string) {
  return !!s && /^https?:\/\//.test(s);
}

export function formatDate(s?: string) {
  if (!s) return '';
  return s.slice(0, 10).replace(/-/g, '.');
}

export function excerpt(content = '', len = 90) {
  const plain = content
    .replace(/```[\s\S]*?```/g, '')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/[#>*_`~\-\[\]()|]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  return plain.length > len ? `${plain.slice(0, len)}…` : plain;
}

export const COVER_PRESETS = [
  'gradient:152:📖',
  'gradient:200:🌉',
  'gradient:18:☕',
  'gradient:28:🏚️',
  'gradient:210:🌧️',
  'gradient:96:🌿',
  'gradient:340:🌸',
  'gradient:45:🌾',
];

export const AVATAR_PRESETS = [
  'gradient:152:苔',
  'gradient:200:岚',
  'gradient:18:禾',
  'gradient:28:周',
  'gradient:96:叶',
  'gradient:340:花',
];
