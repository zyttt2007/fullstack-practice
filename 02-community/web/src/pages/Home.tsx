import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import QuestionCard from '../components/QuestionCard';
import { Empty, Loading, Pagination, Tag } from '../components/ui';
import type { Question } from '../lib/types';
import { gradientBg } from '../lib/visual';
import { useAuth } from '../context/AuthContext';

const PAGE_SIZE = 8;
const SORTS = [
  { key: 'latest', label: '最新' },
  { key: 'hot', label: '热门' },
  { key: 'unsolved', label: '未解决' },
] as const;

export default function Home() {
  const { user } = useAuth();
  const [sort, setSort] = useState<(typeof SORTS)[number]['key']>('latest');
  const [tag, setTag] = useState('');
  const [tags, setTags] = useState<{ name: string; count: number }[]>([]);
  const [input, setInput] = useState('');
  const [keyword, setKeyword] = useState('');
  const [page, setPage] = useState(1);
  const [list, setList] = useState<Question[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/tags').then((res) => setTags(res.data.list));
  }, []);

  useEffect(() => {
    setLoading(true);
    const q = new URLSearchParams({ sort, page: String(page), pageSize: String(PAGE_SIZE) });
    if (tag) q.set('tag', tag);
    if (keyword) q.set('keyword', keyword);
    api
      .get(`/questions?${q.toString()}`)
      .then((res) => {
        setList(res.data.list);
        setTotal(res.data.total);
      })
      .catch(() => setList([]))
      .finally(() => setLoading(false));
  }, [sort, tag, keyword, page]);

  return (
    <div>
      {/* Hero */}
      <section className="relative border-b border-line overflow-hidden">
        <div className="absolute inset-0 steam opacity-80" />
        <div className="relative max-w-5xl mx-auto px-6 py-12 flex items-center gap-8">
          <div className="flex-1">
            <p className="text-xs tracking-[0.3em] text-fire-soft">HEARTHASK · 有烟火气的问答</p>
            <h1 className="font-title text-3xl sm:text-4xl mt-3 text-ink leading-snug">
              每一个失败过的厨房新手，
              <br />
              都值得一个好答案
            </h1>
            <p className="mt-3 max-w-lg text-sm text-ink-soft leading-relaxed">
              提问要花 5 分，回答能赚 10 分，好答案被采纳再拿 30 分。把踩过的坑变成别人的台阶。
            </p>
            {!user && (
              <div className="mt-5 flex gap-3 text-sm">
                <Link to="/register" className="px-4 py-2 rounded-md bg-fire text-white">
                  注册送 100 积分
                </Link>
                <Link to="/login" className="px-4 py-2 rounded-md border border-line bg-card">
                  登录
                </Link>
              </div>
            )}
          </div>
          <div
            className="hidden md:flex w-40 h-40 rounded-2xl items-center justify-center text-7xl shrink-0"
            style={{ background: gradientBg(24, 78, 60) }}
          >
            🍳
          </div>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-6 py-8 grid lg:grid-cols-[1fr_260px] gap-8">
        <div>
          {/* 排序 + 搜索 */}
          <div className="flex items-center gap-2 flex-wrap">
            {SORTS.map((s) => (
              <button
                key={s.key}
                onClick={() => {
                  setSort(s.key);
                  setPage(1);
                }}
                className={`px-4 py-1.5 rounded-full text-sm border transition ${
                  sort === s.key ? 'bg-fire text-white border-fire' : 'bg-card text-ink-soft border-line hover:border-fire-soft'
                }`}
              >
                {s.label}
              </button>
            ))}
            {tag && (
              <span className="text-xs text-ink-soft">
                筛选标签 <b className="text-fire">#{tag}</b>
                <button onClick={() => setTag('')} className="ml-2 underline">
                  清除
                </button>
              </span>
            )}
            <form
              className="ml-auto flex items-center"
              onSubmit={(e) => {
                e.preventDefault();
                setKeyword(input.trim());
                setPage(1);
              }}
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="搜索问题…"
                className="w-40 px-3 py-1.5 text-sm rounded-l-md border border-line bg-card outline-none focus:border-fire-soft"
              />
              <button className="px-3 py-1.5 text-sm rounded-r-md bg-fire text-white">搜</button>
            </form>
          </div>

          {/* 列表 */}
          <div className="mt-5 space-y-3">
            {loading ? (
              <Loading />
            ) : list.length === 0 ? (
              <Empty text="没有找到相关问题" />
            ) : (
              list.map((q) => <QuestionCard key={q.id} q={q} />)
            )}
          </div>

          <Pagination page={page} pageSize={PAGE_SIZE} total={total} onChange={setPage} />
        </div>

        {/* 侧栏 */}
        <aside className="space-y-5">
          <div className="bg-card border border-line rounded-xl p-5">
            <h3 className="font-title text-sm text-ink mb-3">热门标签</h3>
            <div className="flex flex-wrap gap-2">
              {tags.map((t) => (
                <Tag
                  key={t.name}
                  active={tag === t.name}
                  onClick={() => {
                    setTag(tag === t.name ? '' : t.name);
                    setPage(1);
                  }}
                >
                  {t.name} {t.count}
                </Tag>
              ))}
              {tags.length === 0 && <span className="text-xs text-ink-soft">暂无标签</span>}
            </div>
          </div>

          <div className="bg-card border border-line rounded-xl p-5">
            <h3 className="font-title text-sm text-ink mb-3">积分怎么玩</h3>
            <ul className="space-y-2 text-xs text-ink-soft">
              <li className="flex justify-between"><span>提问</span><b className="text-fire">−5</b></li>
              <li className="flex justify-between"><span>回答问题</span><b className="text-leaf">+10</b></li>
              <li className="flex justify-between"><span>回答被采纳</span><b className="text-leaf">+30</b></li>
              <li className="flex justify-between"><span>问题被点赞</span><b className="text-leaf">+5</b></li>
              <li className="flex justify-between"><span>回答被点赞</span><b className="text-leaf">+10</b></li>
            </ul>
            <Link to="/leaderboard" className="block mt-4 text-center text-xs text-fire underline">
              看看谁积分最高 →
            </Link>
          </div>
        </aside>
      </div>
      <div className="h-8" />
    </div>
  );
}
