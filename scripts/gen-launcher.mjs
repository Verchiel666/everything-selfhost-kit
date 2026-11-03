// Generate a single-file launcher (index.html) for a directory of built apps.
import { readdirSync, existsSync, writeFileSync, statSync } from 'node:fs';
import path from 'node:path';

const SITE = process.argv[2] || '.';

// 中文名 / 对标商业软件 / 分类
const CATALOG = {
  spreadsheet: ['电子表格', 'Excel · Google Sheets', '办公'],
  documents: ['文档', 'Word · Pages', '办公'],
  presentation: ['演示', 'PowerPoint · Keynote', '办公'],
  pdf: ['PDF 工具', 'Acrobat · PDF Expert', '办公'],
  notes: ['笔记', 'OneNote · 印象笔记', '办公'],
  tasks: ['任务', 'Todoist · 滴答清单', '办公'],
  projects: ['项目看板', 'Trello · Asana', '办公'],
  wiki: ['知识库', 'Notion · 语雀', '办公'],
  records: ['多维表格', 'Airtable · 飞书多维表', '办公'],
  calendar: ['日历', 'Google 日历', '办公'],
  contacts: ['通讯录', '手机通讯录', '办公'],
  whiteboard: ['白板', 'Miro · FigJam', '设计'],
  'photo-studio': ['图片编辑', 'Photoshop', '设计'],
  'vector-studio': ['矢量绘图', 'Illustrator · CorelDRAW', '设计'],
  cad: ['CAD', 'AutoCAD', '工程'],
  '3d': ['三维建模', 'Maya · SketchUp', '工程'],
  'music-studio': ['音乐制作', 'FL Studio · Ableton', '影音'],
  chess: ['国际象棋', '—', '游戏'],
  solitaire: ['纸牌接龙', '—', '游戏'],
  sudoku: ['数独', '—', '游戏'],
};

const ICONS = ['icon-512.png', 'icon-192.png', 'apple-touch-icon.png', 'icon-128.png',
  'favicon-48x48.png', 'favicon-32x32.png', 'favicon.ico'];

const apps = readdirSync(SITE)
  .filter((d) => { try { return statSync(path.join(SITE, d)).isDirectory(); } catch { return false; } })
  .filter((d) => existsSync(path.join(SITE, d, 'index.html')))
  .map((d) => {
    const icon = ICONS.find((f) => existsSync(path.join(SITE, d, f)));
    const [zh, alt, cat] = CATALOG[d] || [d, '—', '其他'];
    return { slug: d, zh, alt, cat, icon: icon ? `${d}/${icon}` : null };
  })
  .sort((a, b) => (a.cat + a.zh).localeCompare(b.cat + b.zh, 'zh'));

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
const cards = apps.map((a) => `
    <a class="card" href="./${a.slug}/" data-cat="${esc(a.cat)}" data-key="${esc((a.zh + a.slug + a.alt).toLowerCase())}">
      <span class="ico">${a.icon ? `<img src="./${a.icon}" alt="" loading="lazy">` : '<b>' + esc(a.zh[0]) + '</b>'}</span>
      <span class="txt"><strong>${esc(a.zh)}</strong><small>${esc(a.alt)}</small></span>
      <span class="tag">${esc(a.cat)}</span>
    </a>`).join('');

const cats = [...new Set(apps.map((a) => a.cat))];
const chips = ['全部', ...cats].map((c, i) => `<button class="chip${i === 0 ? ' on' : ''}" data-cat="${esc(c)}">${esc(c)}</button>`).join('');

writeFileSync(path.join(SITE, 'index.html'), `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Everything · 本地部署</title>
<meta name="description" content="Everything 项目本地构建版：开源重写的办公与创作软件，浏览器内秒开。">
<style>
  :root{--bg:#0f1115;--card:#171a21;--line:#262b36;--fg:#e8ebf2;--dim:#8b93a7;--acc:#4c8dff}
  @media (prefers-color-scheme:light){:root{--bg:#f5f6f8;--card:#fff;--line:#e3e6ec;--fg:#14171d;--dim:#666e80;--acc:#2563eb}}
  *{box-sizing:border-box}
  body{margin:0;background:var(--bg);color:var(--fg);font:15px/1.5 system-ui,-apple-system,"PingFang SC","Noto Sans CJK SC",sans-serif;padding:20px 16px 48px}
  header{max-width:1080px;margin:0 auto 20px}
  h1{font-size:22px;margin:0 0 6px}
  .sub{color:var(--dim);font-size:13px;margin:0}
  .bar{display:flex;gap:8px;flex-wrap:wrap;margin:18px 0 4px}
  input{flex:1 1 220px;background:var(--card);border:1px solid var(--line);color:var(--fg);border-radius:10px;padding:9px 12px;font-size:14px}
  .chip{background:var(--card);border:1px solid var(--line);color:var(--dim);border-radius:999px;padding:6px 13px;font-size:13px;cursor:pointer}
  .chip.on{background:var(--acc);border-color:var(--acc);color:#fff}
  .grid{max-width:1080px;margin:14px auto 0;display:grid;gap:10px;grid-template-columns:repeat(auto-fill,minmax(240px,1fr))}
  .card{display:flex;align-items:center;gap:12px;background:var(--card);border:1px solid var(--line);border-radius:14px;padding:12px;text-decoration:none;color:inherit;transition:.15s;position:relative}
  .card:hover{border-color:var(--acc);transform:translateY(-1px)}
  .ico{width:38px;height:38px;flex:0 0 38px;display:grid;place-items:center;border-radius:10px;overflow:hidden;background:rgba(127,127,127,.12);font-weight:700;color:var(--acc)}
  .ico img{width:100%;height:100%;object-fit:contain}
  .txt{display:flex;flex-direction:column;min-width:0}
  .txt strong{font-size:15px}
  .txt small{color:var(--dim);font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .tag{position:absolute;top:8px;right:10px;font-size:10px;color:var(--dim);opacity:.7}
  footer{max-width:1080px;margin:28px auto 0;color:var(--dim);font-size:12px;line-height:1.7;border-top:1px solid var(--line);padding-top:14px}
  .hide{display:none}
</style>
</head>
<body>
<header>
  <h1>Everything · 本地部署版</h1>
  <p class="sub">来自 <code>github.com/HeyPuter/everything</code> · ${apps.length} 个应用 · 全部在本机构建，打开即用</p>
  <div class="bar">
    <input id="q" placeholder="搜索应用，如 表 / 图 / 文档" aria-label="搜索应用">
    ${chips}
  </div>
</header>
<main class="grid" id="grid">${cards}
</main>
<footer>
  <p><b>说明</b>：这是把 Everything 项目（MIT 许可）的各应用在本地构建后的静态镜像。应用本身由 Puter 团队开源，本页只做本地入口集合。</p>
  <p>部分应用会用到 Puter 账号做云存储/协作（右上角“Sign in”），不登录也能本地新建、编辑、导出；跨设备共享、实时协作需要账号。</p>
</footer>
<script>
  const q = document.getElementById('q');
  const chips = [...document.querySelectorAll('.chip')];
  const cards = [...document.querySelectorAll('.card')];
  let cat = '全部';
  function apply(){
    const k = q.value.trim().toLowerCase();
    for (const c of cards){
      const okCat = cat === '全部' || c.dataset.cat === cat;
      const okKey = !k || c.dataset.key.includes(k);
      c.classList.toggle('hide', !(okCat && okKey));
    }
  }
  q.addEventListener('input', apply);
  chips.forEach(b => b.addEventListener('click', () => {
    chips.forEach(x => x.classList.remove('on'));
    b.classList.add('on'); cat = b.dataset.cat; apply();
  }));
</script>
</body>
</html>
`);
console.log(`launcher: ${apps.length} apps, ${cats.length} categories -> ${path.join(SITE, 'index.html')}`);
