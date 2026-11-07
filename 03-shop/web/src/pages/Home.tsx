import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../api/client';
import ProductCard from '../components/ProductCard';
import { Empty, Loading } from '../components/ui';
import type { Product } from '../lib/types';
import { gradientBg } from '../lib/visual';

const SORTS = [
  { key: 'default', label: '综合' },
  { key: 'sales', label: '销量' },
  { key: 'newest', label: '最新' },
  { key: 'price_asc', label: '价格 ↑' },
  { key: 'price_desc', label: '价格 ↓' },
];

export default function Home() {
  const [params] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [category, setCategory] = useState('');
  const [sort, setSort] = useState('default');
  const [input, setInput] = useState(params.get('keyword') || '');
  const [keyword, setKeyword] = useState(params.get('keyword') || '');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const q = new URLSearchParams({ sort, pageSize: '60' });
    if (category) q.set('category', category);
    if (keyword) q.set('keyword', keyword);
    api
      .get(`/products?${q.toString()}`)
      .then((res) => {
        setProducts(res.data.list);
        setCategories(res.data.categories);
      })
      .finally(() => setLoading(false));
  }, [category, sort, keyword]);

  return (
    <div>
      {/* Hero */}
      <section className="relative border-b border-line overflow-hidden">
        <div className="absolute inset-0 grain opacity-80" />
        <div className="relative max-w-6xl mx-auto px-6 py-12">
          <p className="text-xs tracking-[0.3em] text-clay-soft">HANDMADEONE · 一次一件</p>
          <h1 className="font-title text-3xl sm:text-4xl mt-3 text-ink leading-snug">
            手作的东西，
            <br />
            会用出感情来
          </h1>
          <p className="mt-3 max-w-lg text-sm text-ink-soft leading-relaxed">
            粗陶、亚麻、黄铜、大豆蜡。每一样都是手做的，所以每一只都长得不太一样。
          </p>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* 分类 + 排序 + 搜索 */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setCategory('')}
            className={`px-3.5 py-1.5 rounded-full text-sm border transition ${
              category === '' ? 'bg-clay text-white border-clay' : 'bg-card text-ink-soft border-line hover:border-clay-soft'
            }`}
          >
            全部
          </button>
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`px-3.5 py-1.5 rounded-full text-sm border transition ${
                category === c ? 'bg-clay text-white border-clay' : 'bg-card text-ink-soft border-line hover:border-clay-soft'
              }`}
            >
              {c}
            </button>
          ))}

          <div className="ml-auto flex items-center gap-2">
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="px-3 py-1.5 text-sm rounded-md border border-line bg-card outline-none focus:border-clay-soft"
            >
              {SORTS.map((s) => (
                <option key={s.key} value={s.key}>
                  {s.label}
                </option>
              ))}
            </select>
            <form
              className="flex items-center"
              onSubmit={(e) => {
                e.preventDefault();
                setKeyword(input.trim());
              }}
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="搜索商品…"
                className="w-40 px-3 py-1.5 text-sm rounded-l-md border border-line bg-card outline-none focus:border-clay-soft"
              />
              <button className="px-3 py-1.5 text-sm rounded-r-md bg-clay text-white">搜</button>
            </form>
          </div>
        </div>

        {keyword && (
          <p className="mt-4 text-sm text-ink-soft">
            关键词「<b className="text-clay">{keyword}</b>」共 {products.length} 件
          </p>
        )}

        <div className="mt-6">
          {loading ? (
            <Loading />
          ) : products.length === 0 ? (
            <Empty text="没有找到相关商品" />
          ) : (
            <div className="grid gap-5 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {products.map((p) => (
                <ProductCard key={p.id} p={p} />
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="h-10" />
    </div>
  );
}
