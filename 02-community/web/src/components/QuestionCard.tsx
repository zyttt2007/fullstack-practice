import { Link } from 'react-router-dom';
import type { Question } from '../lib/types';
import { Avatar } from './ui';
import { excerpt, formatDate } from '../lib/visual';

export default function QuestionCard({ q }: { q: Question }) {
  return (
    <Link
      to={`/question/${q.id}`}
      className="group flex gap-4 bg-card border border-line rounded-xl p-5 hover:border-fire-soft hover:shadow-[0_6px_20px_rgba(192,86,33,0.10)] transition"
    >
      <div className="flex flex-col items-center justify-center w-16 shrink-0 rounded-lg bg-cream border border-line py-2">
        <span className="font-title text-xl text-fire">{q.votes}</span>
        <span className="text-[11px] text-ink-soft">点赞</span>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          {q.isSolved && (
            <span className="px-2 py-0.5 rounded-full bg-leaf/10 text-leaf text-[11px] border border-leaf/30">
              已解决
            </span>
          )}
          {!q.isSolved && q.answersCount === 0 && (
            <span className="px-2 py-0.5 rounded-full bg-fire/10 text-fire text-[11px] border border-fire/30">
              待回答
            </span>
          )}
          <h3 className="font-title text-base text-ink group-hover:text-fire transition truncate">
            {q.title}
          </h3>
        </div>

        <p className="mt-1.5 text-sm text-ink-soft leading-relaxed line-clamp-2">
          {excerpt(q.content, 90)}
        </p>

        <div className="mt-3 flex items-center gap-2 text-xs text-ink-soft flex-wrap">
          <Avatar token={q.author.avatar} name={q.author.username} size={22} />
          <span>{q.author.username}</span>
          <span className="text-line">·</span>
          <span>{formatDate(q.createdAt)}</span>
          <span className="text-line">·</span>
          <span>👁 {q.views}</span>
          <span className="text-line">·</span>
          <span>💬 {q.answersCount} 个回答</span>
          <span className="ml-auto flex gap-1.5">
            {q.tags.map((t) => (
              <span key={t} className="px-2 py-0.5 rounded-full bg-cream border border-line text-[11px]">
                #{t}
              </span>
            ))}
          </span>
        </div>
      </div>
    </Link>
  );
}
