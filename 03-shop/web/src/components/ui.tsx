import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { gradientBg, gradientParts, isUrl } from '../lib/visual';

export function Avatar({
  token,
  name = '',
  size = 36,
  className = '',
}: {
  token?: string;
  name?: string;
  size?: number;
  className?: string;
}) {
  const g = gradientParts(token);
  const glyph = g?.glyph || name.slice(0, 1) || '·';
  return isUrl(token) ? (
    <img src={token} alt={name} className={`rounded-full object-cover ${className}`} style={{ width: size, height: size }} />
  ) : (
    <span
      className={`inline-flex items-center justify-center rounded-full font-title text-white shrink-0 ${className}`}
      style={{ width: size, height: size, background: gradientBg(g?.hue ?? 16, 48, 38), fontSize: size * 0.45 }}
    >
      {glyph}
    </span>
  );
}

/** 商品图：渐变底 + 大字符 */
export function ProductImage({ token, className = '', glyphSize = 72 }: { token?: string; className?: string; glyphSize?: number }) {
  const g = gradientParts(token);
  if (isUrl(token)) return <img src={token} alt="" className={`w-full h-full object-cover ${className}`} />;
  return (
    <div className={`relative w-full h-full overflow-hidden ${className}`} style={{ background: gradientBg(g?.hue ?? 16) }}>
      <span className="absolute inset-0 grain opacity-70" />
      <span className="absolute inset-0 flex items-center justify-center select-none" style={{ fontSize: glyphSize }}>
        {g?.glyph || '🏺'}
      </span>
    </div>
  );
}

export function Loading({ text = '载入中…' }: { text?: string }) {
  return <div className="py-20 text-center text-ink-soft text-sm">{text}</div>;
}

export function Empty({ text = '这里还什么都没有' }: { text?: string }) {
  return (
    <div className="py-20 text-center">
      <div className="font-title text-5xl text-line mb-3">物</div>
      <p className="text-sm text-ink-soft">{text}</p>
    </div>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const style: Record<string, string> = {
    待支付: 'bg-clay/10 text-clay border-clay/40',
    已支付: 'bg-olive/10 text-olive border-olive/40',
    已发货: 'bg-blue-500/10 text-blue-700 border-blue-300',
    已完成: 'bg-gray-500/10 text-gray-600 border-gray-300',
    已取消: 'bg-gray-500/10 text-gray-400 border-gray-200',
  };
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs border ${style[status] || style['已取消']}`}>
      {status}
    </span>
  );
}

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <Loading />;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}
