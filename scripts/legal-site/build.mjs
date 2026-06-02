// docs/legal/*.md を最小テンプレで HTML 化し、リポジトリ直下 _site/ に出力する。
// GitHub Pages（.github/workflows/deploy-legal-pages.yml）から実行され、
// プライバシーポリシー/利用規約の公開 URL を生成する。
// 単一ソースは docs/legal/*.md（lib/legal-documents.ts のミラー）。README.md は対象外。

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { marked } from 'marked';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, '..', '..');
const legalDir = join(repoRoot, 'docs', 'legal');
const outDir = join(repoRoot, '_site');

const APP_NAME = 'これどう捨てる？';
const PAGES = [
  { src: 'privacy-policy.md', out: 'privacy-policy.html' },
  { src: 'terms-of-use.md', out: 'terms-of-use.html' },
];

const esc = (s) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function template(title, bodyHtml, { withHome }) {
  const home = withHome ? '<p class="nav"><a href="./index.html">← 法務文書トップ</a></p>' : '';
  return `<!doctype html>
<html lang="ja">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="index, follow">
<title>${esc(title)}｜${esc(APP_NAME)}</title>
<style>
  :root { color-scheme: light; }
  * { box-sizing: border-box; }
  body { margin: 0; background: #f4fbf2; color: #1a1a1a;
    font-family: -apple-system, BlinkMacSystemFont, "Hiragino Sans", "Noto Sans JP", Meiryo, sans-serif;
    line-height: 1.8; }
  main { max-width: 720px; margin: 0 auto; padding: 24px 20px 64px; }
  h1 { font-size: 1.6rem; line-height: 1.4; margin: 0 0 8px; color: #173404; }
  h2 { font-size: 1.2rem; margin: 32px 0 8px; padding-top: 8px; color: #173404; }
  p, li { font-size: 1rem; }
  ul { padding-left: 1.25em; }
  a { color: #185fa5; }
  code { background: #eaf3de; padding: 1px 5px; border-radius: 4px; font-size: 0.92em; }
  hr { border: none; border-top: 1px solid rgba(0,0,0,0.08); margin: 32px 0; }
  .nav { margin: 0 0 24px; font-size: 0.95rem; }
  footer { margin-top: 48px; padding-top: 16px; border-top: 1px solid rgba(0,0,0,0.08);
    font-size: 0.85rem; color: #5f5e5a; }
</style>
</head>
<body>
<main>
${home}
${bodyHtml}
<footer>${esc(APP_NAME)}（ほほ笑みラボ）</footer>
</main>
</body>
</html>
`;
}

mkdirSync(outDir, { recursive: true });

const built = [];
for (const page of PAGES) {
  const md = readFileSync(join(legalDir, page.src), 'utf8');
  const h1 = md.match(/^#\s+(.+)$/m);
  const title = h1 ? h1[1].trim() : page.out;
  const body = marked.parse(md);
  writeFileSync(join(outDir, page.out), template(title, body, { withHome: true }));
  built.push({ title, out: page.out });
  console.log(`  ✓ ${page.src} → _site/${page.out}（${title}）`);
}

const links = built.map((b) => `<li><a href="./${b.out}">${esc(b.title)}</a></li>`).join('\n');
const indexBody = `<h1>${esc(APP_NAME)} 法務文書</h1>\n<ul>\n${links}\n</ul>`;
writeFileSync(join(outDir, 'index.html'), template('法務文書', indexBody, { withHome: false }));
console.log(`  ✓ index.html`);
console.log(`Built ${built.length + 1} pages to ${outDir}`);
