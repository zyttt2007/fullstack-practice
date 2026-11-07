import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Avatar } from './ui';
import { gradientBg } from '../lib/visual';

const navItems = [
  { to: '/', label: '首页' },
  { to: '/archive', label: '归档' },
  { to: '/write', label: '写文章' },
  { to: '/profile', label: '我的' },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col bg-paper">
      <header className="sticky top-0 z-20 bg-paper/92 backdrop-blur border-b border-line">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center gap-5">
          <Link to="/" className="flex items-center gap-2 font-title text-lg text-moss">
            <span
              className="w-7 h-7 rounded-md text-white text-sm inline-flex items-center justify-center"
              style={{ background: gradientBg(152, 46, 34) }}
            >
              苔
            </span>
            青苔笔记
          </Link>

          <nav className="hidden sm:flex items-center gap-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `px-3 py-1.5 rounded-md text-sm transition ${
                    isActive ? 'text-moss bg-white border border-line' : 'text-ink-soft hover:text-moss'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-3 text-sm">
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
                <Link to="/login" className="text-ink-soft hover:text-moss">
                  登录
                </Link>
                <Link
                  to="/register"
                  className="px-3 py-1.5 rounded-md bg-moss text-white hover:bg-moss/90"
                >
                  注册
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-line mt-16 py-8 text-center text-xs text-ink-soft">
        <p className="font-title text-sm text-moss mb-1">青苔笔记 · MossNote</p>
        <p>旧书 · 城市漫步 · 手冲咖啡 —— 全栈项目练习 ① React + Express + 数据库</p>
      </footer>
    </div>
  );
}
