import { Link } from 'react-router-dom';
import type { Post } from '../lib/types';
import { Avatar, Cover } from './ui';
import { excerpt, formatDate } from '../lib/visual';

export default function PostCard({ post, wide = false }: { post: Post; wide?: boolean }) {
  return (
    <Link
      to={`/post/${post.id}`}
      className="group block bg-card border border-line rounded-xl overflow-hidden hover:border-moss-soft hover:shadow-[0_6px_24px_rgba(47,93,80,0.10)] transition"
    >
      <div className={`relative ${wide ? 'aspect-[21/9]' : 'aspect-[16/8]'}`}>
        <Cover token={post.cover} glyphSize={wide ? 76 : 56} />
        <span className="absolute left-3 top-3 px-2 py-0.5 rounded-full text-[12px] bg-white/90 text-moss border border-line">
          {post.category}
        </span>
        {post.status === 'draft' && (
          <span className="absolute right-3 top-3 px-2 py-0.5 rounded-full text-[12px] bg-clay/90 text-white">
            草稿
          </span>
        )}
      </div>

      <div className="p-5">
        <h3 className="font-title text-lg leading-snug text-ink group-hover:text-moss transition">
          {post.title}
        </h3>
        <p className="mt-2 text-sm text-ink-soft leading-relaxed line-clamp-2">
          {post.summary || excerpt(post.content, 80)}
        </p>

        <div className="mt-4 flex items-center gap-2 text-xs text-ink-soft">
          <Avatar token={post.author.avatar} name={post.author.username} size={24} />
          <span>{post.author.username}</span>
          <span className="text-line">·</span>
          <span>{formatDate(post.createdAt)}</span>
          <span className="ml-auto flex items-center gap-3">
            <span>👁 {post.views}</span>
            <span>♥ {post.likesCount}</span>
            <span>💬 {post.commentsCount}</span>
          </span>
        </div>
      </div>
    </Link>
  );
}
