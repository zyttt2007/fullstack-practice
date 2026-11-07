"""把 fullstack/README.md 渲染成一个可发布的单页文档站。

用法：
    python tools/build_docs.py

产物：fullstack/docs-site/index.html（纯静态，无外部依赖）
"""

from __future__ import annotations

import re
from pathlib import Path

import markdown

ROOT = Path(__file__).resolve().parent.parent
README = ROOT / "README.md"
TEMPLATE = Path(__file__).resolve().parent / "docs_template.html"
OUT_DIR = ROOT / "docs-site"
OUT_FILE = OUT_DIR / "index.html"


def extract_body(text: str) -> str:
    """去掉一级标题和开头的导语（导语已经在页面 hero 里重写过了）。"""
    lines = text.splitlines()
    first_h2 = next(i for i, line in enumerate(lines) if line.startswith("## "))
    return "\n".join(lines[first_h2:])


def render(md_body: str) -> str:
    md = markdown.Markdown(extensions=["fenced_code", "tables", "sane_lists"])
    html = md.convert(md_body)
    # README 里裸写的粗体地址改成可点击的主链接
    html = re.sub(
        r"<strong>(https?://[^<\s]+)</strong>",
        r'<a class="url-cta" href="\1" target="_blank" rel="noreferrer">\1</a>',
        html,
    )
    return html


def add_heading_ids(html: str) -> tuple[str, list[tuple[str, str]]]:
    """给每个 h2 编一个稳定 id，同时收集目录。"""
    toc: list[tuple[str, str]] = []
    counter = {"n": 0}

    def repl(match: re.Match[str]) -> str:
        counter["n"] += 1
        hid = f"s{counter['n']}"
        inner = match.group(1)
        text = re.sub(r"<[^>]+>", "", inner)
        toc.append((hid, text.strip()))
        return f'<h2 id="{hid}">{inner}</h2>'

    html = re.sub(r"<h2>(.*?)</h2>", repl, html, flags=re.S)
    return html, toc


def build_toc(toc: list[tuple[str, str]]) -> str:
    def label(text: str) -> str:
        # 目录里去掉括号补充说明，避免侧栏换行
        return re.split(r"[（(]", text)[0].strip() or text

    items = "\n".join(
        f'      <li><a href="#{hid}">{label(text)}</a></li>' for hid, text in toc
    )
    return f"    <ol>\n{items}\n    </ol>"


def main() -> None:
    source = README.read_text(encoding="utf-8")
    html, toc = add_heading_ids(render(extract_body(source)))

    page = TEMPLATE.read_text(encoding="utf-8")
    page = page.replace("{{TOC}}", build_toc(toc))
    # 不做行首缩进：<pre> 里的代码会被缩进污染
    page = page.replace("{{CONTENT}}", html)

    # 导航里的 #s2 指向「技术栈」，按标题文本定位，避免标题顺序变动后失效
    stack_id = next((hid for hid, text in toc if "技术栈" in text), "s2")
    page = page.replace('href="#s2"', f'href="#{stack_id}"')

    OUT_DIR.mkdir(exist_ok=True)
    OUT_FILE.write_text(page, encoding="utf-8")
    print(f"wrote {OUT_FILE}  ({len(page)} bytes, {len(toc)} sections)")


if __name__ == "__main__":
    main()
