import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { Avatar } from './ui';
import { gradientBg } from '../lib/visual';

const navItems = [
  { to: '/', label: '商店' },
  { to: '/orders', label: '我的订单' },
  { to: '/addresses', label: '收货地址' },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const { count } = useCart();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col bg-sand">
      <header className="sticky top-0 z-20 bg-sand/92 backdrop-blur border-b border-line">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center gap-5">
          <Link to="/" className="flex items-center gap-2 font-title text-lg text-clay">
            <span className="w-7 h-7 rounded-md text-white text-sm inline-flex items-center justify-center" style={{ background: gradientBg(16, 50, 38) }}>
              枚
            </span>
            一枚手作
          </Link>

          <nav className="hidden sm:flex items-center gap-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `px-3 py-1.5 rounded-md text-sm transition ${
                    isActive ? 'text-clay bg-white border border-line' : 'text-ink-soft hover:text-clay'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-4 text-sm">
            <Link to="/cart" className="relative text-ink-soft hover:text-clay">
              🛒 购物车
              {count > 0 && (
                <span className="absolute -top-2 -right-4 min-w-[18px] h-[18px] px-1 rounded-full bg-clay text-white text-[11px] inline-flex items-center justify-center">
                  {count}
                </span>
              )}
            </Link>
            {user ? (
              <>
                <Avatar token={user.avatar} name={user.username} size={30} />
                <span className="text-ink">{user.username}</span>
                <button
                  onClick={() => {
                    logout();
                    navigate('/');
                  }}
                  className="text-ink-soft hover:text-clay"
                >
                  退出
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-ink-soft hover:text-clay">
                  登录
                </Link>
                <Link to="/register" className="px-3 py-1.5 rounded-md bg-clay text-white hover:bg-clay-deep">
                  注册
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-line mt-16 py-8 text-center text-xs text-ink-soft">
        <p className="font-title text-sm text-clay mb-1">一枚手作 · HandmadeOne</p>
        <p>独立手作器物小店 —— 全栈项目练习 ③ React + Express + 数据库</p>
      </footer>
    </div>
  );
}
