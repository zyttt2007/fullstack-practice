import jwt from 'jsonwebtoken';
import { queryOne } from '../config/db.js';

const SECRET = () => process.env.JWT_SECRET || 'hearthask-dev-secret';

export function signToken(user) {
  return jwt.sign({ id: user.id, username: user.username }, SECRET(), {
    expiresIn: process.env.JWT_EXPIRES || '7d',
  });
}

/** 剔除密码等敏感字段后再返回给前端 */
export function publicUser(row) {
  if (!row) return null;
  const { password, ...rest } = row;
  return rest;
}

/** 必须登录；解析出的 { id, username } 挂在 req.user */
export function requireAuth(req, res, next) {
  // 取 token 的顺序：自定义头 → 查询参数 → Authorization
  // （部分托管环境的反向代理会用平台凭据覆盖 Authorization，所以前两种更可靠）
  const custom = req.headers['x-access-token'];
  const header = req.headers.authorization || '';
  const token = custom || req.query.token || (header.startsWith('Bearer ') ? header.slice(7) : null);
  if (!token) return res.status(401).json({ error: { message: '请先登录' } });
  try {
    req.user = jwt.verify(token, SECRET());
    next();
  } catch {
    res.status(401).json({ error: { message: '登录状态已失效，请重新登录' } });
  }
}

/** 可选登录：登录了就带上 req.user，没登录也放行（用于「是否已点赞」这类判断） */
export function optionalAuth(req, _res, next) {
  // 取 token 的顺序：自定义头 → 查询参数 → Authorization
  // （部分托管环境的反向代理会用平台凭据覆盖 Authorization，所以前两种更可靠）
  const custom = req.headers['x-access-token'];
  const header = req.headers.authorization || '';
  const token = custom || req.query.token || (header.startsWith('Bearer ') ? header.slice(7) : null);
  if (token) {
    try {
      req.user = jwt.verify(token, SECRET());
    } catch {
      req.user = null;
    }
  }
  next();
}

export async function findUserById(id) {
  return queryOne('SELECT * FROM users WHERE id = ?', [id]);
}
