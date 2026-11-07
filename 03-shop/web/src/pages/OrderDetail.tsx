import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api from '../api/client';
import { Empty, Loading, ProductImage, StatusBadge } from '../components/ui';
import type { Order } from '../lib/types';
import { fmtPrice } from '../lib/visual';

const FLOW = ['待支付', '已支付', '已发货', '已完成'];

export default function OrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');

  const load = async () => {
    try {
      const res = await api.get(`/orders/${id}`);
      setOrder(res.data.order);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  const doAction = async (action: 'pay' | 'cancel') => {
    try {
      await api.put(`/orders/${id}/${action}`);
      await load();
      setMsg('');
    } catch (e: any) {
      setMsg(e.message);
    }
  };

  if (loading) return <Loading />;
  if (error || !order) return <Empty text={error || '订单不存在'} />;

  const stepIndex = order.status === '已取消' ? -1 : FLOW.indexOf(order.status);

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <Link to="/orders" className="text-sm text-ink-soft hover:text-clay">
        ← 返回订单列表
      </Link>

      {/* 状态 */}
      <section className="mt-4 bg-card border border-line rounded-xl p-6">
        <div className="flex items-center gap-3">
          <h1 className="font-title text-2xl text-ink">订单 {order.orderNo}</h1>
          <StatusBadge status={order.status} />
        </div>
        <p className="mt-1 text-xs text-ink-soft">下单时间 {order.createdAt}</p>

        {order.status !== '已取消' && (
          <div className="mt-6 flex items-center">
            {FLOW.map((s, i) => (
              <div key={s} className="flex-1 flex items-center">
                <div className="flex flex-col items-center flex-1">
                  <span
                    className={`w-7 h-7 rounded-full text-xs inline-flex items-center justify-center border ${
                      i <= stepIndex ? 'bg-clay text-white border-clay' : 'bg-sand text-ink-soft border-line'
                    }`}
                  >
                    {i + 1}
                  </span>
                  <span className={`mt-1.5 text-xs ${i <= stepIndex ? 'text-clay' : 'text-ink-soft'}`}>{s}</span>
                </div>
                {i < FLOW.length - 1 && <div className={`h-px flex-1 -mt-5 ${i < stepIndex ? 'bg-clay' : 'bg-line'}`} />}
              </div>
            ))}
          </div>
        )}

        {order.status === '待支付' && (
          <div className="mt-6 flex items-center gap-3">
            <button onClick={() => doAction('pay')} className="px-5 py-2 rounded-md bg-clay text-white text-sm hover:bg-clay-deep">
              模拟支付
            </button>
            <button
              onClick={() => {
                if (window.confirm('确定取消这笔订单？库存和优惠券会退回。')) doAction('cancel');
              }}
              className="px-5 py-2 rounded-md border border-line text-sm text-ink-soft hover:border-clay"
            >
              取消订单
            </button>
            {msg && <span className="text-xs text-clay">{msg}</span>}
          </div>
        )}
        {order.status === '已取消' && (
          <p className="mt-4 text-sm text-ink-soft">订单已取消，库存和优惠券已退回。</p>
        )}
      </section>

      {/* 商品 */}
      <section className="mt-5 bg-card border border-line rounded-xl p-6">
        <h2 className="font-title text-base text-ink mb-4">商品</h2>
        <ul className="space-y-3">
          {order.items.map((it) => (
            <li key={it.id} className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-lg overflow-hidden border border-line shrink-0">
                <ProductImage token={it.image} glyphSize={28} />
              </div>
              <div className="flex-1 min-w-0">
                <Link to={`/product/${it.productId}`} className="text-sm text-ink hover:text-clay truncate block">
                  {it.name}
                </Link>
                <div className="text-xs text-ink-soft">
                  {fmtPrice(it.price)} × {it.quantity}
                </div>
              </div>
              <div className="font-title text-clay">{fmtPrice(it.subtotal)}</div>
            </li>
          ))}
        </ul>

        <div className="mt-5 space-y-1.5 text-sm border-t border-line pt-4">
          <div className="flex justify-between text-ink-soft">
            <span>商品小计</span>
            <span>{fmtPrice(order.totalPrice)}</span>
          </div>
          <div className="flex justify-between text-ink-soft">
            <span>优惠</span>
            <span className="text-olive">{order.discountAmount > 0 ? `- ${fmtPrice(order.discountAmount)}` : '—'}</span>
          </div>
          <div className="flex justify-between items-baseline pt-2">
            <span className="text-ink">实付</span>
            <span className="font-title text-2xl text-clay">{fmtPrice(order.payAmount)}</span>
          </div>
        </div>
      </section>

      {/* 地址 */}
      {order.address && (
        <section className="mt-5 bg-card border border-line rounded-xl p-6">
          <h2 className="font-title text-base text-ink mb-3">收货信息</h2>
          <p className="text-sm text-ink">
            {order.address.name}　{order.address.phone}
          </p>
          <p className="mt-1 text-sm text-ink-soft">
            {order.address.province} {order.address.city} {order.address.district} {order.address.detail}
          </p>
        </section>
      )}

      <div className="mt-6 text-center">
        <Link to="/" className="text-sm text-clay underline">
          继续逛逛 →
        </Link>
      </div>
      <div className="h-10" />
    </div>
  );
}
