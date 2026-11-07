import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import PostCard from '../components/PostCard';
import { Empty, Loading } from '../components/ui';
import type { Post } from '../lib/types';

interface Month {
  month: string;
  count: number;
}

export default function Archive() {
  const [months, setMonths] = useState<Month[]>([]);
  const [active, setActive] = useState<string>('');
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/posts/archive')
      .then((res) => {
        const list: Month[] = res.data.months;
        setMonths(list);
        if (list.length) setActive(list[0].month);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!active) return;
    setLoading(true);
    api
      .get(`/posts?month=${active}&pageSize=20`)
      .then((res) => setPosts(res.data.list))
      .catch(() => setPosts([]))
      .finally(() => setLoading(false));
  }, [active]);

  const label = (m: string) => {
    const [y, mm] = m.split('-');
    return `${y} 年 ${Number(mm)} 月`;
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <h1 className="font-title text-3xl text-ink">归档</h1>
      <p className="mt-2 text-sm text-ink-soft">按月份翻一翻，看看哪段时间写得最多。</p>

      <div className="mt-6 flex flex-wrap gap-2">
        {months.map((m) => (
          <button
            key={m.month}
            onClick={() => setActive(m.month)}
            className={`px-3 py-1.5 rounded-full text-sm border transition ${
              active === m.month
                ? 'bg-moss text-white border-moss'
                : 'bg-card text-ink-soft border-line hover:border-moss-soft'
            }`}
          >
            {label(m.month)} <span className="opacity-60">{m.count}</span>
          </button>
        ))}
      </div>

      <div className="mt-8">
        {loading ? (
          <Loading />
        ) : posts.length === 0 ? (
          <Empty text="这个月还没有文章" />
        ) : (
          <div className="grid gap-6 sm:grid-cols-2">
            {posts.map((p) => (
              <PostCard key={p.id} post={p} />
            ))}
          </div>
        )}
      </div>

      <div className="mt-10 text-sm">
        <Link to="/" className="text-ink-soft hover:text-moss">
          ← 回到首页
        </Link>
      </div>
      <div className="h-10" />
    </div>
  );
}
