import bcrypt from 'bcryptjs';
import { query, queryOne, exec, now } from '../config/db.js';
import { signToken, publicUser } from '../middleware/auth.js';
import { asyncHandler, httpError } from '../middleware/error.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** 头像：没传就用「首字母 + 主题色」的占位方案（前端渲染成色块） */
function defaultAvatar(username) {
  return `letter:${encodeURIComponent(username.slice(0, 1).toUpperCase())}`;
}

export const register = asyncHandler(async (req, res) => {
  const { username = '', email = '', password = '' } = req.body || {};
  const name = String(username).trim();
  const mail = String(email).trim().toLowerCase();

  if (name.length < 3 || name.length > 20) throw httpError(400, '用户名长度需为 3-20 个字符');
  if (!EMAIL_RE.test(mail)) throw httpError(400, '邮箱格式不正确');
  if (String(password).length < 6) throw httpError(400, '密码至少 6 位');

  if (await queryOne('SELECT id FROM users WHERE username = ?', [name])) {
    throw httpError(409, '该用户名已被注册');
  }
  if (await queryOne('SELECT id FROM users WHERE email = ?', [mail])) {
    throw httpError(409, '该邮箱已被注册');
  }

  const hash = await bcrypt.hash(String(password), 10);
  const createdAt = now();
  const result = await exec(
    'INSERT INTO users (username, email, password, avatar, bio, created_at) VALUES (?, ?, ?, ?, ?, ?)',
    [name, mail, hash, defaultAvatar(name), '', createdAt]
  );

  const user = { id: result.insertId, username: name, email: mail, avatar: defaultAvatar(name), bio: '', created_at: createdAt };
  res.status(201).json({ token: signToken(user), user: publicUser(user) });
});

export const login = asyncHandler(async (req, res) => {
  const { username = '', password = '' } = req.body || {};
  const name = String(username).trim();
  const user =
    (await queryOne('SELECT * FROM users WHERE username = ?', [name])) ||
    (await queryOne('SELECT * FROM users WHERE email = ?', [name]));

  if (!user) throw httpError(401, '用户不存在');
  if (!(await bcrypt.compare(String(password), user.password))) {
    throw httpError(401, '密码错误');
  }
  res.json({ token: signToken(user), user: publicUser(user) });
});

export const me = asyncHandler(async (req, res) => {
  const user = await queryOne('SELECT * FROM users WHERE id = ?', [req.user.id]);
  if (!user) throw httpError(404, '用户不存在');
  res.json({ user: publicUser(user) });
});

export const updateProfile = asyncHandler(async (req, res) => {
  const { avatar, bio } = req.body || {};
  const user = await queryOne('SELECT * FROM users WHERE id = ?', [req.user.id]);
  if (!user) throw httpError(404, '用户不存在');

  const nextAvatar = avatar !== undefined ? String(avatar) : user.avatar;
  const nextBio = bio !== undefined ? String(bio).slice(0, 120) : user.bio;
  await exec('UPDATE users SET avatar = ?, bio = ? WHERE id = ?', [nextAvatar, nextBio, user.id]);

  const updated = await queryOne('SELECT * FROM users WHERE id = ?', [user.id]);
  res.json({ user: publicUser(updated) });
});

/** 用户主页：作者信息 + 其公开文章数 */
export const publicProfile = asyncHandler(async (req, res) => {
  const user = await queryOne('SELECT * FROM users WHERE id = ?', [req.params.id]);
  if (!user) throw httpError(404, '用户不存在');
  const row = await queryOne(
    "SELECT COUNT(*) AS total FROM posts WHERE author_id = ? AND status = 'published'",
    [user.id]
  );
  res.json({ user: publicUser(user), postCount: row?.total || 0 });
});
