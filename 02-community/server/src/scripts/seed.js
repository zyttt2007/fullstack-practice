import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { exec, now } from '../config/db.js';

const PASSWORD = '123456';

const users = [
  { username: '小满', email: 'man@hearthask.dev', bio: '刚开始学做菜，目标是别再把厨房点着。', avatar: 'gradient:24:满', points: 115 },
  { username: '李师傅', email: 'li@hearthask.dev', bio: '家常菜做了二十年，专治各种「为什么总是失败」。', avatar: 'gradient:18:李', points: 230 },
  { username: '陈阿姨', email: 'chen@hearthask.dev', bio: '退休中学老师，现在研究蒸烤煮炖。', avatar: 'gradient:32:陈', points: 170 },
  { username: '阿果', email: 'guo@hearthask.dev', bio: '一个人住，想把自己喂好一点。', avatar: 'gradient:96:果', points: 110 },
  { username: '老白', email: 'bai@hearthask.dev', bio: '北方人，面食爱好者，正在学习南方炖汤。', avatar: 'gradient:210:白', points: 115 },
];

const questions = [
  {
    author: '小满', tags: ['煎炸', '锅具'], votes: 2, views: 842, solved: 0,
    created: '2026-10-20 12:30:00',
    title: '煎饺子总是粘锅，是锅的问题还是火的问题？',
    content: `家里是不粘锅，每次煎冷冻饺子，底都会破，皮粘在锅上撕下来一塌糊涂。

已经试过的办法：

- 多放油
- 小火慢煎
- 煎之前先摆一会儿让表面回温

还是不行。想知道到底是**锅不行**，还是我**火候不对**？求一个不用买新锅的解法。`,
  },
  {
    author: '小满', tags: ['炖汤', '技巧'], votes: 3, views: 1203, solved: 1,
    created: '2026-10-22 18:05:00',
    title: '如何让炖了一下午的排骨汤更白更浓？',
    content: `照着教程炖了三个小时，汤是清的，排骨是柴的，一点也不白。

\`\`\`text
我的做法：
排骨冷水下锅 → 大火烧开 → 撇浮沫 → 转小火 3 小时
\`\`\`

想问几个关键点：

1. 中途到底能不能加水？
2. 汤要白是不是一定要**大火**滚？
3. 要不要先焯水？`,
  },
  {
    author: '阿果', tags: ['蒸蛋', '新手'], votes: 2, views: 2107, solved: 1,
    created: '2026-10-24 09:12:00',
    title: '鸡蛋羹蒸出来全是蜂窝，问题出在哪？',
    content: `按「鸡蛋和水 1:1.5」蒸了 10 分钟，打开全是孔，口感像海绵。

试过用保鲜膜盖住，好一点但还是有蜂窝。

求一个**傻瓜式**的做法，越具体越好。`,
  },
  {
    author: '老白', tags: ['青菜', '火候'], votes: 1, views: 645, solved: 0,
    created: '2026-10-26 19:40:00',
    title: '炒青菜为什么总是出水发黄？',
    content: `小白菜、空心菜都一样，下锅两分钟就开始大量出水，菜叶发黄，一点都不脆。

> 家里是普通电磁炉，火力最高 2000W。

是不是火力太小？还是油不够热？还是有别的诀窍？`,
  },
  {
    author: '陈阿姨', tags: ['面食', '新手'], votes: 1, views: 918, solved: 0,
    created: '2026-10-28 15:22:00',
    title: '手擀面和面要醒多久？为什么我擀的面条容易断',
    content: `第一次做手擀面，面是揉光滑了，但擀的时候总是裂边，切出来的面条煮完也断成一截一截的。

- 用的中筋面粉
- 揉完直接擀了，没有醒面

是缺了「醒面」这一步吗？具体要醒多久？`,
  },
  {
    author: '阿果', tags: ['红烧肉', '糖色'], votes: 2, views: 1544, solved: 0,
    created: '2026-10-30 20:15:00',
    title: '红烧肉的糖色到底怎么炒？每次都炒糊',
    content: `教程说「冰糖小火炒到枣红色」，我每次都直接炒成**黑色苦味**，已经烧坏一口锅的涂层了。

有没有对新手更友好的方法？能不能不炒糖色，效果会差很多吗？`,
  },
  {
    author: '老白', tags: ['烘焙', '电饭煲'], votes: 0, views: 387, solved: 0,
    created: '2026-11-01 08:05:00',
    title: '电饭煲蛋糕到底能不能成功？塌陷怎么解决',
    content: `网上很火的电饭煲蛋糕，我做了三次，都是「开盖瞬间很好，五分钟后塌成饼」。

蛋白也打到硬性发泡了，也倒扣了。到底哪里不对？还是说这玩意儿本来就做不成？`,
  },
];

const answers = [
  {
    question: '煎饺子总是粘锅，是锅的问题还是火的问题？', author: '李师傅', votes: 1, accepted: 0,
    created: '2026-10-20 13:10:00',
    content: `锅没问题，是**步骤**的问题。给你一个我用了十年的「水煎法」：

\`\`\`text
1. 冷锅倒少量油，码好冻饺子（不用解冻）
2. 中小火煎到底部微黄（约 2 分钟）
3. 倒入「水 + 一勺面粉」调的面粉水，没过饺子 1/3
4. 盖盖，中火 6-8 分钟，水收干即出锅
\`\`\`

## 关键点

- **面粉水**是灵魂：既能让底部形成脆壳，又能防止干煎糊底
- 水收干前**不要开盖**
- 最后听到锅里「滋滋」声变小，就说明水快干了`,
  },
  {
    question: '煎饺子总是粘锅，是锅的问题还是火的问题？', author: '老白', votes: 0, accepted: 0,
    created: '2026-10-20 20:44:00',
    content: `补一句：如果家里有**铸铁平底锅**更好，受热均匀，不容易局部糊。不过李师傅那个水煎法用不粘锅完全够了。`,
  },
  {
    question: '如何让炖了一下午的排骨汤更白更浓？', author: '李师傅', votes: 4, accepted: 1,
    created: '2026-10-22 19:02:00',
    content: `三个问题分开答：

## 1. 中途能不能加水？

能，但必须加**开水**。加凉水会让蛋白质瞬间收缩，汤就再也白不了了。最好一开始就一次加够，比排骨多 3-4 倍的水。

## 2. 汤要白是不是要大火滚？

**是。** 这是最关键的一点。汤发白是脂肪和蛋白质在剧烈翻滚下被打散形成的乳化。全程小火只能出清汤。

正确做法：大火滚 **20-30 分钟**出白汤后，再转小火慢炖。

## 3. 要不要焯水？

要，但别焯太久。冷水下锅，水开煮 2 分钟，捞出温水冲洗干净就行。

> 另外一个小诀窍：加一两块**带皮五花**或几片姜，白得更快。`,
  },
  {
    question: '鸡蛋羹蒸出来全是蜂窝，问题出在哪？', author: '陈阿姨', votes: 3, accepted: 1,
    created: '2026-10-24 10:05:00',
    content: `蜂窝 = 水开了太久 / 蛋液里有气泡。傻瓜式做法：

1. **温水**：用 40°C 左右的温水（手指伸进去不烫），比例 1:1.5
2. **过筛**：搅好的蛋液过一遍筛，泡沫全去掉
3. **盖盖或保鲜膜**：扎几个小孔
4. **冷水上锅**，水开后转**最小火**蒸 8 分钟，关火再焖 2 分钟

> 记住口诀：温水过筛，冷水上锅，小火短蒸，关火焖透。

按这个做，出来是布丁一样嫩滑的。`,
  },
  {
    question: '炒青菜为什么总是出水发黄？', author: '李师傅', votes: 2, accepted: 0,
    created: '2026-10-26 21:00:00',
    content: `电磁炉确实火偏小，但主要问题在**顺序**：

- 油要烧到**微微冒烟**再下菜（高温锁住水分）
- 菜要**一次下足**，别分批，分批会让锅温骤降
- 全程最大火**快炒 1 分钟**，最后放盐（盐放早了出水）
- 出锅前沿锅边淋一点点开水，锅气就上来了

黄是炒太久了，不是火的问题。1 分钟以内必须出锅。`,
  },
  {
    question: '手擀面和面要醒多久？为什么我擀的面条容易断', author: '陈阿姨', votes: 1, accepted: 0,
    created: '2026-10-28 16:30:00',
    content: `对，就是缺了醒面。

## 流程

1. 面和水约 2:1，加一小撮盐，揉成偏硬的面团
2. 盖湿布**醒 30 分钟**，中途再揉一次
3. 再醒 20 分钟，擀的时候撒干面粉防粘

醒面是让面筋松弛，松弛了才好擀、不容易裂边。煮的时候水要**宽**（多），面条下锅轻轻拨散，断的就少了。`,
  },
  {
    question: '红烧肉的糖色到底怎么炒？每次都炒糊', author: '李师傅', votes: 1, accepted: 0,
    created: '2026-10-30 21:33:00',
    content: `新手别硬炒糖色了，换**冰糖 + 老抽**的方案，效果差不了太多：

- 肉先焯水、煎到微黄
- 直接放 15 颗左右冰糖 + 2 勺生抽 + 1 勺老抽 + 热水没过肉
- 大火烧开转小火 50 分钟，收汁即可

如果一定要炒糖色：冰糖**全程最小火**，看到「冒小泡、颜色到枣红」立刻下肉，晚 5 秒就糊。糊了的糖色**果断倒掉**，别救，苦味会毁一锅肉。`,
  },
  {
    question: '红烧肉的糖色到底怎么炒？每次都炒糊', author: '陈阿姨', votes: 0, accepted: 0,
    created: '2026-10-31 09:12:00',
    content: `我炒糖色用**水炒法**：冰糖加一点点水，小火慢慢熬到枣红色，比纯油炒好控制得多，推荐给题主。`,
  },
  {
    question: '电饭煲蛋糕到底能不能成功？塌陷怎么解决', author: '小满', votes: 0, accepted: 0,
    created: '2026-11-01 10:20:00',
    content: `我也翻过车，后来成功的那次改了三点：蛋白里加**几滴柠檬汁**、面糊**切拌不画圈**、开盖后**立刻震两下倒扣**。塌陷主要是因为蛋白消泡 + 锅底温度不够。`,
  },
];

// [问题标题, 投票用户列表]
const votes = [
  ['煎饺子总是粘锅，是锅的问题还是火的问题？', ['老白', '阿果']],
  ['如何让炖了一下午的排骨汤更白更浓？', ['李师傅', '陈阿姨', '老白']],
  ['鸡蛋羹蒸出来全是蜂窝，问题出在哪？', ['小满', '老白']],
  ['炒青菜为什么总是出水发黄？', ['小满']],
  ['手擀面和面要醒多久？为什么我擀的面条容易断', ['李师傅']],
  ['红烧肉的糖色到底怎么炒？每次都炒糊', ['小满', '陈阿姨']],
];

// [回答者@问题标题, 投票用户列表]（用「作者@问题」定位答案）
const answerVotes = [
  ['李师傅@煎饺子总是粘锅，是锅的问题还是火的问题？', ['小满']],
  ['李师傅@如何让炖了一下午的排骨汤更白更浓？', ['小满', '阿果', '陈阿姨', '老白']],
  ['陈阿姨@鸡蛋羹蒸出来全是蜂窝，问题出在哪？', ['阿果', '小满', '李师傅']],
  ['李师傅@炒青菜为什么总是出水发黄？', ['老白', '小满']],
  ['陈阿姨@手擀面和面要醒多久？为什么我擀的面条容易断', ['小满']],
  ['李师傅@红烧肉的糖色到底怎么炒？每次都炒糊', ['阿果']],
];

async function main() {
  await exec('DELETE FROM votes');
  await exec('DELETE FROM answers');
  await exec('DELETE FROM questions');
  await exec('DELETE FROM users');

  const hash = await bcrypt.hash(PASSWORD, 10);
  const uid = {};
  for (const u of users) {
    const r = await exec(
      'INSERT INTO users (username, email, password, avatar, bio, points, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [u.username, u.email, hash, u.avatar, u.bio, u.points, '2026-10-01 10:00:00']
    );
    uid[u.username] = r.insertId;
  }

  const qid = {};
  for (const q of questions) {
    const r = await exec(
      `INSERT INTO questions (title, content, tags, author_id, views, answers_count, votes, is_solved, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, 0, ?, ?, ?, ?)`,
      [q.title, q.content, JSON.stringify(q.tags), uid[q.author], q.views, q.votes, q.solved, q.created, q.created]
    );
    qid[q.title] = r.insertId;
  }

  const aid = {};
  for (const a of answers) {
    const r = await exec(
      `INSERT INTO answers (question_id, author_id, content, votes, is_accepted, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [qid[a.question], uid[a.author], a.content, a.votes, a.accepted, a.created, a.created]
    );
    aid[`${a.author}@${a.question}`] = r.insertId;
    await exec('UPDATE questions SET answers_count = answers_count + 1 WHERE id = ?', [qid[a.question]]);
  }

  for (const [title, names] of votes) {
    for (const n of names) {
      await exec("INSERT INTO votes (user_id, target_type, target_id, created_at) VALUES (?, 'question', ?, ?)", [uid[n], qid[title], now()]);
    }
  }
  for (const [key, names] of answerVotes) {
    const aId = aid[key];
    if (!aId) continue;
    for (const n of names) {
      await exec("INSERT INTO votes (user_id, target_type, target_id, created_at) VALUES (?, 'answer', ?, ?)", [uid[n], aId, now()]);
    }
  }

  console.log(`[seed] 完成：${users.length} 位用户 / ${questions.length} 个问题 / ${answers.length} 个回答`);
  console.log(`[seed] 演示账号密码均为 ${PASSWORD}（例如 小满 / 123456）`);
}

main().catch((err) => {
  console.error('[seed] 失败：', err.message);
  process.exit(1);
});
