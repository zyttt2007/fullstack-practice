import { query, queryOne, exec, withTransaction, now } from '../config/db.js';
import { asyncHandler, httpError } from '../middleware/error.js';

const COMMENT_SELECT = `
  SELECT c.*, u.username, u.avatar
  FROM comments c JOIN users u ON c.user_id = u.id
`;

const mapComment = (row) => ({
  id: row.id,
  postId: row.post_id,
  content: row.content,
  createdAt: row.created_at,
  author: { id: row.user_id, username: row.username, avatar: row.avatar },
});

export const listComments = asyncHandler(async (req, res) => {
  const postId = Number(req.query.postId);
  if (!postId) throw httpError(400, '缺少 postId');
  const rows = await query(`${COMMENT_SELECT} WHERE c.post_id = ? ORDER BY c.created_at ASC`, [postId]);
  res.json({ list: rows.map(mapComment) });
});

export const createComment = asyncHandler(async (req, res) => {
  const postId = Number(req.body.postId || req.query.postId);
  const content = String(req.body.content || '').trim();
  if (!postId) throw httpError(400, '缺少 postId');
  if (!content) throw httpError(400, '评论内容不能为空');
  if (content.length > 500) throw httpError(400, '评论不能超过 500 字');

  const post = await queryOne('SELECT id FROM posts WHERE id = ?', [postId]);
  if (!post) throw httpError(404, '文章不存在');

  const result = await withTransaction(async (tx) => {
    const r = await tx.exec(
      'INSERT INTO comments (post_id, user_id, content, created_at) VALUES (?, ?, ?, ?)',
      [postId, req.user.id, content, now()]
    );
    await tx.exec('UPDATE posts SET comments_count = comments_count + 1 WHERE id = ?', [postId]);
    return r;
  });

  const row = await queryOne(`${COMMENT_SELECT} WHERE c.id = ?`, [result.insertId]);
  res.status(201).json({ comment: mapComment(row) });
});

export const deleteComment = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const comment = await queryOne('SELECT * FROM comments WHERE id = ?', [id]);
  if (!comment) throw httpError(404, '评论不存在');

  const post = await queryOne('SELECT author_id FROM posts WHERE id = ?', [comment.post_id]);
  if (comment.user_id !== req.user.id && post?.author_id !== req.user.id) {
    throw httpError(403, '只能删除自己的评论');
  }

  await withTransaction(async (tx) => {
    await tx.exec('DELETE FROM comments WHERE id = ?', [id]);
    await tx.exec('UPDATE posts SET comments_count = comments_count - 1 WHERE id = ?', [comment.post_id]);
  });
  res.json({ success: true });
});
