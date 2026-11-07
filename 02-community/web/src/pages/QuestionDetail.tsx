import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Avatar, Empty, Loading } from '../components/ui';
import type { Answer, Question } from '../lib/types';
import { formatDate } from '../lib/visual';

function VoteButton({
  voted,
  votes,
  onClick,
  small = false,
}: {
  voted?: boolean;
  votes: number;
  onClick: () => void;
  small?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-full border transition ${
        small ? 'px-3 py-1 text-xs' : 'px-4 py-1.5 text-sm'
      } ${
        voted
          ? 'bg-fire text-white border-fire'
          : 'bg-card text-ink-soft border-line hover:border-fire hover:text-fire'
      }`}
    >
      {voted ? '♥' : '♡'} {votes}
    </button>
  );
}

export default function QuestionDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [question, setQuestion] = useState<Question | null>(null);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');

  useEffect(() => {
    setLoading(true);
    api
      .get(`/questions/${id}`)
      .then((res) => {
        setQuestion(res.data.question);
        setAnswers(res.data.answers);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  const voteQuestion = async () => {
    if (!user) return navigate('/login');
    if (!question) return;
    try {
      const res = await api.post('/votes/toggle', { targetType: 'question', targetId: question.id });
      setQuestion({ ...question, myVote: res.data.voted, votes: res.data.votes });
      setMsg('');
    } catch (e: any) {
      setMsg(e.message);
    }
  };

  const voteAnswer = async (a: Answer) => {
    if (!user) return navigate('/login');
    try {
      const res = await api.post('/votes/toggle', { targetType: 'answer', targetId: a.id });
      setAnswers(answers.map((x) => (x.id === a.id ? { ...x, myVote: res.data.voted, votes: res.data.votes } : x)));
      setMsg('');
    } catch (e: any) {
      setMsg(e.message);
    }
  };

  const accept = async (a: Answer) => {
    if (!user) return navigate('/login');
    try {
      await api.post(`/answers/${a.id}/accept`);
      setQuestion(question ? { ...question, isSolved: true } : question);
      setAnswers(answers.map((x) => ({ ...x, isAccepted: x.id === a.id })));
      setMsg('');
    } catch (e: any) {
      setMsg(e.message);
    }
  };

  const submitAnswer = async () => {
    if (!user) return navigate('/login');
    if (!draft.trim()) return;
    try {
      const res = await api.post(`/questions/${id}/answers`, { content: draft.trim() });
      setAnswers([...answers, res.data.answer]);
      setQuestion(question ? { ...question, answersCount: question.answersCount + 1 } : question);
      setDraft('');
      setMsg('');
    } catch (e: any) {
      setMsg(e.message);
    }
  };

  if (loading) return <Loading />;
  if (error || !question) return <Empty text={error || '问题不存在'} />;

  const isAsker = user?.id === question.authorId;

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <Link to="/" className="text-sm text-ink-soft hover:text-fire">
        ← 返回问答列表
      </Link>

      {/* 问题 */}
      <div className="mt-4 bg-card border border-line rounded-xl p-6">
        <div className="flex items-center gap-2 text-xs text-ink-soft">
          {question.isSolved && (
            <span className="px-2 py-0.5 rounded-full bg-leaf/10 text-leaf border border-leaf/30">已解决</span>
          )}
          <span>{formatDate(question.createdAt)}</span>
          <span className="text-line">·</span>
          <span>👁 {question.views}</span>
        </div>

        <h1 className="font-title text-2xl mt-2 leading-snug text-ink">{question.title}</h1>

        <div className="mt-4 md-body">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{question.content}</ReactMarkdown>
        </div>

        {question.tags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {question.tags.map((t) => (
              <span key={t} className="px-2 py-0.5 rounded-full bg-cream border border-line text-xs text-ink-soft">
                #{t}
              </span>
            ))}
          </div>
        )}

        <div className="mt-5 flex items-center gap-3 border-t border-line pt-4">
          <Avatar token={question.author.avatar} name={question.author.username} size={36} />
          <div className="text-sm">
            <div className="text-ink">{question.author.username}</div>
            <div className="text-xs text-ink-soft">提问者</div>
          </div>
          <div className="ml-auto flex items-center gap-3">
            {msg && <span className="text-xs text-fire">{msg}</span>}
            <VoteButton voted={question.myVote} votes={question.votes} onClick={voteQuestion} />
          </div>
        </div>
      </div>

      {/* 回答 */}
      <h2 className="font-title text-xl mt-8 text-ink">{answers.length} 个回答</h2>

      <div className="mt-4 space-y-4">
        {answers.length === 0 && <Empty text="还没有回答，来当第一个分享经验的人" />}
        {answers.map((a) => (
          <div
            key={a.id}
            className={`bg-card border rounded-xl p-6 ${
              a.isAccepted ? 'border-leaf ring-2 ring-leaf/20' : 'border-line'
            }`}
          >
            {a.isAccepted && (
              <div className="mb-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-leaf text-white text-xs">
                ✓ 最佳答案
              </div>
            )}
            <div className="md-body">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{a.content}</ReactMarkdown>
            </div>

            <div className="mt-4 flex items-center gap-3 border-t border-line pt-4">
              <Avatar token={a.author.avatar} name={a.author.username} size={32} />
              <div className="text-sm">
                <div className="text-ink">{a.author.username}</div>
                <div className="text-xs text-ink-soft">{formatDate(a.createdAt)}</div>
              </div>
              <div className="ml-auto flex items-center gap-2">
                {isAsker && !question.isSolved && (
                  <button
                    onClick={() => accept(a)}
                    className="px-3 py-1 text-xs rounded-full border border-leaf text-leaf hover:bg-leaf hover:text-white transition"
                  >
                    ✓ 采纳
                  </button>
                )}
                <VoteButton small voted={a.myVote} votes={a.votes} onClick={() => voteAnswer(a)} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 写回答 */}
      <section className="mt-8 bg-card border border-line rounded-xl p-6">
        <h3 className="font-title text-base text-ink">写下你的经验（+10 分）</h3>
        {user ? (
          isAsker ? (
            <p className="mt-3 text-sm text-ink-soft">这是你提的问题，自己不能回答哦。</p>
          ) : (
            <div className="mt-3">
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                rows={5}
                placeholder="分享你的做法、踩过的坑、或者一个口诀…"
                className="w-full px-3 py-2 text-sm rounded-md border border-line bg-card outline-none focus:border-fire-soft resize-none"
              />
              <div className="mt-2 flex justify-end">
                <button onClick={submitAnswer} className="px-5 py-2 rounded-md bg-fire text-white text-sm">
                  提交回答
                </button>
              </div>
            </div>
          )
        ) : (
          <p className="mt-3 text-sm text-ink-soft">
            <Link to="/login" className="text-fire underline">
              登录
            </Link>{' '}
            后可以回答
          </p>
        )}
      </section>

      <div className="h-10" />
    </div>
  );
}
