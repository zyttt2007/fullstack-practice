import { Link } from 'react-router-dom';
import type { Product } from '../lib/types';
import { ProductImage } from './ui';
import { fmtPrice } from '../lib/visual';

export default function ProductCard({ p }: { p: Product }) {
  return (
    <Link
      to={`/product/${p.id}`}
      className="group block bg-card border border-line rounded-xl overflow-hidden hover:border-clay-soft hover:shadow-[0_8px_24px_rgba(162,85,54,0.12)] transition"
    >
      <div className="relative aspect-square">
        <ProductImage token={p.images[0]} glyphSize={64} />
        <span className="absolute left-3 top-3 px-2 py-0.5 rounded-full text-[11px] bg-white/90 text-clay border border-line">
          {p.category}
        </span>
        {p.stock === 0 && (
          <span className="absolute inset-0 bg-white/60 flex items-center justify-center font-title text-ink-soft">
            已售罄
          </span>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-title text-base text-ink group-hover:text-clay transition truncate">{p.name}</h3>
        <div className="mt-2 flex items-end justify-between">
          <span className="font-title text-lg text-clay">{fmtPrice(p.price)}</span>
          <span className="text-[11px] text-ink-soft">已售 {p.sales}</span>
        </div>
      </div>
    </Link>
  );
}
