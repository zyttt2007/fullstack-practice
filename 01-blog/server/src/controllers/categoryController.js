import { query } from '../config/db.js';
import { asyncHandler } from '../middleware/error.js';

export const listCategories = asyncHandler(async (_req, res) => {
  const rows = await query(
    `SELECT c.id, c.name, c.description, c.sort_order,
            (SELECT COUNT(*) FROM posts p WHERE p.category = c.name AND p.status = 'published') AS post_count
     FROM categories c
     ORDER BY c.sort_order ASC, c.id ASC`
  );
  res.json({
    list: rows.map((r) => ({
      id: r.id,
      name: r.name,
      description: r.description,
      postCount: r.post_count,
    })),
  });
});
