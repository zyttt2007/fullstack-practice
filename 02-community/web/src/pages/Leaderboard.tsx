import { useEffect, useState } from 'react';
import api from '../api/client';
import { Avatar, Loading } from '../components/ui';
import type { Leader } from '../lib/types';
import { gradientBg } from '../lib/visual';

const MEDAL = ['🥇', '🥈', '🥉'];

export default function Leaderboard() {
  const [list, setList] = useState<Leader[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/leaderboard')
      .then((res) => setList(res.data.list))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <h1 className="font-title text-3xl text-ink">积分排行榜</h1>
      <p className="mt-2 text-sm text-ink-soft">被点赞、被采纳最多的人，都在这儿。</p>

      {loading ? (
        <Loading />
      ) : (
        <ol className="mt-7 space-y-3">
          {list.map((u, i) => (
            <li
              key={u.id}
              className="flex items-center gap-4 bg-card border border-line rounded-xl p-4"
              style={i === 0 ? { background: gradientBg(24, 90, 80) } : undefined}
            >
              <span className="w-8 text-center text-lg">{MEDAL[i] || `${i + 1}`}</span>
              <Avatar token={u.avatar} name={u.username} size={44} />
              <div className="flex-1 min-w-0">
                <div className="font-title text-base text-ink">{u.username}</div>
                <div className="text-xs text-ink-soft truncate">{u.bio || '这个人很低调'}</div>
              </div>
              <div className="hidden sm:flex items-center gap-4 text-xs text-ink-soft">
                <span>提问 {u.questionCount}</span>
                <span>回答 {u.answerCount}</span>
                <span>被采纳 {u.acceptedCount}</span>
              </div>
              <div className="text-right">
                <div className="font-title text-2xl text-fire">{u.points}</div>
                <div className="text-[11px] text-ink-soft">积分</div>
              </div>
            </li>
          ))}
        </ol>
      )}
      <div className="h-10" />
    </div>
  );
}
