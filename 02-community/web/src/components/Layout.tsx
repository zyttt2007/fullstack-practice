import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Avatar } from './ui';
import { gradientBg } from '../lib/visual';

const navItems = [
  { to: '/', label: '问答' },
  { to: '/ask', label: '提问' },
  { to: '/leaderboard', label: '排行榜' },
  { to: '/mine', label: '我的' },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col bg-cream">
      <header className="sticky top-0 z-20 bg-cream/92 backdrop-blur border-b border-line">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center gap-5">
          <Link to="/" className="flex items-center gap-2 font-title text-lg text-fire">
            <span className="w-7 h-7 rounded-md text-white text-sm inline-flex items-center justify-center" style={{ background: gradientBg(24, 55, 40) }}>
              灶
            </span>
            灶台问答
          </Link>

          <nav className="hidden sm:flex items-center gap-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `px-3 py-1.5 rounded-md text-sm transition ${
                    isActive ? 'text-fire bg-white border border-line' : 'text-ink-soft hover:text-fire'
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
                <span className="px-2 py-0.5 rounded-full bg-white border border-line text-fire text-xs font-title">
                  积分 {user.points}
                </span>
                <Avatar token={user.avatar} name={user.username} size={30} />
                <span className="text-ink">{user.username}</span>
                <button
                  onClick={() => {
                    logout();
                    navigate('/');
                  }}
                  className="text-ink-soft hover:text-fire"
                >
                  退出
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-ink-soft hover:text-fire">
                  登录
                </Link>
                <Link to="/register" className="px-3 py-1.5 rounded-md bg-fire text-white hover:bg-fire-deep">
                  注册
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-line mt-16 py-8 text-center text-xs text-ink-soft">
        <p className="font-title text-sm text-fire mb-1">灶台问答 · HearthAsk</p>
        <p>新手下厨互助社区 —— 全栈项目练习 ② React + Express + 数据库</p>
      </footer>
    </div>
  );
}
