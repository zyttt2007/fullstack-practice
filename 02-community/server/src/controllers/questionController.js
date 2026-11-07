import { query, queryOne, exec, withTransaction, now } from '../config/db.js';
import { asyncHandler, httpError } from '../middleware/error.js';

function parseTags(raw) {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return String(raw).split(',').map((s) => s.trim()).filter(Boolean);
  }
}

export function mapQuestion(row) {
  return {
    id: row.id,
    title: row.title,
    content: row.content,
    tags: parseTags(row.tags),
    authorId: row.author_id,
    author: { id: row.author_id, username: row.author_name, avatar: row.author_avatar, bio: row.author_bio },
    views: row.views,
    answersCount: row.answers_count,
    votes: row.votes,
    isSolved: Boolean(row.is_solved),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapAnswer(row) {
  return {
    id: row.id,
    questionId: row.question_id,
    content: row.content,
    votes: row.votes,
    isAccepted: Boolean(row.is_accepted),
    authorId: row.author_id,
    author: { id: row.author_id, username: row.author_name, avatar: row.author_avatar },
    createdAt: row.created_at,
    myVote: Boolean(row.my_vote),
  };
}

const Q_SELECT = `
  SELECT q.*, u.username AS author_name, u.avatar AS author_avatar, u.bio AS author_bio
  FROM questions q JOIN users u ON q.author_id = u.id
`;
const A_SELECT = `
  SELECT a.*, u.username AS author_name, u.avatar AS author_avatar
  FROM answers a JOIN users u ON a.author_id = u.id
`;

export const listQuestions = asyncHandler(async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const pageSize = Math.min(50, Math.max(1, Number(req.query.pageSize) || 8));
  const { sort = 'latest', tag, keyword, authorId } = req.query;

  const where = [];
  const params = [];
  if (sort === 'unsolved') where.push('q.is_solved = 0');
  if (authorId) {
    where.push('q.author_id = ?');
    params.push(Number(authorId));
  }
  if (tag) {
    where.push('q.tags LIKE ?');
    params.push(`%${String(tag)}%`);
  }
  if (keyword) {
    where.push('(q.title LIKE ? OR q.content LIKE ?)');
    const kw = `%${String(keyword)}%`;
    params.push(kw, kw);
  }
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const orderSql = sort === 'hot' ? 'ORDER BY q.votes DESC, q.created_at DESC' : 'ORDER BY q.created_at DESC';

  const totalRow = await queryOne(`SELECT COUNT(*) AS total FROM questions q ${whereSql}`, params);
  const rows = await query(
    `${Q_SELECT} ${whereSql} ${orderSql} LIMIT ? OFFSET ?`,
    [...params, pageSize, (page - 1) * pageSize]
  );
  res.json({ list: rows.map(mapQuestion), total: totalRow?.total || 0, page, pageSize });
});

export const getQuestion = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const question = await queryOne(`${Q_SELECT} WHERE q.id = ?`, [id]);
  if (!question) throw httpError(404, '问题不存在或已删除');

  await exec('UPDATE questions SET views = views + 1 WHERE id = ?', [id]);

  const answers = await query(`${A_SELECT} WHERE a.question_id = ? ORDER BY a.is_accepted DESC, a.votes DESC, a.created_at ASC`, [id]);

  let myVoteQ = 0;
  const myVoteA = {};
  if (req.user) {
    const qVote = await queryOne("SELECT id FROM votes WHERE user_id = ? AND target_type = 'question' AND target_id = ?", [req.user.id, id]);
    myVoteQ = qVote ? 1 : 0;
    const aVotes = await query("SELECT target_id FROM votes WHERE user_id = ? AND target_type = 'answer'", [req.user.id]);
    for (const v of aVotes) myVoteA[v.target_id] = 1;
  }

  res.json({
    question: { ...mapQuestion(question), views: question.views + 1, myVote: Boolean(myVoteQ) },
    answers: answers.map((a) => mapAnswer({ ...a, my_vote: myVoteA[a.id] || 0 })),
  });
});

export const askQuestion = asyncHandler(async (req, res) => {
  const { title, content, tags = [] } = req.body || {};
  const t = String(title || '').trim();
  const c = String(content || '');
  if (!t) throw httpError(400, '问题标题不能为空');
  if (t.length > 120) throw httpError(400, '标题不能超过 120 个字符');
  if (!c.trim()) throw httpError(400, '请补充问题描述');

  const user = await queryOne('SELECT points FROM users WHERE id = ?', [req.user.id]);
  if ((user?.points ?? 0) < 5) throw httpError(400, '积分不足（需要 5 分才能提问），先去回答几个问题赚点分吧');

  const ts = now();
  const created = await withTransaction(async (tx) => {
    const r = await tx.exec(
      'INSERT INTO questions (title, content, tags, author_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
      [t, c, JSON.stringify(Array.isArray(tags) ? tags : []), req.user.id, ts, ts]
    );
    await tx.exec('UPDATE users SET points = points - 5 WHERE id = ?', [req.user.id]);
    return r;
  });
  const row = await queryOne(`${Q_SELECT} WHERE q.id = ?`, [created.insertId]);
  const me = await queryOne('SELECT points FROM users WHERE id = ?', [req.user.id]);
  res.status(201).json({ question: mapQuestion(row), points: me?.points });
});

export const answerQuestion = asyncHandler(async (req, res) => {
  const questionId = Number(req.params.id);
  const content = String(req.body.content || '').trim();
  if (!content) throw httpError(400, '回答内容不能为空');

  const question = await queryOne('SELECT * FROM questions WHERE id = ?', [questionId]);
  if (!question) throw httpError(404, '问题不存在');
  if (question.author_id === req.user.id) throw httpError(400, '不能回答自己提的问题');

  const ts = now();
  const created = await withTransaction(async (tx) => {
    const r = await tx.exec(
      'INSERT INTO answers (question_id, author_id, content, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
      [questionId, req.user.id, content, ts, ts]
    );
    await tx.exec('UPDATE questions SET answers_count = answers_count + 1, updated_at = ? WHERE id = ?', [ts, questionId]);
    await tx.exec('UPDATE users SET points = points + 10 WHERE id = ?', [req.user.id]);
    return r;
  });
  const row = await queryOne(`${A_SELECT} WHERE a.id = ?`, [created.insertId]);
  const me = await queryOne('SELECT points FROM users WHERE id = ?', [req.user.id]);
  res.status(201).json({ answer: mapAnswer({ ...row, my_vote: 0 }), points: me?.points });
});

/** 采纳答案：仅提问者；每题只能采纳一个；回答者 +30 */
export const acceptAnswer = asyncHandler(async (req, res) => {
  const answerId = Number(req.params.id);
  const answer = await queryOne('SELECT * FROM answers WHERE id = ?', [answerId]);
  if (!answer) throw httpError(404, '回答不存在');

  const question = await queryOne('SELECT * FROM questions WHERE id = ?', [answer.question_id]);
  if (!question) throw httpError(404, '问题不存在');
  if (question.author_id !== req.user.id) throw httpError(403, '只有提问者可以采纳答案');
  if (question.is_solved) throw httpError(400, '这个问题已经采纳过答案了');

  await withTransaction(async (tx) => {
    await tx.exec('UPDATE answers SET is_accepted = 1, updated_at = ? WHERE id = ?', [now(), answerId]);
    await tx.exec('UPDATE questions SET is_solved = 1, updated_at = ? WHERE id = ?', [now(), question.id]);
    await tx.exec('UPDATE users SET points = points + 30 WHERE id = ?', [answer.author_id]);
  });

  res.json({ success: true, acceptedAnswerId: answerId });
});

/** 点赞 / 取消点赞：事务内同步 votes 表、目标 votes、作者积分 */
export const toggleVote = asyncHandler(async (req, res) => {
  const { targetType, targetId } = req.body || {};
  const tid = Number(targetId);
  if (!['question', 'answer'].includes(targetType)) throw httpError(400, 'targetType 必须是 question 或 answer');
  if (!tid) throw httpError(400, '缺少 targetId');

  const table = targetType === 'question' ? 'questions' : 'answers';
  const target = await queryOne(`SELECT * FROM ${table} WHERE id = ?`, [tid]);
  if (!target) throw httpError(404, '内容不存在');
  if (target.author_id === req.user.id) throw httpError(400, '不能给自己点赞');

  const pointDelta = targetType === 'question' ? 5 : 10;

  const result = await withTransaction(async (tx) => {
    const exist = await tx.query(
      'SELECT id FROM votes WHERE user_id = ? AND target_type = ? AND target_id = ?',
      [req.user.id, targetType, tid]
    );
    if (exist.length) {
      await tx.exec('DELETE FROM votes WHERE id = ?', [exist[0].id]);
      await tx.exec(`UPDATE ${table} SET votes = votes - 1 WHERE id = ?`, [tid]);
      await tx.exec('UPDATE users SET points = points - ? WHERE id = ?', [pointDelta, target.author_id]);
    } else {
      await tx.exec('INSERT INTO votes (user_id, target_type, target_id, created_at) VALUES (?, ?, ?, ?)', [req.user.id, targetType, tid, now()]);
      await tx.exec(`UPDATE ${table} SET votes = votes + 1 WHERE id = ?`, [tid]);
      await tx.exec('UPDATE users SET points = points + ? WHERE id = ?', [pointDelta, target.author_id]);
    }
    const row = await tx.query(`SELECT votes FROM ${table} WHERE id = ?`, [tid]);
    return { voted: !exist.length, votes: Math.max(0, row[0]?.votes || 0) };
  });

  res.json(result);
});

/** 热门标签 */
export const hotTags = asyncHandler(async (_req, res) => {
  const rows = await query('SELECT tags FROM questions');
  const counter = new Map();
  for (const row of rows) {
    for (const t of parseTags(row.tags)) counter.set(t, (counter.get(t) || 0) + 1);
  }
  const list = [...counter.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 12);
  res.json({ list });
});

/** 积分排行榜 */
export const leaderboard = asyncHandler(async (_req, res) => {
  const rows = await query(`
    SELECT id, username, avatar, bio, points,
      (SELECT COUNT(*) FROM questions q WHERE q.author_id = users.id) AS q_count,
      (SELECT COUNT(*) FROM answers a WHERE a.author_id = users.id) AS a_count,
      (SELECT COUNT(*) FROM answers a WHERE a.author_id = users.id AND a.is_accepted = 1) AS accepted_count
    FROM users ORDER BY points DESC, id ASC LIMIT 10
  `);
  res.json({
    list: rows.map((r) => ({
      id: r.id,
      username: r.username,
      avatar: r.avatar,
      bio: r.bio,
      points: r.points,
      questionCount: r.q_count,
      answerCount: r.a_count,
      acceptedCount: r.accepted_count,
    })),
  });
});

/** 我的主页：我的提问 + 我的回答 */
export const mine = asyncHandler(async (req, res) => {
  const questions = await query(`${Q_SELECT} WHERE q.author_id = ? ORDER BY q.created_at DESC LIMIT 50`, [req.user.id]);
  const answers = await query(
    `${A_SELECT} WHERE a.author_id = ? ORDER BY a.created_at DESC LIMIT 50`,
    [req.user.id]
  );
  const user = await queryOne('SELECT points FROM users WHERE id = ?', [req.user.id]);
  res.json({
    points: user?.points || 0,
    questions: questions.map(mapQuestion),
    answers: answers.map((a) => mapAnswer({ ...a, my_vote: 0 })),
  });
});
