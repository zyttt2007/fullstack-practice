import { useEffect, useState } from 'react';
import api from '../api/client';
import { Empty, Loading } from '../components/ui';
import type { Address } from '../lib/types';

const EMPTY_FORM = { name: '', phone: '', province: '', city: '', district: '', detail: '', isDefault: false };

export default function Addresses() {
  const [list, setList] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [editing, setEditing] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [msg, setMsg] = useState('');

  const load = async () => {
    setLoading(true);
    const res = await api.get('/addresses');
    setList(res.data.list);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const set = (key: keyof typeof EMPTY_FORM) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [key]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });

  const submit = async () => {
    setMsg('');
    try {
      if (editing) await api.put(`/addresses/${editing}`, form);
      else await api.post('/addresses', form);
      setShowForm(false);
      setEditing(null);
      setForm({ ...EMPTY_FORM });
      await load();
    } catch (e: any) {
      setMsg(e.message);
    }
  };

  const edit = (a: Address) => {
    setEditing(a.id);
    setForm({
      name: a.name,
      phone: a.phone,
      province: a.province,
      city: a.city,
      district: a.district,
      detail: a.detail,
      isDefault: a.isDefault,
    });
    setShowForm(true);
  };

  const remove = async (a: Address) => {
    if (!window.confirm(`删除地址「${a.name}」？`)) return;
    await api.delete(`/addresses/${a.id}`);
    await load();
  };

  const setDefault = async (a: Address) => {
    await api.put(`/addresses/${a.id}`, { ...a, isDefault: true });
    await load();
  };

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <div className="flex items-center gap-3">
        <h1 className="font-title text-3xl text-ink">收货地址</h1>
        <button
          onClick={() => {
            setEditing(null);
            setForm({ ...EMPTY_FORM });
            setShowForm(!showForm);
          }}
          className="ml-auto px-4 py-1.5 text-sm rounded-md bg-clay text-white"
        >
          {showForm ? '收起' : '+ 新增地址'}
        </button>
      </div>

      {showForm && (
        <div className="mt-5 bg-card border border-line rounded-xl p-5">
          <h2 className="font-title text-base text-ink mb-4">{editing ? '编辑地址' : '新增地址'}</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            <input value={form.name} onChange={set('name')} placeholder="收货人" className="px-3 py-2 text-sm rounded-md border border-line bg-card outline-none focus:border-clay-soft" />
            <input value={form.phone} onChange={set('phone')} placeholder="手机号" className="px-3 py-2 text-sm rounded-md border border-line bg-card outline-none focus:border-clay-soft" />
            <input value={form.province} onChange={set('province')} placeholder="省（如 浙江省）" className="px-3 py-2 text-sm rounded-md border border-line bg-card outline-none focus:border-clay-soft" />
            <input value={form.city} onChange={set('city')} placeholder="市（如 杭州市）" className="px-3 py-2 text-sm rounded-md border border-line bg-card outline-none focus:border-clay-soft" />
            <input value={form.district} onChange={set('district')} placeholder="区/县（如 西湖区）" className="px-3 py-2 text-sm rounded-md border border-line bg-card outline-none focus:border-clay-soft" />
            <input value={form.detail} onChange={set('detail')} placeholder="详细地址（街道、门牌号）" className="sm:col-span-2 px-3 py-2 text-sm rounded-md border border-line bg-card outline-none focus:border-clay-soft" />
          </div>
          <label className="mt-3 flex items-center gap-2 text-sm text-ink-soft">
            <input type="checkbox" checked={form.isDefault} onChange={set('isDefault')} className="w-4 h-4 accent-clay" />
            设为默认地址
          </label>
          <div className="mt-4 flex items-center gap-3">
            <button onClick={submit} className="px-5 py-2 rounded-md bg-clay text-white text-sm">
              保存
            </button>
            {msg && <span className="text-xs text-clay">{msg}</span>}
          </div>
        </div>
      )}

      {loading ? (
        <Loading />
      ) : list.length === 0 ? (
        <Empty text="还没有收货地址" />
      ) : (
        <ul className="mt-6 space-y-3">
          {list.map((a) => (
            <li key={a.id} className="bg-card border border-line rounded-xl p-5 flex items-start gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <b className="text-ink">{a.name}</b>
                  <span className="text-sm text-ink-soft">{a.phone}</span>
                  {a.isDefault && (
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-clay/10 text-clay border border-clay/30">
                      默认
                    </span>
                  )}
                </div>
                <p className="mt-1.5 text-sm text-ink-soft">
                  {a.province} {a.city} {a.district} {a.detail}
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 text-xs shrink-0">
                {!a.isDefault && (
                  <button onClick={() => setDefault(a)} className="px-3 py-1.5 rounded-md border border-line hover:border-clay-soft">
                    设为默认
                  </button>
                )}
                <button onClick={() => edit(a)} className="px-3 py-1.5 rounded-md border border-line hover:border-clay-soft">
                  编辑
                </button>
                <button onClick={() => remove(a)} className="px-3 py-1.5 rounded-md border border-line text-clay hover:border-clay">
                  删除
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
      <div className="h-10" />
    </div>
  );
}
