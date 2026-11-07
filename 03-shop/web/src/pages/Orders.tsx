import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import { Empty, Loading, ProductImage, StatusBadge } from '../components/ui';
import type { Order } from '../lib/types';
import { fmtPrice } from '../lib/visual';

const TABS = ['全部', '待支付', '已支付', '已发货', '已完成', '已取消'];

export default function Orders() {
  const [tab, setTab] = useState('全部');
  const [list, setList] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async (status: string) => {
    setLoading(true);
    try {
      const res = await api.get(`/orders${status === '全部' ? '' : `?status=${encodeURIComponent(status)}`}`);
      setList(res.data.list);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(tab);
  }, [tab]);

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <h1 className="font-title text-3xl text-ink">我的订单</h1>

      <div className="mt-5 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-3.5 py-1.5 rounded-full text-sm border transition ${
              tab === t ? 'bg-clay text-white border-clay' : 'bg-card text-ink-soft border-line hover:border-clay-soft'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {loading ? (
        <Loading />
      ) : list.length === 0 ? (
        <Empty text={`没有「${tab}」的订单`} />
      ) : (
        <ul className="mt-6 space-y-4">
          {list.map((o) => (
            <li key={o.id} className="bg-card border border-line rounded-xl p-5">
              <div className="flex items-center gap-3 text-xs text-ink-soft">
                <span className="font-mono">订单号 {o.orderNo}</span>
                <span>{o.createdAt}</span>
                <span className="ml-auto">
                  <StatusBadge status={o.status} />
                </span>
              </div>

              <div className="mt-4 flex items-center gap-3 overflow-x-auto">
                {o.items.map((it) => (
                  <div key={it.id} className="flex items-center gap-2 shrink-0">
                    <div className="w-14 h-14 rounded-lg overflow-hidden border border-line">
                      <ProductImage token={it.image} glyphSize={24} />
                    </div>
                    <div className="text-xs">
                      <div className="text-ink max-w-[120px] truncate">{it.name}</div>
                      <div className="text-ink-soft">
                        {fmtPrice(it.price)} × {it.quantity}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 flex items-center gap-4 border-t border-line pt-4">
                <span className="text-sm text-ink-soft">
                  共 {o.items.reduce((s, x) => s + x.quantity, 0)} 件，
                  {o.discountAmount > 0 && <span className="text-olive">已优惠 {fmtPrice(o.discountAmount)}，</span>}
                  实付 <b className="font-title text-lg text-clay">{fmtPrice(o.payAmount)}</b>
                </span>
                <Link
                  to={`/order/${o.id}`}
                  className="ml-auto px-4 py-1.5 text-sm rounded-md border border-line hover:border-clay-soft"
                >
                  查看详情
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
      <div className="h-10" />
    </div>
  );
}
