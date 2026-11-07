import { query, queryOne, exec, withTransaction, now } from '../config/db.js';
import { asyncHandler, httpError } from '../middleware/error.js';

const POST_SELECT = `
  SELECT p.*, u.username AS author_name, u.avatar AS author_avatar, u.bio AS author_bio
  FROM posts p JOIN users u ON p.author_id = u.id
`;

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

/** 去掉 Markdown 标记后取前 120 字作为摘要 */
function buildSummary(content, input) {
  if (input && String(input).trim()) return String(input).trim().slice(0, 120);
  const plain = String(content)
    .replace(/```[\s\S]*?```/g, '')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/[#>*_`~\-\[\]()]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  return plain.slice(0, 120);
}

export function mapPost(row) {
  if (!row) return null;
  return {
    id: row.id,
    title: row.title,
    content: row.content,
    summary: row.summary,
    cover: row.cover,
    category: row.category,
    tags: parseTags(row.tags),
    authorId: row.author_id,
    author: { id: row.author_id, username: row.author_name, avatar: row.author_avatar, bio: row.author_bio },
    views: row.views,
    likesCount: row.likes_count,
    commentsCount: row.comments_count,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    readingMinutes: Math.max(1, Math.round(String(row.content || '').replace(/\s/g, '').length / 350)),
  };
}

export const listPosts = asyncHandler(async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const pageSize = Math.min(50, Math.max(1, Number(req.query.pageSize) || 6));
  const { category, tag, keyword, status, authorId, month } = req.query;

  const where = [];
  const params = [];
  // 游客默认只看已发布；传 status=all 时（个人中心）不限制
  if (status && status !== 'all') {
    where.push('p.status = ?');
    params.push(String(status));
  } else if (!status) {
    where.push("p.status = 'published'");
  }
  if (category) {
    where.push('p.category = ?');
    params.push(String(category));
  }
  if (month) {
    where.push('p.created_at LIKE ?');
    params.push(`${String(month)}%`);
  }
  if (authorId) {
    where.push('p.author_id = ?');
    params.push(Number(authorId));
  }
  if (keyword) {
    where.push('(p.title LIKE ? OR p.content LIKE ?)');
    const kw = `%${String(keyword)}%`;
    params.push(kw, kw);
  }
  if (tag) {
    where.push('p.tags LIKE ?');
    params.push(`%${String(tag)}%`);
  }
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

  const totalRow = await queryOne(
    `SELECT COUNT(*) AS total FROM posts p ${whereSql}`,
    params
  );
  const rows = await query(
    `${POST_SELECT} ${whereSql} ORDER BY p.created_at DESC LIMIT ? OFFSET ?`,
    [...params, pageSize, (page - 1) * pageSize]
  );

  res.json({
    list: rows.map(mapPost),
    total: totalRow?.total || 0,
    page,
    pageSize,
  });
});

export const getPost = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const post = await queryOne(`${POST_SELECT} WHERE p.id = ?`, [id]);
  if (!post) throw httpError(404, '文章不存在或已删除');

  // 浏览数 +1（作者自己看也计数，演示用）
  await exec('UPDATE posts SET views = views + 1 WHERE id = ?', [id]);

  let liked = false;
  if (req.user) {
    const row = await queryOne('SELECT id FROM likes WHERE post_id = ? AND user_id = ?', [id, req.user.id]);
    liked = Boolean(row);
  }
  res.json({ post: { ...mapPost(post), views: post.views + 1, liked } });
});

export const createPost = asyncHandler(async (req, res) => {
  const { title, content, category = '随笔', tags = [], cover = '', summary = '', status = 'published' } = req.body || {};
  const t = String(title || '').trim();
  const c = String(content || '');
  if (!t) throw httpError(400, '标题不能为空');
  if (t.length > 120) throw httpError(400, '标题不能超过 120 个字符');
  if (!c.trim()) throw httpError(400, '正文不能为空');
  if (!['published', 'draft'].includes(status)) throw httpError(400, '状态只能是 published 或 draft');

  const ts = now();
  const result = await exec(
    `INSERT INTO posts (title, content, summary, cover, category, tags, author_id, status, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      t,
      c,
      buildSummary(c, summary),
      String(cover),
      String(category),
      JSON.stringify(Array.isArray(tags) ? tags : []),
      req.user.id,
      status,
      ts,
      ts,
    ]
  );
  const created = await queryOne(`${POST_SELECT} WHERE p.id = ?`, [result.insertId]);
  res.status(201).json({ post: mapPost(created) });
});

export const updatePost = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const post = await queryOne('SELECT * FROM posts WHERE id = ?', [id]);
  if (!post) throw httpError(404, '文章不存在');
  if (post.author_id !== req.user.id) throw httpError(403, '只能编辑自己的文章');

  const { title, content, category, tags, cover, summary, status } = req.body || {};
  const nextTitle = title !== undefined ? String(title).trim() : post.title;
  const nextContent = content !== undefined ? String(content) : post.content;
  if (!nextTitle) throw httpError(400, '标题不能为空');

  await exec(
    `UPDATE posts SET title = ?, content = ?, summary = ?, cover = ?, category = ?, tags = ?, status = ?, updated_at = ?
     WHERE id = ?`,
    [
      nextTitle,
      nextContent,
      summary !== undefined ? String(summary) : buildSummary(nextContent, post.summary),
      cover !== undefined ? String(cover) : post.cover,
      category !== undefined ? String(category) : post.category,
      JSON.stringify(tags !== undefined ? (Array.isArray(tags) ? tags : []) : parseTags(post.tags)),
      status !== undefined ? String(status) : post.status,
      now(),
      id,
    ]
  );
  const updated = await queryOne(`${POST_SELECT} WHERE p.id = ?`, [id]);
  res.json({ post: mapPost(updated) });
});

export const deletePost = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const post = await queryOne('SELECT * FROM posts WHERE id = ?', [id]);
  if (!post) throw httpError(404, '文章不存在');
  if (post.author_id !== req.user.id) throw httpError(403, '只能删除自己的文章');
  await exec('DELETE FROM posts WHERE id = ?', [id]);
  res.json({ success: true });
});

/** 点赞 / 取消点赞：事务内同步 likes 表与 posts.likes_count */
export const toggleLike = asyncHandler(async (req, res) => {
  const postId = Number(req.params.id);
  const userId = req.user.id;
  const post = await queryOne('SELECT * FROM posts WHERE id = ?', [postId]);
  if (!post) throw httpError(404, '文章不存在');

  const { liked, likesCount } = await withTransaction(async (tx) => {
    const exist = await tx.query('SELECT id FROM likes WHERE post_id = ? AND user_id = ?', [postId, userId]);
    if (exist.length) {
      await tx.exec('DELETE FROM likes WHERE id = ?', [exist[0].id]);
      await tx.exec('UPDATE posts SET likes_count = likes_count - 1 WHERE id = ?', [postId]);
    } else {
      await tx.exec('INSERT INTO likes (post_id, user_id, created_at) VALUES (?, ?, ?)', [postId, userId, now()]);
      await tx.exec('UPDATE posts SET likes_count = likes_count + 1 WHERE id = ?', [postId]);
    }
    const row = await tx.query('SELECT likes_count FROM posts WHERE id = ?', [postId]);
    return { liked: !exist.length, likesCount: Math.max(0, row[0]?.likes_count || 0) };
  });

  res.json({ liked, likesCount });
});

/** 归档：按年-月聚合 */
export const archive = asyncHandler(async (_req, res) => {
  const rows = await query(
    `SELECT substr(created_at, 1, 7) AS month, COUNT(*) AS count
     FROM posts WHERE status = 'published'
     GROUP BY month ORDER BY month DESC`
  );
  res.json({ months: rows.filter((r) => r.month).map((r) => ({ month: r.month, count: r.count })) });
});
