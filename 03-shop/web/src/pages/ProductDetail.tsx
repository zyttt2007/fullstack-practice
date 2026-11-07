import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { Empty, Loading, ProductImage } from '../components/ui';
import type { Product } from '../lib/types';
import { fmtPrice } from '../lib/visual';

export default function ProductDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const { refresh } = useCart();
  const navigate = useNavigate();

  const [p, setP] = useState<Product | null>(null);
  const [qty, setQty] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    setLoading(true);
    api
      .get(`/products/${id}`)
      .then((res) => setP(res.data.product))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  const addToCart = async () => {
    if (!user) return navigate('/login');
    if (!p) return;
    setAdding(true);
    setMsg('');
    try {
      await api.post('/cart', { productId: p.id, quantity: qty });
      await refresh();
      setMsg('已加入购物车');
      setTimeout(() => setMsg(''), 1800);
    } catch (e: any) {
      setMsg(e.message);
    } finally {
      setAdding(false);
    }
  };

  if (loading) return <Loading />;
  if (error || !p) return <Empty text={error || '商品不存在'} />;

  const soldOut = p.stock === 0;

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <div className="grid md:grid-cols-[1fr_1fr] gap-10">
        {/* 图 */}
        <div className="rounded-xl overflow-hidden border border-line aspect-square">
          <ProductImage token={p.images[0]} glyphSize={140} />
        </div>

        {/* 信息 */}
        <div className="flex flex-col">
          <span className="self-start px-2.5 py-0.5 rounded-full bg-white border border-line text-xs text-clay">
            {p.category}
          </span>
          <h1 className="font-title text-3xl mt-4 text-ink">{p.name}</h1>
          <p className="mt-2 text-xs text-ink-soft">手作 · 每件独一无二 · 已售 {p.sales} 件</p>

          <div className="mt-5 flex items-baseline gap-3">
            <span className="font-title text-4xl text-clay">{fmtPrice(p.price)}</span>
          </div>

          <div className="mt-6 text-sm text-ink-soft">
            库存：
            {soldOut ? <span className="text-clay">已售罄</span> : <span>{p.stock} 件</span>}
          </div>

          {/* 数量 */}
          <div className="mt-6 flex items-center gap-3">
            <span className="text-sm text-ink-soft">数量</span>
            <div className="inline-flex items-center border border-line rounded-md bg-card">
              <button onClick={() => setQty(Math.max(1, qty - 1))} className="w-9 h-9 text-lg">
                −
              </button>
              <span className="w-10 text-center text-sm">{qty}</span>
              <button onClick={() => setQty(Math.min(p.stock || 1, qty + 1))} className="w-9 h-9 text-lg">
                +
              </button>
            </div>
          </div>

          <div className="mt-7 flex items-center gap-3">
            <button
              onClick={addToCart}
              disabled={soldOut || adding}
              className="px-7 py-2.5 rounded-md bg-clay text-white text-sm disabled:opacity-50 hover:bg-clay-deep transition"
            >
              {soldOut ? '已售罄' : adding ? '加入中…' : '加入购物车'}
            </button>
            {msg && <span className={`text-sm ${msg.includes('已加入') ? 'text-olive' : 'text-clay'}`}>{msg}</span>}
          </div>

          {/* 描述 */}
          <div className="mt-8 border-t border-line pt-6 md-body whitespace-pre-wrap">
            {p.description}
          </div>
        </div>
      </div>
      <div className="h-10" />
    </div>
  );
}
