import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../api/client';
import PostCard from '../components/PostCard';
import { Empty, Loading, Pagination } from '../components/ui';
import type { Category, Post } from '../lib/types';
import { gradientBg } from '../lib/visual';

const PAGE_SIZE = 6;

export default function Home() {
  const [params, setParams] = useSearchParams();
  const month = params.get('month') || '';

  const [categories, setCategories] = useState<Category[]>([]);
  const [list, setList] = useState<Post[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [category, setCategory] = useState('');
  const [input, setInput] = useState('');
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/categories').then((res) => setCategories(res.data.list));
  }, []);

  useEffect(() => {
    setLoading(true);
    const query = new URLSearchParams({
      page: String(page),
      pageSize: String(PAGE_SIZE),
      status: 'published',
    });
    if (category) query.set('category', category);
    if (keyword) query.set('keyword', keyword);
    if (month) query.set('month', month);

    api
      .get(`/posts?${query.toString()}`)
      .then((res) => {
        setList(res.data.list);
        setTotal(res.data.total);
      })
      .catch(() => setList([]))
      .finally(() => setLoading(false));
  }, [page, category, keyword, month]);

  const chooseCategory = (name: string) => {
    setCategory(name);
    setPage(1);
  };

  const resetMonth = () => {
    params.delete('month');
    setParams(params);
  };

  const totalPosts = categories.reduce((sum, c) => sum + c.postCount, 0);

  return (
    <div>
      {/* Hero */}
      <section className="relative border-b border-line">
        <div className="absolute inset-0 paper-grain opacity-70" />
        <div className="relative max-w-5xl mx-auto px-6 py-14">
          <p className="text-xs tracking-[0.3em] text-moss-soft">MOSSNOTE · 慢一点的记录</p>
          <h1 className="font-title text-4xl sm:text-5xl mt-3 text-ink leading-tight">
            在旧书、河岸与咖啡之间，
            <br />
            记下走得很慢的那些角落
          </h1>
          <p className="mt-4 max-w-xl text-sm text-ink-soft leading-relaxed">
            青苔笔记是一个私人写作博客：写文章、存草稿、给喜欢的句子点赞、和读到同一页的人聊两句。
          </p>
          <div className="mt-7 flex items-center gap-6 text-sm">
            <div>
              <div className="font-title text-2xl text-moss">{totalPosts}</div>
              <div className="text-ink-soft text-xs">篇文章</div>
            </div>
            <div className="w-px h-8 bg-line" />
            <div>
              <div className="font-title text-2xl text-moss">{categories.length}</div>
              <div className="text-ink-soft text-xs">个分类</div>
            </div>
            <div className="w-px h-8 bg-line" />
            <div className="text-sm text-ink-soft leading-relaxed">
              常写的三件事：
              <br />
              <span className="text-moss">旧书 · 城市漫步 · 手冲咖啡</span>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-6">
        {/* 分类条 + 搜索 */}
        <div className="flex flex-wrap items-center gap-2 py-7">
          <button
            onClick={() => chooseCategory('')}
            className={`px-3 py-1.5 rounded-full text-sm border transition ${
              category === ''
                ? 'bg-moss text-white border-moss'
                : 'bg-card text-ink-soft border-line hover:border-moss-soft'
            }`}
          >
            全部
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => chooseCategory(c.name)}
              className={`px-3 py-1.5 rounded-full text-sm border transition ${
                category === c.name
                  ? 'bg-moss text-white border-moss'
                  : 'bg-card text-ink-soft border-line hover:border-moss-soft'
              }`}
            >
              {c.name} <span className="opacity-60">{c.postCount}</span>
            </button>
          ))}

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
              placeholder="搜索标题或正文…"
              className="w-44 sm:w-56 px-3 py-1.5 text-sm rounded-l-md border border-line bg-card outline-none focus:border-moss-soft"
            />
            <button className="px-3 py-1.5 text-sm rounded-r-md bg-moss text-white">搜索</button>
          </form>
        </div>

        {month && (
          <div
            className="mb-5 px-4 py-2.5 rounded-lg text-sm flex items-center gap-3"
            style={{ background: gradientBg(152, 92, 88), color: '#22322c' }}
          >
            <span>
              正在查看归档：<b className="font-title">{month.replace('-', ' 年 ')} 月</b>
            </span>
            <button onClick={resetMonth} className="ml-auto text-moss underline text-xs">
              清除筛选
            </button>
          </div>
        )}

        {keyword && (
          <p className="mb-4 text-sm text-ink-soft">
            关键词「<b className="text-moss">{keyword}</b>」共 {total} 条结果
          </p>
        )}

        {loading ? (
          <Loading />
        ) : list.length === 0 ? (
          <Empty text="没有找到文章，换个词试试" />
        ) : (
          <div className="grid gap-6 sm:grid-cols-2">
            {list.map((p, i) => (
              <PostCard key={p.id} post={p} wide={i === 0 && list.length > 2 && !month} />
            ))}
          </div>
        )}

        <Pagination page={page} pageSize={PAGE_SIZE} total={total} onChange={setPage} />
        <div className="h-10" />
      </div>
    </div>
  );
}
