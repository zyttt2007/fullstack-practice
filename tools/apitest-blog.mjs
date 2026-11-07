const BASE = 'http://localhost:4001/api';

async function call(method, path, body, token) {
  const res = await fetch(BASE + path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { data = text; }
  return { status: res.status, data };
}

const show = (label, r) => console.log(`\n--- ${label} [${r.status}] ---\n` + JSON.stringify(r.data, null, 1).slice(0, 900));

const health = await call('GET', '/health');
show('health', health);

const cats = await call('GET', '/categories');
show('categories', cats);

const list = await call('GET', '/posts?page=1&pageSize=3');
show('posts?page=1&pageSize=3', list);

const archive = await call('GET', '/posts/archive');
show('archive', archive);

const login = await call('POST', '/auth/login', { username: '苔痕', password: '123456' });
show('login', login);
const token = login.data.token;

const detail = await call('GET', '/posts/1', null, token);
show('posts/1 (with token)', detail);

const like = await call('POST', '/posts/1/like', {}, token);
show('like post 1', like);

const comment = await call('POST', '/comments', { postId: 1, content: '接口测试：这条评论由脚本写入' }, token);
show('create comment', comment);

const create = await call('POST', '/posts', {
  title: '接口测试：来自脚本的一篇短文',
  content: '这是**测试正文**，用来验证创建接口。\n\n- 项目一\n- 青苔笔记',
  category: '随笔',
  tags: ['测试', '脚本'],
  cover: 'gradient:152:🧪',
  status: 'published',
}, token);
show('create post', create);

const comments = await call('GET', '/comments?postId=1');
show('comments?postId=1', comments);

const search = await call('GET', '/posts?keyword=咖啡&pageSize=2');
show('search 咖啡', search);
