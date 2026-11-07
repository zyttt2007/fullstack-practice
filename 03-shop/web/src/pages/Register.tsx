import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { gradientBg } from '../lib/visual';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', email: '', password: '' });
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [key]: e.target.value });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMsg('');
    try {
      await register(form.username.trim(), form.email.trim(), form.password);
      navigate('/');
    } catch (err: any) {
      setMsg(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-6 py-16">
      <div className="rounded-xl border border-line p-8" style={{ background: gradientBg(16, 90, 80) }}>
        <h1 className="font-title text-2xl text-ink">注册新账号</h1>
        <p className="mt-1 text-xs text-ink-soft">注册即送三张满减券（满 99 减 10 / 满 199 减 25 / 满 299 减 40）</p>

        <form onSubmit={submit} className="mt-6 space-y-4">
          <div>
            <label className="block text-xs text-ink-soft mb-1">用户名</label>
            <input value={form.username} onChange={set('username')} className="w-full px-3 py-2 text-sm rounded-md border border-line bg-card outline-none focus:border-clay-soft" />
          </div>
          <div>
            <label className="block text-xs text-ink-soft mb-1">邮箱</label>
            <input value={form.email} onChange={set('email')} className="w-full px-3 py-2 text-sm rounded-md border border-line bg-card outline-none focus:border-clay-soft" />
          </div>
          <div>
            <label className="block text-xs text-ink-soft mb-1">密码</label>
            <input type="password" value={form.password} onChange={set('password')} className="w-full px-3 py-2 text-sm rounded-md border border-line bg-card outline-none focus:border-clay-soft" />
          </div>
          {msg && <p className="text-xs text-clay">{msg}</p>}
          <button disabled={busy} className="w-full py-2 rounded-md bg-clay text-white text-sm disabled:opacity-50">
            {busy ? '注册中…' : '注册并登录'}
          </button>
        </form>

        <p className="mt-5 text-xs text-ink-soft text-center">
          已有账号？
          <Link to="/login" className="text-clay underline ml-1">
            去登录
          </Link>
        </p>
      </div>
    </div>
  );
}
