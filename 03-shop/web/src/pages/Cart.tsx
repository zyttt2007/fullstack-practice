import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/client';
import { useCart } from '../context/CartContext';
import { Empty, Loading, ProductImage } from '../components/ui';
import type { CartItem } from '../lib/types';
import { fmtPrice } from '../lib/visual';

export default function Cart() {
  const { refresh } = useCart();
  const navigate = useNavigate();

  const [list, setList] = useState<CartItem[]>([]);
  const [checked, setChecked] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/cart');
      setList(res.data.list);
      setChecked(new Set(res.data.list.map((x: CartItem) => x.id)));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const toggle = (id: number) => {
    const next = new Set(checked);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setChecked(next);
  };

  const setQty = async (item: CartItem, qty: number) => {
    try {
      await api.put(`/cart/${item.id}`, { quantity: qty });
      setList(list.map((x) => (x.id === item.id ? { ...x, quantity: qty, subtotal: x.product.price * qty } : x)));
      setMsg('');
      refresh();
    } catch (e: any) {
      setMsg(e.message);
    }
  };

  const remove = async (item: CartItem) => {
    await api.delete(`/cart/${item.id}`);
    setList(list.filter((x) => x.id !== item.id));
    const next = new Set(checked);
    next.delete(item.id);
    setChecked(next);
    refresh();
  };

  const selected = list.filter((x) => checked.has(x.id));
  const total = useMemo(() => Number(selected.reduce((s, x) => s + x.subtotal, 0).toFixed(2)), [selected]);

  const checkout = () => {
    if (!selected.length) return setMsg('先勾选要结算的商品');
    navigate('/checkout', { state: { cartItemIds: selected.map((x) => x.id) } });
  };

  if (loading) return <Loading />;

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <h1 className="font-title text-3xl text-ink">购物车</h1>

      {list.length === 0 ? (
        <div className="mt-8">
          <Empty text="购物车是空的，去挑几件手作吧" />
          <div className="text-center">
            <Link to="/" className="text-sm text-clay underline">
              去逛逛 →
            </Link>
          </div>
        </div>
      ) : (
        <>
          <ul className="mt-6 space-y-3">
            {list.map((item) => (
              <li key={item.id} className="flex items-center gap-4 bg-card border border-line rounded-xl p-4">
                <input
                  type="checkbox"
                  checked={checked.has(item.id)}
                  onChange={() => toggle(item.id)}
                  className="w-4 h-4 accent-clay"
                />
                <div className="w-20 h-20 rounded-lg overflow-hidden border border-line shrink-0">
                  <ProductImage token={item.product.image} glyphSize={34} />
                </div>
                <div className="flex-1 min-w-0">
                  <Link to={`/product/${item.product.id}`} className="font-title text-base text-ink hover:text-clay truncate block">
                    {item.product.name}
                  </Link>
                  <div className="mt-1 text-xs text-ink-soft">
                    {item.product.category} · 单价 {fmtPrice(item.product.price)} · 库存 {item.product.stock}
                  </div>
                </div>
                <div className="inline-flex items-center border border-line rounded-md">
                  <button onClick={() => setQty(item, Math.max(1, item.quantity - 1))} className="w-8 h-8">
                    −
                  </button>
                  <span className="w-9 text-center text-sm">{item.quantity}</span>
                  <button onClick={() => setQty(item, Math.min(item.product.stock, item.quantity + 1))} className="w-8 h-8">
                    +
                  </button>
                </div>
                <div className="w-24 text-right font-title text-clay">{fmtPrice(item.subtotal)}</div>
                <button onClick={() => remove(item)} className="text-xs text-ink-soft hover:text-clay">
                  删除
                </button>
              </li>
            ))}
          </ul>

          {/* 结算条 */}
          <div className="sticky bottom-4 mt-6 bg-card border border-line rounded-xl p-4 flex items-center gap-4 shadow-[0_8px_24px_rgba(44,33,27,0.08)]">
            <label className="flex items-center gap-2 text-sm text-ink-soft">
              <input
                type="checkbox"
                checked={checked.size === list.length && list.length > 0}
                onChange={(e) => setChecked(e.target.checked ? new Set(list.map((x) => x.id)) : new Set())}
                className="w-4 h-4 accent-clay"
              />
              全选
            </label>
            <div className="ml-auto flex items-center gap-4">
              <span className="text-sm text-ink-soft">
                已选 <b className="text-ink">{selected.length}</b> 件，合计
                <b className="font-title text-xl text-clay ml-2">{fmtPrice(total)}</b>
              </span>
              <button
                onClick={checkout}
                className="px-6 py-2.5 rounded-md bg-clay text-white text-sm hover:bg-clay-deep"
              >
                去结算
              </button>
            </div>
          </div>
          {msg && <p className="mt-3 text-sm text-clay text-right">{msg}</p>}
        </>
      )}
      <div className="h-10" />
    </div>
  );
}
