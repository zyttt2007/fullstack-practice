import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Avatar, Cover, Empty, Loading, Tag } from '../components/ui';
import type { Comment, Post } from '../lib/types';
import { formatDate } from '../lib/visual';

export default function PostDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');

  useEffect(() => {
    setLoading(true);
    api
      .get(`/posts/${id}`)
      .then((res) => setPost(res.data.post))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
    api
      .get(`/comments?postId=${id}`)
      .then((res) => setComments(res.data.list))
      .catch(() => setComments([]));
  }, [id]);

  const toggleLike = async () => {
    if (!user) return navigate('/login');
    if (!post) return;
    try {
      const res = await api.post(`/posts/${post.id}/like`);
      setPost({ ...post, liked: res.data.liked, likesCount: res.data.likesCount });
    } catch (e: any) {
      setMsg(e.message);
    }
  };

  const submitComment = async () => {
    if (!user) return navigate('/login');
    const content = draft.trim();
    if (!content) return;
    try {
      const res = await api.post('/comments', { postId: Number(id), content });
      setComments([...comments, res.data.comment]);
      setDraft('');
      setPost(post ? { ...post, commentsCount: post.commentsCount + 1 } : post);
    } catch (e: any) {
      setMsg(e.message);
    }
  };

  const removeComment = async (cid: number) => {
    try {
      await api.delete(`/comments/${cid}`);
      setComments(comments.filter((c) => c.id !== cid));
      setPost(post ? { ...post, commentsCount: Math.max(0, post.commentsCount - 1) } : post);
    } catch (e: any) {
      setMsg(e.message);
    }
  };

  const removePost = async () => {
    if (!post || !window.confirm('确定删除这篇文章？')) return;
    await api.delete(`/posts/${post.id}`);
    navigate('/profile');
  };

  if (loading) return <Loading />;
  if (error || !post) return <Empty text={error || '文章不存在'} />;

  const isOwner = user?.id === post.authorId;

  return (
    <article className="max-w-3xl mx-auto px-6 py-10">
      <Link to="/" className="text-sm text-ink-soft hover:text-moss">
        ← 返回首页
      </Link>

      <div className="mt-5 flex items-center gap-2 text-xs text-ink-soft">
        <span className="px-2 py-0.5 rounded-full bg-white border border-line text-moss">
          {post.category}
        </span>
        {post.status === 'draft' && (
          <span className="px-2 py-0.5 rounded-full bg-clay text-white">草稿（仅自己可见）</span>
        )}
        <span>{formatDate(post.createdAt)}</span>
        <span className="text-line">·</span>
        <span>约 {post.readingMinutes} 分钟</span>
        <span className="text-line">·</span>
        <span>👁 {post.views}</span>
      </div>

      <h1 className="font-title text-3xl sm:text-4xl mt-4 leading-tight text-ink">{post.title}</h1>

      <div className="mt-5 flex items-center gap-3">
        <Avatar token={post.author.avatar} name={post.author.username} size={40} />
        <div className="text-sm">
          <div className="text-ink">{post.author.username}</div>
          <div className="text-xs text-ink-soft">{post.author.bio || '这个人很懒，还没写简介'}</div>
        </div>
        {isOwner && (
          <div className="ml-auto flex gap-2 text-xs">
            <Link
              to={`/write/${post.id}`}
              className="px-3 py-1.5 rounded-md border border-line hover:border-moss-soft"
            >
              编辑
            </Link>
            <button
              onClick={removePost}
              className="px-3 py-1.5 rounded-md border border-line text-clay hover:border-clay"
            >
              删除
            </button>
          </div>
        )}
      </div>

      <div className="mt-7 rounded-xl overflow-hidden border border-line aspect-[21/9]">
        <Cover token={post.cover} glyphSize={84} />
      </div>

      <div className="mt-8 md-body">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{post.content}</ReactMarkdown>
      </div>

      {post.tags.length > 0 && (
        <div className="mt-8 flex flex-wrap gap-2">
          {post.tags.map((t) => (
            <Tag key={t}>{t}</Tag>
          ))}
        </div>
      )}

      {/* 点赞 */}
      <div className="mt-10 flex items-center gap-4 border-y border-line py-5">
        <button
          onClick={toggleLike}
          className={`px-5 py-2 rounded-full text-sm border transition ${
            post.liked
              ? 'bg-clay text-white border-clay'
              : 'bg-card text-ink-soft border-line hover:border-clay hover:text-clay'
          }`}
        >
          {post.liked ? '♥ 已喜欢' : '♡ 喜欢'} · {post.likesCount}
        </button>
        <span className="text-sm text-ink-soft">💬 {post.commentsCount} 条评论</span>
        {msg && <span className="text-xs text-clay">{msg}</span>}
      </div>

      {/* 评论 */}
      <section className="mt-8">
        <h2 className="font-title text-lg text-ink">评论</h2>

        <div className="mt-4">
          {user ? (
            <div className="flex gap-3">
              <Avatar token={user.avatar} name={user.username} size={34} />
              <div className="flex-1">
                <textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  rows={3}
                  placeholder="说点什么…"
                  className="w-full px-3 py-2 text-sm rounded-md border border-line bg-card outline-none focus:border-moss-soft resize-none"
                />
                <div className="mt-2 flex justify-end">
                  <button
                    onClick={submitComment}
                    className="px-4 py-1.5 text-sm rounded-md bg-moss text-white"
                  >
                    发表评论
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-ink-soft">
              <Link to="/login" className="text-moss underline">
                登录
              </Link>{' '}
              后可以参与评论
            </p>
          )}
        </div>

        <ul className="mt-6 space-y-5">
          {comments.map((c) => (
            <li key={c.id} className="flex gap-3">
              <Avatar token={c.author.avatar} name={c.author.username} size={34} />
              <div className="flex-1">
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-ink">{c.author.username}</span>
                  <span className="text-xs text-ink-soft">{formatDate(c.createdAt)}</span>
                  {(user?.id === c.author.id || isOwner) && (
                    <button
                      onClick={() => removeComment(c.id)}
                      className="ml-auto text-xs text-ink-soft hover:text-clay"
                    >
                      删除
                    </button>
                  )}
                </div>
                <p className="mt-1 text-sm text-ink-soft leading-relaxed">{c.content}</p>
              </div>
            </li>
          ))}
          {comments.length === 0 && (
            <li className="text-sm text-ink-soft">还没有评论，来抢第一个位置。</li>
          )}
        </ul>
      </section>

      <div className="h-10" />
    </article>
  );
}
