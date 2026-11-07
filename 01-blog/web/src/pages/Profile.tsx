import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Avatar, Empty, Loading } from '../components/ui';
import type { Post } from '../lib/types';
import { AVATAR_PRESETS, gradientBg, gradientParts } from '../lib/visual';
import { formatDate } from '../lib/visual';

export default function Profile() {
  const { user, updateProfile } = useAuth();
  const navigate = useNavigate();

  const [tab, setTab] = useState<'published' | 'draft'>('published');
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [bio, setBio] = useState('');
  const [avatar, setAvatar] = useState('');
  const [msg, setMsg] = useState('');

  useEffect(() => {
    if (!user) return;
    setBio(user.bio || '');
    setAvatar(user.avatar || AVATAR_PRESETS[0]);
  }, [user]);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    api
      .get(`/posts?authorId=${user.id}&status=${tab}&pageSize=50`)
      .then((res) => setPosts(res.data.list))
      .catch(() => setPosts([]))
      .finally(() => setLoading(false));
  }, [user, tab]);

  if (!user) return <Loading />;

  const saveProfile = async () => {
    try {
      await updateProfile({ avatar, bio });
      setMsg('资料已更新');
      setTimeout(() => setMsg(''), 2000);
    } catch (e: any) {
      setMsg(e.message);
    }
  };

  const remove = async (p: Post) => {
    if (!window.confirm(`删除《${p.title}》？`)) return;
    await api.delete(`/posts/${p.id}`);
    setPosts(posts.filter((x) => x.id !== p.id));
  };

  const publish = async (p: Post) => {
    await api.put(`/posts/${p.id}`, { status: 'published' });
    setPosts(posts.map((x) => (x.id === p.id ? { ...x, status: 'published' } : x)));
  };

  const hue = gradientParts(user.avatar)?.hue ?? 152;

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      {/* 资料卡 */}
      <section
        className="rounded-xl border border-line p-6 flex flex-col sm:flex-row gap-6"
        style={{ background: gradientBg(hue, 94, 90) }}
      >
        <Avatar token={avatar} name={user.username} size={72} />
        <div className="flex-1">
          <h1 className="font-title text-2xl text-ink">{user.username}</h1>
          <p className="text-xs text-ink-soft mt-1">{user.email}</p>

          <div className="mt-4">
            <p className="text-xs text-ink-soft mb-2">头像</p>
            <div className="flex flex-wrap gap-2">
              {AVATAR_PRESETS.map((p) => (
                <button
                  key={p}
                  onClick={() => setAvatar(p)}
                  className={`w-10 h-10 rounded-full overflow-hidden border-2 ${
                    avatar === p ? 'border-moss' : 'border-transparent'
                  }`}
                >
                  <Avatar token={p} size={36} />
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4">
            <p className="text-xs text-ink-soft mb-1">简介</p>
            <input
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              maxLength={120}
              className="w-full px-3 py-2 text-sm rounded-md border border-line bg-card outline-none focus:border-moss-soft"
            />
          </div>

          <div className="mt-4 flex items-center gap-3">
            <button
              onClick={saveProfile}
              className="px-4 py-1.5 text-sm rounded-md bg-moss text-white"
            >
              保存资料
            </button>
            {msg && <span className="text-xs text-moss">{msg}</span>}
          </div>
        </div>
      </section>

      {/* 我的文章 */}
      <section className="mt-10">
        <div className="flex items-center gap-2">
          {(['published', 'draft'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-3 py-1.5 rounded-full text-sm border transition ${
                tab === t ? 'bg-moss text-white border-moss' : 'bg-card text-ink-soft border-line'
              }`}
            >
              {t === 'published' ? '已发布' : '草稿箱'}
            </button>
          ))}
          <Link
            to="/write"
            className="ml-auto px-4 py-1.5 text-sm rounded-md border border-line hover:border-moss-soft"
          >
            + 写文章
          </Link>
        </div>

        {loading ? (
          <Loading />
        ) : posts.length === 0 ? (
          <Empty text={tab === 'draft' ? '草稿箱是空的' : '还没有发布过文章'} />
        ) : (
          <ul className="mt-5 divide-y divide-line border border-line rounded-lg bg-card">
            {posts.map((p) => (
              <li key={p.id} className="p-4 flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <Link
                    to={`/post/${p.id}`}
                    className="font-title text-base text-ink hover:text-moss truncate block"
                  >
                    {p.title}
                  </Link>
                  <div className="mt-1 text-xs text-ink-soft">
                    {p.category} · {formatDate(p.createdAt)} · 👁 {p.views} · ♥ {p.likesCount} · 💬{' '}
                    {p.commentsCount}
                  </div>
                </div>
                {p.status === 'draft' && (
                  <button
                    onClick={() => publish(p)}
                    className="text-xs px-3 py-1 rounded-md border border-line hover:border-moss-soft"
                  >
                    发布
                  </button>
                )}
                <Link
                  to={`/write/${p.id}`}
                  className="text-xs px-3 py-1 rounded-md border border-line hover:border-moss-soft"
                >
                  编辑
                </Link>
                <button onClick={() => remove(p)} className="text-xs text-clay hover:underline">
                  删除
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="h-10" />
    </div>
  );
}
