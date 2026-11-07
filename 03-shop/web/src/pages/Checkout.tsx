import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import api from '../api/client';
import { useCart } from '../context/CartContext';
import { Empty, Loading, ProductImage } from '../components/ui';
import type { Address, CartItem, Coupon } from '../lib/types';
import { fmtPrice } from '../lib/visual';

export default function Checkout() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { refresh } = useCart();

  const cartItemIds: number[] = state?.cartItemIds || [];

  const [items, setItems] = useState<CartItem[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [addressId, setAddressId] = useState<number | null>(null);
  const [couponId, setCouponId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!cartItemIds.length) {
      navigate('/cart');
      return;
    }
    Promise.all([api.get('/cart'), api.get('/addresses'), api.get('/coupons')])
      .then(([cartRes, addrRes, couponRes]) => {
        setItems(cartRes.data.list.filter((x: CartItem) => cartItemIds.includes(x.id)));
        setAddresses(addrRes.data.list);
        const def = addrRes.data.list.find((a: Address) => a.isDefault) || addrRes.data.list[0];
        setAddressId(def ? def.id : null);
        setCoupons(couponRes.data.list.filter((c: Coupon) => !c.isUsed));
      })
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const total = useMemo(() => Number(items.reduce((s, x) => s + x.subtotal, 0).toFixed(2)), [items]);
  const usable = coupons.filter((c) => total >= c.minAmount);
  const chosenCoupon = coupons.find((c) => c.id === couponId) || null;
  const discount = chosenCoupon ? Math.min(chosenCoupon.discount, total) : 0;
  const pay = Number((total - discount).toFixed(2));

  const submit = async () => {
    if (!addressId) return setMsg('请先添加收货地址');
    setSubmitting(true);
    setMsg('');
    try {
      const res = await api.post('/orders', { cartItemIds, addressId, couponId });
      await refresh();
      navigate(`/order/${res.data.order.id}`);
    } catch (e: any) {
      setMsg(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Loading />;

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <h1 className="font-title text-3xl text-ink">确认订单</h1>

      {/* 地址 */}
      <section className="mt-6 bg-card border border-line rounded-xl p-5">
        <div className="flex items-center gap-3 mb-4">
          <h2 className="font-title text-base text-ink">收货地址</h2>
          <Link to="/addresses" className="text-xs text-clay underline ml-auto">
            管理地址 →
          </Link>
        </div>
        {addresses.length === 0 ? (
          <Empty text="还没有收货地址，先去添加一个" />
        ) : (
          <div className="grid sm:grid-cols-2 gap-3">
            {addresses.map((a) => (
              <button
                key={a.id}
                onClick={() => setAddressId(a.id)}
                className={`text-left p-4 rounded-lg border transition ${
                  addressId === a.id ? 'border-clay bg-clay/5 ring-1 ring-clay' : 'border-line hover:border-clay-soft'
                }`}
              >
                <div className="flex items-center gap-2 text-sm">
                  <b className="text-ink">{a.name}</b>
                  <span className="text-ink-soft">{a.phone}</span>
                  {a.isDefault && <span className="text-[11px] px-1.5 py-0.5 rounded bg-clay/10 text-clay">默认</span>}
                </div>
                <p className="mt-1.5 text-xs text-ink-soft leading-relaxed">
                  {a.province} {a.city} {a.district} {a.detail}
                </p>
              </button>
            ))}
          </div>
        )}
      </section>

      {/* 商品 */}
      <section className="mt-5 bg-card border border-line rounded-xl p-5">
        <h2 className="font-title text-base text-ink mb-4">商品清单</h2>
        <ul className="space-y-3">
          {items.map((it) => (
            <li key={it.id} className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-lg overflow-hidden border border-line shrink-0">
                <ProductImage token={it.product.image} glyphSize={28} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm text-ink truncate">{it.product.name}</div>
                <div className="text-xs text-ink-soft">{fmtPrice(it.product.price)} × {it.quantity}</div>
              </div>
              <div className="font-title text-clay">{fmtPrice(it.subtotal)}</div>
            </li>
          ))}
        </ul>
      </section>

      {/* 优惠券 */}
      <section className="mt-5 bg-card border border-line rounded-xl p-5">
        <h2 className="font-title text-base text-ink mb-4">优惠券</h2>
        {coupons.length === 0 ? (
          <p className="text-sm text-ink-soft">暂无可用优惠券</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setCouponId(null)}
              className={`px-4 py-2 rounded-lg border text-sm transition ${
                couponId === null ? 'border-clay bg-clay/5 text-clay' : 'border-line text-ink-soft'
              }`}
            >
              不用券
            </button>
            {coupons.map((c) => {
              const ok = total >= c.minAmount;
              return (
                <button
                  key={c.id}
                  disabled={!ok}
                  onClick={() => setCouponId(c.id)}
                  className={`px-4 py-2 rounded-lg border text-sm transition ${
                    couponId === c.id
                      ? 'border-clay bg-clay/5 text-clay'
                      : ok
                        ? 'border-line text-ink hover:border-clay-soft'
                        : 'border-line text-ink-soft opacity-40 cursor-not-allowed'
                  }`}
                >
                  {c.title}
                  {!ok && <span className="ml-1 text-[11px]">(差 {fmtPrice(c.minAmount - total)})</span>}
                </button>
              );
            })}
          </div>
        )}
      </section>

      {/* 金额 */}
      <section className="mt-5 bg-card border border-line rounded-xl p-5">
        <div className="space-y-2 text-sm">
          <div className="flex justify-between text-ink-soft">
            <span>商品小计</span>
            <span>{fmtPrice(total)}</span>
          </div>
          <div className="flex justify-between text-ink-soft">
            <span>优惠</span>
            <span className="text-olive">{discount > 0 ? `- ${fmtPrice(discount)}` : '—'}</span>
          </div>
          <div className="flex justify-between text-ink-soft">
            <span>运费</span>
            <span>免运费</span>
          </div>
          <div className="flex justify-between items-baseline border-t border-line pt-3">
            <span className="text-ink">实付</span>
            <span className="font-title text-2xl text-clay">{fmtPrice(pay)}</span>
          </div>
        </div>

        <div className="mt-5 flex items-center gap-3">
          {msg && <span className="text-xs text-clay">{msg}</span>}
          <button
            onClick={submit}
            disabled={submitting || !items.length}
            className="ml-auto px-8 py-2.5 rounded-md bg-clay text-white text-sm hover:bg-clay-deep disabled:opacity-50"
          >
            {submitting ? '提交中…' : '提交订单'}
          </button>
        </div>
      </section>
      <div className="h-10" />
    </div>
  );
}
