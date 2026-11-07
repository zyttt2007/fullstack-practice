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
    <img
      src={token}
      alt={name}
      className={`rounded-full object-cover ${className}`}
      style={{ width: size, height: size }}
    />
  ) : (
    <span
      className={`inline-flex items-center justify-center rounded-full font-title text-white shrink-0 ${className}`}
      style={{
        width: size,
        height: size,
        background: gradientBg(g?.hue ?? 152, 46, 34),
        fontSize: size * 0.45,
      }}
    >
      {glyph}
    </span>
  );
}

export function Cover({
  token,
  className = '',
  glyphSize = 64,
}: {
  token?: string;
  className?: string;
  glyphSize?: number;
}) {
  const g = gradientParts(token);
  if (isUrl(token)) {
    return <img src={token} alt="" className={`w-full h-full object-cover ${className}`} />;
  }
  return (
    <div
      className={`relative w-full h-full overflow-hidden ${className}`}
      style={{ background: gradientBg(g?.hue ?? 152) }}
    >
      <span
        className="absolute inset-0 flex items-center justify-center opacity-90 select-none"
        style={{ fontSize: glyphSize }}
      >
        {g?.glyph || '📄'}
      </span>
      <span className="absolute inset-0 paper-grain opacity-60" />
    </div>
  );
}

export function Tag({ children }: { children: ReactNode }) {
  return (
    <span className="inline-block px-2 py-0.5 rounded-full bg-paper text-[12px] text-ink-soft border border-line">
      #{children}
    </span>
  );
}

export function Loading({ text = '载入中…' }: { text?: string }) {
  return <div className="py-20 text-center text-ink-soft text-sm">{text}</div>;
}

export function Empty({ text = '这里还什么都没有' }: { text?: string }) {
  return (
    <div className="py-20 text-center">
      <div className="font-title text-5xl text-line mb-3">空</div>
      <p className="text-sm text-ink-soft">{text}</p>
    </div>
  );
}

export function Pagination({
  page,
  pageSize,
  total,
  onChange,
}: {
  page: number;
  pageSize: number;
  total: number;
  onChange: (p: number) => void;
}) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  if (pages <= 1) return null;
  return (
    <div className="flex items-center justify-center gap-2 mt-10">
      <button
        disabled={page <= 1}
        onClick={() => onChange(page - 1)}
        className="px-3 py-1.5 text-sm border border-line rounded-md disabled:opacity-40 hover:bg-paper"
      >
        上一页
      </button>
      {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
        <button
          key={p}
          onClick={() => onChange(p)}
          className={`w-9 h-9 text-sm rounded-md border ${
            p === page ? 'bg-moss text-white border-moss' : 'border-line hover:bg-paper'
          }`}
        >
          {p}
        </button>
      ))}
      <button
        disabled={page >= pages}
        onClick={() => onChange(page + 1)}
        className="px-3 py-1.5 text-sm border border-line rounded-md disabled:opacity-40 hover:bg-paper"
      >
        下一页
      </button>
    </div>
  );
}

/** 保护需要登录的页面 */
export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <Loading />;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}
