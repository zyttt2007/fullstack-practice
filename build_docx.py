# -*- coding: utf-8 -*-
"""生成《全栈应用开发 · 示例项目练习 · 提交说明》Word 版（含 30 张截图）"""
import os
from docx import Document
from docx.shared import Pt, Cm, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH, WD_LINE_SPACING
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.enum.section import WD_SECTION
from docx.oxml.ns import qn
from docx.oxml import OxmlElement
from PIL import Image

ROOT = os.path.dirname(os.path.abspath(__file__))
SHOTS = os.path.join(ROOT, 'shots')
OUT = os.path.join(ROOT, '全栈应用开发-示例项目练习-提交说明.docx')

BODY_CN, BODY_EN = '宋体', 'Times New Roman'
HEAD_CN, HEAD_EN = '微软雅黑', 'Arial'
MONO = 'Consolas'

MOSS = RGBColor(0x2F, 0x5D, 0x50)
EMBER = RGBColor(0xC0, 0x56, 0x21)
CLAY = RGBColor(0xA0, 0x52, 0x2D)
INK = RGBColor(0x22, 0x22, 0x22)
GRAY = RGBColor(0x77, 0x77, 0x77)

USABLE_W = 16.4   # cm
MAX_IMG_W = 16.4
MAX_IMG_H = 13.0


def set_font(run, cn=BODY_CN, en=BODY_EN, size=10.5, bold=False, color=None, italic=False):
    run.font.name = en
    run.font.size = Pt(size)
    run.font.bold = bold
    run.font.italic = italic
    if color is not None:
        run.font.color.rgb = color
    rpr = run._element.get_or_add_rPr()
    rf = rpr.find(qn('w:rFonts'))
    if rf is None:
        rf = OxmlElement('w:rFonts')
        rpr.append(rf)
    rf.set(qn('w:eastAsia'), cn)
    rf.set(qn('w:ascii'), en)
    rf.set(qn('w:hAnsi'), en)


def para(doc, text='', size=10.5, cn=BODY_CN, en=BODY_EN, bold=False, color=INK,
         align=WD_ALIGN_PARAGRAPH.JUSTIFY, before=0, after=6, indent=0, line=1.5):
    p = doc.add_paragraph()
    p.alignment = align
    pf = p.paragraph_format
    pf.space_before = Pt(before)
    pf.space_after = Pt(after)
    pf.line_spacing = line
    if indent:
        pf.first_line_indent = Pt(indent)
    if text:
        set_font(p.add_run(text), cn, en, size, bold, color)
    return p


def rich(doc, parts, size=10.5, align=WD_ALIGN_PARAGRAPH.JUSTIFY, before=0, after=6,
         indent=0, line=1.5):
    """parts: [(text, bold, color_or_None)]"""
    p = doc.add_paragraph()
    p.alignment = align
    pf = p.paragraph_format
    pf.space_before = Pt(before)
    pf.space_after = Pt(after)
    pf.line_spacing = line
    if indent:
        pf.first_line_indent = Pt(indent)
    for text, bold, color in parts:
        set_font(p.add_run(text), BODY_CN, BODY_EN, size, bold, color or INK)
    return p


def bullet(doc, text, size=10.5, after=3):
    p = doc.add_paragraph(style='List Bullet')
    pf = p.paragraph_format
    pf.space_before = Pt(0)
    pf.space_after = Pt(after)
    pf.line_spacing = 1.35
    pf.left_indent = Pt(18)
    set_font(p.add_run(text), BODY_CN, BODY_EN, size, False, INK)
    return p


def heading(doc, text, level, color=INK, size=None):
    p = doc.add_paragraph()
    p.style = doc.styles[f'Heading {level}']
    pf = p.paragraph_format
    sizes = {1: 16, 2: 13, 3: 11.5}
    sz = size or sizes.get(level, 11)
    pf.space_before = Pt(16 if level == 1 else 10)
    pf.space_after = Pt(6)
    pf.line_spacing = 1.2
    pf.keep_with_next = True
    set_font(p.add_run(text), HEAD_CN, HEAD_EN, sz, True, color)
    return p


def hr(doc, color='C9D6C9'):
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(2)
    p.paragraph_format.space_after = Pt(8)
    pPr = p._p.get_or_add_pPr()
    pbdr = OxmlElement('w:pBdr')
    bottom = OxmlElement('w:bottom')
    bottom.set(qn('w:val'), 'single')
    bottom.set(qn('w:sz'), '6')
    bottom.set(qn('w:space'), '1')
    bottom.set(qn('w:color'), color)
    pbdr.append(bottom)
    pPr.append(pbdr)
    return p


def shade(cell, hexcolor):
    tcPr = cell._tc.get_or_add_tcPr()
    shd = OxmlElement('w:shd')
    shd.set(qn('w:val'), 'clear')
    shd.set(qn('w:color'), 'auto')
    shd.set(qn('w:fill'), hexcolor)
    tcPr.append(shd)


def cell_text(cell, text, size=9, bold=False, color=INK, align=WD_ALIGN_PARAGRAPH.LEFT):
    cell.text = ''
    p = cell.paragraphs[0]
    p.alignment = align
    p.paragraph_format.space_before = Pt(2)
    p.paragraph_format.space_after = Pt(2)
    p.paragraph_format.line_spacing = 1.25
    set_font(p.add_run(text), BODY_CN, BODY_EN, size, bold, color)


def add_field(paragraph, instr):
    r = paragraph.add_run()
    fld = OxmlElement('w:fldChar')
    fld.set(qn('w:fldCharType'), 'begin')
    r._element.append(fld)
    r2 = paragraph.add_run()
    it = OxmlElement('w:instrText')
    it.set(qn('xml:space'), 'preserve')
    it.text = instr
    r2._element.append(it)
    r3 = paragraph.add_run()
    fld2 = OxmlElement('w:fldChar')
    fld2.set(qn('w:fldCharType'), 'end')
    r3._element.append(fld2)


def add_footer(section, text):
    footer = section.footer
    p = footer.paragraphs[0]
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    set_font(p.add_run(text + '    '), BODY_CN, BODY_EN, 9, False, GRAY)
    set_font(p.add_run('第 '), BODY_CN, BODY_EN, 9, False, GRAY)
    add_field(p, 'PAGE')
    set_font(p.add_run(' 页'), BODY_CN, BODY_EN, 9, False, GRAY)


def img_block(doc, path, caption, no):
    """插入一张截图 + 题注，居中，等比缩放"""
    with Image.open(path) as im:
        w, h = im.size
    scale = min(MAX_IMG_W / w, MAX_IMG_H / h)
    cw, ch = w * scale, h * scale

    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_before = Pt(8)
    p.paragraph_format.space_after = Pt(0)
    p.paragraph_format.line_spacing = 1.0
    p.paragraph_format.keep_with_next = True
    p.add_run().add_picture(path, width=Cm(cw), height=Cm(ch))

    c = doc.add_paragraph()
    c.alignment = WD_ALIGN_PARAGRAPH.CENTER
    c.paragraph_format.space_before = Pt(3)
    c.paragraph_format.space_after = Pt(10)
    c.paragraph_format.line_spacing = 1.1
    c.paragraph_format.keep_with_next = True
    set_font(c.add_run(f'图 {no}  {caption}'), BODY_CN, BODY_EN, 9, False, GRAY)


def code_block(doc, lines):
    p = doc.add_paragraph()
    pf = p.paragraph_format
    pf.space_before = Pt(4)
    pf.space_after = Pt(8)
    pf.line_spacing = 1.15
    pf.left_indent = Pt(10)
    pPr = p._p.get_or_add_pPr()
    shd = OxmlElement('w:shd')
    shd.set(qn('w:val'), 'clear')
    shd.set(qn('w:fill'), 'F5F5F2')
    pPr.append(shd)
    for i, line in enumerate(lines):
        if i:
            p.add_run().add_break()
        set_font(p.add_run(line), MONO, MONO, 9, False, RGBColor(0x33, 0x33, 0x33))
    return p


# ---------------- 文档初始化 ----------------
doc = Document()

sec = doc.sections[0]
sec.page_width = Cm(21)
sec.page_height = Cm(29.7)
sec.top_margin = Cm(2.2)
sec.bottom_margin = Cm(2.0)
sec.left_margin = Cm(2.3)
sec.right_margin = Cm(2.3)

normal = doc.styles['Normal']
normal.font.name = BODY_EN
normal.font.size = Pt(10.5)
normal.element.rPr.rFonts.set(qn('w:eastAsia'), BODY_CN)
normal.paragraph_format.line_spacing = 1.5

add_footer(sec, '全栈应用开发 · 示例项目练习 · 提交说明')

cp = doc.core_properties
cp.title = '全栈应用开发 · 示例项目练习 · 提交说明'
cp.author = 'zyt67'
cp.comments = '青苔笔记 / 灶台问答 / 一枚手作 三个全栈示例项目'

# ---------------- 封面标题区 ----------------
t = doc.add_paragraph()
t.alignment = WD_ALIGN_PARAGRAPH.CENTER
t.paragraph_format.space_before = Pt(60)
t.paragraph_format.space_after = Pt(4)
set_font(t.add_run('全栈应用开发'), HEAD_CN, HEAD_EN, 28, True, MOSS)

t2 = doc.add_paragraph()
t2.alignment = WD_ALIGN_PARAGRAPH.CENTER
t2.paragraph_format.space_after = Pt(10)
set_font(t2.add_run('示例项目练习 · 提交说明'), HEAD_CN, HEAD_EN, 20, True, INK)

t3 = doc.add_paragraph()
t3.alignment = WD_ALIGN_PARAGRAPH.CENTER
t3.paragraph_format.space_after = Pt(6)
set_font(t3.add_run('青苔笔记 MossNote  ·  灶台问答 HearthAsk  ·  一枚手作 HandmadeOne'),
         BODY_CN, BODY_EN, 11, False, GRAY)

t4 = doc.add_paragraph()
t4.alignment = WD_ALIGN_PARAGRAPH.CENTER
t4.paragraph_format.space_after = Pt(40)
set_font(t4.add_run('React 18 + TypeScript + Vite + Tailwind  ·  Node.js + Express  ·  MySQL  ·  JWT + bcrypt'),
         BODY_CN, BODY_EN, 10, False, GRAY)

intro = doc.add_paragraph()
intro.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
intro.paragraph_format.space_after = Pt(6)
intro.paragraph_format.line_spacing = 1.5
for txt, bold in [('三个全栈项目均按文档方法完成：', True),
                  ('设计数据库（database.md）→ 写需求文档（PRD.md）→ 开发后端 → 开发前端 → 测试 → 截图。', False)]:
    set_font(intro.add_run(txt), BODY_CN, BODY_EN, 10.5, bold, MOSS if bold else INK)

intro2 = doc.add_paragraph()
intro2.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
intro2.paragraph_format.line_spacing = 1.5
for txt, bold in [('方法遵循文档，', True),
                  ('主题、内容与视觉均为自主设计：三个项目分别是一个写作博客、一个下厨问答社区和一家手作器物小店，'
                   '且都各自实现了超出文档基础版的扩展功能。', False)]:
    set_font(intro2.add_run(txt), BODY_CN, BODY_EN, 10.5, bold, INK)

hr(doc)

# ---------------- 一、总览 ----------------
heading(doc, '一、总览', 1, MOSS)

tbl = doc.add_table(rows=4, cols=5)
tbl.style = 'Table Grid'
tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
tbl.autofit = False
widths = [Cm(0.9), Cm(2.4), Cm(3.4), Cm(4.4), Cm(5.3)]
headers = ['#', '文档示例', '我的项目', '核心亮点', '扩展（超出文档）']
for i, h in enumerate(headers):
    cell_text(tbl.rows[0].cells[i], h, 9, True, RGBColor(0xFF, 0xFF, 0xFF))
    shade(tbl.rows[0].cells[i], '2F5D50')

rows = [
    ('①', '个人博客系统', '青苔笔记 MossNote',
     '文章 CRUD、JWT 鉴权、Markdown 编辑器、分页 / 分类 / 搜索',
     '评论系统、点赞、草稿箱、按月归档、阅读时长'),
    ('②', '问答社区', '灶台问答 HearthAsk',
     '提问 / 回答、点赞去重、采纳答案、积分系统、多排序',
     '积分排行榜、热门标签、提问积分不足拦截'),
    ('③', 'Mini 在线商城', '一枚手作 HandmadeOne',
     '商品、购物车、地址、下单事务（扣库存 / 价格快照 / 订单号）、取消恢复库存',
     '优惠券满减、模拟支付、订单状态流转、地址快照'),
]
for r, data in enumerate(rows, start=1):
    colors = [MOSS, EMBER, CLAY][r - 1]
    for c, v in enumerate(data):
        cell_text(tbl.rows[r].cells[c], v, 9, c == 2, colors if c == 2 else INK,
                  WD_ALIGN_PARAGRAPH.CENTER if c == 0 else WD_ALIGN_PARAGRAPH.LEFT)
    if r % 2 == 0:
        for c in range(5):
            shade(tbl.rows[r].cells[c], 'F7F7F4')

for r in range(4):
    for c, w in enumerate(widths):
        tbl.rows[r].cells[c].width = w

para(doc, '', after=2)
bullet(doc, '技术栈：React 18 + TypeScript + Vite + Tailwind ｜ Node.js + Express ｜ MySQL（mysql2）｜ JWT + bcrypt', 10)
bullet(doc, '工程规范：配置用 .env 管理、密码 bcrypt 加密、统一错误处理中间件、所有写接口做参数校验', 10)
bullet(doc, '数据库说明：教程选型 MySQL，代码按 MySQL 编写（server/schema.mysql.sql）。为便于零安装真实运行，'
            '数据访问层做了双驱动开关（DB_DRIVER=mysql / sqlite），业务 SQL、表结构与事务完全一致。'
            '本套截图即在真实运行状态下截取。', 10)
bullet(doc, '演示账号密码均为 123456（各项目账号见对应章节）', 10)

# ---------------- 项目章节 ----------------
projects = [
    {
        'no': '二', 'name': '青苔笔记 MossNote（个人博客）', 'color': MOSS, 'hr': 'C9D6C9',
        'theme': '一个记录「旧书 · 城市漫步 · 手冲咖啡」的私人写作博客。',
        'visual': '纸感米白 + 墨绿（苔色），衬线标题，卡片细描边；封面与头像用「渐变色 + 字符」程序化生成，不依赖外部图床。',
        'checks': [
            '注册 / 登录 / JWT / bcrypt ｜ 个人中心资料编辑',
            '文章发布 / 编辑 / 删除（仅本人）｜ Markdown 渲染、浏览数 +1',
            '首页列表：分页、分类筛选、关键词搜索（标题 + 正文）',
            '写文章页：左编辑右实时预览、分类、标签、封面选择',
        ],
        'extra': '评论（增删 + 计数）、点赞（每人一次，事务同步计数）、草稿箱（草稿不出现在首页，可在个人中心一键发布）、'
                 '按月归档、阅读时长估算。',
        'accounts': '苔痕 / 阿岚 / 苏禾 / 老周',
        'dir': '01-blog',
        'shots': [
            ('01-首页-文章列表.png', '首页：文章列表 + 分类筛选 + 搜索 + 分页'),
            ('02-文章详情-Markdown渲染.png', '文章详情：Markdown 正文渲染'),
            ('03-文章详情-评论区.png', '文章详情：评论区与评论发布'),
            ('04-登录页.png', '登录页'),
            ('05-写文章-左编辑右预览.png', '写文章：左侧编辑、右侧实时预览'),
            ('06-发布成功-新文章详情.png', '发布成功：跳转新文章详情（含编辑 / 删除）'),
            ('07-个人中心-我的文章.png', '个人中心：我的文章'),
            ('08-个人中心-草稿箱.png', '个人中心：草稿箱（一键发布）'),
            ('09-归档页-按月.png', '归档页：按月份归档'),
            ('10-搜索结果.png', '搜索结果页'),
        ],
    },
    {
        'no': '三', 'name': '灶台问答 HearthAsk（问答社区）', 'color': EMBER, 'hr': 'E8CFC0',
        'theme': '面向新手下厨与家庭厨房的互助问答社区。',
        'visual': '灶火暖橙 + 奶油白，圆角卡片，有烟火气。',
        'checks': [
            '提问（标题 + Markdown 正文 + 标签）｜ 回答',
            '点赞去重：每人对同一目标只能投一次，可取消',
            '采纳答案：仅提问者可操作、每题一个、标记问题已解决',
            '积分系统：提问 −5、回答 +10、采纳 +30、问题被赞 +5、回答被赞 +10（全部走事务）',
            '列表排序：最新 / 热门 / 未解决 + 标签筛选 + 搜索 + 分页',
        ],
        'extra': '积分排行榜、热门标签聚合、提问前校验积分是否充足（不足时给出引导文案）。',
        'accounts': '小满 / 李师傅 / 陈阿姨 / 阿果 / 老白',
        'dir': '02-community',
        'shots': [
            ('01-首页-问题列表.png', '首页：问题列表 + 排序 + 标签 + 搜索'),
            ('02-排序-热门.png', '列表排序：按热门'),
            ('03-问题详情-回答与点赞.png', '问题详情：回答列表 + 点赞'),
            ('04-提问页（未登录跳登录）.png', '未登录访问提问页被拦截，跳转登录'),
            ('05-登录页.png', '登录页'),
            ('06-提问页-编辑中.png', '提问页：编辑中'),
            ('07-我的问题-提问成功.png', '提问成功：积分 −5，头像旁积分已变化'),
            ('08-点赞后-状态变化.png', '点赞后：♥ 变实心、计数 +1'),
            ('09-积分排行榜.png', '积分排行榜'),
            ('10-我的主页-积分.png', '我的主页：积分 / 我的提问 / 我的回答'),
        ],
    },
    {
        'no': '四', 'name': '一枚手作 HandmadeOne（Mini 在线商城）', 'color': CLAY, 'hr': 'DDC8B4',
        'theme': '独立手作器物小店（粗陶 / 织物 / 文具 / 香氛）。',
        'visual': '陶土赭石色 + 米沙白，大块留白；商品图用「渐变 + 字符」生成，突出质感。',
        'checks': [
            '商品列表（分类 / 搜索 / 排序）+ 商品详情',
            '购物车：同商品数量累加、库存校验、改数量、删除、实时小计',
            '地址：增删改查、默认地址、删除默认后自动顺延',
            '下单：事务内校验库存 → 计算金额 → 占用券 → 生成订单号 → 写 orders + order_items'
            '（保存下单时价格快照）→ 乐观锁扣库存防超卖 → 清空对应购物车项',
            '取消订单（仅待支付）：恢复库存、回退销量、释放优惠券',
            '订单列表按状态筛选、订单详情',
        ],
        'extra': '优惠券满减（满 99 减 10 / 满 199 减 25 / 满 299 减 40，下单时校验门槛并抵扣）、模拟支付、'
                 '订单状态流程可视化、收货地址快照（下单后改地址不影响历史订单）。',
        'accounts': '阿禾 / 小瓷 / 舟舟',
        'dir': '03-shop',
        'shots': [
            ('01-首页-商品列表.png', '首页：商品列表 + 分类 + 排序 + 搜索'),
            ('02-商品详情.png', '商品详情页'),
            ('03-未登录跳转登录页.png', '未登录加购被拦截，跳转登录页'),
            ('04-购物车.png', '购物车：数量增减、勾选、小计'),
            ('05-结算页-地址与优惠券.png', '结算页：收货地址 + 优惠券 + 金额明细'),
            ('06-订单创建成功-待支付.png', '订单创建成功：待支付'),
            ('07-模拟支付-已支付.png', '模拟支付后：已支付 + 状态流转'),
            ('08-订单列表.png', '订单列表：按状态筛选'),
            ('09-地址管理.png', '地址管理'),
            ('10-商品搜索.png', '商品搜索结果'),
        ],
    },
]

for p in projects:
    doc.add_page_break()
    heading(doc, f"{p['no']}、项目{p['no']}：{p['name']}", 1, p['color'])
    hr(doc, p['hr'])

    heading(doc, '主题与视觉', 2, p['color'], 12)
    rich(doc, [('主题：', True, p['color']), (p['theme'], False, None)], 10.5, after=3)
    rich(doc, [('视觉：', True, p['color']), (p['visual'], False, None)], 10.5, after=8)

    heading(doc, '实现对照（文档要求 → 完成情况）', 2, p['color'], 12)
    for c in p['checks']:
        bullet(doc, '✓  ' + c, 10)

    heading(doc, '扩展功能（超出文档）', 2, p['color'], 12)
    para(doc, p['extra'], 10.5, after=8)

    rich(doc, [('演示账号：', True, p['color']), (p['accounts'] + '（密码 123456）', False, None)],
         10, after=10)

    heading(doc, '运行截图', 2, p['color'], 12)
    prefix = {'二': '2', '三': '3', '四': '4'}[p['no']]
    for i, (fn, cap) in enumerate(p['shots'], start=1):
        img_block(doc, os.path.join(SHOTS, p['dir'], fn), cap, f'{prefix}-{i}')

# ---------------- 五、关键工程实践 ----------------
doc.add_page_break()
heading(doc, '五、关键工程实践（对应文档「开发技巧」）', 1, MOSS)
hr(doc)

practices = [
    ('环境变量：', '端口、数据库连接、JWT 密钥都在 .env 中，代码里用 process.env 读取，不硬编码。'),
    ('统一错误处理：', '所有接口返回统一结构 { error: { message } }，前端 axios 拦截器统一取出并提示。'),
    ('数据一致性：', '点赞 / 评论计数、积分变化、下单扣库存、取消恢复库存全部走数据库事务；'
                 '下单扣库存使用 UPDATE ... WHERE stock >= ? 乐观锁防超卖。'),
    ('金额只在服务端计算：', '前端传来的金额不可信，价格从数据库读取，小计 / 优惠 / 实付均在后端计算。'),
    ('价格快照：', 'order_items 保存下单时的单价与商品名称，商品改价或改名不影响历史订单。'),
    ('开发效率：', '后端 node --watch 热重启，前端 Vite 热更新。'),
]
for k, v in practices:
    rich(doc, [(k, True, MOSS), (v, False, None)], 10.5, after=4)

# ---------------- 六、如何运行 ----------------
heading(doc, '六、如何运行', 1, MOSS)
hr(doc)
para(doc, '详见根目录 README.md。最短路径（以博客项目为例）：', 10.5, after=4)
code_block(doc, [
    'cd 01-blog/server && npm install && npm run reset   # 建表 + 写入演示数据',
    'cd ../web    && npm install && npm run build        # 构建前端',
    'cd ../server && npm run dev                         # 打开 http://localhost:4001',
])
para(doc, '三个项目的端口分别为 4001（青苔笔记）、4002（灶台问答）、4003（一枚手作）。', 10.5, after=4)
para(doc, '如需使用真实 MySQL：把 server/.env 中的 DB_DRIVER 改为 mysql 并填入连接信息，'
          '再执行 npm run reset（自动建库建表）与 npm run dev 即可，业务代码无需任何修改。', 10.5, after=4)

doc.save(OUT)
print('saved:', OUT)
print('paragraphs:', len(doc.paragraphs), 'tables:', len(doc.tables))
