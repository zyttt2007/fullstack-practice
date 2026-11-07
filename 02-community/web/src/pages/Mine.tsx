import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Avatar, Loading } from '../components/ui';
import type { Answer, Question } from '../lib/types';
import { excerpt, formatDate, gradientBg, gradientParts } from '../lib/visual';

export default function Mine() {
  const { user } = useAuth();
  const [points, setPoints] = useState(0);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [tab, setTab] = useState<'questions' | 'answers'>('questions');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    api
      .get('/mine')
      .then((res) => {
        setPoints(res.data.points);
        setQuestions(res.data.questions);
        setAnswers(res.data.answers);
      })
      .finally(() => setLoading(false));
  }, [user]);

  if (!user) return <Loading />;

  const hue = gradientParts(user.avatar)?.hue ?? 24;

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <section
        className="rounded-xl border border-line p-6 flex items-center gap-6"
        style={{ background: gradientBg(hue, 90, 78) }}
      >
        <Avatar token={user.avatar} name={user.username} size={72} />
        <div className="flex-1">
          <h1 className="font-title text-2xl text-ink">{user.username}</h1>
          <p className="text-xs text-ink-soft mt-1">{user.bio || '这个人很低调'}</p>
        </div>
        <div className="text-center px-6">
          <div className="font-title text-3xl text-fire">{points}</div>
          <div className="text-xs text-ink-soft">我的积分</div>
        </div>
      </section>

      <div className="mt-8 flex items-center gap-2">
        <button
          onClick={() => setTab('questions')}
          className={`px-4 py-1.5 rounded-full text-sm border transition ${
            tab === 'questions' ? 'bg-fire text-white border-fire' : 'bg-card text-ink-soft border-line'
          }`}
        >
          我的提问（{questions.length}）
        </button>
        <button
          onClick={() => setTab('answers')}
          className={`px-4 py-1.5 rounded-full text-sm border transition ${
            tab === 'answers' ? 'bg-fire text-white border-fire' : 'bg-card text-ink-soft border-line'
          }`}
        >
          我的回答（{answers.length}）
        </button>
        <Link to="/ask" className="ml-auto px-4 py-1.5 text-sm rounded-md bg-fire text-white">
          + 提个问题
        </Link>
      </div>

      {loading ? (
        <Loading />
      ) : tab === 'questions' ? (
        <ul className="mt-5 divide-y divide-line border border-line rounded-xl bg-card">
          {questions.length === 0 && <li className="p-6 text-sm text-ink-soft">还没提过问题</li>}
          {questions.map((q) => (
            <li key={q.id} className="p-4 flex items-center gap-3">
              <Link to={`/question/${q.id}`} className="font-title text-base text-ink hover:text-fire flex-1 truncate">
                {q.title}
              </Link>
              {q.isSolved && <span className="text-xs text-leaf">已解决</span>}
              <span className="text-xs text-ink-soft">{formatDate(q.createdAt)} · 💬 {q.answersCount} · ♥ {q.votes}</span>
            </li>
          ))}
        </ul>
      ) : (
        <ul className="mt-5 divide-y divide-line border border-line rounded-xl bg-card">
          {answers.length === 0 && <li className="p-6 text-sm text-ink-soft">还没回答过问题</li>}
          {answers.map((a) => (
            <li key={a.id} className="p-4">
              <div className="flex items-center gap-3">
                <Link to={`/question/${a.questionId}`} className="text-xs text-fire hover:underline">
                  查看原问题 →
                </Link>
                {a.isAccepted && (
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-leaf text-white">被采纳 +30</span>
                )}
                <span className="ml-auto text-xs text-ink-soft">{formatDate(a.createdAt)} · ♥ {a.votes}</span>
              </div>
              <p className="mt-2 text-sm text-ink-soft line-clamp-2">{excerpt(a.content, 120)}</p>
            </li>
          ))}
        </ul>
      )}
      <div className="h-10" />
    </div>
  );
}
