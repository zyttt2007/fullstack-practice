import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { gradientBg } from '../lib/visual';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('阿禾');
  const [password, setPassword] = useState('123456');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMsg('');
    try {
      await login(username.trim(), password);
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
        <h1 className="font-title text-2xl text-ink">登录一枚手作</h1>
        <p className="mt-1 text-xs text-ink-soft">演示账号：阿禾 / 小瓷 / 舟舟，密码 123456</p>

        <form onSubmit={submit} className="mt-6 space-y-4">
          <div>
            <label className="block text-xs text-ink-soft mb-1">用户名或邮箱</label>
            <input value={username} onChange={(e) => setUsername(e.target.value)} className="w-full px-3 py-2 text-sm rounded-md border border-line bg-card outline-none focus:border-clay-soft" />
          </div>
          <div>
            <label className="block text-xs text-ink-soft mb-1">密码</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-3 py-2 text-sm rounded-md border border-line bg-card outline-none focus:border-clay-soft" />
          </div>
          {msg && <p className="text-xs text-clay">{msg}</p>}
          <button disabled={busy} className="w-full py-2 rounded-md bg-clay text-white text-sm disabled:opacity-50">
            {busy ? '登录中…' : '登录'}
          </button>
        </form>

        <p className="mt-5 text-xs text-ink-soft text-center">
          还没有账号？
          <Link to="/register" className="text-clay underline ml-1">
            去注册（送三张满减券）
          </Link>
        </p>
      </div>
    </div>
  );
}
