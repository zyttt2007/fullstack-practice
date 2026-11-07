import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import api from '../api/client';
import { Cover, Loading } from '../components/ui';
import type { Category } from '../lib/types';
import { COVER_PRESETS } from '../lib/visual';

const TEMPLATE = `## 小标题

正文从这里开始…

- 可以列点
- 也可以 > 引用一句话

\`\`\`text
需要的话放一段代码或参数
\`\`\`
`;

export default function Write() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [categories, setCategories] = useState<Category[]>([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState(TEMPLATE);
  const [category, setCategory] = useState('随笔');
  const [tagsText, setTagsText] = useState('');
  const [cover, setCover] = useState(COVER_PRESETS[0]);
  const [loading, setLoading] = useState(Boolean(id));
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    api.get('/categories').then((res) => {
      setCategories(res.data.list);
      if (res.data.list.length) setCategory((c) => c || res.data.list[0].name);
    });
    if (!id) return;
    api
      .get(`/posts/${id}`)
      .then((res) => {
        const p = res.data.post;
        setTitle(p.title);
        setContent(p.content);
        setCategory(p.category);
        setTagsText((p.tags || []).join(', '));
        setCover(p.cover || COVER_PRESETS[0]);
      })
      .catch((e) => setMsg(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  const tags = tagsText
    .split(/[,，\s]+/)
    .map((t) => t.trim())
    .filter(Boolean);

  const save = async (status: 'published' | 'draft') => {
    if (!title.trim()) return setMsg('标题不能为空');
    setSaving(true);
    setMsg('');
    try {
      const payload = { title: title.trim(), content, category, tags, cover, status };
      const res = id
        ? await api.put(`/posts/${id}`, payload)
        : await api.post('/posts', payload);
      const saved = res.data.post;
      navigate(status === 'draft' ? '/profile' : `/post/${saved.id}`);
    } catch (e: any) {
      setMsg(e.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loading />;

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <div className="flex items-center gap-3 mb-5">
        <h1 className="font-title text-2xl text-ink">{id ? '编辑文章' : '写一篇新的'}</h1>
        <span className="text-xs text-ink-soft">
          {content.replace(/\s/g, '').length} 字 · 约{' '}
          {Math.max(1, Math.round(content.replace(/\s/g, '').length / 350))} 分钟
        </span>
        {msg && <span className="ml-auto text-xs text-clay">{msg}</span>}
      </div>

      <div className="grid lg:grid-cols-[1fr_1fr] gap-6">
        {/* 左：编辑 */}
        <div className="space-y-4">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="文章标题"
            className="w-full px-4 py-3 font-title text-xl rounded-lg border border-line bg-card outline-none focus:border-moss-soft"
          />

          <div className="grid grid-cols-2 gap-3">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="px-3 py-2 text-sm rounded-md border border-line bg-card outline-none focus:border-moss-soft"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
            <input
              value={tagsText}
              onChange={(e) => setTagsText(e.target.value)}
              placeholder="标签，逗号分隔"
              className="px-3 py-2 text-sm rounded-md border border-line bg-card outline-none focus:border-moss-soft"
            />
          </div>

          <div>
            <p className="text-xs text-ink-soft mb-2">封面</p>
            <div className="flex flex-wrap gap-2">
              {COVER_PRESETS.map((p) => (
                <button
                  key={p}
                  onClick={() => setCover(p)}
                  className={`w-14 h-14 rounded-lg overflow-hidden border-2 transition ${
                    cover === p ? 'border-moss' : 'border-line hover:border-moss-soft'
                  }`}
                >
                  <Cover token={p} glyphSize={24} />
                </button>
              ))}
            </div>
          </div>

          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={20}
            placeholder="用 Markdown 写点什么…"
            className="w-full px-4 py-3 text-sm rounded-lg border border-line bg-card outline-none focus:border-moss-soft resize-y font-mono leading-relaxed"
          />

          <div className="flex items-center gap-3">
            <button
              onClick={() => save('published')}
              disabled={saving}
              className="px-5 py-2 rounded-md bg-moss text-white text-sm disabled:opacity-50"
            >
              {id ? '保存修改' : '发布文章'}
            </button>
            <button
              onClick={() => save('draft')}
              disabled={saving}
              className="px-5 py-2 rounded-md border border-line text-sm text-ink-soft hover:border-moss-soft"
            >
              存为草稿
            </button>
            <button
              onClick={() => navigate(-1)}
              className="ml-auto text-sm text-ink-soft hover:text-moss"
            >
              取消
            </button>
          </div>
        </div>

        {/* 右：实时预览 */}
        <div className="bg-card border border-line rounded-lg p-6 min-h-[520px]">
          <p className="text-xs text-ink-soft mb-4 pb-3 border-b border-line">实时预览</p>
          {title && <h2 className="font-title text-2xl text-ink mb-3">{title}</h2>}
          <div className="md-body">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
          </div>
        </div>
      </div>
    </div>
  );
}
