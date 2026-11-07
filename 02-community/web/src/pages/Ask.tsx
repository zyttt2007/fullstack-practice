import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function Ask() {
  const { user, refresh } = useAuth();
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tagsText, setTagsText] = useState('');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!title.trim()) return setMsg('一句话概括你的问题');
    if (!content.trim()) return setMsg('请补充问题描述');
    setBusy(true);
    setMsg('');
    try {
      const tags = tagsText
        .split(/[,，\s]+/)
        .map((t) => t.trim())
        .filter(Boolean);
      const res = await api.post('/questions', { title: title.trim(), content, tags });
      await refresh();
      navigate(`/question/${res.data.question.id}`);
    } catch (e: any) {
      setMsg(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <div className="flex items-center gap-3">
        <h1 className="font-title text-2xl text-ink">提出一个问题</h1>
        <span className="px-2 py-0.5 rounded-full bg-fire/10 text-fire text-xs border border-fire/30">
          提问 −5 积分
        </span>
        {user && <span className="text-xs text-ink-soft ml-auto">当前积分：{user.points}</span>}
      </div>

      <div className="mt-6 grid lg:grid-cols-[1fr_1fr] gap-6">
        <div className="space-y-4">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="一句话概括你的问题（如：煎饺子总是粘锅怎么办？）"
            className="w-full px-4 py-3 font-title text-lg rounded-lg border border-line bg-card outline-none focus:border-fire-soft"
          />
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={12}
            placeholder="说清楚你试过什么、哪里不对。写得越具体，越有人能帮你。支持 Markdown。"
            className="w-full px-4 py-3 text-sm rounded-lg border border-line bg-card outline-none focus:border-fire-soft resize-y font-mono leading-relaxed"
          />
          <input
            value={tagsText}
            onChange={(e) => setTagsText(e.target.value)}
            placeholder="标签，逗号分隔（如：煎炸, 锅具）"
            className="w-full px-3 py-2 text-sm rounded-md border border-line bg-card outline-none focus:border-fire-soft"
          />
          <div className="flex items-center gap-3">
            <button
              onClick={submit}
              disabled={busy}
              className="px-5 py-2 rounded-md bg-fire text-white text-sm disabled:opacity-50"
            >
              {busy ? '发布中…' : '发布问题'}
            </button>
            <button onClick={() => navigate(-1)} className="text-sm text-ink-soft hover:text-fire">
              取消
            </button>
            {msg && <span className="text-xs text-fire">{msg}</span>}
          </div>
        </div>

        <div className="bg-card border border-line rounded-lg p-6 min-h-[420px]">
          <p className="text-xs text-ink-soft mb-4 pb-3 border-b border-line">预览</p>
          {title && <h2 className="font-title text-xl text-ink mb-3">{title}</h2>}
          {content ? (
            <div className="md-body">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
            </div>
          ) : (
            <p className="text-sm text-ink-soft">问题描述会显示在这里…</p>
          )}
        </div>
      </div>
    </div>
  );
}
