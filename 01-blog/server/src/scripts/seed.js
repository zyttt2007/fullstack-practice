import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { exec, query, now } from '../config/db.js';

const PASSWORD = '123456';

const categories = [
  { name: '旧书', description: '书页发黄，但故事还没有', sort: 1 },
  { name: '城市漫步', description: '用脚丈量一条街的宽度', sort: 2 },
  { name: '手冲咖啡', description: '水温、时间与耐心的三角关系', sort: 3 },
  { name: '随笔', description: '一些没头没尾但想记下来的话', sort: 4 },
];

const users = [
  { username: '苔痕', email: 'moss@mossnote.dev', bio: '在旧书和咖啡之间反复横跳。记录城市里那些走得很慢的角落。', avatar: 'gradient:152:苔' },
  { username: '阿岚', email: 'lan@mossnote.dev', bio: '平面设计师，偏爱纸质的一切。', avatar: 'gradient:200:岚' },
  { username: '老周', email: 'zhou@mossnote.dev', bio: '开了十二年书店，现在只想安静看书。', avatar: 'gradient:28:周' },
  { username: '苏禾', email: 'he@mossnote.dev', bio: '咖啡师，相信每一颗豆子都有自己的脾气。', avatar: 'gradient:18:禾' },
];

const posts = [
  {
    author: '苔痕', category: '旧书', tags: ['旧书', '书摊', '东京'], cover: 'gradient:28:📖',
    title: '在旧书摊上遇见 1987 年的春天',
    created: '2026-08-12 20:14:00', views: 1284, status: 'published',
    content: `神保町的旧书摊沿着人行道一路排开，阳光斜斜地打在书脊上，像给每一本书都镀了一层薄薄的年纪。

我在一个不起眼的纸箱里翻到一本 1987 年的散文集。扉页上有铅笔写的名字，和一个日期：

> 1987.4.3 于东京，雨。

## 书里夹着的东西

旧书最迷人的从来不是内容，而是**前一位读者留下的痕迹**：

- 一张过期的电车票
- 咖啡杯留下的圆形印子
- 第十一页折起的角，刚好停在一句「春天应该被浪费掉」上

我站在摊前读完那一页，然后把书买了下来。老板用报纸把它包好，说：「这本等了很久了。」

## 一点感想

我们总说读书是和作者对话，但旧书让我觉得，它更像是一场**三个人**的谈话——作者、上一个读者，和你。`,
  },
  {
    author: '苔痕', category: '城市漫步', tags: ['城市漫步', '河岸', '散步路线'], cover: 'gradient:200:🌉',
    title: '城市漫步：一条被忽略的河岸线',
    created: '2026-08-27 09:02:00', views: 966, status: 'published',
    content: `这条河从我住的城区边缘穿过，两岸都有步道，但北岸几乎没有人。

## 为什么是北岸

- 北岸的树更密，夏天有连续的阴影
- 长椅面朝西，傍晚能看到水面反光
- 唯一的问题：入口藏在一座立交桥下面，很难被发现

## 走一遍需要多久

从桥下出发，走到第三个闸门再折返，全程 **4.2 公里**，慢走约 55 分钟。途中有三段值得停下来的地方：

1. **第二个闸门**——有人在这里用石头摆了一小圈「座椅」
2. **芦苇荡**——秋天会变成一片很浅的金黄色
3. **废弃的摆渡口**——台阶一直伸到水里，像是还没放弃

> 城市里最好的地方，往往是那些没有被写进攻略的地方。

我把这条路画成了一张手绘地图，贴在书桌前。每次觉得闷，就照着走一遍。`,
  },
  {
    author: '苏禾', category: '手冲咖啡', tags: ['咖啡', '手冲', '水温'], cover: 'gradient:18:☕',
    title: '手冲笔记：水温 92°C 与一颗焦躁的心',
    created: '2026-09-05 14:38:00', views: 1543, status: 'published',
    content: `同一支豆子，同一只手冲壶，我只改了水温，味道就完全不一样。

## 三次对照

| 水温 | 口感 | 问题 |
| --- | --- | --- |
| 96°C | 苦、涩，尾段发干 | 萃取过度 |
| 92°C | 甜感明显，果酸干净 | 比较平衡 |
| 88°C | 水感重，香气出不来 | 萃取不足 |

## 我现在的参数

\`\`\`text
豆量   15g
水量   225g（1:15）
水温   92°C
研磨   中细（类似白砂糖）
分段   30g 闷蒸 30s → 两段各 97.5g
\`\`\`

## 但更重要的是

手冲这件事，最难的从来不是参数，是**愿意等**。闷蒸的 30 秒里什么都做不了，只能看着粉层慢慢鼓起来。

那 30 秒，是我一天里最安静的时候。`,
  },
  {
    author: '苔痕', category: '随笔', tags: ['写作', '习惯'], cover: 'gradient:152:✍️',
    title: '为什么我开始给每本书写两行字',
    created: '2026-09-18 22:41:00', views: 742, status: 'published',
    content: `读完就忘，是我以前最大的问题。一本书合上，两周后只记得「好像还不错」。

后来我给自己定了个规矩：**读完必须写两行字**，写在书的空白页上。

## 两行字写什么

1. 这本书讲了什么（一句话，不许超过 30 字）
2. 它让我想起了什么（随便什么，越私人越好）

第二行才是重点。它把书和我的生活缝在了一起。比如读完《散步的发明》，我写的是：

> 想起高三那年绕远路回家，只为了多走十分钟。

现在那本书随便翻到哪一页，我都能想起那个傍晚。`,
  },
  {
    author: '老周', category: '旧书', tags: ['旧书', '书店', '清单'], cover: 'gradient:28:🏚️',
    title: '雨天书店清单：五家值得一去再去的小店',
    created: '2026-09-29 16:20:00', views: 1890, status: 'published',
    content: `下雨天最适合做的事，是钻进一家小书店，听雨点砸在雨棚上。

## 我的五家

1. **渡口书屋**——只有 12 平米，但选书极狠
2. **夜航船**——晚上九点才开门，卖旧诗集
3. **半页**——专营残本和缺页书，很怪，但很迷人
4. **橡果**——兼卖咖啡，老板会记得你上次买了什么
5. **无名**——真的没有名字，门牌上只贴了一个灯泡

## 一个建议

进店先看**最里面的那排书架**。好东西通常放得最深，因为老板舍不得卖给别人，只想留给会走到那里的人。`,
  },
  {
    author: '阿岚', category: '城市漫步', tags: ['城市漫步', '观察', '摄影'], cover: 'gradient:200:📷',
    title: '同一个街区，走一百遍',
    created: '2026-10-08 11:07:00', views: 1122, status: 'published',
    content: `我做了一个实验：接下来三个月，只拍同一个街区的四个路口。

## 第一遍和第二十遍的区别

- 第一遍：只看到显眼的招牌和大楼
- 第十遍：开始注意墙上的涂鸦、电线、晾着的衣服
- 第二十遍：能认出每天早上七点半遛狗的那个人

## 照片的变化

我把照片按时间排成一条，发现**光**才是主角：

> 同一个转角，六月的下午四点，和十一月的下午四点，是两个完全不同的地方。

走一百遍不是为了找到新东西，是为了让眼睛学会慢下来。`,
  },
  {
    author: '苏禾', category: '手冲咖啡', tags: ['咖啡', '器具', '磨豆机'], cover: 'gradient:18:⚙️',
    title: '磨豆机的刻度，和生活的刻度',
    created: '2026-10-21 08:55:00', views: 883, status: 'published',
    content: `磨豆机上那个从 1 到 40 的刻度盘，我用了两年才搞明白。

## 刻度不是标准答案

- 同一支豆子，夏天和冬天的最佳刻度能差 **3 格**
- 湿度大的日子，粉会结块，需要调粗一点
- 新磨的刀盘比旧刀盘要细半格

## 我学会的事

刚开咖啡店的时候，我总想找到一个「正确的数字」，刻在机器上就再也不动了。

后来发现没有那个数字。每天早上第一件事是试喝，然后微调。

> 生活大概也是这样：不是找到正确答案，是每天校准一次。`,
  },
  {
    author: '苔痕', category: '随笔', tags: ['随笔', '慢'], cover: 'gradient:152:🌿',
    title: '草稿：关于「慢」的一些碎片',
    created: '2026-10-30 23:12:00', views: 0, status: 'draft',
    content: `（这篇还没写完，先存着。）

想写的东西太散，列几个点：

- 慢不等于拖，慢是**把注意力放回去**
- 走得慢的人看得见更多东西，但也会错过末班车
- 我妈做饭很慢，但她做的汤没有一次是糊的

待补：上次回老家，看她炖了一下午的萝卜。`,
  },
  {
    author: '阿岚', category: '城市漫步', tags: ['城市漫步', '地图', '记录'], cover: 'gradient:200:🗺️',
    title: '把散步写成地图：我的记录方法',
    created: '2026-10-31 19:30:00', views: 415, status: 'published',
    content: `散步两年，我攒了四十多张手绘地图。方法其实很笨，但很好用。

## 工具

- 一本 A6 的空白本
- 一支 0.38 的针管笔
- 手机计时器（只记起点和终点，不看路线）

## 画什么

1. **转角**：每次转弯画一个折线
2. **停顿点**：停下来超过 30 秒的地方画一个实心点
3. **声音**：特别吵或特别安静的路段，画一排短竖线

> 不画建筑，只画**身体记得的东西**。

回家再补上日期和天气。三个月后翻回去，你会发现自己反复停在同一类地方——那就是你真正喜欢的东西。`,
  },
];

const comments = [
  { post: '在旧书摊上遇见 1987 年的春天', user: '老周', content: '「这本等了很久了」——这句话我们这行的人说得最多，也最真心。' },
  { post: '在旧书摊上遇见 1987 年的春天', user: '阿岚', content: '夹在书里的电车票，我也有一张，是 2003 年的。' },
  { post: '城市漫步：一条被忽略的河岸线', user: '苏禾', content: '照着走了，55 分钟刚好，谢谢你的地图。' },
  { post: '手冲笔记：水温 92°C 与一颗焦躁的心', user: '苔痕', content: '闷蒸那 30 秒确实是最好的部分。' },
  { post: '雨天书店清单：五家值得一去再去的小店', user: '苔痕', content: '「无名」那家我去过！灯泡上还写着 watt 数。' },
  { post: '同一个街区，走一百遍', user: '老周', content: '第二十遍才认出遛狗的人——这段写得真好。' },
];

const likes = [
  ['在旧书摊上遇见 1987 年的春天', ['阿岚', '老周', '苏禾']],
  ['城市漫步：一条被忽略的河岸线', ['苏禾', '阿岚']],
  ['手冲笔记：水温 92°C 与一颗焦躁的心', ['苔痕', '阿岚', '老周']],
  ['雨天书店清单：五家值得一去再去的小店', ['苔痕', '苏禾', '阿岚', '老周']],
  ['同一个街区，走一百遍', ['苔痕']],
  ['把散步写成地图：我的记录方法', ['苔痕', '老周']],
];

async function main() {
  // 清空
  await exec('DELETE FROM likes');
  await exec('DELETE FROM comments');
  await exec('DELETE FROM posts');
  await exec('DELETE FROM categories');
  await exec('DELETE FROM users');

  const hash = await bcrypt.hash(PASSWORD, 10);
  const userIds = {};
  for (const u of users) {
    const r = await exec(
      'INSERT INTO users (username, email, password, avatar, bio, created_at) VALUES (?, ?, ?, ?, ?, ?)',
      [u.username, u.email, hash, u.avatar, u.bio, '2026-07-01 10:00:00']
    );
    userIds[u.username] = r.insertId;
  }

  for (const c of categories) {
    await exec(
      'INSERT INTO categories (name, description, sort_order, created_at) VALUES (?, ?, ?, ?)',
      [c.name, c.description, c.sort, now()]
    );
  }

  const postIds = {};
  for (const p of posts) {
    const r = await exec(
      `INSERT INTO posts (title, content, summary, cover, category, tags, author_id, views, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        p.title, p.content, '', p.cover, p.category, JSON.stringify(p.tags),
        userIds[p.author], p.views, p.status, p.created, p.created,
      ]
    );
    postIds[p.title] = r.insertId;
  }

  for (const c of comments) {
    const created = '2026-10-25 15:00:00';
    await exec(
      'INSERT INTO comments (post_id, user_id, content, created_at) VALUES (?, ?, ?, ?)',
      [postIds[c.post], userIds[c.user], c.content, created]
    );
    await exec('UPDATE posts SET comments_count = comments_count + 1 WHERE id = ?', [postIds[c.post]]);
  }

  for (const [title, names] of likes) {
    for (const n of names) {
      await exec('INSERT INTO likes (post_id, user_id, created_at) VALUES (?, ?, ?)', [postIds[title], userIds[n], now()]);
    }
    await exec('UPDATE posts SET likes_count = ? WHERE id = ?', [names.length, postIds[title]]);
  }

  const rows = await query('SELECT COUNT(*) AS c FROM posts');
  console.log(`[seed] 完成：${users.length} 位用户 / ${posts.length} 篇文章 / ${comments.length} 条评论`);
  console.log(`[seed] 演示账号密码均为 ${PASSWORD}（例如 苔痕 / 123456）`);
  console.log(`[seed] posts 行数：${rows[0].c}`);
}

main().catch((err) => {
  console.error('[seed] 失败：', err.message);
  process.exit(1);
});
